import uuid
from datetime import datetime
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.models import Policy, Group, User, Resource, SecurityFinding, AuditLog

SEVERITY_DEDUCTIONS = {
    'CRITICAL': 25,
    'HIGH': 15,
    'MEDIUM': 8,
    'LOW': 3
}

def calculate_security_score(db: Session) -> int:
    """Calculates dynamic security score starting at 100 based on open findings."""
    open_findings = db.query(SecurityFinding).filter(SecurityFinding.status == 'OPEN').all()
    score = 100
    for finding in open_findings:
        deduction = SEVERITY_DEDUCTIONS.get(finding.severity, 0)
        score -= deduction
    return max(0, score)

def run_security_analysis(db: Session) -> Tuple[int, List[SecurityFinding]]:
    """
    Analyzes all policies, groups, users, and resources in the database.
    Generates security findings for insecure configurations and updates findings list.
    Returns (security_score, list_of_findings).
    """
    # Identify existing findings to avoid duplicate title & affected_entity creation if OPEN
    existing_open = {
        (f.title, f.affected_entity): f
        for f in db.query(SecurityFinding).filter(SecurityFinding.status == 'OPEN').all()
    }
    
    new_findings: List[SecurityFinding] = []

    def add_finding(
        severity: str,
        title: str,
        description: str,
        affected_entity: str,
        problem: str,
        why_it_matters: str,
        current_permission: str,
        recommended_permission: str,
        recommendation: str
    ):
        key = (title, affected_entity)
        if key not in existing_open:
            finding = SecurityFinding(
                id=f"fnd_{uuid.uuid4().hex[:8]}",
                severity=severity,
                title=title,
                description=description,
                affected_entity=affected_entity,
                problem=problem,
                why_it_matters=why_it_matters,
                current_permission=current_permission,
                recommended_permission=recommended_permission,
                recommendation=recommendation,
                status='OPEN',
                created_at=datetime.utcnow()
            )
            db.add(finding)
            new_findings.append(finding)

    # Fetch entities
    policies = db.query(Policy).all()
    groups = db.query(Group).all()
    users = db.query(User).all()
    resources = db.query(Resource).all()

    # Rule 1: Detect Wildcard Administrator Permissions (*, *)
    for policy in policies:
        if policy.effect == 'ALLOW':
            has_action_wildcard = '*' in policy.actions or any(a.endswith(':*') for a in policy.actions)
            has_resource_wildcard = '*' in policy.resources or any(r == '*' for r in policy.resources)

            if '*' in policy.actions and '*' in policy.resources:
                add_finding(
                    severity='CRITICAL',
                    title='Wildcard administrator permissions detected.',
                    description=f"Policy '{policy.name}' grants full wildcard access (*:*) across all resources.",
                    affected_entity=f"Policy: {policy.name}",
                    problem=f"Policy '{policy.name}' contains Action: [*] and Resource: [*].",
                    why_it_matters="Full administrative privileges violate the Principle of Least Privilege and allow uncontrolled modification or deletion of any cloud resource.",
                    current_permission="Effect: ALLOW | Action: * | Resource: *",
                    recommended_permission="Effect: ALLOW | Scope actions to specific services and resources.",
                    recommendation="Restrict permissions to granular required actions and specific resource ARNs."
                )
            elif has_action_wildcard and has_resource_wildcard:
                add_finding(
                    severity='HIGH',
                    title='Broad service wildcard policy detected.',
                    description=f"Policy '{policy.name}' grants wildcard service permissions across all resources.",
                    affected_entity=f"Policy: {policy.name}",
                    problem=f"Policy contains wildcard action patterns ({', '.join(policy.actions)}) targeting wildcard resources.",
                    why_it_matters="Broad wildcards increase attack blast radius if credentials assigned this policy are compromised.",
                    current_permission=f"Actions: {policy.actions} | Resources: {policy.resources}",
                    recommended_permission="Replace wildcard actions with specific API permissions.",
                    recommendation="Audit policy usage and remove unused wildcard capabilities."
                )

    # Rule 2: Excessive Destructive Permissions on Developer Group
    for group in groups:
        if group.name.lower() in ['developers', 'devs']:
            for policy in group.policies:
                destructive_actions = ['storage:DeleteObject', 'storage:*', '*']
                found_destructive = [a for a in policy.actions if a in destructive_actions or a == '*']
                if found_destructive:
                    add_finding(
                        severity='HIGH',
                        title='Developer group has unnecessary object deletion permission.',
                        description=f"Group '{group.name}' is assigned policy '{policy.name}' which grants destructive deletion rights ('{', '.join(found_destructive)}').",
                        affected_entity=f"Group: {group.name}",
                        problem=f"Developers group has policy '{policy.name}' containing dangerous actions: {found_destructive}.",
                        why_it_matters="Developers typically require read/write access for testing, but destructive deletion permissions on production buckets create severe data loss risks.",
                        current_permission=f"Current: {', '.join(policy.actions)}",
                        recommended_permission="Recommended: storage:GetObject, storage:PutObject",
                        recommendation="Remove delete permissions from Developer group and grant read/write access only."
                    )

    # Rule 3: Policy Assigned to Inappropriate Groups (e.g. Admin policy on Auditor group)
    for group in groups:
        if 'auditor' in group.name.lower() or 'guest' in group.name.lower():
            for policy in group.policies:
                if policy.name in ['AdministratorAccess', 'StorageAdmin'] or '*' in policy.actions:
                    add_finding(
                        severity='HIGH',
                        title='Administrative policy assigned to inappropriate group.',
                        description=f"Auditor group '{group.name}' is assigned high-privilege policy '{policy.name}'.",
                        affected_entity=f"Group: {group.name}",
                        problem=f"Auditors should have read-only inspection access, but are assigned administrative policy '{policy.name}'.",
                        why_it_matters="Separation of duties breach. Auditors could modify cloud infrastructure.",
                        current_permission=f"Policy: {policy.name}",
                        recommended_permission="Recommended Policy: SecurityAuditor or StorageReadOnly",
                        recommendation="Detach administrative policies from auditor groups and assign SecurityAuditor."
                    )

    # Rule 4: Sensitive Resource Unrestricted Access
    sensitive_resources = [r for r in resources if r.sensitivity in ['CONFIDENTIAL', 'RESTRICTED']]
    for res in sensitive_resources:
        for policy in policies:
            if '*' in policy.resources or res.name in policy.resources:
                if '*' in policy.actions or any(a.startswith('storage:') for a in policy.actions):
                    if policy.risk_level in ['CRITICAL', 'HIGH'] and res.sensitivity == 'RESTRICTED':
                        add_finding(
                            severity='HIGH',
                            title=f"Sensitive resource '{res.name}' exposed to broad policy.",
                            description=f"Restricted resource '{res.name}' ({res.environment}) is accessible via broad policy '{policy.name}'.",
                            affected_entity=f"Resource: {res.name}",
                            problem=f"Sensitive {res.resource_type} '{res.name}' can be accessed or modified via policy '{policy.name}'.",
                            why_it_matters="Unrestricted permissions on sensitive logs or production storage buckets expose confidential data to unauthorized access or exfiltration.",
                            current_permission=f"Policy: {policy.name} | Resource: {policy.resources}",
                            recommended_permission=f"Restrict access specifically to authorized security roles.",
                            recommendation="Implement strict Resource-level permissions and audit logging."
                        )

    # Rule 5: Overprivileged User (Direct Policies bypassing Groups)
    for user in users:
        if user.direct_policies:
            for pol in user.direct_policies:
                if '*' in pol.actions or pol.risk_level in ['CRITICAL', 'HIGH']:
                    add_finding(
                        severity='MEDIUM',
                        title=f"User '{user.username}' has direct high-risk policy attachment.",
                        description=f"User '{user.username}' is directly attached high-risk policy '{pol.name}' instead of inheriting permissions via RBAC group.",
                        affected_entity=f"User: {user.username}",
                        problem=f"Direct policy attachment breaks Role-Based Access Control (RBAC) governance.",
                        why_it_matters="Directly attaching policies to individual users leads to privilege drift and auditing complexity.",
                        current_permission=f"Direct Policy: {pol.name}",
                        recommended_permission="Assign user to appropriate RBAC Group.",
                        recommendation="Detach inline/direct policy from user and assign user to standard group."
                    )

    db.commit()
    score = calculate_security_score(db)
    all_findings = db.query(SecurityFinding).order_by(SecurityFinding.created_at.desc()).all()
    return score, all_findings
