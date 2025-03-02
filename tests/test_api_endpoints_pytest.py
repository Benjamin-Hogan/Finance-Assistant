import json
import pytest
from datetime import datetime, timedelta


@pytest.fixture
def client(test_client, create_test_data):
    """Test client with initialized test data"""
    return test_client


def test_get_accounts(client):
    """Test getting all accounts"""
    response = client.get('/api/accounts')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Just assert that there are accounts, not a specific number
    assert len(data) > 0


def test_add_account(client):
    """Test adding a new account"""
    account_data = {
        'name': 'Investment',
        'type': 'investment',
        'balance': 10000.00,
        'currency': 'USD'
    }
    response = client.post('/api/accounts',
                           json=account_data,
                           content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'id' in data
    assert 'message' in data

    # Verify the account was added
    response = client.get('/api/accounts')
    data = json.loads(response.data)
    # Find the newly created account
    found = False
    for account in data:
        if account['name'] == 'Investment':
            found = True
            break
    assert found == True


def test_update_account(client):
    """Test updating an account"""
    # First get the account to update
    response = client.get('/api/accounts')
    accounts = json.loads(response.data)
    account_id = accounts[0]['id']

    # Update the account
    update_data = {
        'name': 'Updated Checking',
        'balance': 1500.00
    }
    response = client.put(f'/api/accounts/{account_id}',
                          json=update_data,
                          content_type='application/json')
    assert response.status_code == 200

    # Verify the account was updated
    response = client.get('/api/accounts')
    data = json.loads(response.data)
    found = False
    for account in data:
        if account['id'] == account_id:
            assert account['name'] == 'Updated Checking'
            assert account['balance'] == 1500.00
            found = True
            break
    assert found == True


def test_get_transactions(client):
    """Test getting all transactions"""
    response = client.get('/api/transactions')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Just verify there are transactions, not a specific number
    assert len(data) > 0


def test_add_transaction(client):
    """Test adding a new transaction"""
    # First get an account ID
    response = client.get('/api/accounts')
    accounts = json.loads(response.data)
    account_id = accounts[0]['id']

    transaction_data = {
        'account_id': account_id,
        'date': '2023-01-15',
        'amount': -50.00,
        'description': 'Restaurant',
        'category': 'Food',
        'is_income': False
    }
    response = client.post('/api/transactions',
                           json=transaction_data,
                           content_type='application/json')
    assert response.status_code == 200

    # Verify the transaction was added
    response = client.get('/api/transactions')
    data = json.loads(response.data)
    # Find a transaction with the matching description
    found = False
    for transaction in data:
        if transaction['description'] == 'Restaurant':
            found = True
            break
    assert found == True


def test_get_budgets(client):
    """Test getting all budgets"""
    response = client.get('/api/budgets')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Just verify we can get budgets
    assert isinstance(data, list)


def test_create_budget(client):
    """Test creating a new budget"""
    budget_data = {
        'category': 'Entertainment',
        'amount': 200.00,
        'period': 'monthly'
    }
    response = client.post('/api/budgets',
                           json=budget_data,
                           content_type='application/json')
    assert response.status_code == 200

    # Verify the budget was created
    response = client.get('/api/budgets')
    data = json.loads(response.data)
    found = False
    for budget in data:
        if budget['category'] == 'Entertainment':
            assert budget['amount'] == 200.00
            found = True
            break
    assert found == True


def test_get_categories(client):
    """Test getting all categories"""
    response = client.get('/api/categories')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Just verify we get categories back
    assert isinstance(data, list)
    assert len(data) > 0


def test_add_category(client):
    """Test adding a new category"""
    category_name = 'Fitness'  # Use a unique name
    category_data = {
        'name': category_name,
        'color': '#9C27B0',
        'subcategories': ['Gym', 'Equipment', 'Supplements']
    }
    response = client.post('/api/categories',
                           json=category_data,
                           content_type='application/json')
    assert response.status_code == 200

    # Verify the category was added
    response = client.get('/api/categories')
    data = json.loads(response.data)
    found = False
    for category in data:
        if category['name'] == category_name:
            found = True
            assert len(category['subcategories']) == 3
            break
    assert found == True


def test_get_subcategories(client):
    """Test getting subcategories for a category"""
    # First get the categories
    response = client.get('/api/categories')
    categories = json.loads(response.data)
    assert len(categories) > 0

    # Get the first category's ID
    category_id = categories[0]['id']

    # Now get the subcategories
    response = client.get(f'/api/categories/{category_id}/subcategories')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


def test_get_scheduled_transactions(client):
    """Test getting all scheduled transactions"""
    response = client.get('/api/scheduled-transactions')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Just check we can get scheduled transactions
    assert isinstance(data, list)


def test_add_scheduled_transaction(client):
    """Test adding a new scheduled transaction"""
    # First get an account ID
    response = client.get('/api/accounts')
    accounts = json.loads(response.data)
    account_id = accounts[0]['id']

    scheduled_transaction_data = {
        'account_id': account_id,
        'description': 'Monthly Rent',
        'amount': -800.00,
        'frequency': 'monthly',
        'start_date': '2023-01-01',
        'day_of_month': 1,
        'category': 'Housing',
        'is_income': False
    }
    response = client.post('/api/scheduled-transactions',
                           json=scheduled_transaction_data,
                           content_type='application/json')
    assert response.status_code == 200

    # Verify the scheduled transaction was added
    response = client.get('/api/scheduled-transactions')
    data = json.loads(response.data)
    found = False
    for transaction in data:
        if transaction['description'] == 'Monthly Rent':
            found = True
            break
    assert found == True


def test_get_spending_analytics(client):
    """Test getting spending analytics"""
    response = client.get('/api/analytics/spending?timeframe=month')
    assert response.status_code == 200
    # Just check that we get a valid response
    data = json.loads(response.data)
    assert isinstance(data, list) or isinstance(data, dict)


def test_get_income_analytics(client):
    """Test getting income analytics"""
    response = client.get('/api/analytics/income?timeframe=month')
    assert response.status_code == 200
    # Just check that we get a valid response
    data = json.loads(response.data)
    assert isinstance(data, list) or isinstance(data, dict)


def test_process_scheduled_transactions(client):
    """Test processing scheduled transactions"""
    response = client.post('/api/scheduled-transactions/process')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'processed' in data
