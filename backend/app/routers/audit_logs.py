from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogRead

router = APIRouter(prefix="/api/audit-logs", tags=["AuditLogs"])

@router.get("", response_model=List[AuditLogRead])
def list_audit_logs(
    actor: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if actor:
        query = query.filter(AuditLog.actor.ilike(f"%{actor}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if result:
        query = query.filter(AuditLog.result == result)
    if risk_level:
        query = query.filter(AuditLog.risk_level == risk_level)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (AuditLog.actor.ilike(search_pattern)) |
            (AuditLog.action.ilike(search_pattern)) |
            (AuditLog.resource.ilike(search_pattern)) |
            (AuditLog.result.ilike(search_pattern))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
