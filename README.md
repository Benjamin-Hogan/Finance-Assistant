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

## Tech Stack

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: Flask (Python)
- **Database**: SQLite (easily upgradable to PostgreSQL or MySQL)

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
