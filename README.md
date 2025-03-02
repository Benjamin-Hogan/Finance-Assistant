# Personal Finance Manager

A comprehensive personal finance application with YNAB-style envelope budgeting, transaction tracking, and financial analytics.

## Features

- **Dashboard**: Get an overview of your financial health with key metrics and visualizations
- **Accounts Management**: Track multiple accounts and their balances
- **Transaction Tracking**: Record and categorize your income and expenses
- **Scheduled Transactions**: Set up recurring transactions that automatically process
- **YNAB-Style Budgeting**: Allocate every dollar to specific categories using the envelope method
- **Categories Management**: Create and organize categories and subcategories for your transactions
- **Analytics**: Visualize your spending patterns, income sources, and financial trends
- **Data Import**: Import transaction data from CSV files
- **Balance Projections**: See how your account balances might change over time
- **Budget Progress Tracking**: Monitor your spending against your budget in real-time

## Tech Stack

### Frontend

- **Framework**: React 18
- **UI Library**: Material-UI v5 with emotion styling
- **State Management**: React Hooks
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charting**: Chart.js with react-chartjs-2
- **Date Handling**: date-fns
- **Data Grid**: MUI X Data Grid for tabular data
- **Color Picker**: react-colorful for budget category customization

### Backend

- **Framework**: Flask (Python)
- **ORM**: SQLAlchemy
- **Data Processing**: Pandas, NumPy
- **Data Visualization**: Matplotlib, Seaborn, Plotly
- **Testing**: PyTest, Coverage
- **Validation**: Pydantic
- **Code Quality**: Black, Flake8

### Database

- **Primary**: SQLite (easily upgradable to PostgreSQL or MySQL)
- **MongoDB Support**: Available via pymongo for specific use cases

## Project Structure

```
personal-finance/
├── backend/               # Flask backend
│   ├── data/              # Database and data files
│   ├── src/               # Source code
│   │   ├── account_manager.py
│   │   ├── analytics.py
│   │   ├── app.py         # Main Flask application
│   │   ├── budget_manager.py
│   │   ├── category_manager.py
│   │   ├── database.py
│   │   ├── scheduled_transaction_manager.py
│   │   └── transaction_manager.py
│   ├── tests/             # Comprehensive test suite
│   ├── run.py             # Entry point for backend
│   ├── seed_data.py       # Initialize with sample data
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API and utility services
│   │   ├── assets/        # Images and other assets
│   │   ├── App.js         # Main React component
│   │   └── theme.js       # Material UI theme configuration
│   ├── package.json       # Node.js dependencies
│   └── main.js            # Electron support
└── .gitignore             # Git ignore file
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- pip

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Create and activate a virtual environment:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```
   python run.py
   ```
   The backend will run on http://127.0.0.1:5002/api

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run the development server:
   ```
   npm start
   ```
   The frontend will run on http://localhost:3000

## API Endpoints

The backend provides a comprehensive RESTful API:

- **/api/accounts** - Manage financial accounts
- **/api/transactions** - Handle financial transactions
- **/api/budgets** - Configure and monitor budgets
- **/api/categories** - Organize transaction categories
- **/api/scheduled-transactions** - Set up recurring transactions
- **/api/analytics** - Get financial insights and visualizations
- **/api/import-csv** - Import transaction data

## Testing

### Backend Tests

Run the comprehensive test suite:

```
cd backend
pytest
```

Generate coverage report:

```
cd backend
python run_tests.py
```

## Usage Guide

### Getting Started

1. **Set up accounts**: Create your bank accounts, credit cards, and other financial accounts
2. **Add categories**: Set up your budget categories and subcategories
3. **Create a budget**: Allocate funds to your categories
4. **Add transactions**: Record your income and expenses

### Budgeting (YNAB Style)

The application follows the YNAB (You Need A Budget) methodology:

1. **Give Every Dollar a Job**: Allocate all your available money to specific categories
2. **Embrace Your True Expenses**: Plan for larger, less frequent expenses by setting aside money each month
3. **Roll With The Punches**: Move money between categories as your priorities change
4. **Age Your Money**: Work towards spending money that's at least 30 days old

### Scheduled Transactions

Set up recurring transactions for:

- Regular bills (rent, utilities, subscriptions)
- Income (salary, dividends)
- Savings contributions
- Loan payments

### Analytics

Gain insights into your financial habits with:

- Spending by category
- Income vs. expenses over time
- Net worth tracking
- Budget compliance
- Balance projections
- Category breakdown

## Troubleshooting

### Common Issues

- **Backend connection errors**: Ensure the backend server is running on port 5002
- **Database errors**: Check file permissions for the SQLite database
- **CORS issues**: Verify that the frontend is connecting to the correct backend URL

### Logs

- Backend logs are available in the terminal where the server is running
- Frontend logs can be viewed in the browser's developer console

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by YNAB (You Need A Budget) and other personal finance tools
- Built with open-source technologies
