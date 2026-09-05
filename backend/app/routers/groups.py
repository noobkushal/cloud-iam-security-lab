from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Group, Policy, User, AuditLog
from app.schemas import GroupRead, GroupCreate
from app.services.security_engine import run_security_analysis

router = APIRouter(prefix="/api/groups", tags=["Groups"])

@router.get("", response_model=List[GroupRead])
def list_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).all()
    res = []
    for g in groups:
        item = GroupRead.model_validate(g)
        item.user_count = len(g.users)
        res.append(item)
    return res

@router.get("/{group_id}", response_model=GroupRead)
def get_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter((Group.id == group_id) | (Group.name == group_id)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    item = GroupRead.model_validate(group)
    item.user_count = len(group.users)
    return item

@router.post("", response_model=GroupRead)
def create_group(payload: GroupCreate, actor: str = "admin", db: Session = Depends(get_db)):
    existing = db.query(Group).filter(Group.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Group name already exists")

    group = Group(
        name=payload.name,
        description=payload.description
    )
    if payload.policy_ids:
        policies = db.query(Policy).filter(Policy.id.in_(payload.policy_ids)).all()
        group.policies.extend(policies)

    db.add(group)
    
    log = AuditLog(
        actor=actor,
        action="iam:GroupCreated",
        resource=f"Group:{payload.name}",
        result="SUCCESS",
        risk_level="INFO"
    )
    db.add(log)
    db.commit()
    db.refresh(group)

    run_security_analysis(db)
    item = GroupRead.model_validate(group)
    item.user_count = 0
    return item

@router.post("/{group_id}/policies/{policy_id}")
def attach_policy_to_group(group_id: str, policy_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    group = db.query(Group).filter((Group.id == group_id) | (Group.name == group_id)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy not in group.policies:
        group.policies.append(policy)
        log = AuditLog(
            actor=actor,
            action="iam:PolicyAttachedToGroup",
            resource=f"Group:{group.name} -> Policy:{policy.name}",
            result="SUCCESS",
            risk_level="HIGH" if '*' in policy.actions else "MEDIUM"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"Policy '{policy.name}' attached to Group '{group.name}'."}

@router.delete("/{group_id}/policies/{policy_id}")
def detach_policy_from_group(group_id: str, policy_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    group = db.query(Group).filter((Group.id == group_id) | (Group.name == group_id)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    policy = db.query(Policy).filter((Policy.id == policy_id) | (Policy.name == policy_id)).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy in group.policies:
        group.policies.remove(policy)
        log = AuditLog(
            actor=actor,
            action="iam:PolicyDetachedFromGroup",
            resource=f"Group:{group.name} -/> Policy:{policy.name}",
            result="SUCCESS",
            risk_level="INFO"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"Policy '{policy.name}' detached from Group '{group.name}'."}

@router.post("/{group_id}/users/{user_id}")
def add_user_to_group(group_id: str, user_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    group = db.query(Group).filter((Group.id == group_id) | (Group.name == group_id)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user not in group.users:
        group.users.append(user)
        log = AuditLog(
            actor=actor,
            action="iam:UserAddedToGroup",
            resource=f"User:{user.username} -> Group:{group.name}",
            result="SUCCESS",
            risk_level="INFO"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"User '{user.username}' added to Group '{group.name}'."}

@router.delete("/{group_id}/users/{user_id}")
def remove_user_from_group(group_id: str, user_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    group = db.query(Group).filter((Group.id == group_id) | (Group.name == group_id)).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    user = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user in group.users:
        group.users.remove(user)
        log = AuditLog(
            actor=actor,
            action="iam:UserRemovedFromGroup",
            resource=f"User:{user.username} -/> Group:{group.name}",
            result="SUCCESS",
            risk_level="INFO"
        )
        db.add(log)
        db.commit()
        run_security_analysis(db)

    return {"message": f"User '{user.username}' removed from Group '{group.name}'."}
