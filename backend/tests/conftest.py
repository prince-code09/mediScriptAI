import pytest
from typing import Generator
from fastapi.testclient import TestClient
from app.main import app
from app.db.memory_store import memory_store

@pytest.fixture(autouse=True)
def reset_store():
    """Resets memory store before each test run."""
    memory_store.reset()
    yield

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def auth_headers() -> dict:
    """Returns valid bearer token headers for Dr. Rajesh Sharma (default doctor)."""
    return {"Authorization": "Bearer test-token-dr-sharma"}

@pytest.fixture
def other_doctor_headers() -> dict:
    """Returns bearer token headers for a different doctor in another clinic."""
    return {"Authorization": "Bearer test-token-other-doctor"}
