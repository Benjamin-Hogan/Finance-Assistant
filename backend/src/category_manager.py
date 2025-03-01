class CategoryManager:
    def __init__(self, db):
        """Initialize category manager with database connection"""
        self.db = db

    def get_all_categories(self):
        """Get all categories with their subcategories"""
        # First, get all main categories
        categories = self.db.query(
            """
            SELECT id, name, color 
            FROM categories 
            WHERE parent_id IS NULL
            ORDER BY name
            """
        )

        result = []
        for category in categories:
            category_dict = dict(category)

            # Get all subcategories for this category
            subcategories = self.db.query(
                """
                SELECT id, name 
                FROM categories 
                WHERE parent_id = ?
                ORDER BY name
                """,
                (category['id'],)
            )

            category_dict['subcategories'] = [
                dict(subcat) for subcat in subcategories]
            result.append(category_dict)

        return result

    def get_category_by_id(self, category_id):
        """Get a category by ID"""
        category = self.db.query(
            """
            SELECT id, name, color, parent_id 
            FROM categories 
            WHERE id = ?
            """,
            (category_id,)
        )

        if not category:
            return None

        return dict(category[0])

    def add_category(self, category_data):
        """Add a new main category"""
        required_fields = ['name']
        for field in required_fields:
            if field not in category_data:
                return {'error': f'Missing required field: {field}'}

        # Check if category already exists
        existing = self.db.query(
            """
            SELECT id FROM categories 
            WHERE name = ? AND parent_id IS NULL
            """,
            (category_data['name'],)
        )

        if existing:
            return {'error': 'Category already exists'}

        # Insert category
        category_id = self.db.execute(
            """
            INSERT INTO categories (name, color)
            VALUES (?, ?)
            """,
            (
                category_data['name'],
                category_data.get('color', '#9E9E9E')  # Default gray color
            )
        )

        # If subcategories are provided, add them
        if 'subcategories' in category_data and isinstance(category_data['subcategories'], list):
            for subcategory in category_data['subcategories']:
                if isinstance(subcategory, str):
                    self.add_subcategory(category_id, {'name': subcategory})
                elif isinstance(subcategory, dict) and 'name' in subcategory:
                    self.add_subcategory(category_id, subcategory)

        return {
            'id': category_id,
            'message': 'Category created successfully'
        }

    def update_category(self, category_id, category_data):
        """Update an existing category"""
        category = self.get_category_by_id(category_id)
        if not category:
            return {'error': 'Category not found'}

        # Check if this is a subcategory (parent_id is not null)
        if category['parent_id'] is not None:
            return {'error': 'This endpoint is for main categories only. Use the subcategory endpoints for updating subcategories.'}

        fields = []
        params = []

        if 'name' in category_data:
            fields.append("name = ?")
            params.append(category_data['name'])

        if 'color' in category_data:
            fields.append("color = ?")
            params.append(category_data['color'])

        if not fields:
            return {'error': 'No fields to update'}

        # Add category_id to params
        params.append(category_id)

        # Update category
        self.db.execute(
            f"UPDATE categories SET {', '.join(fields)} WHERE id = ?",
            params
        )

        return {
            'id': category_id,
            'message': 'Category updated successfully'
        }

    def delete_category(self, category_id):
        """Delete a category and all its subcategories"""
        category = self.get_category_by_id(category_id)
        if not category:
            return {'error': 'Category not found'}

        # Check if this is a subcategory
        if category['parent_id'] is not None:
            # Delete just this subcategory
            self.db.execute(
                "DELETE FROM categories WHERE id = ?",
                (category_id,)
            )
            return {'message': 'Subcategory deleted successfully'}

        # For main categories, first check if it's being used in transactions or budgets
        transactions = self.db.query(
            "SELECT COUNT(*) as count FROM transactions WHERE category = ?",
            (category['name'],)
        )

        budgets = self.db.query(
            "SELECT COUNT(*) as count FROM budgets WHERE category = ?",
            (category['name'],)
        )

        if transactions[0]['count'] > 0 or budgets[0]['count'] > 0:
            return {'error': 'Cannot delete category that is being used in transactions or budgets'}

        # Delete all subcategories
        self.db.execute(
            "DELETE FROM categories WHERE parent_id = ?",
            (category_id,)
        )

        # Delete the main category
        self.db.execute(
            "DELETE FROM categories WHERE id = ?",
            (category_id,)
        )

        return {'message': 'Category and all subcategories deleted successfully'}

    def get_subcategories(self, category_id):
        """Get all subcategories for a category"""
        category = self.get_category_by_id(category_id)
        if not category:
            return {'error': 'Category not found'}

        subcategories = self.db.query(
            """
            SELECT id, name 
            FROM categories 
            WHERE parent_id = ?
            ORDER BY name
            """,
            (category_id,)
        )

        return [dict(subcat) for subcat in subcategories]

    def add_subcategory(self, category_id, subcategory_data):
        """Add a subcategory to a category"""
        category = self.get_category_by_id(category_id)
        if not category:
            return {'error': 'Parent category not found'}

        if 'name' not in subcategory_data:
            return {'error': 'Name is required for subcategory'}

        # Check if subcategory already exists
        existing = self.db.query(
            """
            SELECT id FROM categories 
            WHERE name = ? AND parent_id = ?
            """,
            (subcategory_data['name'], category_id)
        )

        if existing:
            return {'error': 'Subcategory already exists in this category'}

        # Insert subcategory
        subcategory_id = self.db.execute(
            """
            INSERT INTO categories (name, parent_id)
            VALUES (?, ?)
            """,
            (
                subcategory_data['name'],
                category_id
            )
        )

        return {
            'id': subcategory_id,
            'message': 'Subcategory added successfully'
        }
