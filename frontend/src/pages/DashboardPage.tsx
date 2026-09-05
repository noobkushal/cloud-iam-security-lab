import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardStats, SecurityFinding } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PermissionGraph } from '../components/visualization/PermissionGraph';
import { useRole } from '../context/RoleContext';
import {
  ShieldAlert,
  Users,
  UserCheck,
  FileCode2,
  HardDrive,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  Sparkles,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardPageProps {
  onScoreUpdate?: (score: number) => void;
  onOpenFindingsChange?: (count: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onScoreUpdate,
  onOpenFindingsChange
}) => {
  const { currentActor, executeProtectedAction } = useRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, userData, groupData, policyData, resourceData] = await Promise.all([
        api.getDashboard(),
        api.getUsers(),
        api.getGroups(),
        api.getPolicies(),
        api.getResources()
      ]);
      setStats(dashboardData);
      setUsers(userData);
      setGroups(groupData);
      setPolicies(policyData);
      setResources(resourceData);

      if (onScoreUpdate) onScoreUpdate(dashboardData.security_score);
      if (onOpenFindingsChange) {
        const openCount = dashboardData.security_findings.filter(f => f.status === 'OPEN').length;
        onOpenFindingsChange(openCount);
      }
    } catch (err: any) {
      console.error('Failed loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemediate = async (findingId: string) => {
    await executeProtectedAction('REMEDIATE_FINDINGS', async () => {
      try {
        setRemediatingId(findingId);
        const res = await api.remediateFinding(findingId, currentActor);
        setToastMessage(res.message);
        await loadData();
        setTimeout(() => setToastMessage(null), 4000);
      } catch (err: any) {
        alert(`Remediation failed: ${err.message}`);
      } finally {
        setRemediatingId(null);
      }
    }, `Access Denied: Role '${currentActor}' is not authorized to execute remediation.`);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing Cloud IAM Environment...</span>
        </div>
      </div>
    );
  }

  const openFindings = stats.security_findings.filter((f) => f.status === 'OPEN');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#111827] border border-emerald-500/50 rounded-xl shadow-2xl flex items-center gap-3 text-emerald-400 text-xs font-mono animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Security Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Meter Card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-[#111827] to-[#151D2E] relative overflow-hidden border-cyan-500/30">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              IAM Security Posture
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="my-6 text-center">
            <div className="inline-flex items-baseline justify-center">
              <span className={`text-6xl font-extrabold font-mono tracking-tight ${
                stats.security_score >= 80 ? 'text-emerald-400' : stats.security_score >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {stats.security_score}
              </span>
              <span className="text-xl font-mono text-slate-500 ml-1">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {stats.security_score >= 80
                ? 'Healthy - Least Privilege Enforced'
                : stats.security_score >= 50
                ? 'Warning - Excessive Permissions Detected'
                : 'CRITICAL - Overprivileged Wildcards Detected'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#1F293D] text-center text-[10px] font-mono">
            <div>
              <div className="text-rose-400 font-bold">{stats.critical_findings}</div>
              <div className="text-slate-500">Critical</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{stats.high_findings}</div>
              <div className="text-slate-500">High</div>
            </div>
            <div>
              <div className="text-yellow-300 font-bold">{stats.medium_findings}</div>
              <div className="text-slate-500">Medium</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold">{stats.low_findings}</div>
              <div className="text-slate-500">Low</div>
            </div>
          </div>
        </Card>

        {/* Quick Inventory Stat Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Users</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100 mt-4">{stats.total_users}</div>
            <Link to="/identities" className="text-[11px] font-mono text-cyan-400 hover:underline mt-2 inline-flex items-center gap-1">
              View Identities <ArrowUpRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">RBAC Groups</span>
              <UserCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100 mt-4">{stats.total_groups}</div>
            <Link to="/groups" className="text-[11px] font-mono text-purple-400 hover:underline mt-2 inline-flex items-center gap-1">
              View Groups <ArrowUpRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">IAM Policies</span>
              <FileCode2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-[#F59E0B] mt-4">{stats.total_policies}</div>
            <Link to="/policies" className="text-[11px] font-mono text-amber-400 hover:underline mt-2 inline-flex items-center gap-1">
              View Policies <ArrowUpRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Cloud Resources</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-100 mt-4">{stats.total_resources}</div>
            <Link to="/resources" className="text-[11px] font-mono text-emerald-400 hover:underline mt-2 inline-flex items-center gap-1">
              View Resources <ArrowUpRight className="w-3 h-3" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Permission Relationship Visualizer Graph */}
      <Card title="IAM Relationship Flow Graph (User → Group → Policy → Resource)" subtitle="Interactive visualization of cloud permissions inheritance">
        <PermissionGraph users={users} groups={groups} policies={policies} resources={resources} />
      </Card>

      {/* Security Findings & Overprivileged Identities Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Security Audit Findings */}
        <Card
          className="lg:col-span-2"
          title="Active Security Audit Findings"
          subtitle="Intentional insecure scenarios detected by the Security Analysis Engine"
          action={
            <Link to="/findings" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              All Findings ({stats.security_findings.length}) <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {openFindings.length > 0 ? (
              openFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 bg-[#090D16] rounded-lg border border-[#1F293D] hover:border-cyan-500/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={finding.severity}>{finding.severity}</Badge>
                      <h4 className="font-semibold text-sm text-slate-100">{finding.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{finding.description}</p>
                    <div className="text-[11px] font-mono text-slate-500">
                      Entity: <span className="text-cyan-300">{finding.affected_entity}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemediate(finding.id)}
                    disabled={remediatingId === finding.id}
                    className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {remediatingId === finding.id ? (
                      <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Mark as Remediated</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#090D16] rounded-lg border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>All security findings remediated! Cloud IAM environment is hardened.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Overprivileged Identities & Recent Audit Events */}
        <div className="space-y-6">
          <Card title="Overprivileged Identities" subtitle="Users assigned wildcard or administrator policies">
            <div className="space-y-3">
              {stats.overprivileged_identities.length > 0 ? (
                stats.overprivileged_identities.map((item) => (
                  <div key={item.id} className="p-3 bg-[#090D16] rounded-lg border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-slate-200">{item.username}</div>
                      <Badge variant="HIGH">OVERPRIVILEGED</Badge>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-1">
                      <div>Policies: <span className="text-amber-300">{item.risk_policies.join(', ')}</span></div>
                      <div>Groups: <span className="text-purple-300">{item.groups.join(', ')}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-3 text-center">No overprivileged identities found</div>
              )}
            </div>
          </Card>

          <Card
            title="Recent Audit Events"
            subtitle="Latest security activities"
            action={
              <Link to="/audit-logs" className="text-xs font-mono text-cyan-400 hover:underline">
                View All
              </Link>
            }
          >
            <div className="space-y-2">
              {stats.recent_audit_events.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded bg-[#090D16] border border-[#1F293D]">
                  <div className="truncate pr-2">
                    <span className="font-mono font-semibold text-cyan-300">{log.actor}</span>
                    <span className="text-slate-400 ml-1">[{log.action}]</span>
                  </div>
                  <Badge variant={log.result}>{log.result}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
