import random


class CategoryManager:
    def __init__(self, db):
        """Initialize category manager with database connection"""
        self.db = db
        # Initialize default categories when created
        self.initialize_default_categories()

    def initialize_default_categories(self):
        """Initialize default categories if they don't exist"""
        # List of default categories with their subcategories and colors
        default_categories = [
            {
                'name': 'Food',
                'color': '#4CAF50',  # Green
                'subcategories': ['Groceries', 'Restaurants', 'Fast Food', 'Coffee']
            },
            {
                'name': 'Housing',
                'color': '#2196F3',  # Blue
                'subcategories': ['Rent/Mortgage', 'Utilities', 'Maintenance', 'Insurance']
            },
            {
                'name': 'Transportation',
                'color': '#FF9800',  # Orange
                'subcategories': ['Fuel', 'Public Transit', 'Maintenance', 'Insurance']
            },
            {
                'name': 'Entertainment',
                'color': '#9C27B0',  # Purple
                'subcategories': ['Movies', 'Games', 'Events']
            },
            {
                'name': 'Shopping',
                'color': '#F44336',  # Red
                'subcategories': ['Clothing', 'Electronics', 'Gifts']
            },
            {
                'name': 'Health',
                'color': '#00BCD4',  # Cyan
                'subcategories': ['Medical', 'Fitness', 'Pharmacy']
            },
            {
                'name': 'Personal',
                'color': '#607D8B',  # Blue Grey
                'subcategories': ['Education', 'Beauty', 'Subscriptions']
            },
            {
                'name': 'Income',
                'color': '#8BC34A',  # Light Green
                'subcategories': ['Salary', 'Investments', 'Gifts', 'Other', 'Freelance', 'Interest']
            },
            {
                'name': 'Transfer',
                'color': '#9E9E9E',  # Grey
                'subcategories': ['Account Transfer', 'Withdrawal', 'Deposit']
            }
        ]

        # For each default category, check if it exists and create if not
        for category_data in default_categories:
            # Check if category exists
            category_exists = self.db.execute_query(
                """
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name = ?
                """,
                (category_data['name'],)
            )

            if not category_exists or category_exists[0]['count'] == 0:
                # Category doesn't exist, create it
                print(f"Creating default category: {category_data['name']}")
                self.add_category(category_data)
            else:
                # Category exists, make sure subcategories exist
                category = self.db.execute_query(
                    """
                    SELECT id 
                    FROM categories 
                    WHERE name = ?
                    """,
                    (category_data['name'],)
                )

                if category and len(category) > 0:
                    category_id = category[0]['id']

                    # For each subcategory, check if it exists
                    for subcat in category_data['subcategories']:
                        subcat_exists = self.db.execute_query(
                            """
                            SELECT COUNT(*) as count 
                            FROM subcategories 
                            WHERE category_id = ? AND name = ?
                            """,
                            (category_id, subcat)
                        )

                        if not subcat_exists or subcat_exists[0]['count'] == 0:
                            # Subcategory doesn't exist, create it
                            print(
                                f"Creating default subcategory: {subcat} for {category_data['name']}")
                            self.create_subcategory({
                                'category_id': category_id,
                                'name': subcat
                            })

    def get_all_categories(self):
        """Get all categories with their subcategories"""
        # Get main categories
        categories_query = """
        SELECT c.id, c.name, c.color
        FROM categories c
        ORDER BY c.name
        """
        categories = self.db.execute_query(categories_query)

        # Get subcategories for each category
        for category in categories:
            subcategories_query = """
            SELECT s.id, s.name, s.color
            FROM subcategories s
            WHERE s.category_id = ?
            ORDER BY s.name
            """
            subcategories = self.db.execute_query(
                subcategories_query, (category['id'],))
            category['subcategories'] = subcategories

        return categories

    def get_category(self, category_id):
        """Get a category by ID"""
        query = """
        SELECT c.id, c.name, c.color
        FROM categories c
        WHERE c.id = ?
        """
        category = self.db.execute_query(query, (category_id,))

        if not category:
            return None

        # Get subcategories
        subcategories_query = """
        SELECT s.id, s.name, s.color
        FROM subcategories s
        WHERE s.category_id = ?
        ORDER BY s.name
        """
        subcategories = self.db.execute_query(
            subcategories_query, (category_id,))

        result = category[0]
        result['subcategories'] = subcategories

        return result

    def create_category(self, category_data):
        """Create a new category"""
        # Validate required fields
        if 'name' not in category_data:
            return {'error': 'Category name is required'}

        # Check if category already exists
        check_query = """
        SELECT COUNT(*) as count
        FROM categories
        WHERE name = ?
        """
        result = self.db.execute_query(check_query, (category_data['name'],))

        if result[0]['count'] > 0:
            return {'error': 'Category with this name already exists'}

        # Insert new category
        insert_query = """
        INSERT INTO categories (name, color)
        VALUES (?, ?)
        """
        params = (
            category_data['name'],
            category_data.get('color')
        )

        category_id = self.db.execute_insert(insert_query, params)

        # Add subcategories if provided
        if 'subcategories' in category_data and category_data['subcategories']:
            for subcategory in category_data['subcategories']:
                if isinstance(subcategory, dict):
                    subcategory_name = subcategory.get('name')
                    subcategory_color = subcategory.get('color')
                else:
                    subcategory_name = subcategory
                    subcategory_color = None

                self.create_subcategory({
                    'category_id': category_id,
                    'name': subcategory_name,
                    'color': subcategory_color
                })

        return self.get_category(category_id)

    def update_category(self, category_id, category_data):
        """Update an existing category"""
        # Check if category exists
        category = self.get_category(category_id)
        if not category:
            return {'error': 'Category not found'}

        # Update category
        update_query = """
        UPDATE categories
        SET name = ?, color = ?
        WHERE id = ?
        """
        params = (
            category_data.get('name', category['name']),
            category_data.get('color', category['color']),
            category_id
        )

        self.db.execute_update(update_query, params)

        # Update subcategories if provided
        if 'subcategories' in category_data:
            # Delete existing subcategories
            delete_query = """
            DELETE FROM subcategories
            WHERE category_id = ?
            """
            self.db.execute_update(delete_query, (category_id,))

            # Add new subcategories
            for subcategory in category_data['subcategories']:
                if isinstance(subcategory, dict):
                    subcategory_name = subcategory.get('name')
                    subcategory_color = subcategory.get('color')
                else:
                    subcategory_name = subcategory
                    subcategory_color = None

                self.create_subcategory({
                    'category_id': category_id,
                    'name': subcategory_name,
                    'color': subcategory_color
                })

        return self.get_category(category_id)

    def delete_category(self, category_id):
        """Delete a category and its subcategories"""
        # Check if category exists
        category = self.get_category(category_id)
        if not category:
            return {'error': 'Category not found'}

        # Delete subcategories
        delete_subcategories_query = """
        DELETE FROM subcategories
        WHERE category_id = ?
        """
        self.db.execute_update(delete_subcategories_query, (category_id,))

        # Delete category
        delete_category_query = """
        DELETE FROM categories
        WHERE id = ?
        """
        self.db.execute_update(delete_category_query, (category_id,))

        return {'success': True, 'message': 'Category deleted successfully'}

    def create_subcategory(self, subcategory_data):
        """Create a new subcategory"""
        # Validate required fields
        if 'category_id' not in subcategory_data:
            return {'error': 'Category ID is required'}

        if 'name' not in subcategory_data:
            return {'error': 'Subcategory name is required'}

        # Check if category exists
        category_query = """
        SELECT COUNT(*) as count
        FROM categories
        WHERE id = ?
        """
        result = self.db.execute_query(
            category_query, (subcategory_data['category_id'],))

        if result[0]['count'] == 0:
            return {'error': 'Parent category not found'}

        # Check if subcategory already exists
        check_query = """
        SELECT COUNT(*) as count
        FROM subcategories
        WHERE category_id = ? AND name = ?
        """
        result = self.db.execute_query(
            check_query, (subcategory_data['category_id'], subcategory_data['name']))

        if result[0]['count'] > 0:
            return {'error': 'Subcategory with this name already exists in this category'}

        # Insert new subcategory
        insert_query = """
        INSERT INTO subcategories (category_id, name, color)
        VALUES (?, ?, ?)
        """
        params = (
            subcategory_data['category_id'],
            subcategory_data['name'],
            subcategory_data.get('color')
        )

        subcategory_id = self.db.execute_insert(insert_query, params)

        # Get the created subcategory
        query = """
        SELECT s.id, s.name, s.color
        FROM subcategories s
        WHERE s.id = ?
        """
        subcategory = self.db.execute_query(query, (subcategory_id,))

        return subcategory[0] if subcategory else None

    def update_subcategory(self, subcategory_id, subcategory_data):
        """Update an existing subcategory"""
        # Check if subcategory exists
        query = """
        SELECT s.id, s.name, s.color, s.category_id
        FROM subcategories s
        WHERE s.id = ?
        """
        subcategory = self.db.execute_query(query, (subcategory_id,))

        if not subcategory:
            return {'error': 'Subcategory not found'}

        subcategory = subcategory[0]

        # Update subcategory
        update_query = """
        UPDATE subcategories
        SET name = ?, color = ?, category_id = ?
        WHERE id = ?
        """
        params = (
            subcategory_data.get('name', subcategory['name']),
            subcategory_data.get('color', subcategory['color']),
            subcategory_data.get('category_id', subcategory['category_id']),
            subcategory_id
        )

        self.db.execute_update(update_query, params)

        # Get the updated subcategory
        query = """
        SELECT s.id, s.name, s.color
        FROM subcategories s
        WHERE s.id = ?
        """
        updated_subcategory = self.db.execute_query(query, (subcategory_id,))

        return updated_subcategory[0] if updated_subcategory else None

    def delete_subcategory(self, subcategory_id):
        """Delete a subcategory"""
        # Check if subcategory exists
        query = """
        SELECT COUNT(*) as count
        FROM subcategories
        WHERE id = ?
        """
        result = self.db.execute_query(query, (subcategory_id,))

        if result[0]['count'] == 0:
            return {'error': 'Subcategory not found'}

        # Delete subcategory
        delete_query = """
        DELETE FROM subcategories
        WHERE id = ?
        """
        self.db.execute_update(delete_query, (subcategory_id,))

        return {'success': True, 'message': 'Subcategory deleted successfully'}

    # Compatibility methods for API endpoints
    def get_subcategories(self, category_id):
        """Get all subcategories for a category - compatibility method for API"""
        category = self.get_category(category_id)
        if not category:
            return {'error': 'Category not found'}

        return category['subcategories']

    def add_category(self, category_data):
        """Add a new category with optional subcategories"""
        # Check if required fields are present
        if 'name' not in category_data:
            return {'error': 'Missing required field: name'}

        # Check if category already exists
        existing = self.db.execute_query(
            """
            SELECT id, name, color
            FROM categories
            WHERE name = ?
            """,
            (category_data['name'],)
        )

        if existing and len(existing) > 0:
            # Category already exists, return the existing ID
            return {'id': existing[0]['id'], 'message': 'Category already exists', 'name': category_data['name']}

        # Insert category
        category_id = self.db.execute_insert(
            """
            INSERT INTO categories (name, color)
            VALUES (?, ?)
            """,
            (
                category_data['name'],
                category_data.get(
                    'color', '#' + ''.join([format(int(random.random() * 255), '02X') for _ in range(3)]))
            )
        )

        # Insert subcategories if provided
        if 'subcategories' in category_data and isinstance(category_data['subcategories'], list):
            for subcategory in category_data['subcategories']:
                if isinstance(subcategory, str):
                    self.db.execute_insert(
                        """
                        INSERT INTO subcategories (category_id, name)
                        VALUES (?, ?)
                        """,
                        (category_id, subcategory)
                    )
                elif isinstance(subcategory, dict) and 'name' in subcategory:
                    self.db.execute_insert(
                        """
                        INSERT INTO subcategories (category_id, name, color)
                        VALUES (?, ?, ?)
                        """,
                        (
                            category_id,
                            subcategory['name'],
                            subcategory.get('color')
                        )
                    )

        return {'id': category_id, 'message': 'Category created successfully', 'name': category_data['name']}

    def add_subcategory(self, category_id, subcategory_data):
        """Add a subcategory to a category - compatibility method for API"""
        # Add category_id to the subcategory data
        subcategory_data['category_id'] = category_id
        return self.create_subcategory(subcategory_data)

    def get_category_by_id(self, category_id):
        """Get a category and its subcategories by ID"""
        category = self.db.execute_query(
            """
            SELECT id, name, color
            FROM categories
            WHERE id = ?
            """,
            (category_id,)
        )

        if not category:
            return None

        category = category[0]

        subcategories = self.db.execute_query(
            """
            SELECT id, name, color
            FROM subcategories
            WHERE category_id = ?
            ORDER BY name
            """,
            (category_id,)
        )

        category['subcategories'] = subcategories

        return category
