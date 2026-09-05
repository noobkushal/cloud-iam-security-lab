from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Group, Policy, Resource, SecurityFinding, AuditLog
from app.schemas import DashboardStats, AuditLogRead, SecurityFindingRead
from app.services.security_engine import calculate_security_score, run_security_analysis

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStats)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Returns aggregated security metrics, findings, score, and recent audit events."""
    # Ensure findings are fresh
    score, all_findings = run_security_analysis(db)

    total_users = db.query(User).count()
    total_groups = db.query(Group).count()
    total_policies = db.query(Policy).count()
    total_resources = db.query(Resource).count()

    open_findings = [f for f in all_findings if f.status == 'OPEN']
    critical_findings = len([f for f in open_findings if f.severity == 'CRITICAL'])
    high_findings = len([f for f in open_findings if f.severity == 'HIGH'])
    medium_findings = len([f for f in open_findings if f.severity == 'MEDIUM'])
    low_findings = len([f for f in open_findings if f.severity == 'LOW'])

    # Overprivileged Identities (users with CRITICAL or HIGH risk policies attached directly or via group)
    overprivileged = []
    users = db.query(User).all()
    for user in users:
        risk_policies = []
        # check direct policies
        for p in user.direct_policies:
            if p.risk_level in ['CRITICAL', 'HIGH'] or '*' in p.actions:
                risk_policies.append(p.name)
        # check group policies
        for g in user.groups:
            for p in g.policies:
                if (p.risk_level in ['CRITICAL', 'HIGH'] or '*' in p.actions) and p.name not in risk_policies:
                    risk_policies.append(p.name)
        if risk_policies:
            overprivileged.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "risk_policies": risk_policies,
                "groups": [g.name for g in user.groups]
            })

    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()

    return DashboardStats(
        security_score=score,
        total_users=total_users,
        total_groups=total_groups,
        total_policies=total_policies,
        total_resources=total_resources,
        critical_findings=critical_findings,
        high_findings=high_findings,
        medium_findings=medium_findings,
        low_findings=low_findings,
        overprivileged_identities=overprivileged,
        recent_audit_events=[AuditLogRead.model_validate(l) for l in recent_logs],
        security_findings=[SecurityFindingRead.model_validate(f) for f in all_findings]
    )
