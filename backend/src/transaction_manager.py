import pandas as pd
from datetime import datetime
import hashlib
import os
import tempfile


class TransactionManager:
    def __init__(self, db):
        """Initialize transaction manager with database connection"""
        self.db = db

    def get_all_transactions(self, limit=100, offset=0):
        """Get all transactions with pagination"""
        transactions = self.db.query(
            """
            SELECT t.*, a.name as account_name 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            ORDER BY t.date DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset)
        )
        return [dict(tx) for tx in transactions]

    def get_transactions_by_account(self, account_id, limit=100, offset=0):
        """Get transactions for a specific account"""
        transactions = self.db.query(
            """
            SELECT t.*, a.name as account_name 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.account_id = ?
            ORDER BY t.date DESC
            LIMIT ? OFFSET ?
            """,
            (account_id, limit, offset)
        )
        return [dict(tx) for tx in transactions]

    def get_transaction_by_id(self, transaction_id):
        """Get a transaction by ID"""
        transaction = self.db.query(
            """
            SELECT t.*, a.name as account_name 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.id = ?
            """,
            (transaction_id,)
        )
        if transaction:
            return dict(transaction[0])
        return None

    def add_transaction(self, transaction_data):
        """Add a new transaction"""
        required_fields = ['account_id', 'date', 'amount', 'description']
        for field in required_fields:
            if field not in transaction_data:
                return {'error': f'Missing required field: {field}'}

        # Ensure date is in the correct format
        try:
            if isinstance(transaction_data['date'], str):
                # Try to parse the date string
                datetime.fromisoformat(
                    transaction_data['date'].replace('Z', '+00:00'))
        except ValueError:
            return {'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}

        # Validate category if provided
        if 'category' in transaction_data and transaction_data['category']:
            # Check if the category exists
            category_exists = self.db.execute_query(
                """
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name = ?
                """,
                (transaction_data['category'],)
            )

            if not category_exists or category_exists[0]['count'] == 0:
                # Category doesn't exist - return error
                return {'error': f'Category "{transaction_data["category"]}" does not exist. Please create it first.'}

            # If subcategory is provided, validate it too
            if 'subcategory' in transaction_data and transaction_data['subcategory']:
                subcategory_exists = self.db.execute_query(
                    """
                    SELECT COUNT(*) as count 
                    FROM subcategories s
                    JOIN categories c ON s.category_id = c.id
                    WHERE c.name = ? AND s.name = ?
                    """,
                    (transaction_data['category'],
                     transaction_data['subcategory'])
                )

                if not subcategory_exists or subcategory_exists[0]['count'] == 0:
                    # Subcategory doesn't exist - return error
                    return {'error': f'Subcategory "{transaction_data["subcategory"]}" does not exist for category "{transaction_data["category"]}". Please create it first.'}

        # Insert transaction into database
        query = """
        INSERT INTO transactions (account_id, date, amount, description, category, subcategory, is_income, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        transaction_id = self.db.execute(
            query,
            (
                transaction_data['account_id'],
                transaction_data['date'],
                transaction_data['amount'],
                transaction_data['description'],
                transaction_data.get('category'),
                transaction_data.get('subcategory'),
                1 if transaction_data.get('is_income', False) else 0,
                transaction_data.get('notes')
            )
        )

        # Update account balance
        self._update_account_balance_after_transaction(
            transaction_data['account_id'],
            transaction_data['amount']
        )

        return {'id': transaction_id, 'message': 'Transaction added successfully'}

    def update_transaction(self, transaction_id, transaction_data):
        """Update an existing transaction"""
        current_transaction = self.get_transaction_by_id(transaction_id)
        if not current_transaction:
            return {'error': 'Transaction not found'}

        # Validate category if provided
        if 'category' in transaction_data and transaction_data['category']:
            # Check if the category exists
            category_exists = self.db.execute_query(
                """
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name = ?
                """,
                (transaction_data['category'],)
            )

            if not category_exists or category_exists[0]['count'] == 0:
                # Category doesn't exist - return error
                return {'error': f'Category "{transaction_data["category"]}" does not exist. Please create it first.'}

            # If subcategory is provided, validate it too
            if 'subcategory' in transaction_data and transaction_data['subcategory']:
                subcategory_exists = self.db.execute_query(
                    """
                    SELECT COUNT(*) as count 
                    FROM subcategories s
                    JOIN categories c ON s.category_id = c.id
                    WHERE c.name = ? AND s.name = ?
                    """,
                    (transaction_data['category'],
                     transaction_data['subcategory'])
                )

                if not subcategory_exists or subcategory_exists[0]['count'] == 0:
                    # Subcategory doesn't exist - return error
                    return {'error': f'Subcategory "{transaction_data["subcategory"]}" does not exist for category "{transaction_data["category"]}". Please create it first.'}

        # Update transaction in database
        fields = []
        params = []

        for field in ['account_id', 'date', 'amount', 'description', 'category', 'subcategory', 'is_income', 'notes']:
            if field in transaction_data:
                fields.append(f"{field} = ?")
                params.append(transaction_data[field])

        # Add transaction_id to params
        params.append(transaction_id)

        query = f"UPDATE transactions SET {', '.join(fields)} WHERE id = ?"
        self.db.execute(query, params)

        # If amount changed, update account balance
        if 'amount' in transaction_data and transaction_data['amount'] != current_transaction['amount']:
            # Reverse the old amount and add the new amount
            self._update_account_balance_after_transaction(
                transaction_data.get(
                    'account_id', current_transaction['account_id']),
                -current_transaction['amount'] + transaction_data['amount']
            )

        return {'id': transaction_id, 'message': 'Transaction updated successfully'}

    def delete_transaction(self, transaction_id):
        """Delete a transaction"""
        transaction = self.get_transaction_by_id(transaction_id)
        if not transaction:
            return {'error': 'Transaction not found'}

        # Delete transaction from database
        self.db.execute("DELETE FROM transactions WHERE id = ?",
                        (transaction_id,))

        # Update account balance (reverse the transaction amount)
        self._update_account_balance_after_transaction(
            transaction['account_id'],
            -transaction['amount']
        )

        return {'message': 'Transaction deleted successfully'}

    def _update_account_balance_after_transaction(self, account_id, amount):
        """
        Update account balance after adding, updating, or deleting a transaction

        Args:
            account_id (int): ID of the account to update
            amount (float): Amount to add to the account balance
        """
        # Get current account
        query = "SELECT * FROM accounts WHERE id = ?"
        account = self.db.execute_query(query, (account_id,))

        if not account:
            return False

        # Update account balance
        new_balance = account[0]['balance'] + amount

        # Update account
        self.db.execute(
            "UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?",
            (new_balance, datetime.now().isoformat(), account_id)
        )

        return True

    def import_from_csv(self, file, account_id):
        """Import transactions from CSV file"""
        # Save uploaded file to a temporary location
        _, temp_path = tempfile.mkstemp(suffix='.csv')
        file.save(temp_path)

        try:
            # Read CSV file
            df = pd.read_csv(temp_path)

            # Check for required columns
            required_columns = ['date', 'amount', 'description']
            missing_columns = [
                col for col in required_columns if col not in df.columns]

            if missing_columns:
                return {'error': f'Missing required columns: {", ".join(missing_columns)}'}

            # Prepare data for import
            transactions = []
            duplicates = 0

            for _, row in df.iterrows():
                # Create a unique hash for the transaction to check for duplicates
                hash_input = f"{row['date']}{row['amount']}{row['description']}{account_id}"
                tx_hash = hashlib.md5(hash_input.encode()).hexdigest()

                # Check if transaction already exists
                existing = self.db.query(
                    """
                    SELECT COUNT(*) as count FROM transactions 
                    WHERE account_id = ? AND date = ? AND amount = ? AND description = ?
                    """,
                    (account_id, row['date'],
                     row['amount'], row['description'])
                )

                if existing[0]['count'] > 0:
                    duplicates += 1
                    continue

                # Prepare transaction data
                tx_data = {
                    'account_id': account_id,
                    'date': row['date'],
                    'amount': row['amount'],
                    'description': row['description'],
                    'category': row.get('category', None),
                    'subcategory': row.get('subcategory', None),
                    'is_income': 1 if row.get('is_income', False) else 0,
                    'notes': row.get('notes', None)
                }

                # Add to transactions list
                transactions.append((
                    tx_data['account_id'],
                    tx_data['date'],
                    tx_data['amount'],
                    tx_data['description'],
                    tx_data['category'],
                    tx_data['subcategory'],
                    tx_data['is_income'],
                    tx_data['notes']
                ))

            # Insert transactions
            if transactions:
                self.db.executemany(
                    """
                    INSERT INTO transactions 
                    (account_id, date, amount, description, category, subcategory, is_income, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    transactions
                )

                # Update account balance
                total_amount = sum(tx[2] for tx in transactions)
                self._update_account_balance_after_transaction(
                    account_id, total_amount)

            return {
                'message': 'Import successful',
                'imported': len(transactions),
                'duplicates': duplicates
            }

        except Exception as e:
            return {'error': f'Error importing CSV: {str(e)}'}

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def get_transactions_by_category(self, category, start_date=None, end_date=None):
        """Get transactions filtered by category"""
        params = [category]
        query = "SELECT * FROM transactions WHERE category = ?"

        if start_date:
            query += " AND date >= ?"
            params.append(start_date)

        if end_date:
            query += " AND date <= ?"
            params.append(end_date)

        query += " ORDER BY date DESC"

        transactions = self.db.query(query, params)
        return [dict(tx) for tx in transactions]

    def get_transactions_by_date_range(self, start_date, end_date, account_id=None):
        """Get transactions within a date range"""
        params = [start_date, end_date]
        query = "SELECT * FROM transactions WHERE date >= ? AND date <= ?"

        if account_id:
            query += " AND account_id = ?"
            params.append(account_id)

        query += " ORDER BY date DESC"

        transactions = self.db.query(query, params)
        return [dict(tx) for tx in transactions]
