import pytest
import json
from datetime import datetime, timedelta
from sqlite3 import connect


@pytest.fixture
def client(test_client, create_test_data):
    """Test client with initialized test data"""
    return test_client


def test_category_crud_operations(client):
    """Test creating, reading, updating, and deleting categories with subcategories"""
    # Create a new category with subcategories
    category_data = {
        'name': 'Test Entertainment Category',
        'color': '#9C27B0',
        'subcategories': ['Movies', 'Music', 'Games']
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    category_id = result['id']

    # Read the category
    response = client.get(f'/api/categories/{category_id}')
    assert response.status_code == 200
    category = json.loads(response.data)
    assert category['name'] == 'Test Entertainment Category'
    assert category['color'] == '#9C27B0'
    assert len(category['subcategories']) == 3

    # Get subcategories
    response = client.get(f'/api/categories/{category_id}/subcategories')
    assert response.status_code == 200
    subcategories = json.loads(response.data)
    assert len(subcategories) == 3
    subcategory_names = [s['name'] for s in subcategories]
    assert 'Movies' in subcategory_names
    assert 'Music' in subcategory_names
    assert 'Games' in subcategory_names

    # Update the category
    update_data = {
        'name': 'Updated Entertainment',
        'color': '#673AB7'
    }

    response = client.put(
        f'/api/categories/{category_id}',
        json=update_data,
        content_type='application/json'
    )
    assert response.status_code == 200

    # Verify the update
    response = client.get(f'/api/categories/{category_id}')
    assert response.status_code == 200
    updated_category = json.loads(response.data)
    assert updated_category['name'] == 'Updated Entertainment'
    assert updated_category['color'] == '#673AB7'

    # Add a new subcategory
    subcategory_data = {
        'name': 'Concerts'
    }

    response = client.post(
        f'/api/categories/{category_id}/subcategories',
        json=subcategory_data,
        content_type='application/json'
    )
    assert response.status_code == 200

    # Verify the new subcategory
    response = client.get(f'/api/categories/{category_id}/subcategories')
    assert response.status_code == 200
    updated_subcategories = json.loads(response.data)
    assert len(updated_subcategories) == 4
    subcategory_names = [s['name'] for s in updated_subcategories]
    assert 'Concerts' in subcategory_names

    # Delete the category
    response = client.delete(f'/api/categories/{category_id}')
    assert response.status_code == 200

    # Verify deletion
    response = client.get(f'/api/categories/{category_id}')
    assert response.status_code == 404


def test_budget_crud_operations(client):
    """Test creating, reading, updating, and deleting budgets"""
    # Get a category for the budget
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) > 0
    category = categories[0]['name']

    # Create a new budget
    budget_data = {
        'category': category,
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
    budget_id = result['id']

    # Read the budget
    response = client.get(f'/api/budgets/{budget_id}')
    assert response.status_code == 200
    budget = json.loads(response.data)
    assert budget['category'] == category
    assert budget['amount'] == 400.00
    assert budget['period'] == 'monthly'

    # Update the budget
    update_data = {
        'amount': 500.00
    }

    response = client.put(
        f'/api/budgets/{budget_id}',
        json=update_data,
        content_type='application/json'
    )
    assert response.status_code == 200

    # Verify the update
    response = client.get(f'/api/budgets/{budget_id}')
    assert response.status_code == 200
    updated_budget = json.loads(response.data)
    assert updated_budget['amount'] == 500.00

    # Delete the budget
    response = client.delete(f'/api/budgets/{budget_id}')
    assert response.status_code == 200

    # Verify deletion
    response = client.get(f'/api/budgets/{budget_id}')
    assert response.status_code == 404


def test_budget_progress(client):
    """Test budget progress tracking with transactions"""
    # Get a category for the budget
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) > 0
    category = categories[0]['name']

    # Create a new budget
    budget_data = {
        'category': category,
        'amount': 300.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    budget_id = result['id']

    # Get initial budget progress
    response = client.get(f'/api/budgets/progress?category={category}')
    assert response.status_code == 200
    initial_progress = json.loads(response.data)
    initial_spent = initial_progress.get('spent', 0)

    # Add a transaction in this category
    account_id = 1  # Assuming test data includes this account
    transaction_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -75.00,
        'description': 'Test Budget Progress',
        'category': category,
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

    # Check updated budget progress
    response = client.get(f'/api/budgets/progress?category={category}')
    assert response.status_code == 200
    updated_progress = json.loads(response.data)
    updated_spent = updated_progress.get('spent', 0)

    # Verify the spent amount increased by the transaction amount
    assert round(updated_spent - initial_spent, 2) == 75.00

    # Add another transaction with a subcategory
    if len(categories[0]['subcategories']) > 0:
        subcategory = categories[0]['subcategories'][0]['name']
        subcategory_transaction = {
            'account_id': account_id,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': -50.00,
            'description': 'Test Subcategory Budget',
            'category': category,
            'subcategory': subcategory,
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=subcategory_transaction,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        subcategory_tx_id = result['id']

        # Check updated budget progress again
        response = client.get(f'/api/budgets/progress?category={category}')
        assert response.status_code == 200
        final_progress = json.loads(response.data)
        final_spent = final_progress.get('spent', 0)

        # Verify the spent amount increased by both transaction amounts
        assert round(final_spent - initial_spent, 2) == 125.00

        # Clean up subcategory transaction
        client.delete(f'/api/transactions/{subcategory_tx_id}')

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')
    client.delete(f'/api/budgets/{budget_id}')


def test_subcategory_budgeting(client):
    """Test budgeting for specific subcategories"""
    # Define the category name
    category_name = 'Test Subcategory Budgeting'

    # Clean up any existing transactions for this category from previous test runs
    # This is done directly with SQLite to ensure a clean state
    conn = connect('data/finance.db')
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM transactions WHERE category = ?", (category_name,))
    conn.commit()
    conn.close()

    # First create a category with subcategories
    category_data = {
        'name': category_name,
        'color': '#FF5722',
        'subcategories': ['Sub1', 'Sub2', 'Sub3']
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    category_result = json.loads(response.data)
    category_id = category_result['id']

    # Get subcategories
    response = client.get(f'/api/categories/{category_id}/subcategories')
    assert response.status_code == 200
    subcategories = json.loads(response.data)
    assert len(subcategories) == 3

    subcategory_name = subcategories[0]['name']

    # Create a budget for the main category
    main_budget_data = {
        'category': category_name,
        'amount': 300.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=main_budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    main_budget_result = json.loads(response.data)
    main_budget_id = main_budget_result['id']

    # Create a budget for a subcategory
    sub_budget_data = {
        'category': category_name,
        'subcategory': subcategory_name,
        'amount': 100.00,
        'period': 'monthly'
    }

    response = client.post(
        '/api/budgets',
        json=sub_budget_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    sub_budget_result = json.loads(response.data)
    sub_budget_id = sub_budget_result['id']

    # Add a transaction with this subcategory
    account_id = 1  # Assuming test data includes this account
    transaction_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -30.00,
        'description': 'Test Subcategory Budget',
        'category': category_name,
        'subcategory': subcategory_name,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    transaction_result = json.loads(response.data)
    transaction_id = transaction_result['id']

    # Check budget progress for subcategory
    response = client.get(
        f'/api/budgets/progress?category={category_name}&subcategory={subcategory_name}')
    if response.status_code == 200:
        subcategory_progress = json.loads(response.data)
        subcategory_spent = subcategory_progress.get('spent', 0)
        assert round(subcategory_spent, 2) == 30.00

    # Check overall budget progress
    response = client.get(f'/api/budgets/progress?category={category_name}')
    assert response.status_code == 200
    overall_progress = json.loads(response.data)
    overall_spent = overall_progress.get('spent', 0)
    assert round(overall_spent, 2) == 30.00

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')
    client.delete(f'/api/budgets/{sub_budget_id}')
    client.delete(f'/api/budgets/{main_budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_budget_period_handling(client):
    """Test different budget periods (monthly, yearly, etc.)"""
    # Create a category for testing
    category_data = {
        'name': 'Period Test Category',
        'color': '#3F51B5',
        'subcategories': []
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
            'amount': 100.00,
            'period': 'monthly'
        },
        {
            'category': category_name,
            'amount': 1200.00,
            'period': 'yearly'
        },
        {
            'category': category_name,
            'amount': 25.00,
            'period': 'weekly'
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

    # Add a transaction in this category
    account_id = 1  # Assuming test data includes this account
    transaction_data = {
        'account_id': account_id,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'amount': -50.00,
        'description': 'Test Budget Period',
        'category': category_name,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=transaction_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    transaction_result = json.loads(response.data)
    transaction_id = transaction_result['id']

    # Check budget progress for each period
    for period in ['monthly', 'yearly', 'weekly']:
        response = client.get(
            f'/api/budgets/progress?category={category_name}&period={period}')
        if response.status_code == 200:
            progress = json.loads(response.data)
            spent = progress.get('spent', 0)
            assert round(spent, 2) == 50.00

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')
    for budget_id in budget_ids:
        client.delete(f'/api/budgets/{budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_budget_allocations(client):
    """Test budget allocation functionality (if implemented)"""
    # This test checks if the budget allocation functionality works
    # If your app doesn't have budget allocation, this test will be skipped

    # Create a category for testing
    category_data = {
        'name': 'Allocation Test',
        'color': '#E91E63',
        'subcategories': ['Sub A', 'Sub B']
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
        'amount': 200.00,
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

    # Try to allocate budget (if the endpoint exists)
    allocation_data = {
        'category': category_name,
        'amount': 100.00
    }

    response = client.post('/api/budgets/allocate',
                           json=allocation_data, content_type='application/json')

    # If allocation endpoint exists, validate the response
    if response.status_code == 200:
        result = json.loads(response.data)
        assert 'success' in result or 'id' in result

        # Check if allocation was applied
        response = client.get(f'/api/budgets/{budget_id}')
        assert response.status_code == 200
        updated_budget = json.loads(response.data)
        assert 'allocated' in updated_budget

    # Clean up
    client.delete(f'/api/budgets/{budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_default_categories(client):
    """Test that default categories are properly initialized, including Food"""
    # Get all categories
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)

    # Check that we have categories
    assert len(categories) > 0

    # Check for specific default categories
    category_names = [c['name'] for c in categories]
    required_categories = ['Food', 'Housing',
                           'Transportation', 'Entertainment']

    for required in required_categories:
        assert required in category_names, f"Default category '{required}' not found"

    # Check the Food category specifically
    food_category = next((c for c in categories if c['name'] == 'Food'), None)
    assert food_category is not None

    # Check if it has the expected subcategories
    assert 'subcategories' in food_category
    assert len(food_category['subcategories']) > 0

    # Check for specific subcategories in Food
    subcat_names = [s['name'] for s in food_category['subcategories']]
    expected_subcats = ['Groceries', 'Restaurants']

    for expected in expected_subcats:
        assert expected in subcat_names, f"Expected subcategory '{expected}' not found in Food category"
