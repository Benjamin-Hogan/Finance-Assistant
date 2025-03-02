from .test_initialize_db import create_test_database, create_tables, insert_test_data
from src.database import Database
from src.app import app, db
import pytest
import os
import sys
import tempfile
import shutil
from datetime import datetime, timedelta
import uuid
import sqlite3
from src.account_manager import AccountManager
from src.transaction_manager import TransactionManager
from src.budget_manager import BudgetManager
from src.analytics import Analytics
from src.scheduled_transaction_manager import ScheduledTransactionManager
from src.category_manager import CategoryManager

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture(scope="session")
def app_with_temp_db():
    """Create Flask app with a test database"""
    print("\n\n=== INITIALIZING TEST DATABASE ===")
    # Set up a fixed test directory and database
    test_db_dir = os.path.join(os.path.dirname(
        os.path.dirname(__file__)), 'test_data')
    os.makedirs(test_db_dir, exist_ok=True)
    db_path = os.path.join(test_db_dir, 'test_finance.db')

    # Remove any existing database file
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database at {db_path}")

    print(f"Creating new test database at {db_path}")

    # Create the database file and initialize tables directly
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Create tables and insert test data directly
    try:
        print("Creating tables...")
        create_tables(cursor)

        # Verify tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables created: {[table[0] for table in tables]}")

        print("Inserting test data...")
        insert_test_data(cursor)

        # Commit changes
        conn.commit()
        print("Database setup completed successfully")
    except Exception as e:
        print(f"Error during database setup: {e}")
        conn.rollback()
    finally:
        conn.close()

    # Store original database instance
    original_db = db

    # Create test database instance
    test_db = Database(db_path)

    # Double check tables exist in our new database instance
    try:
        check_conn = sqlite3.connect(db_path)
        check_cursor = check_conn.cursor()
        check_cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table';")
        tables = check_cursor.fetchall()
        print(
            f"Tables in database after setup: {[table[0] for table in tables]}")

        # Check if we have data in the categories table
        if 'categories' in [table[0] for table in tables]:
            check_cursor.execute("SELECT COUNT(*) FROM categories")
            count = check_cursor.fetchone()[0]
            print(f"Number of categories: {count}")

            if count > 0:
                check_cursor.execute(
                    "SELECT id, name, color FROM categories LIMIT 5")
                categories = check_cursor.fetchall()
                print(f"Sample categories: {categories}")

        check_conn.close()
    except Exception as e:
        print(f"Error checking database: {e}")

    # Replace the app's db with our test db
    app.config['TEST_DB_PATH'] = db_path
    app.config['TESTING'] = True

    # Patch the app's database instance
    import src.app
    src.app.db = test_db

    # Update all managers to use the test database
    account_manager = AccountManager(test_db)
    transaction_manager = TransactionManager(test_db)
    budget_manager = BudgetManager(test_db)
    analytics = Analytics(test_db)
    scheduled_transaction_manager = ScheduledTransactionManager(test_db)
    category_manager = CategoryManager(test_db, initialize_defaults=True)

    print("Initialized all managers with test database")

    # Update app's manager instances
    src.app.account_manager = account_manager
    src.app.transaction_manager = transaction_manager
    src.app.budget_manager = budget_manager
    src.app.analytics = analytics
    src.app.scheduled_transaction_manager = scheduled_transaction_manager
    src.app.category_manager = category_manager

    yield app

    # Clean up: close the test database
    test_db.close()

    # Clean up database file
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed test database at: {db_path}")

    # Clean up test directory if it's empty
    if os.path.exists(test_db_dir) and not os.listdir(test_db_dir):
        os.rmdir(test_db_dir)
        print(f"Removed empty test directory: {test_db_dir}")


@pytest.fixture
def client(app_with_temp_db):
    """Get a test client for the app"""
    # Ensure the app has a properly initialized database
    print("Creating test client with initialized database")
    return app_with_temp_db.test_client()


@pytest.fixture
def test_client(app_with_temp_db):
    """Create a test client using the Flask app with temporary database"""
    print("Creating test client with app_with_temp_db")
    with app_with_temp_db.test_client() as client:
        yield client


@pytest.fixture
def create_test_data():
    """Create test data for testing"""
    # This fixture depends on app_with_temp_db which already creates test data
    # So we just need to yield to ensure the fixture dependency is maintained
    yield


