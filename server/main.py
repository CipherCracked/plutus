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
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv
from supabase import create_client, Client

from models import (
    AnalyticsResponse,
    CategoryBreakdown,
    CoinBalance,
    LoginRequest,
    LoginResponse,
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

# CORS — open to all origins: public demo API, no credentials involved,
# and Vercel mints a new origin per deployment. To restrict, set
# ALLOWED_ORIGINS (comma-separated) in the environment.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer(auto_error=False)


supabase_client: Client = None


def get_supabase_client():
    global supabase_client
    if supabase_client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if url and key:
            supabase_client = create_client(url, key)
        else:
            # Fallback for demo: no external auth required
            supabase_client = None
    return supabase_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> int:
    """
    Return user profile id from Supabase Auth (existing auth service).
    Falls back to demo user (`plutus_user`) when no valid session or token.
    """
    user_profile_id = None
    supabase_client = get_supabase_client()

    if supabase_client and credentials:
        try:
            # Use existing Supabase auth session/token mechanism
            # Instead of reinventing JWT decode with python-jose
            user = supabase_client.auth.get_user(credentials.credentials)
            if user and user.user:
                user_sub = user.user.id
                with get_db() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT id FROM user_profiles WHERE user_id = %s",
                            (user_sub,),
                        )
                        row = cur.fetchone()
                        if row:
                            user_profile_id = row[0]
        except Exception:
            pass  # Fall back to demo user

    if user_profile_id is None:
        raise HTTPException(status_code=401, detail="Authentication required — no valid Supabase session or token provided.")

    return user_profile_id


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
def get_balance(user_profile_id: int = Depends(get_current_user)):
    """Return the user's coin balance and lifetime stats (scoped by profile)."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT coin_balance FROM user_profiles WHERE id = %s",
                (user_profile_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(500, "User profile not found — run seed.py first")
            balance = row[0]

            # Get username from linked users table for display
            cur.execute(
                "SELECT u.username FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE up.id = %s",
                (user_profile_id,),
            )
            username_row = cur.fetchone()
            username = username_row[0] if username_row else "plutus_user"

            # Total earned (user-scoped transactions)
            cur.execute(
                "SELECT COALESCE(SUM(coins_earned), 0) FROM transactions WHERE user_id = (SELECT user_id FROM user_profiles WHERE id = %s)",
                (user_profile_id,),
            )
            total_earned = cur.fetchone()[0]

            # Total redeemed (user-scoped redemptions via user_profiles FK)
            cur.execute(
                "SELECT COALESCE(SUM(coins_spent), 0) FROM redemptions WHERE user_profile_id = %s",
                (user_profile_id,),
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
def redeem_reward(request: RedeemRequest, user_profile_id: int = Depends(get_current_user)):
    """
    Redeem a reward atomically (user-scoped via user_profile_id).

    Flow (all in one transaction):
        1. Look up user profile and reward.
        2. Check balance >= coin_cost.
        3. Deduct coins from user_profiles, log redemption via user_profile_id.

    Returns 402 if insufficient balance, 404 for invalid request.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, coin_balance FROM user_profiles WHERE id = %s",
                (user_profile_id,),
            )
            profile_row = cur.fetchone()
            if not profile_row:
                raise HTTPException(500, "User profile not found — run seed.py first")
            profile_id, balance = profile_row

            cur.execute(
                "SELECT id, name, coin_cost FROM rewards WHERE id = %s",
                (request.reward_id,),
            )
            reward_row = cur.fetchone()
            if not reward_row:
                raise HTTPException(404, "Reward not found")
            reward_id, reward_name, coin_cost = reward_row

            if balance < coin_cost:
                raise HTTPException(
                    402,
                    f"Insufficient coins: {balance} < {coin_cost} required for '{reward_name}'",
                )

            new_balance = balance - coin_cost
            cur.execute(
                "UPDATE user_profiles SET coin_balance = %s WHERE id = %s",
                (new_balance, profile_id),
            )
            cur.execute(
                "INSERT INTO redemptions (user_profile_id, reward_id, coins_spent) VALUES (%s, %s, %s)",
                (profile_id, reward_id, coin_cost),
            )
    return RedeemResponse(
        success=True,
        message=f"Redeemed '{reward_name}' for {coin_cost} coins",
        new_balance=new_balance,
    )


@app.post("/api/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Authenticate via existing Supabase Auth. Returns JWT + profile id."""
    supabase_client = get_supabase_client()
    if not supabase_client:
        raise HTTPException(501, "Supabase Auth not configured")
    try:
        auth = supabase_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        token = auth.session.access_token
        user_sub = auth.user.id
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM user_profiles WHERE user_id = %s",
                    (str(user_sub),),
                )
                row = cur.fetchone()
                profile_id = row[0] if row else None
        if profile_id is None:
            raise HTTPException(404, "User profile not found")
        return LoginResponse(token=token, user_profile_id=profile_id)
    except Exception as exc:
        raise HTTPException(401, f"Login failed: {exc}")


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
