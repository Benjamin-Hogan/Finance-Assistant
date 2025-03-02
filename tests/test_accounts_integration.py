import pytest
import json
from datetime import datetime, timedelta


@pytest.fixture
def client(test_client, create_test_data):
    """Test client with initialized test data"""
    return test_client


def test_account_crud_operations(client):
    """Test creating, reading, updating, and deleting an account"""
    # Create a new account
    account_data = {
        'name': 'Test Investment Account',
        'type': 'investment',
        'balance': 5000.00,
        'currency': 'USD'
    }

    response = client.post(
        '/api/accounts',
        json=account_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    account_id = result['id']

    # Read the account details
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    account = json.loads(response.data)
    assert account['name'] == 'Test Investment Account'
    assert account['type'] == 'investment'
    assert account['balance'] == 5000.00

    # Update the account
    update_data = {
        'name': 'Updated Investment Account',
        'balance': 6000.00
    }

    response = client.put(
        f'/api/accounts/{account_id}',
        json=update_data,
        content_type='application/json'
    )
    assert response.status_code == 200

    # Verify the update
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    updated_account = json.loads(response.data)
    assert updated_account['name'] == 'Updated Investment Account'
    assert updated_account['balance'] == 6000.00
    assert updated_account['type'] == 'investment'  # Unchanged field

    # Delete the account
    response = client.delete(f'/api/accounts/{account_id}')
    assert response.status_code == 200

    # Verify deletion
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 404


def test_account_transactions(client):
    """Test transactions associated with an account"""
    # Create a new account
    account_data = {
        'name': 'Transaction Test Account',
        'type': 'checking',
        'balance': 1000.00,
        'currency': 'USD'
    }

    response = client.post(
        '/api/accounts',
        json=account_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    account_id = result['id']

    # Add transactions to the account
    transactions = [
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -50.00,
            'description': 'Test Expense 1',
            'category': 'Food',
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -30.00,
            'description': 'Test Expense 2',
            'category': 'Transportation',
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': 200.00,
            'description': 'Test Income',
            'category': 'Income',
            'is_income': True
        }
    ]

    transaction_ids = []
    for tx_data in transactions:
        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transaction_ids.append(result['id'])

    # Check account transactions
    response = client.get(f'/api/accounts/{account_id}/transactions')
    assert response.status_code == 200
    account_transactions = json.loads(response.data)
    assert len(account_transactions) >= 3

    # Verify account balance is updated correctly
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    updated_account = json.loads(response.data)
    expected_balance = 1000.00 - 50.00 - 30.00 + 200.00
    assert updated_account['balance'] == expected_balance

    # Clean up
    for tx_id in transaction_ids:
        client.delete(f'/api/transactions/{tx_id}')
    client.delete(f'/api/accounts/{account_id}')


def test_account_net_worth(client):
    """Test net worth calculation includes all accounts"""
    # Get initial accounts and calculate net worth
    response = client.get('/api/accounts')
    assert response.status_code == 200
    initial_accounts = json.loads(response.data)
    initial_net_worth = sum(account['balance'] for account in initial_accounts)

    # Create a new account
    account_data = {
        'name': 'Net Worth Test Account',
        'type': 'savings',
        'balance': 2500.00,
        'currency': 'USD'
    }

    response = client.post(
        '/api/accounts',
        json=account_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    account_id = result['id']

    # Get updated accounts and recalculate net worth
    response = client.get('/api/accounts')
    assert response.status_code == 200
    updated_accounts = json.loads(response.data)
    updated_net_worth = sum(account['balance'] for account in updated_accounts)

    # Net worth should increase by the new account balance
    assert updated_net_worth == initial_net_worth + 2500.00

    # Get net worth from analytics endpoint if available
    response = client.get('/api/analytics/net-worth')
    if response.status_code == 200:
        net_worth_data = json.loads(response.data)
        if isinstance(net_worth_data, dict) and 'current' in net_worth_data:
            assert net_worth_data['current'] == updated_net_worth

    # Clean up
    client.delete(f'/api/accounts/{account_id}')


def test_account_balance_history(client):
    """Test account balance history tracking"""
    # Create a new account
    account_data = {
        'name': 'Balance History Test Account',
        'type': 'checking',
        'balance': 1000.00,
        'currency': 'USD'
    }

    response = client.post(
        '/api/accounts',
        json=account_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    account_id = result['id']

    # Add transactions on different dates
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    day_before = today - timedelta(days=2)

    transactions = [
        {
            'account_id': account_id,
            'date': day_before.strftime('%Y-%m-%d'),
            'amount': -50.00,
            'description': 'Past Expense 1',
            'category': 'Food',
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': yesterday.strftime('%Y-%m-%d'),
            'amount': -30.00,
            'description': 'Past Expense 2',
            'category': 'Transportation',
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': 200.00,
            'description': 'Today Income',
            'category': 'Income',
            'is_income': True
        }
    ]

    transaction_ids = []
    for tx_data in transactions:
        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transaction_ids.append(result['id'])

    # Check balance history if the endpoint exists
    response = client.get(f'/api/accounts/{account_id}/history')
    if response.status_code == 200:
        history = json.loads(response.data)
        assert len(history) > 0
        # Verify the latest balance matches the account
        response = client.get(f'/api/accounts/{account_id}')
        assert response.status_code == 200
        account = json.loads(response.data)
        if history and len(history) > 0 and 'balance' in history[-1]:
            assert history[-1]['balance'] == account['balance']

    # Clean up
    for tx_id in transaction_ids:
        client.delete(f'/api/transactions/{tx_id}')
    client.delete(f'/api/accounts/{account_id}')


def test_negative_balance_account(client):
    """Test handling of accounts with negative balances (like credit cards)"""
    # Create a credit card account with negative balance
    account_data = {
        'name': 'Test Credit Card',
        'type': 'credit',
        'balance': -500.00,
        'currency': 'USD'
    }

    response = client.post(
        '/api/accounts',
        json=account_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    account_id = result['id']

    # Add a payment transaction (reducing the debt)
    payment_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': 200.00,  # Positive amount for credit card payment
        'description': 'Credit Card Payment',
        'category': 'Transfer',
        'is_income': True
    }

    response = client.post(
        '/api/transactions',
        json=payment_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    payment_id = result['id']

    # Check updated balance
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    updated_account = json.loads(response.data)
    assert updated_account['balance'] == -300.00  # -500 + 200

    # Add a purchase transaction (increasing the debt)
    purchase_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -150.00,  # Negative amount for purchase
        'description': 'Credit Card Purchase',
        'category': 'Shopping',
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=purchase_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    purchase_id = result['id']

    # Check updated balance again
    response = client.get(f'/api/accounts/{account_id}')
    assert response.status_code == 200
    updated_account = json.loads(response.data)
    assert updated_account['balance'] == -450.00  # -300 - 150

    # Clean up
    client.delete(f'/api/transactions/{payment_id}')
    client.delete(f'/api/transactions/{purchase_id}')
    client.delete(f'/api/accounts/{account_id}')
