from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Group, Policy, AuditLog
from app.schemas import UserRead, UserCreate
from app.services.security_engine import run_security_analysis

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    res = []
    for u in users:
        risk = 0
        all_policies = list(u.direct_policies)
        for g in u.groups:
            for p in g.policies:
                if p not in all_policies:
                    all_policies.append(p)
        for p in all_policies:
            if '*' in p.actions:
                risk += 40
            elif p.risk_level == 'CRITICAL':
                risk += 35
            elif p.risk_level == 'HIGH':
                risk += 20
            elif p.risk_level == 'MEDIUM':
                risk += 10
            else:
                risk += 5

        read_item = UserRead.model_validate(u)
        read_item.risk_score = min(100, risk)
        res.append(read_item)
    return res

@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    risk = 0
    all_policies = list(user.direct_policies)
    for g in user.groups:
        for p in g.policies:
            if p not in all_policies:
                all_policies.append(p)
    for p in all_policies:
        if '*' in p.actions:
            risk += 40
        elif p.risk_level == 'CRITICAL':
            risk += 35
        elif p.risk_level == 'HIGH':
            risk += 20
        elif p.risk_level == 'MEDIUM':
            risk += 10
        else:
            risk += 5

    read_item = UserRead.model_validate(user)
    read_item.risk_score = min(100, risk)
    return read_item

@router.post("", response_model=UserRead)
def create_user(payload: UserCreate, actor: str = "admin", db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        status=payload.status
    )
    if payload.group_ids:
        groups = db.query(Group).filter(Group.id.in_(payload.group_ids)).all()
        user.groups.extend(groups)
    if payload.policy_ids:
        policies = db.query(Policy).filter(Policy.id.in_(payload.policy_ids)).all()
        user.direct_policies.extend(policies)

    db.add(user)
    
    log = AuditLog(
        actor=actor,
        action="iam:UserCreated",
        resource=f"User:{payload.username}",
        result="SUCCESS",
        risk_level="INFO"
    )
    db.add(log)
    db.commit()
    db.refresh(user)

    run_security_analysis(db)
    read_item = UserRead.model_validate(user)
    read_item.risk_score = 0
    return read_item

@router.post("/{user_id}/policies/{policy_id}")
def attach_policy_to_user(user_id: str, policy_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy not in user.direct_policies:
        user.direct_policies.append(policy)
        log = AuditLog(
            actor=actor,
            action="iam:PolicyAttachedToUser",
            resource=f"User:{user.username} -> Policy:{policy.name}",
            result="SUCCESS",
            risk_level="HIGH" if '*' in policy.actions else "MEDIUM"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"Policy '{policy.name}' successfully attached to user '{user.username}'."}

@router.delete("/{user_id}/policies/{policy_id}")
def detach_policy_from_user(user_id: str, policy_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy in user.direct_policies:
        user.direct_policies.remove(policy)
        log = AuditLog(
            actor=actor,
            action="iam:PolicyDetachedFromUser",
            resource=f"User:{user.username} -/> Policy:{policy.name}",
            result="SUCCESS",
            risk_level="INFO"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"Policy '{policy.name}' successfully detached from user '{user.username}'."}
