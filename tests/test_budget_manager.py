import pytest
import json
from datetime import datetime, timedelta


@pytest.fixture
def client(test_client, create_test_data):
    """Test client with initialized test data"""
    return test_client


def test_get_all_budget_progress(client):
    """Test getting progress for all budgets"""
    # First create a few test budgets with different periods
    category_data = {
        'name': 'Budget Progress Test',
        'color': '#FF5722',
        'subcategories': ['Test Sub 1', 'Test Sub 2']
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    category_result = json.loads(response.data)
    category_id = category_result['id']
    category_name = category_data['name']

    # Create budgets with different periods
    budgets = [
        {
            'category': category_name,
            'amount': 200.00,
            'period': 'monthly'
        },
        {
            'category': category_name,
            'subcategory': 'Test Sub 1',
            'amount': 100.00,
            'period': 'weekly'
        },
        {
            'category': category_name,
            'subcategory': 'Test Sub 2',
            'amount': 1200.00,
            'period': 'yearly'
        }
    ]

    budget_ids = []
    for budget_data in budgets:
        response = client.post(
            '/api/budgets',
            json=budget_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        budget_ids.append(result['id'])

    # Add some transactions for these budgets
    account_id = 1  # Assuming test data includes this account
    transactions = [
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -40.00,
            'description': 'Test Main Category',
            'category': category_name,
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -30.00,
            'description': 'Test Subcategory 1',
            'category': category_name,
            'subcategory': 'Test Sub 1',
            'is_income': False
        },
        {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -50.00,
            'description': 'Test Subcategory 2',
            'category': category_name,
            'subcategory': 'Test Sub 2',
            'is_income': False
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

    # Test getting all budget progress - by monthly period
    response = client.get('/api/budgets/progress?period=monthly')
    assert response.status_code == 200
    monthly_progress = json.loads(response.data)

    # Verify we get progress for all monthly budgets
    if isinstance(monthly_progress, list):
        # Find our test category budget progress
        found_monthly = False
        for progress in monthly_progress:
            if progress.get('category') == category_name and not progress.get('subcategory'):
                found_monthly = True
                assert progress.get('spent') >= 40.00
                assert progress.get('budget') == 200.00
                break

        assert found_monthly, "Monthly budget progress not found"

    # Test getting all budget progress - by yearly period
    response = client.get('/api/budgets/progress?period=yearly')
    assert response.status_code == 200
    yearly_progress = json.loads(response.data)

    # Find our yearly budget for subcategory 2
    if isinstance(yearly_progress, list):
        found_yearly = False
        for progress in yearly_progress:
            if progress.get('category') == category_name and progress.get('subcategory') == 'Test Sub 2':
                found_yearly = True
                assert progress.get('spent') >= 50.00
                assert progress.get('budget') == 1200.00
                break

        assert found_yearly, "Yearly budget progress not found"

    # Test getting all budget progress - by weekly period
    response = client.get('/api/budgets/progress?period=weekly')
    assert response.status_code == 200
    weekly_progress = json.loads(response.data)

    # Find our weekly budget for subcategory 1
    if isinstance(weekly_progress, list):
        found_weekly = False
        for progress in weekly_progress:
            if progress.get('category') == category_name and progress.get('subcategory') == 'Test Sub 1':
                found_weekly = True
                assert progress.get('spent') >= 30.00
                assert progress.get('budget') == 100.00
                break

        assert found_weekly, "Weekly budget progress not found"

    # Clean up
    for tx_id in transaction_ids:
        client.delete(f'/api/transactions/{tx_id}')

    for budget_id in budget_ids:
        client.delete(f'/api/budgets/{budget_id}')

    client.delete(f'/api/categories/{category_id}')


def test_budget_without_transactions(client):
    """Test budget progress calculation when there are no transactions"""
    # Create a test category and budget
    category_data = {
        'name': 'Empty Budget Test',
        'color': '#9E9E9E'
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    category_result = json.loads(response.data)
    category_id = category_result['id']
    category_name = category_data['name']

    # Create a budget
    budget_data = {
        'category': category_name,
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
    budget_id = budget_result['id']

    # Get budget progress for a category with no transactions
    response = client.get(f'/api/budgets/progress?category={category_name}')
    assert response.status_code == 200
    progress = json.loads(response.data)

    # Verify the progress calculation is correct
    assert progress.get('category') == category_name
    assert progress.get('spent') == 0
    assert progress.get('budget') == 300.00
    assert progress.get('remaining') == 300.00

    # Clean up
    client.delete(f'/api/budgets/{budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_budget_with_date_range(client):
    """Test budget progress with specific date range"""
    # Create a test category
    category_data = {
        'name': 'Date Range Test',
        'color': '#3F51B5'
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    category_result = json.loads(response.data)
    category_id = category_result['id']
    category_name = category_data['name']

    # Create a budget
    budget_data = {
        'category': category_name,
        'amount': 500.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    budget_result = json.loads(response.data)
    budget_id = budget_result['id']

    # Add a transaction in the current month to make sure it's counted
    account_id = 1  # Assuming test data includes this account
    today = datetime.now()
    # Make sure the transaction is in the current month
    current_month_date = datetime(
        today.year, today.month, 15).strftime('%Y-%m-%d')

    print(f"Creating transaction with date: {current_month_date}")

    transaction_data = {
        'account_id': account_id,
        'date': current_month_date,
        'amount': -75.00,
        'description': 'Current Month Transaction',
        'category': category_name,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    tx_result = json.loads(response.data)
    transaction_id = tx_result['id']

    # Get budget progress
    response = client.get(f'/api/budgets/progress?category={category_name}')
    assert response.status_code == 200
    progress = json.loads(response.data)

    print(f"Budget progress response: {progress}")

    # Verify the transaction is counted
    assert progress.get('spent') >= 75.00
    assert progress.get('budget') == 500.00
    assert progress.get('remaining') <= 425.00

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')
    client.delete(f'/api/budgets/{budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_budget_force_create(client):
    """Test creating a budget with force_create flag"""
    # Create a test category
    category_data = {
        'name': 'Force Create Test',
        'color': '#E91E63'
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    category_result = json.loads(response.data)
    category_id = category_result['id']
    category_name = category_data['name']

    # Create a budget
    budget_data = {
        'category': category_name,
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
    first_budget_id = budget_result['id']

    # Try to create another budget for the same category - without force_create
    budget_data = {
        'category': category_name,
        'amount': 400.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)

    # This should update the existing budget instead of creating a new one
    assert result.get('id') == first_budget_id
    assert 'updated' in result.get('message', '').lower()

    # Now try with force_create flag
    budget_data = {
        'category': category_name,
        'amount': 500.00,
        'period': 'yearly',
        'force_create': True
    }

    response = client.post(
        '/api/budgets',
        json=budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    force_result = json.loads(response.data)
    second_budget_id = force_result['id']

    # This should create a new budget
    assert second_budget_id != first_budget_id
    assert 'created' in force_result.get('message', '').lower()

    # Verify both budgets exist
    response = client.get('/api/budgets')
    assert response.status_code == 200
    all_budgets = json.loads(response.data)

    budget_ids = [b['id'] for b in all_budgets]
    assert first_budget_id in budget_ids
    assert second_budget_id in budget_ids

    # Clean up
    client.delete(f'/api/budgets/{first_budget_id}')
    client.delete(f'/api/budgets/{second_budget_id}')
    client.delete(f'/api/categories/{category_id}')
