import sqlite3
import os
import json
from datetime import datetime
import pandas as pd
import threading


class Database:
    def __init__(self, db_path=None):
        """Initialize database connection"""
        if db_path is None:
            # Check if we're running in test mode
            test_db_path = os.environ.get("TEST_DB_PATH")
            test_db_dir = os.environ.get("TEST_DB_DIR")

            if test_db_path:
                # Use the specific test database path
                db_path = test_db_path
                print(f"Using test database from TEST_DB_PATH: {db_path}")
            elif test_db_dir:
                # We're in test mode, use test database directory
                os.makedirs(test_db_dir, exist_ok=True)
                db_path = os.path.join(test_db_dir, 'test_finance.db')
                print(f"Using test database from TEST_DB_DIR: {db_path}")
            else:
                # Normal mode, use regular data directory
                data_dir = os.path.join(os.path.dirname(
                    os.path.dirname(__file__)), 'data')
                os.makedirs(data_dir, exist_ok=True)
                db_path = os.path.join(data_dir, 'finance.db')

        self.db_path = db_path
        self.conn = None
        self.initialize_db()
        print(f"Database initialized at: {self.db_path}")

    def get_connection(self):
        """Get a database connection with thread safety"""
        if self.conn is None:
            try:
                # Ensure the directory exists
                db_dir = os.path.dirname(self.db_path)
                if db_dir and not os.path.exists(db_dir):
                    os.makedirs(db_dir, exist_ok=True)

                self.conn = sqlite3.connect(
                    self.db_path, check_same_thread=False)
                self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            except sqlite3.Error as e:
                print(f"Database connection error: {e}")
                raise
        return self.conn

    def initialize_db(self):
        """Initialize the database with required tables"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

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
                name TEXT NOT NULL UNIQUE,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                UNIQUE(category_id, name)
            )
            ''')

            # Commit the table creation
            conn.commit()

            print(
                f"Successfully initialized database tables at {self.db_path}")

        except Exception as e:
            print(f"Error initializing database: {e}")
            raise

    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            cursor = self.conn.cursor()
            print(f"Executing query: {query}")
            print(f"With parameters: {params}")

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            rows = cursor.fetchall()
            print(f"Query returned {len(rows)} rows")

            # Convert to list of dictionaries
            results = [dict(row) for row in rows]

            # Print the first result for debugging
            if results and len(results) > 0:
                print(f"First result: {results[0]}")

            return results
        except Exception as e:
            print(f"Database error: {e}")
            return []

    def execute_insert(self, query, params=()):
        """Execute an INSERT query and return the ID of the inserted row"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        conn.commit()
        return cursor.lastrowid

    def execute_update(self, query, params=()):
        """Execute an UPDATE or DELETE query and return the number of affected rows"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        conn.commit()
        return cursor.rowcount

    def execute_transaction(self, queries):
        """Execute multiple queries as a transaction"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            for query, params in queries:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)

            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Transaction failed: {e}")
            return False

    # Compatibility methods for older code
    def query(self, sql, params=()):
        """Compatibility method for older code - executes a query and returns results"""
        return self.execute_query(sql, params)

    def execute(self, sql, params=()):
        """Compatibility method for older code - executes a command and returns lastrowid"""
        return self.execute_insert(sql, params)

    def executemany(self, sql, params_list):
        """Compatibility method for older code - executes many commands"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.executemany(sql, params_list)
        conn.commit()
        return cursor.rowcount

    def close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def __del__(self):
        """Close connection when object is deleted"""
        self.close()
