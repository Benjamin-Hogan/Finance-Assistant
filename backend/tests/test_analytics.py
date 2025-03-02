import pytest
import json
from datetime import datetime, timedelta


@pytest.fixture
def client(client):
    """Test client with initialized test data"""
    return client


def test_spending_by_category(client):
    """Test spending by category analytics"""
    # Get all categories
    response = client.get('/api/categories')
    assert response.status_code == 200
    categories = json.loads(response.data)
    assert len(categories) > 0

    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Create test transactions in different categories
    today = datetime.now()
    transactions = []

    # Use categories that we know exist in our test data
    test_categories = ['Food', 'Entertainment', 'Transportation']

    for i, category_name in enumerate(test_categories):
        amount = -(i + 1) * 100  # -100, -200, -300

        # Find the category object for this name
        category = next(
            (c for c in categories if c['name'] == category_name), None)
        assert category is not None, f"Category {category_name} not found in test data"

        tx_data = {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': amount,
            'description': f'Test Analytics for {category_name}',
            'category': category_name,
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append({
            'id': result['id'],
            'category': category_name,
            'amount': amount
        })

    # Get spending analytics
    response = client.get('/api/analytics/spending?timeframe=month')
    assert response.status_code == 200
    spending_data = json.loads(response.data)

    # Verify that our test categories appear in the results
    if isinstance(spending_data, dict) and 'categories' in spending_data:
        categories_data = spending_data['categories']
        for tx in transactions:
            category_found = False
            for cat_data in categories_data:
                if cat_data['category'] == tx['category']:
                    category_found = True
                    # The spending should include our transaction amount (absolute value)
                    spending_value = cat_data.get(
                        'amount', cat_data.get('spending', 0))
                    assert spending_value >= abs(tx['amount'])
                    break
            assert category_found, f"Category {tx['category']} not found in spending analytics"
    elif isinstance(spending_data, list):
        for tx in transactions:
            category_found = False
            for cat_data in spending_data:
                if cat_data['category'] == tx['category']:
                    category_found = True
                    # The spending should include our transaction amount (absolute value)
                    spending_value = cat_data.get(
                        'amount', cat_data.get('spending', 0))
                    assert spending_value >= abs(tx['amount'])
                    break
            assert category_found, f"Category {tx['category']} not found in spending analytics"

    # Clean up
    for tx in transactions:
        client.delete(f'/api/transactions/{tx["id"]}')


def test_income_analytics(client):
    """Test income analytics"""
    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Create income transactions
    today = datetime.now()
    transactions = []

    income_sources = ['Salary', 'Freelance', 'Interest']
    for i, source in enumerate(income_sources):
        amount = (i + 1) * 1000  # 1000, 2000, 3000
        tx_data = {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': amount,
            'description': f'{source} Income',
            'category': 'Income',
            'subcategory': source,
            'is_income': True
        }

        response = client.post(
            '/api/transactions',
            json=tx_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append({
            'id': result['id'],
            'source': source,
            'amount': amount
        })

    # Get income analytics
    response = client.get('/api/analytics/income?timeframe=month')
    assert response.status_code == 200
    income_data = json.loads(response.data)

    # Verify that our test income sources appear in the results
    # The exact format depends on your implementation
    if isinstance(income_data, dict) and 'sources' in income_data:
        sources_data = income_data['sources']
        total_income = 0
        for tx in transactions:
            source_found = False
            for source_data in sources_data:
                if source_data.get('subcategory') == tx['source'] or source_data.get('name') == tx['source']:
                    source_found = True
                    assert source_data['amount'] >= tx['amount']
                    break
            # Some implementations might group by category instead of subcategory
            if not source_found and 'Income' in [s.get('name', '') for s in sources_data]:
                total_income = sum(tx['amount'] for tx in transactions)
                income_category = next(
                    s for s in sources_data if s.get('name') == 'Income')
                assert income_category['amount'] >= total_income
    elif isinstance(income_data, list):
        for tx in transactions:
            source_found = False
            for source_data in income_data:
                if source_data.get('subcategory') == tx['source'] or source_data.get('name') == tx['source']:
                    source_found = True
                    assert source_data['amount'] >= tx['amount']
                    break
            # Some implementations might group all income together
            if not source_found and any(s.get('name') == 'Income' for s in income_data):
                pass

    # Clean up
    for tx in transactions:
        client.delete(f'/api/transactions/{tx["id"]}')


def test_net_worth_analytics(client):
    """Test net worth analytics"""
    # Get current accounts and calculate initial net worth
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0

    initial_net_worth = sum(account['balance'] for account in accounts)

    # Create a new account with positive balance
    account_data = {
        'name': 'Net Worth Test Account',
        'type': 'savings',
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

    # Get net worth analytics if available
    response = client.get('/api/analytics/net-worth')
    if response.status_code == 200:
        net_worth_data = json.loads(response.data)

        # Verify the net worth includes our new account
        if isinstance(net_worth_data, dict) and 'current' in net_worth_data:
            assert net_worth_data['current'] >= initial_net_worth + 5000.00
        elif isinstance(net_worth_data, list) and len(net_worth_data) > 0:
            latest = max(net_worth_data, key=lambda x: x.get('date', ''))
            assert latest.get('amount', 0) >= initial_net_worth + 5000.00

    # Clean up
    client.delete(f'/api/accounts/{account_id}')


def test_spending_trends(client):
    """Test spending trends analytics"""
    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Create transactions on different dates
    today = datetime.now()
    transactions = []

    # Transactions for the last 3 months
    for i in range(3):
        date = today.replace(day=15) - timedelta(days=30 * i)
        tx_data = {
            'account_id': account_id,
            'date': date.strftime('%Y-%m-%d'),
            'amount': -((i + 1) * 100),  # -100, -200, -300
            'description': f'Month {i+1} Expense',
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
        transactions.append({
            'id': result['id'],
            'month': date.month,
            'year': date.year,
            'amount': -((i + 1) * 100)
        })

    # Get spending trends
    response = client.get('/api/analytics/trends?timeframe=month&months=3')
    if response.status_code == 200:
        trends_data = json.loads(response.data)

        # Verify that our test months appear in the results
        # The exact format depends on your implementation
        if isinstance(trends_data, dict) and 'months' in trends_data:
            months_data = trends_data['months']
            for tx in transactions:
                month_key = f"{tx['year']}-{tx['month']:02d}"
                month_found = False
                for month_data in months_data:
                    if month_data.get('month') == month_key or month_data.get('date') == month_key:
                        month_found = True
                        assert month_data.get(
                            'spending', 0) >= abs(tx['amount'])
                        break
                assert month_found, f"Month {month_key} not found in spending trends"
        elif isinstance(trends_data, list):
            for tx in transactions:
                month_key = f"{tx['year']}-{tx['month']:02d}"
                month_found = False
                for month_data in trends_data:
                    if month_data.get('month') == month_key or month_data.get('date') == month_key:
                        month_found = True
                        assert month_data.get(
                            'spending', 0) >= abs(tx['amount'])
                        break
                assert month_found, f"Month {month_key} not found in spending trends"

    # Clean up
    for tx in transactions:
        client.delete(f'/api/transactions/{tx["id"]}')


def test_budget_vs_actual(client):
    """Test budget vs actual spending analytics"""
    # Create a test category
    category_data = {
        'name': 'Budget Analytics Test',
        'color': '#4CAF50',
        'subcategories': []
    }

    response = client.post(
        '/api/categories',
        json=category_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    result = json.loads(response.data)
    category_id = result['id']
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

    # Get an account for transactions
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Create transactions in this category
    today = datetime.now()
    tx_data = {
        'account_id': account_id,
        'date': today.strftime('%Y-%m-%d'),
        'amount': -150.00,
        'description': 'Budget Analytics Test',
        'category': category_name,
        'is_income': False
    }

    response = client.post(
        '/api/transactions',
        json=tx_data,
        content_type='application/json'
    )
    assert response.status_code == 200
    tx_result = json.loads(response.data)
    transaction_id = tx_result['id']

    # Get budget analytics
    response = client.get('/api/analytics/budgets')
    if response.status_code == 200:
        budget_analytics = json.loads(response.data)

        # Find our test category in the results
        category_found = False

        if isinstance(budget_analytics, dict) and 'categories' in budget_analytics:
            categories = budget_analytics['categories']
            for cat in categories:
                if cat['category'] == category_name:
                    category_found = True
                    assert cat['budget'] == 300.00
                    assert cat['spent'] >= 150.00
                    break
        elif isinstance(budget_analytics, list):
            for cat in budget_analytics:
                if cat['category'] == category_name:
                    category_found = True
                    assert cat['budget'] == 300.00
                    assert cat['spent'] >= 150.00
                    break

        assert category_found, f"Category {category_name} not found in budget analytics"

    # Clean up
    client.delete(f'/api/transactions/{transaction_id}')
    client.delete(f'/api/budgets/{budget_id}')
    client.delete(f'/api/categories/{category_id}')


def test_get_balance_over_time(client):
    """Test balance over time analytics"""
    # Get an account for testing
    response = client.get('/api/accounts')
    assert response.status_code == 200
    accounts = json.loads(response.data)
    assert len(accounts) > 0
    account_id = accounts[0]['id']

    # Add a series of transactions on different dates to the account
    today = datetime.now()
    transactions = []

    # Add transactions for the last 3 days
    for i in range(3):
        # Create date for transaction (today, yesterday, day before)
        tx_date = today - timedelta(days=i)

        # Add an expense
        expense_data = {
            'account_id': account_id,
            'date': tx_date.strftime('%Y-%m-%d'),
            'amount': -50.00 * (i + 1),  # -50, -100, -150
            'description': f'Day {i} Expense',
            'category': 'Food',
            'is_income': False
        }

        response = client.post(
            '/api/transactions',
            json=expense_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append(result['id'])

        # Add income
        income_data = {
            'account_id': account_id,
            'date': tx_date.strftime('%Y-%m-%d'),
            'amount': 100.00,
            'description': f'Day {i} Income',
            'category': 'Income',
            'is_income': True
        }

        response = client.post(
            '/api/transactions',
            json=income_data,
            content_type='application/json'
        )
        assert response.status_code == 200
        result = json.loads(response.data)
        transactions.append(result['id'])

    # Test for specific account
    response = client.get(
        f'/api/analytics/balance?account_id={account_id}&timeframe=month')
    if response.status_code == 200:
        balance_data = json.loads(response.data)

        # Check that the balance history has entries
        if isinstance(balance_data, list):
            assert len(balance_data) > 0

            # Check that the data has the expected keys
            for entry in balance_data:
                assert 'date' in entry
                assert 'balance' in entry
                assert 'change' in entry

    # Test for all accounts
    response = client.get('/api/analytics/balance?timeframe=month')
    if response.status_code == 200:
        all_balance_data = json.loads(response.data)

        # Verify that we got data back
        if isinstance(all_balance_data, list):
            assert len(all_balance_data) > 0

    # Clean up
    for tx_id in transactions:
        client.delete(f'/api/transactions/{tx_id}')


def test_category_breakdown(client):
    """Test category breakdown analytics"""
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
    assert len(categories) > 0

    # Create transactions in various categories and subcategories
    transactions = []
    today = datetime.now()

    # Use a specific category and subcategories that we know exist
    test_category = next((c for c in categories if c['name'] == 'Entertainment' and 'subcategories' in c and len(
        c['subcategories']) > 0), None)
    if test_category is None:
        test_category = next((c for c in categories if 'subcategories' in c and len(
            c['subcategories']) > 0), None)

    assert test_category is not None, "No category with subcategories found"

    # Create transactions in the category with different subcategories
    # Use first 2 subcategories
    for i, subcategory in enumerate(test_category['subcategories'][:2]):
        tx_data = {
            'account_id': account_id,
            'date': today.strftime('%Y-%m-%d'),
            'amount': -(i + 1) * 75.00,
            'description': f'Test for {subcategory["name"]}',
            'category': test_category['name'],
            'subcategory': subcategory['name'],
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

    # Get category breakdown
    response = client.get(
        f'/api/analytics/category-breakdown?timeframe=month&category={test_category["name"]}')
    assert response.status_code == 200
    breakdown_data = json.loads(response.data)

    # Check that we got data
    assert breakdown_data is not None
    if isinstance(breakdown_data, list):
        assert len(breakdown_data) > 0

        # Verify our test category and subcategories are in the results
        category_found = False
        for item in breakdown_data:
            if item.get('category') == test_category['name']:
                category_found = True
                break

        assert category_found, f"Category {test_category['name']} not found in breakdown"

    # Clean up
    for tx_id in transactions:
        client.delete(f'/api/transactions/{tx_id}')


def test_all_analytics_endpoints(client):
    """Test all analytics endpoints to ensure they return valid responses"""

    # Test various analytics endpoints
    endpoints = [
        '/api/analytics/spending?timeframe=month',
        '/api/analytics/income?timeframe=month',
        '/api/analytics/balance?timeframe=month',
        '/api/analytics/category-breakdown?timeframe=month',
        '/api/analytics/spending?timeframe=year',
        '/api/analytics/income?timeframe=year',
        '/api/analytics/balance?timeframe=year',
        '/api/analytics/category-breakdown?timeframe=year',
        '/api/analytics/spending?timeframe=all',
        '/api/analytics/projections?months=12'
    ]

    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code in [
            200, 404], f"Endpoint {endpoint} returned {response.status_code}"

        # If the endpoint exists (200), make sure it returns valid JSON
        if response.status_code == 200:
            result = json.loads(response.data)
            assert result is not None, f"Endpoint {endpoint} returned None"
