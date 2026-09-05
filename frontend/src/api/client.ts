/// <reference types="vite/client" />
import {
  DashboardStats,
  User,
  UserCreatePayload,
  Group,
  GroupCreatePayload,
  Policy,
  Resource,
  SecurityFinding,
  AuditLog,
  SimulationRequest,
  SimulationResponse
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => fetchJson<DashboardStats>('/dashboard'),

  getUsers: () => fetchJson<User[]>('/users'),
  getUser: (id: string) => fetchJson<User>(`/users/${id}`),
  createUser: (data: UserCreatePayload, actor: string = 'admin') => fetchJson<User>(`/users?actor=${encodeURIComponent(actor)}`, { method: 'POST', body: JSON.stringify(data) }),
  attachPolicyToUser: (userId: string, policyId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/users/${userId}/policies/${policyId}?actor=${encodeURIComponent(actor)}`, { method: 'POST' }),
  detachPolicyFromUser: (userId: string, policyId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/users/${userId}/policies/${policyId}?actor=${encodeURIComponent(actor)}`, { method: 'DELETE' }),

  getGroups: () => fetchJson<Group[]>('/groups'),
  getGroup: (id: string) => fetchJson<Group>(`/groups/${id}`),
  createGroup: (data: GroupCreatePayload, actor: string = 'admin') => fetchJson<Group>(`/groups?actor=${encodeURIComponent(actor)}`, { method: 'POST', body: JSON.stringify(data) }),
  attachPolicyToGroup: (groupId: string, policyId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/groups/${groupId}/policies/${policyId}?actor=${encodeURIComponent(actor)}`, { method: 'POST' }),
  detachPolicyFromGroup: (groupId: string, policyId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/groups/${groupId}/policies/${policyId}?actor=${encodeURIComponent(actor)}`, { method: 'DELETE' }),
  addUserToGroup: (groupId: string, userId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/groups/${groupId}/users/${userId}?actor=${encodeURIComponent(actor)}`, { method: 'POST' }),
  removeUserFromGroup: (groupId: string, userId: string, actor: string = 'admin') => 
    fetchJson<{ message: string }>(`/groups/${groupId}/users/${userId}?actor=${encodeURIComponent(actor)}`, { method: 'DELETE' }),

  getPolicies: () => fetchJson<Policy[]>('/policies'),
  getPolicy: (id: string) => fetchJson<Policy>(`/policies/${id}`),
  createPolicy: (data: Partial<Policy>) => fetchJson<Policy>('/policies', { method: 'POST', body: JSON.stringify(data) }),
  updatePolicy: (id: string, data: Partial<Policy>) => fetchJson<Policy>(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getResources: () => fetchJson<Resource[]>('/resources'),

  getFindings: () => fetchJson<SecurityFinding[]>('/findings'),
  getFinding: (id: string) => fetchJson<SecurityFinding>(`/findings/${id}`),
  remediateFinding: (id: string, actor: string = 'admin') => 
    fetchJson<{ message: string; note: string; finding: SecurityFinding; new_security_score: number }>(
      `/findings/${id}/remediate?actor=${encodeURIComponent(actor)}`, 
      { method: 'POST' }
    ),

  evaluateSimulation: (req: SimulationRequest) => fetchJson<SimulationResponse>('/simulator/evaluate', { method: 'POST', body: JSON.stringify(req) }),

  getAuditLogs: (filters?: { actor?: string; action?: string; result?: string; risk_level?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.actor) params.append('actor', filters.actor);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.result) params.append('result', filters.result);
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString();
    return fetchJson<AuditLog[]>(`/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  reseedDatabase: () => fetchJson<{ message: string }>('/seed', { method: 'POST' }),
};
