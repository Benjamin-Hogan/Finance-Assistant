import os
import tempfile
import shutil
import sqlite3
from datetime import datetime, timedelta


def create_test_database(db_path):
    """Create a test database with initial test data"""
    # Create database connection
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Create tables
    create_tables(cursor)

    # Insert test data
    insert_test_data(cursor)

    # Commit changes and close
    conn.commit()
    conn.close()


def create_tables(cursor):
    """Create all the tables needed for testing"""
    # Create accounts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        subcategory TEXT,
        is_income BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    )
    ''')

    # Create scheduled transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scheduled_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        day_of_month INTEGER,
        day_of_week INTEGER,
        category TEXT,
        subcategory TEXT,
        is_income BOOLEAN DEFAULT 0,
        last_occurrence TEXT,
        next_occurrence TEXT,
        active BOOLEAN DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    )
    ''')

    # Create budgets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        subcategory TEXT,
        amount REAL NOT NULL,
        period TEXT DEFAULT 'monthly',
        start_date TEXT,
        end_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create categories table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create subcategories table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )
    ''')


def insert_test_data(cursor):
    """Insert test data for testing"""
    # Insert test categories
    cursor.execute(
        "INSERT INTO categories (name, color) VALUES (?, ?)", ("Income", "#4CAF50"))
    income_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO categories (name, color) VALUES (?, ?)", ("Housing", "#2196F3"))
    housing_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO categories (name, color) VALUES (?, ?)", ("Food", "#FF9800"))
    food_id = cursor.lastrowid

    # Insert test subcategories
    cursor.execute("INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)",
                   (income_id, "Salary", None))
    cursor.execute(
        "INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)", (income_id, "Bonus", None))
    cursor.execute(
        "INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)", (housing_id, "Rent", None))
    cursor.execute("INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)",
                   (housing_id, "Utilities", None))
    cursor.execute("INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)",
                   (food_id, "Groceries", None))
    cursor.execute("INSERT INTO subcategories (category_id, name, color) VALUES (?, ?, ?)",
                   (food_id, "Dining Out", None))

    # Insert test accounts
    cursor.execute("INSERT INTO accounts (name, type, balance, currency) VALUES (?, ?, ?, ?)",
                   ("Checking", "checking", 1000.00, "USD"))
    checking_id = cursor.lastrowid
    cursor.execute("INSERT INTO accounts (name, type, balance, currency) VALUES (?, ?, ?, ?)",
                   ("Savings", "savings", 5000.00, "USD"))
    savings_id = cursor.lastrowid
    cursor.execute("INSERT INTO accounts (name, type, balance, currency) VALUES (?, ?, ?, ?)",
                   ("Credit Card", "credit", -500.00, "USD"))
    credit_id = cursor.lastrowid

    # Insert test transactions
    today = datetime.now().date().isoformat()
    yesterday = (datetime.now() - timedelta(days=1)).date().isoformat()

    cursor.execute("""
    INSERT INTO transactions 
    (account_id, date, amount, description, category, subcategory, is_income) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (checking_id, yesterday, 1000.00, "Salary", "Income", "Salary", 1))

    cursor.execute("""
    INSERT INTO transactions 
    (account_id, date, amount, description, category, subcategory, is_income) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (checking_id, today, -500.00, "Rent", "Housing", "Rent", 0))

    cursor.execute("""
    INSERT INTO transactions 
    (account_id, date, amount, description, category, subcategory, is_income) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (checking_id, today, -100.00, "Groceries", "Food", "Groceries", 0))

    # Insert test budgets
    cursor.execute("""
    INSERT INTO budgets 
    (category, subcategory, amount, period) 
    VALUES (?, ?, ?, ?)
    """, ("Housing", None, 600.00, "monthly"))

    cursor.execute("""
    INSERT INTO budgets 
    (category, subcategory, amount, period) 
    VALUES (?, ?, ?, ?)
    """, ("Food", None, 300.00, "monthly"))

    # Insert test scheduled transactions
    next_month = (datetime.now() + timedelta(days=30)).date().isoformat()

    cursor.execute("""
    INSERT INTO scheduled_transactions 
    (account_id, description, amount, frequency, start_date, day_of_month, category, 
     subcategory, is_income, next_occurrence, active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (checking_id, "Monthly Salary", 1000.00, "monthly", today, 1, "Income",
          "Salary", 1, next_month, 1))


if __name__ == "__main__":
    # Create a temporary test database
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'test_finance.db')

    # Create the test database
    create_test_database(db_path)

    print(f"Test database created at: {db_path}")

    # Clean up when done
    shutil.rmtree(temp_dir)