def _create_test_data(test_db):
    """Create test data for the database"""
    # Initialize default categories (delegate to CategoryManager)
    try:
        from src.category_manager import CategoryManager
        category_manager = CategoryManager(test_db, initialize_defaults=False)
        print("CategoryManager initialized with initialize_defaults=False")

        # Manually create some test categories
        food_category = category_manager.add_category({
            'name': 'Food',
            'color': '#FF9800'
        })

        housing_category = category_manager.add_category({
            'name': 'Housing',
            'color': '#2196F3'
        })

        income_category = category_manager.add_category({
            'name': 'Income',
            'color': '#4CAF50'
        })

        transportation_category = category_manager.add_category({
            'name': 'Transportation',
            'color': '#9C27B0'
        })

        # Add some subcategories
        if food_category and 'id' in food_category:
            category_manager.create_subcategory(
                food_category['id'], 'Groceries')
            category_manager.create_subcategory(
                food_category['id'], 'Restaurants')

        if housing_category and 'id' in housing_category:
            category_manager.create_subcategory(housing_category['id'], 'Rent')
            category_manager.create_subcategory(
                housing_category['id'], 'Utilities')

        if income_category and 'id' in income_category:
            category_manager.create_subcategory(
                income_category['id'], 'Salary')
            category_manager.create_subcategory(income_category['id'], 'Bonus')

        if transportation_category and 'id' in transportation_category:
            category_manager.create_subcategory(
                transportation_category['id'], 'Gas')
            category_manager.create_subcategory(
                transportation_category['id'], 'Public Transit')

        print("Test categories and subcategories created")
    except Exception as e:
        print(f"Error initializing CategoryManager: {e}")

    # Create test accounts
    account_ids = [
        _create_account(test_db, "Checking", "checking", 1000.00),
        _create_account(test_db, "Savings", "savings", 5000.00),
        _create_account(test_db, "Credit Card", "credit", -500.00),
        _create_account(test_db, "Investment", "investment", 2000.00),
        _create_account(test_db, "Cash", "cash", 200.00)
    ]

    # Create test transactions
    today = datetime.now().strftime('%Y-%m-%d')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

    # Expense transactions
    _create_transaction(
        test_db, account_ids[0], today, -50.00, "Grocery shopping", "Food", "Groceries", False)
    _create_transaction(
        test_db, account_ids[0], today, -30.00, "Lunch", "Food", "Restaurants", False)
    _create_transaction(
        test_db, account_ids[2], yesterday, -75.00, "Movie night", "Entertainment", "Movies", False)
    _create_transaction(
        test_db, account_ids[0], yesterday, -100.00, "Gas", "Transportation", "Fuel", False)

    # Income transactions
    _create_transaction(
        test_db, account_ids[0], today, 1500.00, "Salary", "Income", "Salary", True)
    _create_transaction(
        test_db, account_ids[1], yesterday, 200.00, "Freelance work", "Income", "Freelance", True)

    # Transfer
    _create_transaction(test_db, account_ids[0], today, -500.00,
                        "Transfer to savings", "Transfer", "Account Transfer", False)
    _create_transaction(test_db, account_ids[1], today, 500.00,
                        "Transfer from checking", "Transfer", "Account Transfer", True)

    # Create test budgets
    _create_budget(test_db, "Food", None, 400.00)
    _create_budget(test_db, "Entertainment", None, 200.00)
    _create_budget(test_db, "Transportation", None, 300.00)

    # Create test scheduled transactions
    _create_scheduled_transaction(
        test_db, account_ids[0], "Monthly Salary", 1500.00, "monthly", today,
        None, 15, None, "Income", "Salary", True
    )
    _create_scheduled_transaction(
        test_db, account_ids[0], "Rent", -800.00, "monthly", today,
        None, 1, None, "Housing", "Rent/Mortgage", False
    )


def _create_category(test_db, name, color):
    """Helper to create a test category"""
    query = "INSERT INTO categories (name, color) VALUES (?, ?)"
    return test_db.execute_insert(query, (name, color))


def _create_subcategory(test_db, category_id, name):
    """Helper to create a test subcategory"""
    query = "INSERT INTO subcategories (category_id, name) VALUES (?, ?)"
    return test_db.execute_insert(query, (category_id, name))


def _create_account(test_db, name, account_type, balance):
    """Helper to create a test account"""
    query = "INSERT INTO accounts (name, type, balance, currency) VALUES (?, ?, ?, 'USD')"
    return test_db.execute_insert(query, (name, account_type, balance))


def _create_transaction(test_db, account_id, date, amount, description, category, subcategory, is_income):
    """Helper to create a test transaction"""
    query = """
    INSERT INTO transactions 
    (account_id, date, amount, description, category, subcategory, is_income) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    return test_db.execute_insert(
        query, (account_id, date, amount, description, category, subcategory, is_income))


def _create_budget(test_db, category, subcategory, amount):
    """Helper to create a test budget"""
    query = """
    INSERT INTO budgets 
    (category, subcategory, amount, period) 
    VALUES (?, ?, ?, 'monthly')
    """
    return test_db.execute_insert(query, (category, subcategory, amount))


def _create_scheduled_transaction(test_db, account_id, description, amount, frequency, start_date, end_date,
                                  day_of_month, day_of_week, category, subcategory, is_income):
    """Helper to create a test scheduled transaction"""
    query = """
    INSERT INTO scheduled_transactions 
    (account_id, description, amount, frequency, start_date, end_date, day_of_month, day_of_week,
     category, subcategory, is_income, next_occurrence) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    # Set next_occurrence to start_date for simplicity
    return test_db.execute_insert(
        query, (account_id, description, amount, frequency, start_date, end_date,
                day_of_month, day_of_week, category, subcategory, is_income, start_date))
