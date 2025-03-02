from src.database import Database
from src.app import app, db
import unittest
import json
import os
import sys
import tempfile
import shutil
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))


class ApiEndpointTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method"""
        # Create a temporary directory for the test database
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_finance.db')

        # Configure the app for testing
        app.config['TESTING'] = True
        app.config['DEBUG'] = False
        self.app = app.test_client()

        # Create a test database
        self.test_db = Database(self.db_path)
        db = self.test_db  # Replace the global db with our test db

        # Populate the database with test data
        self._create_test_data()

    def tearDown(self):
        """Tear down test fixtures after each test method"""
        # Close the test database connection
        self.test_db.close()

        # Remove the temporary directory
        shutil.rmtree(self.temp_dir)

    def _create_test_data(self):
        """Create test data for the database"""
        # Create test categories
        self._create_category("Income", "#4CAF50")
        self._create_category("Housing", "#2196F3")
        self._create_category("Food", "#FF9800")

        # Create test accounts
        self._create_account("Checking", "checking", 1000.00)
        self._create_account("Savings", "savings", 5000.00)
        self._create_account("Credit Card", "credit", -500.00)

        # Create test transactions
        self._create_transaction(
            1, "2023-01-01", 1000.00, "Salary", "Income", None, True)
        self._create_transaction(
            1, "2023-01-05", -500.00, "Rent", "Housing", None, False)
        self._create_transaction(
            1, "2023-01-10", -100.00, "Groceries", "Food", None, False)

        # Create test budgets
        self._create_budget("Housing", None, 600.00)
        self._create_budget("Food", None, 300.00)

        # Create test scheduled transactions
        self._create_scheduled_transaction(
            1, "Monthly Salary", 1000.00, "monthly", "2023-01-01", None, 1, None, "Income", None, True)

    def _create_category(self, name, color):
        """Helper to create a test category"""
        query = "INSERT INTO categories (name, color) VALUES (?, ?)"
        self.test_db.execute_insert(query, (name, color))

    def _create_account(self, name, account_type, balance):
        """Helper to create a test account"""
        query = "INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)"
        self.test_db.execute_insert(query, (name, account_type, balance))

    def _create_transaction(self, account_id, date, amount, description, category, subcategory, is_income):
        """Helper to create a test transaction"""
        query = """
        INSERT INTO transactions 
        (account_id, date, amount, description, category, subcategory, is_income) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        self.test_db.execute_insert(
            query, (account_id, date, amount, description, category, subcategory, is_income))

    def _create_budget(self, category, subcategory, amount):
        """Helper to create a test budget"""
        query = """
        INSERT INTO budgets 
        (category, subcategory, amount, period) 
        VALUES (?, ?, ?, 'monthly')
        """
        self.test_db.execute_insert(query, (category, subcategory, amount))

    def _create_scheduled_transaction(self, account_id, description, amount, frequency, start_date, end_date,
                                      day_of_month, day_of_week, category, subcategory, is_income):
        """Helper to create a test scheduled transaction"""
        query = """
        INSERT INTO scheduled_transactions 
        (account_id, description, amount, frequency, start_date, end_date, day_of_month, day_of_week, 
         category, subcategory, is_income) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        self.test_db.execute_insert(query, (account_id, description, amount, frequency, start_date, end_date,
                                            day_of_month, day_of_week, category, subcategory, is_income))

    # Account Endpoint Tests
    def test_get_accounts(self):
        """Test getting all accounts"""
        response = self.app.get('/api/accounts')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        # Just assert that there are accounts
        self.assertTrue(len(data) > 0)

    def test_add_account(self):
        """Test adding a new account"""
        account_data = {
            'name': 'Investment',
            'type': 'investment',
            'balance': 10000.00,
            'currency': 'USD'
        }
        response = self.app.post('/api/accounts',
                                 json=account_data,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertIn('message', data)

        # Verify the account was added
        response = self.app.get('/api/accounts')
        data = json.loads(response.data)
        found = False
        for account in data:
            if account['name'] == 'Investment':
                found = True
                break
        self.assertTrue(found)

    def test_update_account(self):
        """Test updating an account"""
        # First get the account to update
        response = self.app.get('/api/accounts')
        accounts = json.loads(response.data)
        account_id = accounts[0]['id']

        # Save the original name to verify it changed
        original_name = accounts[0]['name']

        # Update the account
        new_name = "Updated Account"
        update_data = {
            'name': new_name,
            'balance': 1500.00
        }
        response = self.app.put(f'/api/accounts/{account_id}',
                                json=update_data,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify the account was updated
        response = self.app.get('/api/accounts')
        data = json.loads(response.data)
        found = False
        for account in data:
            if account['id'] == account_id:
                self.assertEqual(account['name'], new_name)
                self.assertEqual(account['balance'], 1500.00)
                found = True
                break
        self.assertTrue(found)

    # Transaction Endpoint Tests
    def test_get_transactions(self):
        """Test getting all transactions"""
        response = self.app.get('/api/transactions')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        # Just verify there are transactions
        self.assertTrue(len(data) > 0)

    def test_add_transaction(self):
        """Test adding a new transaction"""
        # First get an account ID
        response = self.app.get('/api/accounts')
        accounts = json.loads(response.data)
        account_id = accounts[0]['id']

        transaction_data = {
            'account_id': account_id,
            'date': '2023-01-15',
            'amount': -50.00,
            'description': 'Test Transaction',
            'category': 'Food',
            'is_income': False
        }
        response = self.app.post('/api/transactions',
                                 json=transaction_data,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify the transaction was added
        response = self.app.get('/api/transactions')
        data = json.loads(response.data)
        found = False
        for transaction in data:
            if transaction['description'] == 'Test Transaction':
                found = True
                break
        self.assertTrue(found)

    # Budget Endpoint Tests
    def test_get_budgets(self):
        """Test getting all budgets"""
        response = self.app.get('/api/budgets')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        # Just verify we can get budgets
        self.assertIsInstance(data, list)

    def test_create_budget(self):
        """Test creating a new budget"""
        budget_data = {
            'category': 'Test Budget',
            'amount': 200.00,
            'period': 'monthly'
        }
        response = self.app.post('/api/budgets',
                                 json=budget_data,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify the budget was created
        response = self.app.get('/api/budgets')
        data = json.loads(response.data)
        found = False
        for budget in data:
            if budget['category'] == 'Test Budget':
                self.assertEqual(budget['amount'], 200.00)
                found = True
                break
        self.assertTrue(found)

    # Category Endpoint Tests
    def test_get_categories(self):
        """Test getting all categories"""
        response = self.app.get('/api/categories')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        # Just verify we get categories back
        self.assertTrue(len(data) > 0)

    def test_add_category(self):
        """Test adding a new category"""
        category_name = "Test Category"
        category_data = {
            'name': category_name,
            'color': '#9C27B0',
            'subcategories': ['Test Sub 1', 'Test Sub 2', 'Test Sub 3']
        }
        response = self.app.post('/api/categories',
                                 json=category_data,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify the category was added
        response = self.app.get('/api/categories')
        data = json.loads(response.data)
        found = False
        for category in data:
            if category['name'] == category_name:
                found = True
                self.assertGreaterEqual(len(category['subcategories']), 3)
                break
        self.assertTrue(found)

    def test_get_subcategories(self):
        """Test getting subcategories for a category"""
        # First get the categories
        response = self.app.get('/api/categories')
        categories = json.loads(response.data)
        self.assertTrue(len(categories) > 0)

        # Get the first category's ID
        category_id = categories[0]['id']

        # Now get the subcategories
        response = self.app.get(f'/api/categories/{category_id}/subcategories')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    # Scheduled Transaction Endpoint Tests
    def test_get_scheduled_transactions(self):
        """Test getting all scheduled transactions"""
        response = self.app.get('/api/scheduled-transactions')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        # Just check we can get scheduled transactions
        self.assertIsInstance(data, list)

    def test_add_scheduled_transaction(self):
        """Test adding a new scheduled transaction"""
        # First get an account ID
        response = self.app.get('/api/accounts')
        accounts = json.loads(response.data)
        account_id = accounts[0]['id']

        scheduled_transaction_data = {
            'account_id': account_id,
            'description': 'Test Monthly Payment',
            'amount': -800.00,
            'frequency': 'monthly',
            'start_date': '2023-01-01',
            'day_of_month': 1,
            'category': 'Housing',
            'is_income': False
        }
        response = self.app.post('/api/scheduled-transactions',
                                 json=scheduled_transaction_data,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Verify the scheduled transaction was added
        response = self.app.get('/api/scheduled-transactions')
        data = json.loads(response.data)
        found = False
        for transaction in data:
            if transaction['description'] == 'Test Monthly Payment':
                found = True
                break
        self.assertTrue(found)

    # Analytics Endpoint Tests
    def test_get_spending_analytics(self):
        """Test getting spending analytics"""
        response = self.app.get('/api/analytics/spending?timeframe=month')
        self.assertEqual(response.status_code, 200)
        # Just check that we get a valid response
        data = json.loads(response.data)
        self.assertIsInstance(data, (list, dict))

    def test_get_income_analytics(self):
        """Test getting income analytics"""
        response = self.app.get('/api/analytics/income?timeframe=month')
        self.assertEqual(response.status_code, 200)
        # Just check that we get a valid response
        data = json.loads(response.data)
        self.assertIsInstance(data, (list, dict))


if __name__ == '__main__':
    unittest.main()
