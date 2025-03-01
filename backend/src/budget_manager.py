from datetime import datetime


class BudgetManager:
    def __init__(self, db):
        """Initialize budget manager with database connection"""
        self.db = db

    def get_all_budgets(self):
        """Get all budgets"""
        budgets = self.db.query("SELECT * FROM budgets ORDER BY name")
        return [dict(budget) for budget in budgets]

    def get_budget_by_id(self, budget_id):
        """Get budget by ID"""
        budget = self.db.query(
            "SELECT * FROM budgets WHERE id = ?", (budget_id,))
        if budget:
            return dict(budget[0])
        return None

    def create_budget(self, budget_data):
        """Create a new budget"""
        required_fields = ['name', 'amount', 'category']
        for field in required_fields:
            if field not in budget_data:
                return {'error': f'Missing required field: {field}'}

        # Insert budget into database
        query = """
        INSERT INTO budgets (name, amount, category, subcategory, period, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """

        budget_id = self.db.execute(
            query,
            (
                budget_data['name'],
                budget_data['amount'],
                budget_data['category'],
                budget_data.get('subcategory'),
                budget_data.get('period', 'monthly'),
                budget_data.get('start_date'),
                budget_data.get('end_date')
            )
        )

        return {'id': budget_id, 'message': 'Budget created successfully'}

    def update_budget(self, budget_id, budget_data):
        """Update an existing budget"""
        current_budget = self.get_budget_by_id(budget_id)
        if not current_budget:
            return {'error': 'Budget not found'}

        # Update budget in database
        fields = []
        params = []

        for field in ['name', 'amount', 'category', 'subcategory', 'period', 'start_date', 'end_date']:
            if field in budget_data:
                fields.append(f"{field} = ?")
                params.append(budget_data[field])

        # Add budget_id to params
        params.append(budget_id)

        query = f"UPDATE budgets SET {', '.join(fields)} WHERE id = ?"
        self.db.execute(query, params)

        return {'id': budget_id, 'message': 'Budget updated successfully'}

    def delete_budget(self, budget_id):
        """Delete a budget"""
        current_budget = self.get_budget_by_id(budget_id)
        if not current_budget:
            return {'error': 'Budget not found'}

        # Delete budget from database
        self.db.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))

        return {'message': 'Budget deleted successfully'}

    def get_budgets_by_category(self, category):
        """Get budgets filtered by category"""
        budgets = self.db.query(
            "SELECT * FROM budgets WHERE category = ? ORDER BY name",
            (category,)
        )
        return [dict(budget) for budget in budgets]

    def get_budget_progress(self, budget_id, start_date=None, end_date=None):
        """Calculate budget progress"""
        budget = self.get_budget_by_id(budget_id)
        if not budget:
            return {'error': 'Budget not found'}

        # Determine date range based on budget period
        now = datetime.now()
        if not start_date:
            if budget['period'] == 'monthly':
                start_date = datetime(now.year, now.month, 1).isoformat()
            elif budget['period'] == 'yearly':
                start_date = datetime(now.year, 1, 1).isoformat()
            elif budget['period'] == 'weekly':
                # Start from beginning of the week (Monday)
                start_date = (now - pd.Timedelta(days=now.weekday())
                              ).replace(hour=0, minute=0, second=0).isoformat()
            else:
                start_date = budget['start_date'] if budget['start_date'] else now.replace(
                    day=1).isoformat()

        if not end_date:
            if budget['period'] == 'monthly':
                # End of current month
                next_month = now.month + 1 if now.month < 12 else 1
                next_year = now.year if now.month < 12 else now.year + 1
                end_date = datetime(next_year, next_month, 1).isoformat()
            elif budget['period'] == 'yearly':
                end_date = datetime(now.year + 1, 1, 1).isoformat()
            elif budget['period'] == 'weekly':
                # End of the week (Sunday)
                end_date = (now + pd.Timedelta(days=6-now.weekday())
                            ).replace(hour=23, minute=59, second=59).isoformat()
            else:
                end_date = budget['end_date'] if budget['end_date'] else datetime(
                    now.year, now.month + 1, 1).isoformat()

        # Query transactions for this category within date range
        category_filter = ''
        params = [start_date, end_date]

        if budget['subcategory']:
            category_filter = "AND category = ? AND subcategory = ?"
            params.extend([budget['category'], budget['subcategory']])
        else:
            category_filter = "AND category = ?"
            params.append(budget['category'])

        query = f"""
        SELECT SUM(amount) as spent FROM transactions 
        WHERE date >= ? AND date < ? {category_filter} AND is_income = 0
        """

        result = self.db.query(query, params)
        spent = result[0]['spent'] if result[0]['spent'] else 0

        # Calculate remaining amount and percentage
        remaining = budget['amount'] - spent
        percentage = (spent / budget['amount']) * \
            100 if budget['amount'] > 0 else 0

        return {
            'budget_id': budget_id,
            'name': budget['name'],
            'category': budget['category'],
            'subcategory': budget['subcategory'],
            'amount': budget['amount'],
            'spent': spent,
            'remaining': remaining,
            'percentage': percentage,
            'period': budget['period'],
            'start_date': start_date,
            'end_date': end_date
        }

    def get_all_budget_progress(self, period='monthly'):
        """Get progress for all budgets in the current period"""
        budgets = self.get_all_budgets()
        progress = []

        for budget in budgets:
            if budget['period'] == period or period == 'all':
                budget_progress = self.get_budget_progress(budget['id'])
                progress.append(budget_progress)

        return progress
