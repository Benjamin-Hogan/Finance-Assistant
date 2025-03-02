from datetime import datetime
import pandas as pd


class BudgetManager:
    def __init__(self, db):
        """Initialize budget manager with database connection"""
        self.db = db

    def get_all_budgets(self):
        """Get all budgets"""
        query = """
        SELECT b.id, b.category, b.subcategory, b.amount, b.period, b.start_date, b.end_date
        FROM budgets b
        ORDER BY b.category, b.subcategory
        """
        budgets = self.db.execute_query(query)
        return budgets

    def get_budget(self, budget_id):
        """Get budget by ID"""
        query = """
        SELECT b.id, b.category, b.subcategory, b.amount, b.period, b.start_date, b.end_date
        FROM budgets b
        WHERE b.id = ?
        """
        budget = self.db.execute_query(query, (budget_id,))
        return budget[0] if budget else None

    def get_budgets_by_category(self, category):
        """Get budgets filtered by category"""
        query = """
        SELECT b.id, b.category, b.subcategory, b.amount, b.period, b.start_date, b.end_date
        FROM budgets b
        WHERE b.category = ?
        ORDER BY b.subcategory
        """
        budgets = self.db.execute_query(query, (category,))
        return budgets

    def get_budgets_by_subcategory(self, category, subcategory):
        """Get budgets filtered by subcategory"""
        query = """
        SELECT b.id, b.category, b.subcategory, b.amount, b.period, b.start_date, b.end_date
        FROM budgets b
        WHERE b.category = ? AND b.subcategory = ?
        """
        budgets = self.db.execute_query(query, (category, subcategory))
        return budgets

    def create_budget(self, budget_data):
        """Create a new budget"""
        # Check if required fields are present
        required_fields = ['category', 'amount', 'period']
        for field in required_fields:
            if field not in budget_data:
                return {'error': f'Missing required field: {field}'}

        # Set default values for optional fields
        if 'subcategory' not in budget_data:
            budget_data['subcategory'] = None

        # Check if a budget for this category/subcategory already exists
        existing_budget = None
        if budget_data['subcategory']:
            existing_budget = self.get_budgets_by_subcategory(
                budget_data['category'], budget_data['subcategory'])
        else:
            existing_budget = self.get_budgets_by_category(
                budget_data['category'])
            # Filter out budgets with subcategories
            existing_budget = [
                b for b in existing_budget if not b['subcategory']]

        if existing_budget and not budget_data.get('force_create', False):
            existing_budget = self.update_budget(existing_budget[0]['id'], {
                                                 'amount': budget_data['amount']})
            return {'id': existing_budget['id'], 'message': 'Budget updated successfully', 'budget': existing_budget}

        # Insert the new budget
        query = """
        INSERT INTO budgets (category, subcategory, amount, period, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        params = (
            budget_data['category'],
            budget_data.get('subcategory'),
            budget_data['amount'],
            budget_data['period'],
            budget_data.get('start_date'),
            budget_data.get('end_date')
        )
        budget_id = self.db.execute_insert(query, params)

        # Return the created budget with an ID
        created_budget = self.get_budget(budget_id)
        return {'id': budget_id, 'message': 'Budget created successfully', 'budget': created_budget}

    def update_budget(self, budget_id, budget_data):
        """Update an existing budget"""
        # Check if the budget exists
        existing_budget = self.get_budget(budget_id)
        if not existing_budget:
            return {'error': 'Budget not found'}

        # Update the budget
        query = """
        UPDATE budgets
        SET category = ?, subcategory = ?, amount = ?, period = ?, start_date = ?, end_date = ?
        WHERE id = ?
        """
        params = (
            budget_data.get('category', existing_budget['category']),
            budget_data.get('subcategory', existing_budget['subcategory']),
            budget_data.get('amount', existing_budget['amount']),
            budget_data.get('period', existing_budget['period']),
            budget_data.get('start_date', existing_budget['start_date']),
            budget_data.get('end_date', existing_budget['end_date']),
            budget_id
        )
        self.db.execute_update(query, params)

        # Return the updated budget
        return self.get_budget(budget_id)

    def delete_budget(self, budget_id):
        """Delete a budget"""
        # Check if the budget exists
        existing_budget = self.get_budget(budget_id)
        if not existing_budget:
            return {'error': 'Budget not found'}

        # Delete the budget
        query = "DELETE FROM budgets WHERE id = ?"
        self.db.execute_update(query, (budget_id,))

        return {'success': True, 'message': 'Budget deleted successfully'}

    def get_budget_progress(self, budget_id, start_date=None, end_date=None):
        """Calculate budget progress"""
        budget = self.get_budget(budget_id)
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

        result = self.db.execute_query(query, params)
        spent = result[0]['spent'] if result[0]['spent'] else 0

        # Calculate remaining amount and percentage
        remaining = budget['amount'] - spent
        percentage = (spent / budget['amount']) * \
            100 if budget['amount'] > 0 else 0

        return {
            'budget_id': budget_id,
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

    def get_budget_progress(self, category, subcategory=None, period='monthly'):
        """Calculate budget progress for a category/subcategory"""
        # Get budget for the category/subcategory
        if subcategory:
            budgets = self.get_budgets_by_subcategory(category, subcategory)
        else:
            budgets = self.get_budgets_by_category(category)
            # Filter out budgets with subcategories
            budgets = [b for b in budgets if not b['subcategory']]

        if not budgets:
            return {'category': category, 'subcategory': subcategory, 'spent': 0, 'budget': 0, 'period': period}

        # Use first matching budget (there should be only one)
        budget = budgets[0]
        budget_amount = budget['amount']

        # Determine date range based on budget period
        now = datetime.now()
        # Get the first day of the current month
        current_month_start = datetime(now.year, now.month, 1)

        if period == 'monthly':
            start_date = current_month_start.strftime('%Y-%m-%d')
            # Get the first day of next month
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1).strftime('%Y-%m-%d')
            else:
                end_date = datetime(now.year, now.month +
                                    1, 1).strftime('%Y-%m-%d')
        elif period == 'yearly':
            start_date = datetime(now.year, 1, 1).strftime('%Y-%m-%d')
            end_date = datetime(now.year + 1, 1, 1).strftime('%Y-%m-%d')
        elif period == 'weekly':
            # Start from beginning of the week (Monday)
            start_date = (now - pd.Timedelta(days=now.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d')
            end_date = (pd.Timestamp(start_date) +
                        pd.Timedelta(days=7)).strftime('%Y-%m-%d')
        else:
            return {'error': 'Invalid period'}

        # Debug the query parameters
        print(
            f"Fetching spending for category: {category}, subcategory: {subcategory}, date range: {start_date} to {end_date}")

        # Get transactions within date range for the category/subcategory
        query = """
        SELECT COALESCE(SUM(ABS(amount)), 0) as spent
        FROM transactions
        WHERE date >= ? AND date <= ? AND category = ? AND amount < 0
        """
        params = [start_date, end_date, category]

        if subcategory:
            query += " AND subcategory = ?"
            params.append(subcategory)

        print(f"SQL Query: {query}")
        print(f"Parameters: {params}")

        spent_result = self.db.execute_query(query, params)
        spent = spent_result[0]['spent'] if spent_result and spent_result[0]['spent'] is not None else 0

        print(f"Spent amount: {spent}")

        # Calculate progress
        return {
            'category': category,
            'subcategory': subcategory,
            'spent': spent,
            'budget': budget_amount,
            'period': period,
            'remaining': budget_amount - spent
        }
