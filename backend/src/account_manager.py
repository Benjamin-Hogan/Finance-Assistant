from datetime import datetime


class AccountManager:
    def __init__(self, db):
        """Initialize account manager with database connection"""
        self.db = db

    def get_all_accounts(self):
        """Get all accounts"""
        accounts = self.db.query("SELECT * FROM accounts ORDER BY name")
        return [dict(account) for account in accounts]

    def get_account_by_id(self, account_id):
        """Get account by ID"""
        account = self.db.query(
            "SELECT * FROM accounts WHERE id = ?", (account_id,))
        if account:
            return dict(account[0])
        return None

    def add_account(self, account_data):
        """Add a new account"""
        required_fields = ['name', 'type']
        for field in required_fields:
            if field not in account_data:
                return {'error': f'Missing required field: {field}'}

        # Set default values if not provided
        if 'balance' not in account_data:
            account_data['balance'] = 0.0

        # Insert account into database
        query = """
        INSERT INTO accounts (name, type, balance, currency, institution, account_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        account_id = self.db.execute(
            query,
            (
                account_data['name'],
                account_data['type'],
                account_data.get('balance', 0.0),
                account_data.get('currency', 'USD'),
                account_data.get('institution'),
                account_data.get('account_number'),
                account_data.get('notes')
            )
        )

        return {'id': account_id, 'message': 'Account created successfully'}

    def update_account(self, account_id, account_data):
        """Update an existing account"""
        current_account = self.get_account_by_id(account_id)
        if not current_account:
            return {'error': 'Account not found'}

        # Update account in database
        fields = []
        params = []

        for field in ['name', 'type', 'balance', 'currency', 'institution', 'account_number', 'notes']:
            if field in account_data:
                fields.append(f"{field} = ?")
                params.append(account_data[field])

        # Add last_updated timestamp
        fields.append("last_updated = ?")
        params.append(datetime.now().isoformat())

        # Add account_id to params
        params.append(account_id)

        query = f"UPDATE accounts SET {', '.join(fields)} WHERE id = ?"
        self.db.execute(query, params)

        return {'id': account_id, 'message': 'Account updated successfully'}

    def delete_account(self, account_id):
        """Delete an account"""
        # Check if account exists
        current_account = self.get_account_by_id(account_id)
        if not current_account:
            return {'error': 'Account not found'}

        # Delete account from database
        self.db.execute("DELETE FROM accounts WHERE id = ?", (account_id,))

        # Delete associated transactions
        self.db.execute(
            "DELETE FROM transactions WHERE account_id = ?", (account_id,))

        return {'message': 'Account and associated transactions deleted successfully'}

    def get_account_balance(self, account_id):
        """Get current balance for an account"""
        account = self.get_account_by_id(account_id)
        if not account:
            return {'error': 'Account not found'}

        return {'id': account_id, 'balance': account['balance']}

    def update_account_balance(self, account_id, new_balance):
        """Update account balance"""
        account = self.get_account_by_id(account_id)
        if not account:
            return {'error': 'Account not found'}

        self.db.execute(
            "UPDATE accounts SET balance = ?, last_updated = ? WHERE id = ?",
            (new_balance, datetime.now().isoformat(), account_id)
        )

        return {'id': account_id, 'balance': new_balance, 'message': 'Balance updated successfully'}

    def get_accounts_by_type(self, account_type):
        """Get accounts filtered by type"""
        accounts = self.db.query(
            "SELECT * FROM accounts WHERE type = ? ORDER BY name",
            (account_type,)
        )
        return [dict(account) for account in accounts]

    def calculate_net_worth(self):
        """Calculate total net worth across all accounts"""
        # Get asset accounts (positive balance)
        assets_query = """
        SELECT SUM(balance) as total FROM accounts 
        WHERE type IN ('checking', 'savings', 'investment', 'cash', 'other')
        """
        assets = self.db.query(assets_query)[0]['total'] or 0

        # Get liability accounts (negative balance)
        liabilities_query = """
        SELECT SUM(balance) as total FROM accounts 
        WHERE type IN ('credit', 'loan', 'mortgage', 'debt')
        """
        liabilities = self.db.query(liabilities_query)[0]['total'] or 0

        net_worth = assets - liabilities

        return {
            'assets': assets,
            'liabilities': liabilities,
            'net_worth': net_worth
        }
