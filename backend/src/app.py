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
    budgets = budget_manager.get_all_budgets()
    return jsonify(budgets)


@api.route('/budgets', methods=['POST'])
def create_budget():
    budget_data = request.json
    result = budget_manager.create_budget(budget_data)
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


# Register the blueprint
app.register_blueprint(api)

if __name__ == '__main__':
    # For local development only
    app.run(host='127.0.0.1', port=5001, debug=True)
