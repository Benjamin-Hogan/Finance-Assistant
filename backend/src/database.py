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
            # Default to the data directory
            self.db_path = os.path.join(os.path.dirname(
                os.path.dirname(__file__)), 'data', 'finance.db')
        else:
            self.db_path = db_path

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        # Initialize database with thread safety
        self.conn = None
        self.lock = threading.Lock()
        self.init_db()

    def get_connection(self):
        """Get a database connection with thread safety"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return self.conn

    def init_db(self):
        """Initialize database tables if they don't exist"""
        with self.lock:
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
                institution TEXT,
                account_number TEXT,
                notes TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')

            # Create transactions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                category TEXT,
                subcategory TEXT,
                is_income BOOLEAN DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
            ''')

            # Create scheduled transactions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                category TEXT,
                subcategory TEXT,
                is_income BOOLEAN DEFAULT 0,
                frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                last_occurrence TIMESTAMP,
                next_occurrence TIMESTAMP,
                day_of_month INTEGER,
                day_of_week INTEGER,
                week_of_month INTEGER,
                month_of_year INTEGER,
                active BOOLEAN DEFAULT 1,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
            ''')

            # Create budgets table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                subcategory TEXT,
                period TEXT DEFAULT 'monthly',
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')

            # Create categories table for predefined categories
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT,
                parent_id INTEGER,
                FOREIGN KEY (parent_id) REFERENCES categories(id)
            )
            ''')

            conn.commit()

            # Initialize with default categories if empty
            cursor.execute('SELECT COUNT(*) FROM categories')
            if cursor.fetchone()[0] == 0:
                self._init_default_categories()

    def _init_default_categories(self):
        """Initialize default categories"""
        categories = [
            {'name': 'Income', 'color': '#4CAF50', 'subcategories': [
                'Salary', 'Dividends', 'Interest', 'Gifts', 'Other']},
            {'name': 'Housing', 'color': '#2196F3', 'subcategories': [
                'Rent', 'Mortgage', 'Insurance', 'Utilities', 'Maintenance']},
            {'name': 'Transportation', 'color': '#FF9800', 'subcategories': [
                'Car Payment', 'Gas', 'Insurance', 'Maintenance', 'Public Transit']},
            {'name': 'Food', 'color': '#E91E63', 'subcategories': [
                'Groceries', 'Dining Out', 'Takeout', 'Coffee']},
            {'name': 'Shopping', 'color': '#9C27B0', 'subcategories': [
                'Clothing', 'Electronics', 'Home Goods', 'Gifts']},
            {'name': 'Entertainment', 'color': '#FF5722', 'subcategories': [
                'Movies', 'Concerts', 'Subscriptions', 'Hobbies']},
            {'name': 'Health', 'color': '#607D8B', 'subcategories': [
                'Medical', 'Pharmacy', 'Fitness', 'Mental Health']},
            {'name': 'Debt', 'color': '#F44336', 'subcategories': [
                'Credit Card', 'Student Loans', 'Personal Loans']},
            {'name': 'Savings', 'color': '#8BC34A', 'subcategories': [
                'Emergency Fund', 'Retirement', 'Investments', 'Goals']},
            {'name': 'Education', 'color': '#00BCD4', 'subcategories': [
                'Tuition', 'Books', 'Courses', 'Supplies']},
            {'name': 'Miscellaneous', 'color': '#9E9E9E',
                'subcategories': ['Fees', 'Other']}
        ]

        conn = self.get_connection()
        cursor = conn.cursor()

        for category in categories:
            cursor.execute('INSERT INTO categories (name, color) VALUES (?, ?)',
                           (category['name'], category['color']))
            parent_id = cursor.lastrowid

            for subcategory in category['subcategories']:
                cursor.execute('INSERT INTO categories (name, parent_id) VALUES (?, ?)',
                               (subcategory, parent_id))

        conn.commit()

    def query(self, sql, params=()):
        """Execute a query and return results with thread safety"""
        with self.lock:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, params)
            return cursor.fetchall()

    def execute(self, sql, params=()):
        """Execute a command and commit changes with thread safety"""
        with self.lock:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor.lastrowid

    def executemany(self, sql, params_list):
        """Execute many commands with list of parameter tuples with thread safety"""
        with self.lock:
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
