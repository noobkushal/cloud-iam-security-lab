from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Policy, AuditLog
from app.schemas import PolicyRead, PolicyCreate, PolicyUpdate
from app.services.security_engine import run_security_analysis

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.get("", response_model=List[PolicyRead])
def list_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()

@router.get("/{policy_id}", response_model=PolicyRead)
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("", response_model=PolicyRead)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    existing = db.query(Policy).filter(Policy.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy name already exists")

    policy = Policy(
        name=payload.name,
        description=payload.description,
        effect=payload.effect,
        actions=payload.actions,
        resources=payload.resources,
        risk_level=payload.risk_level
    )
    db.add(policy)

    log = AuditLog(
        actor="admin",
        action="iam:PolicyCreated",
        resource=f"Policy:{payload.name}",
        result="SUCCESS",
        risk_level="MEDIUM"
    )
    db.add(log)
    db.commit()
    db.refresh(policy)

    # Re-evaluate security score
    run_security_analysis(db)
    return policy

@router.put("/{policy_id}", response_model=PolicyRead)
def update_policy(policy_id: str, payload: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if payload.name:
        policy.name = payload.name
    if payload.description is not None:
        policy.description = payload.description
    if payload.effect:
        policy.effect = payload.effect
    if payload.actions is not None:
        policy.actions = payload.actions
    if payload.resources is not None:
        policy.resources = payload.resources
    if payload.risk_level:
        policy.risk_level = payload.risk_level

    log = AuditLog(
        actor="admin",
        action="iam:PolicyModified",
        resource=f"Policy:{policy.name}",
        result="SUCCESS",
        risk_level="HIGH" if '*' in policy.actions else "INFO"
    )
    db.add(log)
    db.commit()
    db.refresh(policy)

    # Re-evaluate security score
    run_security_analysis(db)
    return policy
