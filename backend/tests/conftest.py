from .test_initialize_db import create_test_database
from src.database import Database
from src.app import app, db
import pytest
import os
import sys
import tempfile
import shutil
from datetime import datetime

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture
def test_client():
    """Create a test Flask client"""
    # Configure the app for testing
    app.config['TESTING'] = True
    app.config['DEBUG'] = False

    # Create a test client
    with app.test_client() as client:
        yield client


@pytest.fixture
def create_test_data(test_client):
    """Create test data for tests"""
    # Create a temporary directory for the test database
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'test_finance.db')

    # Create a test database
    test_db = Database(db_path)

    # Replace the global db with our test db
    global db
    original_db = db
    db = test_db

    # Create test data
    _create_test_data(test_db)

    # Return the test client and database
    yield test_client

    # Close the test database connection
    test_db.close()

    # Remove the temporary directory
    shutil.rmtree(temp_dir)

    # Restore the original db
    db = original_db


def _create_test_data(test_db):
    """Create test data for the database"""
    # Create test categories
    _create_category(test_db, "Income", "#4CAF50")
    _create_category(test_db, "Housing", "#2196F3")
    _create_category(test_db, "Food", "#FF9800")

    # Add subcategories
    _create_subcategory(test_db, 1, "Salary")
    _create_subcategory(test_db, 1, "Freelance")
    _create_subcategory(test_db, 2, "Rent")
    _create_subcategory(test_db, 2, "Utilities")
    _create_subcategory(test_db, 3, "Groceries")
    _create_subcategory(test_db, 3, "Restaurants")

    # Create test accounts
    _create_account(test_db, "Checking", "checking", 1000.00)
    _create_account(test_db, "Savings", "savings", 5000.00)
    _create_account(test_db, "Credit Card", "credit", -500.00)

    # Create test transactions
    _create_transaction(test_db, 1, datetime.now().strftime(
        '%Y-%m-%d'), 1000.00, "Salary", "Income", "Salary", True)
    _create_transaction(test_db, 1, datetime.now().strftime(
        '%Y-%m-%d'), -500.00, "Rent", "Housing", "Rent", False)
    _create_transaction(test_db, 1, datetime.now().strftime(
        '%Y-%m-%d'), -100.00, "Groceries", "Food", "Groceries", False)

    # Create test budgets
    _create_budget(test_db, "Housing", None, 600.00)
    _create_budget(test_db, "Food", None, 300.00)

    # Create test scheduled transactions
    _create_scheduled_transaction(
        test_db, 1, "Monthly Salary", 1000.00, "monthly", datetime.now().strftime('%Y-%m-%d'),
        None, 1, None, "Income", "Salary", True
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
    query = "INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)"
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
