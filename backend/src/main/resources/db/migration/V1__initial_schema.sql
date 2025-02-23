CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(19,2) NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT true,
    institution_name VARCHAR(255),
    account_number VARCHAR(255),
    routing_number VARCHAR(255),
    interest_rate DECIMAL(5,2),
    credit_limit DECIMAL(19,2),
    due_date INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    date DATE NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(255),
    merchant_name VARCHAR(255),
    reference_number VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE,
    active BOOLEAN NOT NULL DEFAULT true,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(255),
    description VARCHAR(1000),
    rollover_enabled BOOLEAN NOT NULL DEFAULT false,
    rollover_amount DECIMAL(19,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period_start ON budgets(period_start); 