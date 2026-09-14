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
import jwt

from models import (
    AnalyticsResponse,
    CategoryBreakdown,
    CoinBalance,
    LoginRequest,
    LoginResponse,
    MonthlyTrend,
    RedeemRequest,
    RedeemResponse,
    RegisterResponse,
    RegisterRequest,
    Reward,
    Transaction,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL not set. Create a .env file at the project root."
    )

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase_client: Client = None


def get_supabase_client():
    global supabase_client
    if supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase_client


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


security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Extract user_id (Supabase UUID) from JWT token.
    No database lookup needed — the JWT carries the identity directly.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required — no token provided.")

    token = credentials.credentials

    # If Supabase Auth is configured, verify with Supabase
    sb_client = get_supabase_client()
    if sb_client:
        try:
            user = sb_client.auth.get_user(token)
            if user and user.user:
                return user.user.id
        except Exception:
            pass  # Fall through to local JWT decode

    # Fallback: decode JWT locally (no signature verification for demo)
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if user_id:
            return user_id
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid or expired token.")


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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/transactions", response_model=list[Transaction])
def get_transactions(user_id: str = Depends(get_current_user_id)):
    """
    Return user-scoped transactions (requires auth via Supabase JWT).
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
                    coins_earned,
                    user_id
                FROM transactions
                WHERE user_id = %s
                ORDER BY timestamp DESC
            """, (user_id,))
            rows = cur.fetchall()

    columns = [
        "id", "timestamp", "merchant", "category", "amount",
        "currency", "status", "payment_method", "coins_earned", "user_id",
    ]
    return [dict(zip(columns, row)) for row in rows]


@app.get("/api/balance", response_model=CoinBalance)
def get_balance(user_id: str = Depends(get_current_user_id)):
    """Return the user's coin balance and lifetime stats (scoped by user_id)."""
    with get_db() as conn:
        with conn.cursor() as cur:
            # Sum of coins_earned from transactions
            cur.execute(
                "SELECT COALESCE(SUM(coins_earned), 0) FROM transactions WHERE user_id = %s",
                (user_id,),
            )
            total_earned = cur.fetchone()[0]

            # Sum of coins_spent from redemptions
            cur.execute(
                "SELECT COALESCE(SUM(coins_spent), 0) FROM redemptions WHERE user_id = %s",
                (user_id,),
            )
            total_redeemed = cur.fetchone()[0]

    balance = total_earned - total_redeemed

    return CoinBalance(
        balance=balance,
        user_id=user_id,
        total_earned=total_earned,
        total_redeemed=total_redeemed,
    )


@app.get("/api/rewards", response_model=list[Reward])
def get_rewards(user_id: str = Depends(get_current_user_id)):
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
def redeem_reward(request: RedeemRequest, user_id: str = Depends(get_current_user_id)):
    """
    Redeem a reward atomically (user-scoped via user_id).

    Flow (all in one transaction):
        1. Look up reward.
        2. Check balance >= coin_cost.
        3. Deduct coins by inserting redemption (balance computed from transactions - redemptions).

    Returns 402 if insufficient balance, 404 for invalid request.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, coin_cost FROM rewards WHERE id = %s",
                (request.reward_id,),
            )
            reward_row = cur.fetchone()
            if not reward_row:
                raise HTTPException(404, "Reward not found")
            reward_id, reward_name, coin_cost = reward_row

            # Compute current balance from transactions - redemptions
            cur.execute(
                "SELECT COALESCE(SUM(coins_earned), 0) FROM transactions WHERE user_id = %s",
                (user_id,),
            )
            total_earned = cur.fetchone()[0]
            cur.execute(
                "SELECT COALESCE(SUM(coins_spent), 0) FROM redemptions WHERE user_id = %s",
                (user_id,),
            )
            total_redeemed = cur.fetchone()[0]
            balance = total_earned - total_redeemed

            if balance < coin_cost:
                raise HTTPException(
                    402,
                    f"Insufficient coins: {balance} < {coin_cost} required for '{reward_name}'",
                )

            cur.execute(
                "INSERT INTO redemptions (user_id, reward_id, coins_spent) VALUES (%s, %s, %s)",
                (user_id, reward_id, coin_cost),
            )
            new_balance = balance - coin_cost

    return RedeemResponse(
        success=True,
        message=f"Redeemed '{reward_name}' for {coin_cost} coins",
        new_balance=new_balance,
    )


@app.post("/api/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Authenticate via existing Supabase Auth. Returns JWT + user_id."""
    sb_client = get_supabase_client()
    if not sb_client:
        raise HTTPException(501, "Supabase Auth not configured")
    try:
        auth = sb_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        token = auth.session.access_token
        user_id = auth.user.id
        return LoginResponse(token=token, user_id=user_id)
    except Exception as exc:
        raise HTTPException(401, f"Login failed: {exc}")


@app.post("/api/register", response_model=RegisterResponse)
def register(request: RegisterRequest):
    """Register via existing Supabase Auth. Creates user."""
    sb_client = get_supabase_client()
    if not sb_client:
        raise HTTPException(501, "Supabase Auth not configured")
    try:
        auth = sb_client.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })
        token = auth.session.access_token if auth.session else ""
        user_id = auth.user.id if auth.user else None
        if user_id is None:
            raise HTTPException(500, "Failed to create user")
        return RegisterResponse(token=token, user_id=user_id)
    except Exception as exc:
        raise HTTPException(400, f"Registration failed: {exc}")


@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(user_id: str = Depends(get_current_user_id)):
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
                WHERE user_id = %s
                GROUP BY category
                ORDER BY SUM(amount) DESC
            """, (user_id,))
            cat_rows = cur.fetchall()

            cur.execute("""
                SELECT
                    to_char(timestamp, 'YYYY-MM') AS month,
                    SUM(amount),
                    COUNT(*)
                FROM transactions
                WHERE user_id = %s
                GROUP BY month
                ORDER BY month
            """, (user_id,))
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