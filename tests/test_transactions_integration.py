import pytest
import json
from datetime import datetime, timedelta


@pytest.fixture
def client(test_client, create_test_data):
    """Test client with initialized test data"""
    return test_client


def test_edit_transaction(client):
    """Test that editing a transaction works properly"""
    # First get a transaction to edit
    response = client.get('/api/transactions')
    assert response.status_code == 200
    transactions = json.loads(response.data)
    assert len(transactions) > 0

    transaction_id = transactions[0]['id']
    original_amount = transactions[0]['amount']
    original_category = transactions[0]['category']

    # Edit the transaction
    updated_data = {
        'amount': original_amount * 1.5,
        'description': 'Updated Transaction',
        'category': 'Food' if original_category != 'Food' else 'Housing'
    }

    response = client.put(
        f'/api/transactions/{transaction_id}',
        json=updated_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'message' in result
    assert 'id' in result

    # Verify the transaction was updated
    response = client.get(f'/api/transactions/{transaction_id}')
    assert response.status_code == 200
    updated_transaction = json.loads(response.data)
    assert updated_transaction['description'] == 'Updated Transaction'
    assert updated_transaction['amount'] == original_amount * 1.5
    assert updated_transaction['category'] == updated_data['category']


def test_delete_transaction(client):
    """Test that deleting a transaction works properly"""
    # Create a transaction to delete
    account_id = 1  # Assuming test data includes this account
    transaction_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -75.00,
        'description': 'Transaction to Delete',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transaction_id = result['id']

    # Get the account balance before deletion
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    account_before = json.loads(response.data)
    balance_before = account_before['balance']

    # Delete the transaction
    response = client.delete(f'/api/transactions/{transaction_id}')
    assert response.status_code == 200

    # Verify the transaction was deleted
    response = client.get(f'/api/transactions/{transaction_id}')
    assert response.status_code == 404

    # Verify the account balance was updated
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    account_after = json.loads(response.data)
    balance_after = account_after['balance']

    # Since we deleted a transaction with amount -75.00, balance should increase by 75.00
    assert balance_after == balance_before + 75.00


def test_transaction_budget_integration(client):
    """Test that transactions affect budget spending properly"""
    # Create a test category if needed
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) > 0

    test_category = categories[0]['name']

    # Get the current date for the transaction
    today = datetime.now()
    current_month_date = today.strftime('%Y-%m-%d')

    print(f"Current test date: {current_month_date}")

    # Create a test budget
    budget_data = {
        'category': test_category,
        'amount': 300.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    budget_result = json.loads(response.data)

    # Get initial budget progress
    response = client.get(f'/api/budgets/progress?category={test_category}')
    assert response.status_code == 200
    initial_progress = json.loads(response.data)
    initial_spent = initial_progress.get('spent', 0)

    print(f"Initial spent: {initial_spent}")

    # Add a transaction in this category
    account_id = 1  # Assuming test data includes this account
    transaction_amount = -50.00
    transaction_data = {
        'account_id': account_id,
        'date': current_month_date,
        'amount': transaction_amount,
        'description': 'Test Budget Impact',
        'category': test_category,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transaction_id = result['id']

    print(f"Created transaction with ID: {transaction_id}")

    # Check that budget progress has been updated
    response = client.get(f'/api/budgets/progress?category={test_category}')
    assert response.status_code == 200
    updated_progress = json.loads(response.data)
    updated_spent = updated_progress.get('spent', 0)

    print(f"Updated spent: {updated_spent}")

    # Verify the spent amount increased by the transaction amount
    # The spent should increase by 50 (absolute value of -50.00)
    assert round(updated_spent - initial_spent, 2) == abs(transaction_amount)

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')


def test_income_transaction(client):
    """Test income transactions are handled correctly"""
    # Get initial account balance
    account_id = 1  # Assuming test data includes this account
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    account_before = json.loads(response.data)
    balance_before = account_before['balance']

    # Add an income transaction
    income_amount = 1000.00
    transaction_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': income_amount,
        'description': 'Test Income',
        'category': 'Income',
        'is_income': True
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transaction_id = result['id']

    # Verify account balance increased
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    account_after = json.loads(response.data)
    balance_after = account_after['balance']

    assert balance_after == balance_before + income_amount

    # Verify income analytics
    response = client.get('/api/analytics/income?timeframe=month')
    assert response.status_code == 200
    income_data = json.loads(response.data)

    # Income data should include our new transaction
    # The exact format depends on your implementation, but we should be able to find our transaction

    # Clean up - delete the test transaction
    client.delete(f'/api/transactions/{transaction_id}')


def test_transfer_between_accounts(client):
    """Test transferring money between accounts"""
    # Get information about two accounts
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) >= 2

    from_account_id = accounts[0]['id']
    to_account_id = accounts[1]['id']

    from_account_balance = accounts[0]['balance']
    to_account_balance = accounts[1]['balance']

    # Create a transfer amount
    transfer_amount = 100.00

    # Create withdrawal transaction
    withdrawal_data = {
        'account_id': from_account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -transfer_amount,
        'description': 'Transfer to ' + accounts[1]['name'],
        'category': 'Transfer',
        'is_income': False,
        'is_transfer': True,
        'transfer_account_id': to_account_id
    }

    response = client.post(
        '/api/transactions',
        json=withdrawal_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    withdrawal_result = json.loads(response.data)
    withdrawal_id = withdrawal_result['id']

    # Create deposit transaction
    deposit_data = {
        'account_id': to_account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': transfer_amount,
        'description': 'Transfer from ' + accounts[0]['name'],
        'category': 'Transfer',
        'is_income': True,
        'is_transfer': True,
        'transfer_account_id': from_account_id
    }

    response = client.post(
        '/api/transactions',
        json=deposit_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    deposit_result = json.loads(response.data)
    deposit_id = deposit_result['id']

    # Verify account balances were updated correctly
    response = client.get('/api/accounts')
    assert response.status_code == 200
    updated_accounts = json.loads(response.data)

    # Find the updated accounts
    updated_from_account = next(
        (a for a in updated_accounts if a['id'] == from_account_id), None)
    updated_to_account = next(
        (a for a in updated_accounts if a['id'] == to_account_id), None)

    assert updated_from_account['balance'] == from_account_balance - \
        transfer_amount
    assert updated_to_account['balance'] == to_account_balance + \
        transfer_amount

    # Clean up - delete the test transactions
    client.delete(f'/api/transactions/{withdrawal_id}')
    client.delete(f'/api/transactions/{deposit_id}')


def test_category_validation(client):
    """Test that transactions validate categories before creation"""
    # First get an account
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Try to create a transaction with a non-existent category
    non_existent_category = "NonExistentCategory" + \
        datetime.now().strftime("%Y%m%d%H%M%S")

    tx_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -50.00,
        'description': 'Test Category Validation',
        'category': non_existent_category,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'error' in result
    assert 'does not exist' in result['error']

    # Get categories and pick a valid one
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) > 0
    valid_category = categories[0]['name']

    # Try to create a transaction with a valid category but invalid subcategory
    tx_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -50.00,
        'description': 'Test Category Validation',
        'category': valid_category,
        'subcategory': 'NonExistentSubcategory' + datetime.now().strftime("%Y%m%d%H%M%S"),
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'error' in result
    assert 'does not exist' in result['error']

    # Use a valid category and subcategory - should succeed
    if len(categories[0]['subcategories']) > 0:
        valid_subcategory = categories[0]['subcategories'][0]['name']

        tx_data = {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -50.00,
            'description': 'Test Category Validation - Valid',
            'category': valid_category,
            'subcategory': valid_subcategory,
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        assert 'id' in result

        # Clean up
        client.delete(f'/api/transactions/{result["id"]}')

    # Test without subcategory - should also succeed
    tx_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -50.00,
        'description': 'Test Category Validation - Valid No Subcategory',
        'category': valid_category,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'id' in result

    # Clean up
    client.delete(f'/api/transactions/{result["id"]}')


def test_transaction_date_validation(client):
    """Test that transaction dates are validated properly"""
    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Try to create a transaction with an invalid date
    tx_data = {
        'account_id': account_id,
        'date': 'not-a-date',
        'amount': -50.00,
        'description': 'Test Date Validation',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'error' in result
    assert 'Invalid date' in result['error']

    # Try with a valid date
    tx_data['date'] = datetime.now().strftime('%Y-%m-%d')
    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    assert 'id' in result

    # Clean up
    client.delete(f'/api/transactions/{result["id"]}')


def test_get_transactions_by_date_range(client):
    """Test getting transactions within a specific date range"""
    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Create transactions on different dates
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    last_week = today - timedelta(days=7)
    last_month = today - timedelta(days=30)

    transactions = []

    # Create a transaction for today
    today_tx = {
        'account_id': account_id,
        'date': today.strftime('%Y-%m-%d'),
        'amount': -10.00,
        'description': 'Today Transaction',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=today_tx,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transactions.append(result['id'])

    # Create a transaction for yesterday
    yesterday_tx = {
        'account_id': account_id,
        'date': yesterday.strftime('%Y-%m-%d'),
        'amount': -20.00,
        'description': 'Yesterday Transaction',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=yesterday_tx,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transactions.append(result['id'])

    # Create a transaction for last week
    last_week_tx = {
        'account_id': account_id,
        'date': last_week.strftime('%Y-%m-%d'),
        'amount': -30.00,
        'description': 'Last Week Transaction',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=last_week_tx,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transactions.append(result['id'])

    # Create a transaction for last month
    last_month_tx = {
        'account_id': account_id,
        'date': last_month.strftime('%Y-%m-%d'),
        'amount': -40.00,
        'description': 'Last Month Transaction',
        'category': 'Food',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=last_month_tx,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    transactions.append(result['id'])

    # Test getting transactions by date range - this week
    start_date = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')

    response = client.get(
        f'/api/transactions/by-date?start_date={start_date}&end_date={end_date}')
    assert response.status_code == 200
    this_week_txs = json.loads(response.data)

    # Should include today and yesterday transactions if they're in this week
    if yesterday.weekday() < today.weekday():
        assert len(this_week_txs) >= 2
    else:
        assert len(this_week_txs) >= 1

    # Test getting transactions by date range and account
    response = client.get(
        f'/api/transactions/by-date?start_date={start_date}&end_date={end_date}&account_id={account_id}')
    assert response.status_code == 200
    account_txs = json.loads(response.data)

    if yesterday.weekday() < today.weekday():
        assert len(account_txs) >= 2
    else:
        assert len(account_txs) >= 1

    # Test getting transactions for the last month
    start_date = last_month.strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')

    response = client.get(
        f'/api/transactions/by-date?start_date={start_date}&end_date={end_date}')
    assert response.status_code == 200
    last_month_txs = json.loads(response.data)
    assert len(last_month_txs) >= 4

    # Clean up
    for tx_id in transactions:
        client.delete(f'/api/transactions/{tx_id}')


def test_get_transactions_by_category(client):
    """Test getting transactions by category"""
    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Get categories
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) >= 2

    # Create transactions in two different categories
    today = datetime.now()
    transactions = []

    # Category 1 transactions
    for i in range(2):
        tx_data = {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': -(i + 1) * 25.00,
            'description': f'Cat1 Transaction {i}',
            'category': categories[0]['name'],
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append(result['id'])

    # Category 2 transactions
    for i in range(3):
        tx_data = {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': -(i + 1) * 15.00,
            'description': f'Cat2 Transaction {i}',
            'category': categories[1]['name'],
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append(result['id'])

    # Get transactions by category 1
    response = client.get(
        f'/api/transactions/by-category?category={categories[0]["name"]}')
    assert response.status_code == 200
    cat1_txs = json.loads(response.data)
    assert len(cat1_txs) >= 2

    # Check that all transactions are in the correct category
    for tx in cat1_txs:
        assert tx['category'] == categories[0]['name']

    # Get transactions by category 2
    response = client.get(
        f'/api/transactions/by-category?category={categories[1]["name"]}')
    assert response.status_code == 200
    cat2_txs = json.loads(response.data)
    assert len(cat2_txs) >= 3

    # Check that all transactions are in the correct category
    for tx in cat2_txs:
        assert tx['category'] == categories[1]['name']

    # Get transactions for an invalid category
    response = client.get(
        '/api/transactions/by-category?category=NonExistentCategory')
    assert response.status_code == 200
    invalid_cat_txs = json.loads(response.data)
    assert len(invalid_cat_txs) == 0

    # Clean up
    for tx_id in transactions:
        client.delete(f'/api/transactions/{tx_id}')
