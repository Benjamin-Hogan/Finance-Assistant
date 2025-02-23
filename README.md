# Personal Finance Management System

A comprehensive personal finance management application that helps you track accounts, create budgets, and plan for your financial future.

## Features

- **Account Management**: Track multiple financial accounts (bank, investment, loans) in one place
- **Transaction Management**:
  - Centralized transaction history with categorization
  - Table and List views for transactions
  - Inline editing capabilities
  - Real-time balance updates
  - Transaction categorization and filtering
- **Authentication**:
  - Secure session-based authentication
  - User registration and login
  - Protected routes and API endpoints
- **Dashboard**:
  - Overview of all accounts and financial status
  - Total balance calculation
  - Recent transaction history
- **User Experience**:
  - Responsive Material-UI design
  - Intuitive navigation
  - Real-time updates
  - Error handling and validation

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Security (Session-based authentication)
- Maven
- PostgreSQL
- JUnit for testing

### Frontend

- React 18
- TypeScript
- Material-UI (MUI)
- Chart.js for visualizations
- Axios for API communication
- Jest for testing

## Project Structure

```
personal-finance/
├── backend/                 # Java/Maven backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   ├── controller/    # REST controllers
│   │   │   │   ├── service/       # Business logic
│   │   │   │   ├── repository/    # Data access
│   │   │   │   ├── model/         # Domain models
│   │   │   │   ├── security/      # Authentication
│   │   │   │   └── dto/           # Data transfer objects
│   │   │   └── resources/  # Configuration files
│   │   └── test/           # Test files
│   └── pom.xml             # Maven configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard/  # Dashboard views
│   │   │   ├── Transactions/ # Transaction management
│   │   │   └── Auth/      # Authentication pages
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── package.json       # NPM configuration
│   └── tsconfig.json      # TypeScript configuration
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 16 or higher
- Maven
- PostgreSQL

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a PostgreSQL database named 'personal_finance'

3. Update `application.properties` with your database credentials

4. Run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user

### Accounts

- GET `/api/accounts` - Get user accounts
- POST `/api/accounts` - Create new account
- PUT `/api/accounts/{id}` - Update account
- DELETE `/api/accounts/{id}` - Delete account

### Transactions

- GET `/api/transactions` - Get user transactions
- POST `/api/transactions` - Create new transaction
- PUT `/api/transactions/{id}` - Update transaction
- DELETE `/api/transactions/{id}` - Delete transaction

## Database Schema

### Users

- id (PK)
- email
- password (hashed)
- first_name
- last_name
- created_at
- updated_at

### Accounts

- id (PK)
- user_id (FK)
- name
- type
- balance
- currency
- created_at
- updated_at

### Transactions

- id (PK)
- account_id (FK)
- amount
- type
- description
- category
- date
- merchant_name
- reference_number
- recurring
- notes
- created_at
- updated_at

## Security Features

- Session-based authentication
- CSRF protection
- Secure password hashing
- Protected API endpoints
- Input validation
- Error handling

## Development Guidelines

1. Follow Git flow for branch management
2. Write unit tests for new features
3. Follow code style guidelines
4. Document new features and APIs
5. Keep the README updated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
