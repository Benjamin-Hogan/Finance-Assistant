from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import os
import json
from .database import Database
from .account_manager import AccountManager
from .transaction_manager import TransactionManager
from .budget_manager import BudgetManager
from .analytics import Analytics
from .scheduled_transaction_manager import ScheduledTransactionManager
# Import directly from file using relative path
from .category_manager import CategoryManager

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create a blueprint for API routes
api = Blueprint('api', __name__, url_prefix='/api')

# Initialize database and managers
db = Database()
account_manager = AccountManager(db)
transaction_manager = TransactionManager(db)
budget_manager = BudgetManager(db)
analytics = Analytics(db)
scheduled_transaction_manager = ScheduledTransactionManager(db)
category_manager = CategoryManager(db)

# Add OPTIONS method handling for all routes


@api.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

# Add CORS headers to all responses


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# API Routes


@api.route('/accounts', methods=['GET'])
def get_accounts():
    accounts = account_manager.get_all_accounts()
    return jsonify(accounts)


@api.route('/accounts', methods=['POST'])
def add_account():
    account_data = request.json
    result = account_manager.add_account(account_data)
    return jsonify(result)


@api.route('/accounts/<account_id>', methods=['PUT'])
def update_account(account_id):
    account_data = request.json
    result = account_manager.update_account(account_id, account_data)
    return jsonify(result)


@api.route('/accounts/<account_id>', methods=['DELETE'])
def delete_account(account_id):
    result = account_manager.delete_account(account_id)
    return jsonify(result)


@api.route('/accounts/<account_id>', methods=['GET'])
def get_account(account_id):
    account = account_manager.get_account_by_id(account_id)
    if account:
        return jsonify(account)
    return jsonify({'error': 'Account not found'}), 404


@api.route('/accounts/<account_id>/transactions', methods=['GET'])
def get_account_transactions(account_id):
    transactions = transaction_manager.get_transactions_by_account(account_id)
    return jsonify(transactions)


@api.route('/transactions', methods=['GET'])
def get_transactions():
    account_id = request.args.get('account_id')
    if account_id:
        transactions = transaction_manager.get_transactions_by_account(
            account_id)
    else:
        transactions = transaction_manager.get_all_transactions()
    return jsonify(transactions)


@api.route('/transactions', methods=['POST'])
def add_transaction():
    transaction_data = request.json
    result = transaction_manager.add_transaction(transaction_data)
    return jsonify(result)


@api.route('/import-csv', methods=['POST'])
def import_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    account_id = request.form.get('account_id')

    if not account_id:
        return jsonify({'error': 'Account ID is required'}), 400

    result = transaction_manager.import_from_csv(file, account_id)
    return jsonify(result)


@api.route('/budgets', methods=['GET'])
def get_budgets():
    # Print the complete request to debug
    print(f"GET /budgets request received")
    print(f"Query parameters: {request.args}")

    # Extract and validate date parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    # Extract explicit month_year parameter
    month_year = request.args.get('month_year')

    print(
        f"Extracted parameters: start_date={start_date}, end_date={end_date}, month_year={month_year}")

    try:
        # Return appropriate budgets based on the parameters
        if month_year:
            # If month_year is provided, use it as the primary filtering mechanism
            print(f"Filtering budgets by month_year: {month_year}")

            # Parse the month_year to create date bounds if start_date or end_date is missing
            if not (start_date and end_date):
                year, month = map(int, month_year.split('-'))

                # Create first day of month if start_date is missing
                if not start_date:
                    from datetime import datetime
                    start_date = datetime(year, month, 1).isoformat()

                # Create last day of month if end_date is missing
                if not end_date:
                    import calendar
                    from datetime import datetime
                    last_day = calendar.monthrange(year, month)[1]
                    end_date = datetime(
                        year, month, last_day, 23, 59, 59).isoformat()

                print(
                    f"Derived date range from month_year: {start_date} to {end_date}")

            budgets = budget_manager.get_budgets_by_date_range(
                start_date, end_date, month_year=month_year)
        elif start_date and end_date:
            print(
                f"Filtering budgets by date range: {start_date} to {end_date}")
            budgets = budget_manager.get_budgets_by_date_range(
                start_date, end_date)
        else:
            print("No filtering parameters found, returning all budgets")
            budgets = budget_manager.get_all_budgets()

        print(f"Returning {len(budgets)} budgets")
        for budget in budgets[:3]:  # Log first 3 budgets for debugging
            print(
                f"  Budget: {budget['category']} - {budget.get('subcategory', 'N/A')} - Amount: {budget['amount']}")

        return jsonify(budgets)
    except Exception as e:
        print(f"Error in /budgets endpoint: {str(e)}")
        return jsonify({"error": f"Failed to retrieve budgets: {str(e)}"}), 500


@api.route('/budgets', methods=['POST'])
def create_budget():
    budget_data = request.json
    result = budget_manager.create_budget(budget_data)
    return jsonify(result)


@api.route('/budgets/<budget_id>', methods=['GET'])
def get_budget(budget_id):
    budget = budget_manager.get_budget(budget_id)
    if budget:
        return jsonify(budget)
    return jsonify({'error': 'Budget not found'}), 404


@api.route('/budgets/<budget_id>', methods=['PUT'])
def update_budget(budget_id):
    budget_data = request.json
    result = budget_manager.update_budget(budget_id, budget_data)
    return jsonify(result)


