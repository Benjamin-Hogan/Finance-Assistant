from datetime import datetime, timedelta
import calendar


class ScheduledTransactionManager:
    def __init__(self, db):
        """Initialize scheduled transaction manager with database connection"""
        self.db = db

    def get_all_scheduled_transactions(self):
        """Get all scheduled transactions"""
        transactions = self.db.query(
            """
            SELECT s.*, a.name as account_name 
            FROM scheduled_transactions s
            JOIN accounts a ON s.account_id = a.id
            ORDER BY s.next_occurrence
            """
        )
        return [dict(tx) for tx in transactions]

    def get_scheduled_transaction_by_id(self, transaction_id):
        """Get a scheduled transaction by ID"""
        transaction = self.db.query(
            """
            SELECT s.*, a.name as account_name 
            FROM scheduled_transactions s
            JOIN accounts a ON s.account_id = a.id
            WHERE s.id = ?
            """,
            (transaction_id,)
        )
        if transaction:
            return dict(transaction[0])
        return None

    def get_scheduled_transactions_by_account(self, account_id):
        """Get scheduled transactions for a specific account"""
        transactions = self.db.query(
            """
            SELECT s.*, a.name as account_name 
            FROM scheduled_transactions s
            JOIN accounts a ON s.account_id = a.id
            WHERE s.account_id = ?
            ORDER BY s.next_occurrence
            """,
            (account_id,)
        )
        return [dict(tx) for tx in transactions]

    def add_scheduled_transaction(self, transaction_data):
        """Add a new scheduled transaction"""
        required_fields = ['account_id', 'amount',
                           'description', 'frequency', 'start_date']
        for field in required_fields:
            if field not in transaction_data:
                return {'error': f'Missing required field: {field}'}

        # Calculate the next occurrence date
        next_occurrence = self._calculate_next_occurrence(
            transaction_data['frequency'],
            transaction_data['start_date'],
            day_of_month=transaction_data.get('day_of_month'),
            day_of_week=transaction_data.get('day_of_week'),
            week_of_month=transaction_data.get('week_of_month'),
            month_of_year=transaction_data.get('month_of_year')
        )

        # Insert scheduled transaction into database
        query = """
        INSERT INTO scheduled_transactions (
            account_id, amount, description, category, subcategory, is_income, 
            frequency, start_date, end_date, next_occurrence, 
            day_of_month, day_of_week, week_of_month, month_of_year,
            active, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        transaction_id = self.db.execute(
            query,
            (
                transaction_data['account_id'],
                transaction_data['amount'],
                transaction_data['description'],
                transaction_data.get('category'),
                transaction_data.get('subcategory'),
                1 if transaction_data.get('is_income', False) else 0,
                transaction_data['frequency'],
                transaction_data['start_date'],
                transaction_data.get('end_date'),
                next_occurrence,
                transaction_data.get('day_of_month'),
                transaction_data.get('day_of_week'),
                transaction_data.get('week_of_month'),
                transaction_data.get('month_of_year'),
                1 if transaction_data.get('active', True) else 0,
                transaction_data.get('notes')
            )
        )

        return {'id': transaction_id, 'message': 'Scheduled transaction created successfully'}

    def update_scheduled_transaction(self, transaction_id, transaction_data):
        """Update an existing scheduled transaction"""
        current_transaction = self.get_scheduled_transaction_by_id(
            transaction_id)
        if not current_transaction:
            return {'error': 'Scheduled transaction not found'}

        # Calculate the next occurrence date if frequency parameters changed
        recalculate_next = False
        for field in ['frequency', 'start_date', 'day_of_month', 'day_of_week', 'week_of_month', 'month_of_year']:
            if field in transaction_data and transaction_data[field] != current_transaction.get(field):
                recalculate_next = True
                break

        if recalculate_next:
            next_occurrence = self._calculate_next_occurrence(
                transaction_data.get(
                    'frequency', current_transaction['frequency']),
                transaction_data.get(
                    'start_date', current_transaction['start_date']),
                day_of_month=transaction_data.get(
                    'day_of_month', current_transaction.get('day_of_month')),
                day_of_week=transaction_data.get(
                    'day_of_week', current_transaction.get('day_of_week')),
                week_of_month=transaction_data.get(
                    'week_of_month', current_transaction.get('week_of_month')),
                month_of_year=transaction_data.get(
                    'month_of_year', current_transaction.get('month_of_year'))
            )
            transaction_data['next_occurrence'] = next_occurrence

        # Update transaction in database
        fields = []
        params = []

        for field in ['account_id', 'amount', 'description', 'category', 'subcategory', 'is_income',
                      'frequency', 'start_date', 'end_date', 'next_occurrence',
                      'day_of_month', 'day_of_week', 'week_of_month', 'month_of_year',
                      'active', 'notes']:
            if field in transaction_data:
                fields.append(f"{field} = ?")

                # Convert boolean values
                if field == 'is_income' or field == 'active':
                    params.append(1 if transaction_data[field] else 0)
                else:
                    params.append(transaction_data[field])

        if not fields:
            return {'error': 'No fields to update'}

        # Add transaction_id to params
        params.append(transaction_id)

        query = f"UPDATE scheduled_transactions SET {', '.join(fields)} WHERE id = ?"
        self.db.execute(query, params)

        return {'id': transaction_id, 'message': 'Scheduled transaction updated successfully'}

    def delete_scheduled_transaction(self, transaction_id):
        """Delete a scheduled transaction"""
        transaction = self.get_scheduled_transaction_by_id(transaction_id)
        if not transaction:
            return {'error': 'Scheduled transaction not found'}

        # Delete transaction from database
        self.db.execute(
            "DELETE FROM scheduled_transactions WHERE id = ?", (transaction_id,))

        return {'message': 'Scheduled transaction deleted successfully'}

    def process_due_transactions(self):
        """Process all due scheduled transactions and create actual transactions"""
        now = datetime.now().isoformat()

        # Get all active scheduled transactions that are due
        due_transactions = self.db.query(
            """
            SELECT * FROM scheduled_transactions
            WHERE active = 1 AND next_occurrence <= ?
            """,
            (now,)
        )

        processed_count = 0
        for scheduled_tx in due_transactions:
            scheduled_tx = dict(scheduled_tx)

            # Create an actual transaction
            transaction_data = {
                'account_id': scheduled_tx['account_id'],
                'date': scheduled_tx['next_occurrence'],
                'amount': scheduled_tx['amount'],
                'description': scheduled_tx['description'],
                'category': scheduled_tx['category'],
                'subcategory': scheduled_tx['subcategory'],
                'is_income': bool(scheduled_tx['is_income']),
                'notes': f"Auto-generated from scheduled transaction. {scheduled_tx.get('notes', '')}"
            }

            # Use transaction manager to create the transaction
            from transaction_manager import TransactionManager
            tx_manager = TransactionManager(self.db)
            tx_manager.add_transaction(transaction_data)

            # Calculate the next occurrence
            last_occurrence = scheduled_tx['next_occurrence']
            next_occurrence = self._calculate_next_occurrence(
                scheduled_tx['frequency'],
                last_occurrence,  # Use the last occurrence as the reference point
                day_of_month=scheduled_tx['day_of_month'],
                day_of_week=scheduled_tx['day_of_week'],
                week_of_month=scheduled_tx['week_of_month'],
                month_of_year=scheduled_tx['month_of_year']
            )

            # Check if this scheduled transaction has reached its end date
            active = 1
            if scheduled_tx['end_date'] and next_occurrence > scheduled_tx['end_date']:
                active = 0

            # Update the scheduled transaction with the new next occurrence
            self.db.execute(
                """
                UPDATE scheduled_transactions
                SET last_occurrence = ?, next_occurrence = ?, active = ?
                WHERE id = ?
                """,
                (last_occurrence, next_occurrence, active, scheduled_tx['id'])
            )

            processed_count += 1

        return {'processed': processed_count, 'message': f'Processed {processed_count} scheduled transactions'}

    def _calculate_next_occurrence(self, frequency, reference_date, day_of_month=None,
                                   day_of_week=None, week_of_month=None, month_of_year=None):
        """Calculate the next occurrence date based on frequency and reference date"""
        if isinstance(reference_date, str):
            reference_date = datetime.fromisoformat(
                reference_date.replace('Z', '+00:00'))

        today = datetime.now()
        if reference_date < today:
            reference_date = today

        if frequency == 'daily':
            return (reference_date + timedelta(days=1)).isoformat()

        elif frequency == 'weekly':
            return (reference_date + timedelta(days=7)).isoformat()

        elif frequency == 'monthly':
            # Calculate the next month's date, handling month end correctly
            next_month = reference_date.month + 1
            next_year = reference_date.year

            if next_month > 12:
                next_month = 1
                next_year += 1

            # Use the specified day of month if provided
            if day_of_month:
                target_day = min(day_of_month, calendar.monthrange(
                    next_year, next_month)[1])
            else:
                # Otherwise try to use the same day as the reference date
                target_day = min(reference_date.day,
                                 calendar.monthrange(next_year, next_month)[1])

            next_date = datetime(next_year, next_month, target_day)
            return next_date.isoformat()

        elif frequency == 'yearly':
            # Move to next year, same month and day
            next_date = datetime(reference_date.year + 1,
                                 reference_date.month, reference_date.day)
            return next_date.isoformat()

        # Default fallback
        return (reference_date + timedelta(days=30)).isoformat()
