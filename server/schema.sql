-- Plutus — PostgreSQL schema (simplified: use Supabase UUID directly)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,
    timestamp       TIMESTAMP NOT NULL,
    merchant        TEXT NOT NULL,
    category        TEXT NOT NULL,
    amount          NUMERIC(14,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'INR',
    status          TEXT NOT NULL,
    payment_method  TEXT NOT NULL,
    coins_earned    INTEGER NOT NULL DEFAULT 0,
    user_id         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_gin ON transactions USING gin(merchant gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_transactions_coins_earned ON transactions(coins_earned);

CREATE TABLE IF NOT EXISTS rewards (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    description      TEXT,
    coin_cost        INTEGER NOT NULL,
    reward_type      TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS redemptions (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL,
    reward_id       INTEGER NOT NULL REFERENCES rewards(id),
    coins_spent     INTEGER NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);