@api.route('/budgets/<budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    result = budget_manager.delete_budget(budget_id)
    return jsonify(result)


@api.route('/analytics/spending', methods=['GET'])
def get_spending_analytics():
    timeframe = request.args.get('timeframe', 'month')
    result = analytics.get_spending_by_category(timeframe)
    return jsonify(result)


@api.route('/analytics/income', methods=['GET'])
def get_income_analytics():
    timeframe = request.args.get('timeframe', 'month')
    result = analytics.get_income_by_source(timeframe)
    return jsonify(result)


@api.route('/analytics/projections', methods=['GET'])
def get_projections():
    months = int(request.args.get('months', 12))
    result = analytics.get_future_projections(months)
    return jsonify(result)


# Scheduled Transactions endpoints

@api.route('/scheduled-transactions', methods=['GET'])
def get_scheduled_transactions():
    account_id = request.args.get('account_id')
    if account_id:
        transactions = scheduled_transaction_manager.get_scheduled_transactions_by_account(
            account_id)
    else:
        transactions = scheduled_transaction_manager.get_all_scheduled_transactions()
    return jsonify(transactions)


@api.route('/scheduled-transactions', methods=['POST'])
def add_scheduled_transaction():
    transaction_data = request.json
    result = scheduled_transaction_manager.add_scheduled_transaction(
        transaction_data)
    return jsonify(result)


@api.route('/scheduled-transactions/<transaction_id>', methods=['PUT'])
def update_scheduled_transaction(transaction_id):
    transaction_data = request.json
    result = scheduled_transaction_manager.update_scheduled_transaction(
        transaction_id, transaction_data)
    return jsonify(result)


@api.route('/scheduled-transactions/<transaction_id>', methods=['DELETE'])
def delete_scheduled_transaction(transaction_id):
    result = scheduled_transaction_manager.delete_scheduled_transaction(
        transaction_id)
    return jsonify(result)


@api.route('/scheduled-transactions/process', methods=['POST'])
def process_scheduled_transactions():
    result = scheduled_transaction_manager.process_due_transactions()
    return jsonify(result)


@api.route('/scheduled-transactions/<transaction_id>', methods=['GET'])
def get_scheduled_transaction(transaction_id):
    transaction = scheduled_transaction_manager.get_scheduled_transaction_by_id(
        transaction_id)
    if transaction:
        return jsonify(transaction)
    return jsonify({'error': 'Scheduled transaction not found'}), 404


# Categories endpoints
@api.route('/categories', methods=['GET'])
def get_categories():
    categories = category_manager.get_all_categories()
    return jsonify(categories)


@api.route('/categories', methods=['POST'])
def add_category():
    category_data = request.json
    result = category_manager.add_category(category_data)
    return jsonify(result)


@api.route('/categories/<category_id>', methods=['PUT'])
def update_category(category_id):
    category_data = request.json
    result = category_manager.update_category(category_id, category_data)
    return jsonify(result)


@api.route('/categories/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    result = category_manager.delete_category(category_id)
    return jsonify(result)


@api.route('/categories/<category_id>/subcategories', methods=['GET'])
def get_subcategories(category_id):
    subcategories = category_manager.get_subcategories(category_id)
    return jsonify(subcategories)


@api.route('/categories/<category_id>/subcategories', methods=['POST'])
def add_subcategory(category_id):
    subcategory_data = request.json
    result = category_manager.add_subcategory(category_id, subcategory_data)
    return jsonify(result)


@api.route('/subcategories/<subcategory_id>', methods=['PUT'])
def update_subcategory(subcategory_id):
    subcategory_data = request.json
    result = category_manager.update_subcategory(
        subcategory_id, subcategory_data)
    return jsonify(result)


@api.route('/subcategories/<subcategory_id>', methods=['DELETE'])
def delete_subcategory(subcategory_id):
    result = category_manager.delete_subcategory(subcategory_id)
    return jsonify(result)


@api.route('/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    transaction = transaction_manager.get_transaction_by_id(transaction_id)
    if transaction:
        return jsonify(transaction)
    return jsonify({'error': 'Transaction not found'}), 404


@api.route('/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    transaction_data = request.json
    result = transaction_manager.update_transaction(
        transaction_id, transaction_data)
    return jsonify(result)


@api.route('/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    result = transaction_manager.delete_transaction(transaction_id)
    return jsonify(result)


@api.route('/transactions/by-date', methods=['GET'])
def get_transactions_by_date_range():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    account_id = request.args.get('account_id')

    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400

    transactions = transaction_manager.get_transactions_by_date_range(
        start_date, end_date, account_id)
    return jsonify(transactions)


@api.route('/transactions/by-category', methods=['GET'])
def get_transactions_by_category():
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not category:
        return jsonify({'error': 'category is required'}), 400

    transactions = transaction_manager.get_transactions_by_category(
        category, start_date, end_date)
    return jsonify(transactions)


@api.route('/analytics/balance', methods=['GET'])
def get_balance_over_time():
    account_id = request.args.get('account_id')
    timeframe = request.args.get('timeframe', 'month')
    result = analytics.get_balance_over_time(account_id, timeframe)
    return jsonify(result)


@api.route('/analytics/category-breakdown', methods=['GET'])
def get_category_breakdown():
    timeframe = request.args.get('timeframe', 'month')
    result = analytics.get_category_breakdown(timeframe)
    return jsonify(result)


@api.route('/budgets/progress', methods=['GET'])
def get_budget_progress():
    category = request.args.get('category')
    subcategory = request.args.get('subcategory')
    period = request.args.get('period', 'monthly')
    progress = budget_manager.get_budget_progress(
        category, subcategory, period)
    return jsonify(progress)


@api.route('/categories/<category_id>', methods=['GET'])
def get_category(category_id):
    category = category_manager.get_category_by_id(category_id)
    if category:
        return jsonify(category)
    return jsonify({'error': 'Category not found'}), 404


# Register the blueprint
app.register_blueprint(api)

if __name__ == '__main__':
    # For local development only
    app.run(host='127.0.0.1', port=5001, debug=True)
