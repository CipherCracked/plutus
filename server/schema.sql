-- Plutus — PostgreSQL schema
-- Designed for 10k transactions with rich filtering and rewards tracking.
-- Run via: psql $DATABASE_URL -f schema.sql
-- Or let seed.py handle schema creation automatically.

-- Extension needed for trigram-based fuzzy search on merchant names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    coin_balance INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS
-- Flat table mapping each JSON field to a typed column.
-- This satisfies the "actual schema, not JSON dump" requirement.
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id            TEXT        PRIMARY KEY,      -- e.g. "TXN2025000000"
    timestamp     TIMESTAMP NOT NULL,         -- normalized to UTC
    merchant      TEXT        NOT NULL,
    category      TEXT        NOT NULL,
    amount        NUMERIC(14,2) NOT NULL,     -- covers -999999.99 to 999999999.00
    currency      TEXT        NOT NULL DEFAULT 'INR',
    status        TEXT        NOT NULL,       -- normalized: SUCCESS, FAILED, PENDING
    payment_method TEXT       NOT NULL,
    coins_earned  INTEGER     NOT NULL DEFAULT 0,
    user_id       INTEGER     NOT NULL REFERENCES users(id)
);

-- ============================================================================
-- REWARDS CATALOGUE
-- 4-6 self-defined rewards that users redeem coins for.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rewards (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    coin_cost   INTEGER NOT NULL,
    -- Optional: a category for UI grouping (voucher, cashback, perk, etc.)
    reward_type TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- REDEMPTIONS LOG
-- Audit trail of all redemptions for the default user.
-- ============================================================================
CREATE TABLE IF NOT EXISTS redemptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    reward_id   INTEGER NOT NULL REFERENCES rewards(id),
    coins_spent INTEGER NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (for frontend filtering and sorting)
-- ============================================================================
-- Filtering: category, status, payment_method
CREATE INDEX IF NOT EXISTS idx_transactions_category      ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status        ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- Filtering: date range
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

-- Filtering: amount range
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Search: merchant name (text search)
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_gin
    ON transactions USING gin(merchant gin_trgm_ops);

-- Filtering: user-scoped queries (if multi-user in future)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Redemptions: user-scoped
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);

-- Coins: coins_earned for aggregate queries
CREATE INDEX IF NOT EXISTS idx_transactions_coins_earned ON transactions(coins_earned);
