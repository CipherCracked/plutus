"""Pytest configuration and fixtures for Plutus tests."""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add server directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Load .env before importing app
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent / ".env")


@pytest.fixture(scope="session")
def test_client():
    """Create a TestClient for the FastAPI app."""
    from main import app
    return TestClient(app)


@pytest.fixture(scope="function")
def clean_test_user():
    """Fixture to track test user emails for cleanup (if needed)."""
    created_emails = []
    yield created_emails
    # Cleanup would go here if we had a delete user endpoint
    # For now, Supabase Auth users persist across test runs