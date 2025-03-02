from src.database import Database
from src.account_manager import AccountManager
from src.transaction_manager import TransactionManager
from src.budget_manager import BudgetManager
from datetime import datetime, timedelta
import random

# Initialize the database and managers
db = Database()
account_manager = AccountManager(db)
transaction_manager = TransactionManager(db)
budget_manager = BudgetManager(db)

# Seed the database with sample accounts


def seed_accounts():
    print("Seeding accounts...")
    accounts = [
        {
            "name": "Checking Account",
            "type": "checking",
            "balance": 5000.0,
            "currency": "USD",
            "institution": "Bank of America",
            "account_number": "XXXX-1234",
        },
        {
            "name": "Savings Account",
            "type": "savings",
            "balance": 15000.0,
            "currency": "USD",
            "institution": "Chase Bank",
            "account_number": "XXXX-5678",
        },
        {
            "name": "Credit Card",
            "type": "credit",
            "balance": -2500.0,
            "currency": "USD",
            "institution": "American Express",
            "account_number": "XXXX-9012",
        },
        {
            "name": "Investment Account",
            "type": "investment",
            "balance": 50000.0,
            "currency": "USD",
            "institution": "Vanguard",
            "account_number": "XXXX-3456",
        },
    ]

    for account in accounts:
        result = account_manager.add_account(account)
        print(f"  Added account: {account['name']} (ID: {result['id']})")

    return account_manager.get_all_accounts()

# Seed the database with sample transactions


def seed_transactions(accounts):
    print("Seeding transactions...")

    # Categories for transactions
    income_categories = ["Salary", "Bonus", "Interest", "Dividends"]
    expense_categories = ["Housing", "Food", "Transportation",
                          "Entertainment", "Utilities", "Healthcare"]

    today = datetime.now()

    for account in accounts:
        # Create some transactions over the last 30 days
        for i in range(20):
            # Random date in the last 30 days
            days_ago = random.randint(0, 30)
            transaction_date = (today - timedelta(days=days_ago)).isoformat()

            # Some transactions are income, some are expenses
            is_income = random.random() > 0.7  # 30% chance of income

            if is_income:
                amount = round(random.uniform(500, 3000), 2)
                category = random.choice(income_categories)
                description = f"{category} payment"
            else:
                amount = -round(random.uniform(10, 500), 2)
                category = random.choice(expense_categories)
                description = f"{category} expense"

            transaction = {
                "account_id": account["id"],
                "date": transaction_date,
                "amount": amount,
                "description": description,
                "category": category,
                "is_income": is_income,
            }

            result = transaction_manager.add_transaction(transaction)
            print(
                f"  Added transaction: {description} - {amount} (ID: {result['id']})")

# Seed the database with sample budgets


def seed_budgets():
    print("Seeding budgets...")

    budgets = [
        {
            "name": "Groceries",
            "amount": 600.0,
            "category": "Food",
            "period": "monthly",
        },
        {
            "name": "Rent",
            "amount": 1800.0,
            "category": "Housing",
            "period": "monthly",
        },
        {
            "name": "Gas",
            "amount": 200.0,
            "category": "Transportation",
            "period": "monthly",
        },
        {
            "name": "Dining Out",
            "amount": 400.0,
            "category": "Food",
            "subcategory": "Restaurants",
            "period": "monthly",
        },
        {
            "name": "Entertainment",
            "amount": 300.0,
            "category": "Entertainment",
            "period": "monthly",
        },
    ]

    for budget in budgets:
        result = budget_manager.create_budget(budget)
        print(
            f"  Added budget: {budget['name']} - ${budget['amount']} (ID: {result['id']})")


if __name__ == "__main__":
    # Seed the database
    accounts = seed_accounts()
    seed_transactions(accounts)
    seed_budgets()

    print("\nDatabase seeded successfully!")
