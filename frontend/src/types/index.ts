export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingStatus = 'OPEN' | 'REMEDIATED';

export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  actions: string[];
  resources: string[];
  risk_level: RiskLevel;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  policies: Policy[];
  user_count: number;
}

export interface GroupCreatePayload {
  name: string;
  description?: string;
  policy_ids?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  last_login: string;
  groups: Group[];
  direct_policies: Policy[];
  risk_score: number;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  status?: string;
  group_ids?: string[];
  policy_ids?: string[];
}

export interface Resource {
  id: string;
  name: string;
  resource_type: 'S3_BUCKET' | 'COMPUTE_INSTANCE' | 'LOG_GROUP' | 'DATABASE';
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  sensitivity: 'CONFIDENTIAL' | 'RESTRICTED' | 'INTERNAL' | 'PUBLIC';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'ALLOWED' | 'DENIED';
  ip_address: string;
  risk_level: RiskLevel;
}

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affected_entity: string;
  problem?: string;
  why_it_matters?: string;
  current_permission?: string;
  recommended_permission?: string;
  recommendation?: string;
  status: FindingStatus;
  created_at: string;
}

export interface SimulationRequest {
  identity: string;
  action: string;
  resource: string;
  actor_context?: string;
}

export interface PolicyEvaluationDetail {
  policy_name: string;
  effect: string;
  actions: string[];
  resources: string[];
  matched: boolean;
  reason: string;
}

export interface SimulationResponse {
  decision: 'ALLOWED' | 'DENIED';
  reason: string;
  evaluated_policies: string[];
  matching_policy?: string;
  policy_details: PolicyEvaluationDetail[];
  user?: string;
  action: string;
  resource: string;
}

export interface OverprivilegedIdentity {
  id: string;
  username: string;
  email: string;
  risk_policies: string[];
  groups: string[];
}

export interface DashboardStats {
  security_score: number;
  total_users: number;
  total_groups: number;
  total_policies: number;
  total_resources: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  overprivileged_identities: OverprivilegedIdentity[];
  recent_audit_events: AuditLog[];
  security_findings: SecurityFinding[];
}
