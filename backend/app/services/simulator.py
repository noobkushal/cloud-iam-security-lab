import re
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import User, Group, Policy, AuditLog, SecurityFinding
from app.schemas import SimulationRequest, SimulationResponse, PolicyEvaluationDetail

def match_pattern(pattern: str, target: str) -> bool:
    """Matches IAM wildcard pattern (e.g. 'storage:*', '*') against target (e.g. 'storage:DeleteObject')."""
    if pattern == '*':
        return True
    if pattern.endswith('*'):
        prefix = pattern[:-1]
        return target.startswith(prefix)
    return pattern.lower() == target.lower()

def evaluate_permission(db: Session, req: SimulationRequest) -> SimulationResponse:
    """
    Evaluates permission access for a given identity, action, and resource.
    Resolves RBAC relationships (User -> Groups -> Policies & User -> Direct Policies).
    """
    user = db.query(User).filter(User.username == req.identity).first()
    group = None
    if not user:
        group = db.query(Group).filter(Group.name == req.identity).first()

    if not user and not group:
        return SimulationResponse(
            decision="DENIED",
            reason=f"Identity '{req.identity}' not found in IAM directory.",
            evaluated_policies=[],
            matching_policy=None,
            policy_details=[],
            user=req.identity,
            action=req.action,
            resource=req.resource
        )

    # Collect all policies
    collected_policies: List[Policy] = []
    if user:
        # Direct policies
        for p in user.direct_policies:
            if p not in collected_policies:
                collected_policies.append(p)
        # Group policies
        for g in user.groups:
            for p in g.policies:
                if p not in collected_policies:
                    collected_policies.append(p)
    elif group:
        collected_policies = list(group.policies)

    policy_names = [p.name for p in collected_policies]
    policy_details: List[PolicyEvaluationDetail] = []

    if not collected_policies:
        res = SimulationResponse(
            decision="DENIED",
            reason=f"Identity '{req.identity}' has no attached IAM policies.",
            evaluated_policies=[],
            matching_policy=None,
            policy_details=[],
            user=req.identity,
            action=req.action,
            resource=req.resource
        )
        _log_simulation(db, req, res)
        return res

    # Phase 1: Check Explicit DENY
    for policy in collected_policies:
        if policy.effect == 'DENY':
            action_match = any(match_pattern(act, req.action) for act in policy.actions)
            resource_match = any(match_pattern(res, req.resource) for res in policy.resources)
            if action_match and resource_match:
                detail = PolicyEvaluationDetail(
                    policy_name=policy.name,
                    effect="DENY",
                    actions=policy.actions,
                    resources=policy.resources,
                    matched=True,
                    reason=f"Explicit DENY matched in policy '{policy.name}'."
                )
                policy_details.append(detail)
                
                response = SimulationResponse(
                    decision="DENIED",
                    reason=f"Access explicitly DENIED by policy '{policy.name}'. Explicit DENY overrides all ALLOW statements.",
                    evaluated_policies=policy_names,
                    matching_policy=policy.name,
                    policy_details=policy_details,
                    user=req.identity,
                    action=req.action,
                    resource=req.resource
                )
                _log_simulation(db, req, response)
                return response

    # Phase 2: Check ALLOW statements
    matching_allow_policy: Optional[Policy] = None
    for policy in collected_policies:
        if policy.effect == 'ALLOW':
            action_match = any(match_pattern(act, req.action) for act in policy.actions)
            resource_match = any(match_pattern(res, req.resource) for res in policy.resources)
            
            matched = action_match and resource_match
            reason_text = (
                f"Policy '{policy.name}' granted access." if matched
                else f"Policy '{policy.name}' did not match action or resource requirements."
            )
            
            policy_details.append(PolicyEvaluationDetail(
                policy_name=policy.name,
                effect="ALLOW",
                actions=policy.actions,
                resources=policy.resources,
                matched=matched,
                reason=reason_text
            ))

            if matched and not matching_allow_policy:
                matching_allow_policy = policy

    if matching_allow_policy:
        reason_str = (
            f"Granted by policy '{matching_allow_policy.name}'."
            if '*' not in matching_allow_policy.actions
            else f"Granted by policy '{matching_allow_policy.name}' which contains wildcard permissions."
        )
        response = SimulationResponse(
            decision="ALLOWED",
            reason=reason_str,
            evaluated_policies=policy_names,
            matching_policy=matching_allow_policy.name,
            policy_details=policy_details,
            user=req.identity,
            action=req.action,
            resource=req.resource
        )
        _log_simulation(db, req, response)
        return response

    # Default Deny
    response = SimulationResponse(
        decision="DENIED",
        reason=f"Implicit DENY: No attached policy grants action '{req.action}' on resource '{req.resource}'.",
        evaluated_policies=policy_names,
        matching_policy=None,
        policy_details=policy_details,
        user=req.identity,
        action=req.action,
        resource=req.resource
    )
    _log_simulation(db, req, response)
    return response

def _log_simulation(db: Session, req: SimulationRequest, res: SimulationResponse):
    """Creates audit log entry for permission evaluation event."""
    log = AuditLog(
        actor=req.actor_context or req.identity,
        action="iam:SimulatorEvaluated",
        resource=f"{req.action} -> {req.resource}",
        result=res.decision,
        ip_address="127.0.0.1",
        risk_level="HIGH" if res.decision == "ALLOWED" and "*" in str(res.reason) else "INFO"
    )
    db.add(log)
    db.commit()
