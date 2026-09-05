import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.schemas import SimulationRequest
from app.services.simulator import evaluate_permission
from app.seed_data import seed_database

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    seed_database(session)
    yield session
    session.close()

def test_admin_wildcard_permission_allowed(db_session):
    req = SimulationRequest(
        identity="admin",
        action="storage:DeleteObject",
        resource="production-bucket"
    )
    response = evaluate_permission(db_session, req)
    assert response.decision == "ALLOWED"
    assert response.matching_policy == "AdministratorAccess"
    assert "wildcard" in response.reason.lower() or "granted" in response.reason.lower()

def test_developer_delete_object_allowed_initially(db_session):
    req = SimulationRequest(
        identity="alice-dev",
        action="storage:DeleteObject",
        resource="production-bucket"
    )
    response = evaluate_permission(db_session, req)
    # Alice is in Developers group which initially has storage:DeleteObject
    assert response.decision == "ALLOWED"

def test_unattached_action_denied(db_session):
    req = SimulationRequest(
        identity="charlie-auditor",
        action="storage:DeleteObject",
        resource="production-bucket"
    )
    response = evaluate_permission(db_session, req)
    assert response.decision == "DENIED"
    assert "implicit deny" in response.reason.lower() or "no attached policy" in response.reason.lower()
