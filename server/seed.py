#!/usr/bin/env python3
"""
Plutus — Seed script

Loads transactions.json into Supabase PostgreSQL, normalizes data quality
issues (mixed timestamp formats, inconsistent status casing, duplicate IDs),
computes coin earnings, seeds the default user and rewards catalogue.

Run:
    python seed.py

Requires:
    DATABASE_URL environment variable
    pip install -r requirements.txt
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

# Load .env file (gitignored, never committed).
# Checks project root first, then server/ directory.
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent / ".env")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATA_FILE = Path(__file__).parent.parent / "transactions.json"
SCHEMA_FILE = Path(__file__).parent / "schema.sql"

DEFAULT_USER = "plutus_user"

# Coin earning: 1 coin per ₹100 spent, capped at 50 per transaction
COIN_RATE = 100        # 1 coin per 100 rupees
COIN_CAP = 50          # max coins per transaction

# Rewards catalogue (4 items to satisfy minimum, easy to extend)
REWARDS = [
    {
        "name": "₹50 Cashback Voucher",
        "description": "₹50 off your next bill payment",
        "coin_cost": 100,
        "reward_type": "cashback",
    },
    {
        "name": "₹100 Cashback Voucher",
        "description": "₹100 off your next bill payment",
        "coin_cost": 200,
        "reward_type": "cashback",
    },
    {
        "name": "₹250 Amazon/Flipkart Voucher",
        "description": "₹250 shopping voucher for Amazon or Flipkart",
        "coin_cost": 400,
        "reward_type": "voucher",
    },
    {
        "name": "₹500 Shopping Voucher",
        "description": "₹500 shopping voucher for major retailers",
        "coin_cost": 750,
        "reward_type": "voucher",
    },
    {
        "name": "Mobile Data Top-up (1GB)",
        "description": "1GB mobile data recharge",
        "coin_cost": 150,
        "reward_type": "voucher",
    },
    {
        "name": "OTT Subscription Trial",
        "description": "3-day free trial of premium OTT subscription",
        "coin_cost": 300,
        "reward_type": "perk",
    },
]


# ---------------------------------------------------------------------------
# Data normalization helpers
# ---------------------------------------------------------------------------

def normalize_timestamp(raw):
    """
    Normalize a timestamp value that could be in any of these formats:
      - ISO 8601 datetime string  ("2025-10-03T21:03:27Z")
      - Unix epoch milliseconds     (1768265109000)
      - Date-only string            ("2025-07-03")
      - Slash datetime string       ("12/10/2025 16:24:49" → DD/MM/YYYY)

    Returns a timezone-aware datetime in UTC.
    Raises ValueError if the format is unrecognized.
    """
    if raw is None or raw == "":
        return None

    # Case 1: epoch milliseconds (or seconds if very large)
    if isinstance(raw, (int, float)):
        if raw > 1e12:  # milliseconds
            ts = raw / 1000.0
        else:  # seconds
            ts = raw
        return datetime.fromtimestamp(ts, tz=timezone.utc)

    # Case 2: string
    s = raw.strip()

    # ISO 8601 datetime (e.g. "2025-10-03T21:03:27Z")
    if "T" in s:
        # Handle 'Z' suffix
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s).astimezone(timezone.utc)

    # Slash format: "DD/MM/YYYY HH:MM:SS" (day-first, seen in dataset)
    if "/" in s:
        return datetime.strptime(s, "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc)

    # Date-only string (e.g. "2025-07-03")
    return datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def normalize_status(status):
    """
    Normalize status to consistent uppercase.
    e.g. "success" -> "SUCCESS", "FAILED" -> "FAILED"
    """
    if status is None:
        return None
    return status.strip().upper()


def compute_coins_earned(amount, status):
    """
    Coin earning: 1 coin per ₹100 spent, capped at COIN_CAP per transaction.
    Only SUCCESS transactions earn coins. Negative amounts (refunds) earn 0.
    """
    if status != "SUCCESS":
        return 0
    if amount is None or amount < 0:
        return 0
    coins = int(amount // COIN_RATE)
    return min(coins, COIN_CAP)


# ---------------------------------------------------------------------------
# Main seed logic
# ---------------------------------------------------------------------------

def get_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("       Set it to your Supabase connection string:")
        print("       export DATABASE_URL='postgresql://user:pass@host:5432/dbname'")
        sys.exit(1)
    return psycopg2.connect(database_url)


def create_schema(conn):
    """Execute schema.sql to create all tables and indexes."""
    with open(SCHEMA_FILE, "r") as f:
        schema_sql = f.read()
    with conn:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
    print("✓ Schema created (tables + indexes)")


def seed_transactions(conn):
    """
    Load transactions.json, normalize data, and bulk-insert into the
    transactions table. Returns the coin_balance for the default user.
    """
    with open(DATA_FILE, "r") as f:
        raw_data = json.load(f)

    # Drop existing tables for idempotent re-runs (CASCADE handles FK deps)
    with conn:
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS transactions CASCADE")
            cur.execute("DROP TABLE IF EXISTS redemptions CASCADE")
            cur.execute("DROP TABLE IF EXISTS rewards CASCADE")
            cur.execute("DROP TABLE IF EXISTS users CASCADE")

    # Create fresh schema
    create_schema(conn)

    # Insert default user
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, coin_balance) VALUES (%s, %s) RETURNING id",
                (DEFAULT_USER, 0),
            )
            user_row = cur.fetchone()
            user_id = user_row[0]

    # Normalize all transactions
    seen_ids = set()
    clean_rows = []
    skipped_dup = 0
    skipped_bad_ts = 0
    skipped_bad_amt = 0

    for txn in raw_data:
        txn_id = txn.get("id")

        # Skip null or empty IDs
        if not txn_id:
            skipped_bad_ts += 1
            continue

        # Skip duplicate IDs
        if txn_id in seen_ids:
            skipped_dup += 1
            continue
        seen_ids.add(txn_id)

        # Normalize timestamp
        try:
            ts = normalize_timestamp(txn.get("timestamp"))
        except (ValueError, TypeError):
            skipped_bad_ts += 1
            continue
        if ts is None:
            skipped_bad_ts += 1
            continue

        # Parse amount
        try:
            amount = float(txn.get("amount", 0))
        except (TypeError, ValueError):
            skipped_bad_amt += 1
            continue

        # Normalize status and compute coins
        status = normalize_status(txn.get("status", "PENDING"))
        coins = compute_coins_earned(amount, status)

        clean_rows.append((
            txn_id,
            ts,
            txn.get("merchant") or "Unknown",
            txn.get("category") or "Uncategorized",
            amount,
            txn.get("currency") or "INR",
            status,
            txn.get("payment_method") or "Unknown",
            coins,
            user_id,
        ))

    # Bulk insert
    insert_sql = """
        INSERT INTO transactions (
            id, timestamp, merchant, category, amount,
            currency, status, payment_method, coins_earned, user_id
        ) VALUES %s
    """
    with conn:
        with conn.cursor() as cur:
            execute_values(cur, insert_sql, clean_rows, page_size=500)

    print(
        f"✓ Loaded {len(clean_rows)} transactions "
        f"(skipped {skipped_dup} duplicates, "
        f"{skipped_bad_ts} bad timestamps, "
        f"{skipped_bad_amt} bad amounts)"
    )

    # Compute and set user's coin balance
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COALESCE(SUM(coins_earned), 0) FROM transactions WHERE user_id = %s",
                (user_id,),
            )
            balance = cur.fetchone()[0]
            cur.execute(
                "UPDATE users SET coin_balance = %s WHERE id = %s",
                (balance, user_id),
            )

    print(f"✓ Default user '{DEFAULT_USER}' created with balance: {balance} coins")
    return user_id


def seed_rewards(conn):
    """Insert the rewards catalogue."""
    with conn:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO rewards (name, description, coin_cost, reward_type)
                VALUES %s
                """,
                [(r["name"], r["description"], r["coin_cost"], r["reward_type"])
                 for r in REWARDS],
            )
    print(f"✓ Seeded {len(REWARDS)} rewards")
    for r in REWARDS:
        print(f"  - {r['name']} ({r['coin_cost']} coins)")


def main():
    print("=" * 60)
    print("Plutus Seed Script")
    print("=" * 60)

    if not DATA_FILE.exists():
        print(f"ERROR: Data file not found at {DATA_FILE}")
        sys.exit(1)

    if not SCHEMA_FILE.exists():
        print(f"ERROR: Schema file not found at {SCHEMA_FILE}")
        sys.exit(1)

    conn = get_connection()
    try:
        seed_transactions(conn)
        seed_rewards(conn)
        print("\n✅ Seed complete. Database is ready.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
