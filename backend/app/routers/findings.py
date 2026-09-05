from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SecurityFinding, Policy, Group, AuditLog
from app.schemas import SecurityFindingRead
from app.services.security_engine import run_security_analysis, calculate_security_score

router = APIRouter(prefix="/api/findings", tags=["Findings"])

@router.get("", response_model=List[SecurityFindingRead])
def list_findings(db: Session = Depends(get_db)):
    # Fresh engine scan
    run_security_analysis(db)
    return db.query(SecurityFinding).order_by(SecurityFinding.created_at.desc()).all()

@router.get("/{finding_id}", response_model=SecurityFindingRead)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(SecurityFinding).filter(SecurityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Security finding not found")
    return finding

@router.post("/{finding_id}/remediate")
def remediate_finding(finding_id: str, actor: str = "admin", db: Session = Depends(get_db)):
    """
    Remediates a specific security finding:
    1. Updates finding status to REMEDIATED.
    2. Modifies offending policy/group attachment to implement Least Privilege.
    3. Recalculates overall Security Score.
    4. Records Audit Log entry.
    """
    finding = db.query(SecurityFinding).filter(SecurityFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if finding.status == 'REMEDIATED':
        return {
            "message": "Finding is already remediated.",
            "finding": SecurityFindingRead.model_validate(finding),
            "new_security_score": calculate_security_score(db)
        }

    # 1. Update finding status
    finding.status = 'REMEDIATED'

    # 2. Automated Remediation of underlying policy/group
    remediation_note = "Remediated via automated security policy hardening."

    # Fix Developer access object deletion finding
    if "developer" in finding.title.lower() or "developeraccess" in finding.affected_entity.lower():
        dev_pol = db.query(Policy).filter(Policy.name == "DeveloperAccess").first()
        if dev_pol:
            dev_pol.actions = ["storage:GetObject", "storage:PutObject", "storage:ListBucket"]
            dev_pol.risk_level = "LOW"
            remediation_note = "Removed 'storage:DeleteObject' permission from DeveloperAccess policy."
            
    # Fix Wildcard Administrator permissions
    elif "administrator" in finding.title.lower() or "administratoraccess" in finding.affected_entity.lower():
        admin_pol = db.query(Policy).filter(Policy.name == "AdministratorAccess").first()
        if admin_pol:
            admin_pol.actions = [
                "compute:Describe*", "storage:GetObject", "storage:PutObject",
                "iam:Get*", "iam:List*", "security:AuditLog"
            ]
            admin_pol.resources = ["arn:aws:cloudlab:prod:*"]
            admin_pol.risk_level = "MEDIUM"
            remediation_note = "Scoped AdministratorAccess from wildcard (*:*) to structured service ARNs."

    # Fix Auditor Admin Policy finding
    elif "auditor" in finding.title.lower():
        auditor_grp = db.query(Group).filter(Group.name == "Auditors").first()
        if auditor_grp:
            # Remove any high risk policies
            auditor_grp.policies = [p for p in auditor_grp.policies if p.name not in ["AdministratorAccess", "StorageAdmin"]]
            remediation_note = "Removed administrative policy attachments from Auditors group."

    # 3. Create Audit Log
    log = AuditLog(
        actor=actor,
        action="iam:FindingRemediated",
        resource=f"Finding:{finding.title}",
        result="SUCCESS",
        ip_address="127.0.0.1",
        risk_level="INFO"
    )
    db.add(log)
    db.commit()

    # 4. Recalculate score
    new_score = calculate_security_score(db)

    return {
        "message": f"Finding '{finding.title}' successfully remediated.",
        "note": remediation_note,
        "finding": SecurityFindingRead.model_validate(finding),
        "new_security_score": new_score
    }
