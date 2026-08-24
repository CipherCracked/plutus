"""
Pydantic models for the Plutus FastAPI backend.

These mirror the PostgreSQL schema in schema.sql and the TypeScript
interfaces in client/src/lib/api.ts.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class Transaction(BaseModel):
    id: str
    timestamp: str
    merchant: str
    category: str
    amount: float
    currency: str
    status: str
    payment_method: str
    coins_earned: int


class CoinBalance(BaseModel):
    balance: int
    username: str
    total_earned: int
    total_redeemed: int


class Reward(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    coin_cost: int
    reward_type: Optional[str] = None


class RedeemRequest(BaseModel):
    reward_id: int


class RedeemResponse(BaseModel):
    success: bool
    message: str
    new_balance: int


class CategoryBreakdown(BaseModel):
    category: str
    total_amount: float
    transaction_count: int


class MonthlyTrend(BaseModel):
    month: str
    total_amount: float
    transaction_count: int


class AnalyticsResponse(BaseModel):
    category_breakdown: List[CategoryBreakdown]
    monthly_trend: List[MonthlyTrend]
