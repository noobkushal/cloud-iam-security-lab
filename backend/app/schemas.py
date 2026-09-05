from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Base Policy Schemas
class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    effect: str = "ALLOW"
    actions: List[str]
    resources: List[str]
    risk_level: str = "LOW"

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    effect: Optional[str] = None
    actions: Optional[List[str]] = None
    resources: Optional[List[str]] = None
    risk_level: Optional[str] = None

class PolicyRead(PolicyBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

# Group Schemas
class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    policy_ids: Optional[List[str]] = []

class GroupRead(GroupBase):
    id: str
    policies: List[PolicyRead] = []
    user_count: int = 0
    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    status: str = "ACTIVE"

class UserCreate(UserBase):
    group_ids: Optional[List[str]] = []
    policy_ids: Optional[List[str]] = []

class UserRead(UserBase):
    id: str
    created_at: datetime
    last_login: datetime
    groups: List[GroupRead] = []
    direct_policies: List[PolicyRead] = []
    risk_score: int = 0
    model_config = ConfigDict(from_attributes=True)

# Resource Schemas
class ResourceBase(BaseModel):
    name: str
    resource_type: str
    environment: str = "PRODUCTION"
    sensitivity: str = "CONFIDENTIAL"

class ResourceCreate(ResourceBase):
    pass

class ResourceRead(ResourceBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

# AuditLog Schemas
class AuditLogBase(BaseModel):
    actor: str
    action: str
    resource: str
    result: str
    ip_address: str = "127.0.0.1"
    risk_level: str = "INFO"

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogRead(AuditLogBase):
    id: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# SecurityFinding Schemas
class SecurityFindingBase(BaseModel):
    severity: str
    title: str
    description: str
    affected_entity: str
    problem: Optional[str] = None
    why_it_matters: Optional[str] = None
    current_permission: Optional[str] = None
    recommended_permission: Optional[str] = None
    recommendation: Optional[str] = None

class SecurityFindingRead(SecurityFindingBase):
    id: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Permission Simulator Schemas
class SimulationRequest(BaseModel):
    identity: str # username or group name
    action: str
    resource: str
    actor_context: Optional[str] = "admin" # for audit logging

class PolicyEvaluationDetail(BaseModel):
    policy_name: str
    effect: str
    actions: List[str]
    resources: List[str]
    matched: bool
    reason: str

class SimulationResponse(BaseModel):
    decision: str # ALLOWED or DENIED
    reason: str
    evaluated_policies: List[str]
    matching_policy: Optional[str] = None
    policy_details: List[PolicyEvaluationDetail] = []
    user: Optional[str] = None
    action: str
    resource: str

# Dashboard Overview Schema
class DashboardStats(BaseModel):
    security_score: int
    total_users: int
    total_groups: int
    total_policies: int
    total_resources: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    overprivileged_identities: List[dict]
    recent_audit_events: List[AuditLogRead]
    security_findings: List[SecurityFindingRead]
