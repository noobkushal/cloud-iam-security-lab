import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import User, Group, Policy, Resource, SecurityFinding
from app.services.security_engine import run_security_analysis, calculate_security_score
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

def test_security_scan_detects_wildcard_admin(db_session):
    score, findings = run_security_analysis(db_session)
    
    admin_findings = [f for f in findings if "wildcard administrator" in f.title.lower()]
    assert len(admin_findings) > 0
    assert admin_findings[0].severity == "CRITICAL"
    assert admin_findings[0].status == "OPEN"

def test_security_scan_detects_developer_delete_permission(db_session):
    score, findings = run_security_analysis(db_session)
    
    dev_findings = [f for f in findings if "developer group has unnecessary object deletion" in f.title.lower()]
    assert len(dev_findings) > 0
    assert dev_findings[0].severity == "HIGH"

def test_security_score_calculation(db_session):
    score = calculate_security_score(db_session)
    # Starts at 100, deduction for CRITICAL (-25) and HIGH (-15) findings -> score should be <= 60
    assert score < 100
    assert score >= 0

def test_finding_remediation_workflow(db_session):
    score_before, findings_before = run_security_analysis(db_session)
    open_before = len([f for f in findings_before if f.status == "OPEN"])
    
    # Find Developer group deletion finding
    finding = db_session.query(SecurityFinding).filter(
        SecurityFinding.title.ilike("%developer group%")
    ).first()
    
    assert finding is not None
    assert finding.status == "OPEN"
    
    # Remediate finding
    finding.status = "REMEDIATED"
    dev_pol = db_session.query(Policy).filter(Policy.name == "DeveloperAccess").first()
    dev_pol.actions = ["storage:GetObject", "storage:PutObject"]
    db_session.commit()
    
    score_after = calculate_security_score(db_session)
    open_after = db_session.query(SecurityFinding).filter(SecurityFinding.status == "OPEN").count()
    
    assert open_after < open_before
    assert score_after >= score_before

