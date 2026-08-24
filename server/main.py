"""
Plutus — FastAPI Backend

Endpoints:
    GET  /api/transactions  — all transactions (for client-side virtualization)
    GET  /api/balance       — user's coin balance + stats
    GET  /api/rewards       — rewards catalogue
    POST /api/redeem        — redeem a reward (atomic)
    GET  /api/analytics     — pre-aggregated category + monthly trend

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000

Requires:
    DATABASE_URL environment variable (Supabase or local PostgreSQL)
    pip install -r requirements.txt
"""

import os
from contextlib import contextmanager

import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    AnalyticsResponse,
    CategoryBreakdown,
    CoinBalance,
    MonthlyTrend,
    RedeemRequest,
    RedeemResponse,
    Reward,
    Transaction,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not set. Create a .env file at the project root."
    )


@contextmanager
def get_db():
    """Yield a database connection, committing/rolling back and closing on exit."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


app = FastAPI(
    title="Plutus API",
    description="Credit-card bill payment and rewards backend",
    version="1.0.0",
)

# CORS — only the origins listed here may call the API from a browser.
# Defaults cover the deployed frontend plus local dev; override or extend
# with ALLOWED_ORIGINS (comma-separated) without touching code.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
] or [
    "https://plutus-drab.vercel.app",              # production alias
    "https://plutus-a9w2ox0xe-cipher-cracked.vercel.app",  # current deployment
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/transactions", response_model=list[Transaction])
def get_transactions():
    """
    Return all transactions.

    The frontend loads this once and caches 10k rows in Zustand for
    client-side filtering, search, and virtualization.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    to_char(timestamp, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS timestamp,
                    merchant,
                    category,
                    amount,
                    currency,
                    status,
                    payment_method,
                    coins_earned
                FROM transactions
                ORDER BY timestamp DESC
            """)
            rows = cur.fetchall()

    columns = [
        "id", "timestamp", "merchant", "category", "amount",
        "currency", "status", "payment_method", "coins_earned",
    ]
    return [dict(zip(columns, row)) for row in rows]


@app.get("/api/balance", response_model=CoinBalance)
def get_balance():
    """Return the default user's coin balance and lifetime stats."""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Current balance + username
            cur.execute(
                "SELECT coin_balance, username FROM users WHERE username = 'plutus_user'"
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(500, "Default user not found — run seed.py first")
            balance, username = row

            # Total earned (sum of coins_earned across all transactions)
            cur.execute(
                "SELECT COALESCE(SUM(coins_earned), 0) FROM transactions"
            )
            total_earned = cur.fetchone()[0]

            # Total redeemed (sum of coins_spent across all redemptions)
            cur.execute(
                """
                SELECT COALESCE(SUM(r.coins_spent), 0)
                FROM redemptions r
                JOIN users u ON r.user_id = u.id
                WHERE u.username = 'plutus_user'
                """
            )
            total_redeemed = cur.fetchone()[0]

    return CoinBalance(
        balance=balance,
        username=username,
        total_earned=total_earned,
        total_redeemed=total_redeemed,
    )


@app.get("/api/rewards", response_model=list[Reward])
def get_rewards():
    """Return the full rewards catalogue."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, description, coin_cost, reward_type FROM rewards ORDER BY coin_cost"
            )
            rows = cur.fetchall()

    return [
        Reward(
            id=row[0],
            name=row[1],
            description=row[2],
            coin_cost=row[3],
            reward_type=row[4],
        )
        for row in rows
    ]


@app.post("/api/redeem", response_model=RedeemResponse)
def redeem_reward(request: RedeemRequest):
    """
    Redeem a reward atomically.

    Flow (all in one transaction):
        1. Look up reward and user.
        2. Check balance >= coin_cost.
        3. Deduct coins, log redemption.

    Returns 402 if insufficient balance, 400/404 for invalid request.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            # Upsert the user (ensure exists)
            cur.execute(
                "SELECT id, coin_balance FROM users WHERE username = 'plutus_user'"
            )
            user_row = cur.fetchone()
            if not user_row:
                raise HTTPException(500, "Default user not found")
            user_id, balance = user_row

            # Look up reward
            cur.execute(
                "SELECT id, name, coin_cost FROM rewards WHERE id = %s",
                (request.reward_id,),
            )
            reward_row = cur.fetchone()
            if not reward_row:
                raise HTTPException(404, "Reward not found")
            reward_id, reward_name, coin_cost = reward_row

            # Check balance (402 = Payment Required)
            if balance < coin_cost:
                raise HTTPException(
                    402,
                    f"Insufficient coins: {balance} < {coin_cost} required for '{reward_name}'",
                )

            # Deduct and log — atomic within this transaction
            new_balance = balance - coin_cost
            cur.execute(
                "UPDATE users SET coin_balance = %s WHERE id = %s",
                (new_balance, user_id),
            )
            cur.execute(
                "INSERT INTO redemptions (user_id, reward_id, coins_spent) VALUES (%s, %s, %s)",
                (user_id, reward_id, coin_cost),
            )
    # Commit happens automatically in get_db() context manager on successful exit

    return RedeemResponse(
        success=True,
        message=f"Redeemed '{reward_name}' for {coin_cost} coins",
        new_balance=new_balance,
    )


@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics():
    """
    Return pre-aggregated analytics.

    Note: The frontend primarily computes charts from in-memory transactions
    for chart-to-table cross-filtering. This endpoint is available as a
    fallback / reference for the full-dataset aggregates.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT  category, SUM(amount), COUNT(*)
                FROM transactions
                GROUP BY category
                ORDER BY SUM(amount) DESC
            """)
            cat_rows = cur.fetchall()

            cur.execute("""
                SELECT
                    to_char(timestamp, 'YYYY-MM') AS month,
                    SUM(amount),
                    COUNT(*)
                FROM transactions
                GROUP BY month
                ORDER BY month
            """)
            month_rows = cur.fetchall()

    category_breakdown = [
        CategoryBreakdown(
            category=row[0],
            total_amount=float(row[1]),
            transaction_count=row[2],
        )
        for row in cat_rows
    ]

    monthly_trend = [
        MonthlyTrend(
            month=row[0],
            total_amount=float(row[1]),
            transaction_count=row[2],
        )
        for row in month_rows
    ]

    return AnalyticsResponse(
        category_breakdown=category_breakdown,
        monthly_trend=monthly_trend,
    )
