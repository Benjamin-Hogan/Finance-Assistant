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
        """Create a new scheduled transaction"""
        required_fields = ['account_id', 'amount',
                           'description', 'frequency', 'start_date']
        for field in required_fields:
            if field not in transaction_data:
                return {'error': f'Missing required field: {field}'}

        # Validate account exists
        account = self.db.execute_query(
            "SELECT id FROM accounts WHERE id = ?",
            (transaction_data['account_id'],)
        )
        if not account:
            return {'error': 'Account not found'}

        # Validate frequency
        valid_frequencies = ['daily', 'weekly', 'monthly', 'yearly']
        if transaction_data['frequency'] not in valid_frequencies:
            return {'error': f'Invalid frequency. Must be one of: {", ".join(valid_frequencies)}'}

        # Set defaults for optional fields
        if 'is_income' not in transaction_data:
            transaction_data['is_income'] = False

        # Calculate next occurrence
        next_occurrence = self._calculate_next_occurrence(
            transaction_data['frequency'],
            transaction_data['start_date'],
            transaction_data.get('day_of_month'),
            transaction_data.get('day_of_week')
        )

        # Insert into database
        query = """
        INSERT INTO scheduled_transactions (
            account_id, amount, description, category, subcategory, is_income,
            frequency, start_date, end_date, day_of_month, day_of_week,
            last_occurrence, next_occurrence, active, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        params = (
            transaction_data['account_id'],
            transaction_data['amount'],
            transaction_data['description'],
            transaction_data.get('category'),
            transaction_data.get('subcategory'),
            transaction_data.get('is_income', False),
            transaction_data['frequency'],
            transaction_data['start_date'],
            transaction_data.get('end_date'),
            transaction_data.get('day_of_month'),
            transaction_data.get('day_of_week'),
            None,  # last_occurrence
            next_occurrence,
            transaction_data.get('active', True),
            transaction_data.get('notes')
        )

        transaction_id = self.db.execute(query, params)

        return {
            'id': transaction_id,
            'message': 'Scheduled transaction created successfully',
            'next_occurrence': next_occurrence
        }

    def update_scheduled_transaction(self, transaction_id, transaction_data):
        """Update an existing scheduled transaction"""
        current_transaction = self.get_scheduled_transaction_by_id(
            transaction_id)
        if not current_transaction:
            return {'error': 'Scheduled transaction not found'}

        # Calculate the next occurrence date if frequency parameters changed
        recalculate_next = False
        for field in ['frequency', 'start_date', 'day_of_month', 'day_of_week']:
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
                    'day_of_week', current_transaction.get('day_of_week'))
            )
            transaction_data['next_occurrence'] = next_occurrence

        # Update transaction in database
        fields = []
        params = []

        for field in ['account_id', 'amount', 'description', 'category', 'subcategory', 'is_income',
                      'frequency', 'start_date', 'end_date', 'next_occurrence',
                      'day_of_month', 'day_of_week', 'active', 'notes']:
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
            from .transaction_manager import TransactionManager
            tx_manager = TransactionManager(self.db)
            tx_manager.add_transaction(transaction_data)

            # Calculate the next occurrence
            last_occurrence = scheduled_tx['next_occurrence']
            next_occurrence = self._calculate_next_occurrence(
                scheduled_tx['frequency'],
                last_occurrence,  # Use the last occurrence as the reference point
                day_of_month=scheduled_tx['day_of_month'],
                day_of_week=scheduled_tx['day_of_week']
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

    def _calculate_next_occurrence(self, frequency, start_date, day_of_month=None, day_of_week=None):
        """
        Calculate the next occurrence of a scheduled transaction

        Args:
            frequency (str): The frequency of the transaction ('daily', 'weekly', 'monthly', 'yearly')
            start_date (str): The start date of the transaction in ISO format
            day_of_month (int, optional): The day of month for monthly transactions
            day_of_week (int, optional): The day of week for weekly transactions (0=Monday, 6=Sunday)

        Returns:
            str: The next occurrence date in ISO format
        """
        # Parse the start date
        try:
            if isinstance(start_date, str):
                if 'Z' in start_date:
                    start_date = datetime.fromisoformat(
                        start_date.replace('Z', '+00:00'))
                elif 'T' in start_date:
                    start_date = datetime.fromisoformat(start_date)
                else:
                    # Handle YYYY-MM-DD format
                    start_date = datetime.strptime(start_date, '%Y-%m-%d')
            elif isinstance(start_date, datetime):
                # Already a datetime object
                pass
            else:
                # Unknown format, use today
                start_date = datetime.now()
        except (ValueError, TypeError):
            # If parsing fails, use today
            start_date = datetime.now()

        today = datetime.now()

        # If start date is in the future, that's the next occurrence
        if start_date > today:
            return start_date.isoformat()

        # Calculate next occurrence based on frequency
        if frequency == 'daily':
            # Next occurrence is tomorrow
            next_date = today + timedelta(days=1)
        elif frequency == 'weekly':
            # Calculate days until the next occurrence
            if day_of_week is not None:
                # Calculate the next occurrence based on day_of_week
                days_ahead = day_of_week - today.weekday()
                if days_ahead <= 0:  # Target day already happened this week
                    days_ahead += 7
                next_date = today + timedelta(days=days_ahead)
            else:
                # If no day_of_week specified, use same day next week
                next_date = today + timedelta(days=7)
        elif frequency == 'monthly':
            # Calculate the next occurrence based on day_of_month
            if day_of_month is not None:
                # If today is after the day of month, move to next month
                if today.day >= day_of_month:
                    if today.month == 12:
                        next_date = datetime(today.year + 1, 1, day_of_month)
                    else:
                        next_date = datetime(
                            today.year, today.month + 1, day_of_month)
                else:
                    next_date = datetime(today.year, today.month, day_of_month)
            else:
                # If no day_of_month specified, use same day next month
                if today.month == 12:
                    next_date = datetime(today.year + 1, 1, today.day)
                else:
                    next_date = datetime(
                        today.year, today.month + 1, today.day)
        elif frequency == 'yearly':
            # Next occurrence is same day next year
            next_date = datetime(today.year + 1, today.month, today.day)
        else:
            # Invalid frequency
            return None

        return next_date.isoformat()
