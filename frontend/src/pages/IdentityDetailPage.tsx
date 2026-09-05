import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { User, Policy } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { UserCheck, ArrowLeft, Shield, FileCode2, PlaySquare } from 'lucide-react';

export const IdentityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getUser(id).then(setUser).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-400 font-mono text-xs">
        <span>Loading User Details...</span>
      </div>
    );
  }

  // Aggregate all policies
  const allPolicies: Policy[] = [...user.direct_policies];
  user.groups.forEach((g) => {
    (g.policies || []).forEach((p) => {
      if (!allPolicies.some((ap) => ap.id === p.id)) {
        allPolicies.push(p);
      }
    });
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link to="/identities" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Identities
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            Identity: {user.username}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
        </div>
        <Link
          to={`/simulator?identity=${encodeURIComponent(user.username)}`}
          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold flex items-center gap-2"
        >
          <PlaySquare className="w-4 h-4" />
          <span>Test in Simulator</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="User Risk Overview">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Calculated Risk Score:</span>
              <Badge variant={user.risk_score >= 50 ? 'HIGH' : 'LOW'}>{user.risk_score} / 100</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Status:</span>
              <span className="text-emerald-400 font-semibold">{user.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Created At:</span>
              <span className="text-slate-200 font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        <Card title="RBAC Group Memberships" className="md:col-span-2">
          <div className="space-y-2">
            {user.groups.length > 0 ? (
              user.groups.map((g) => (
                <div key={g.id} className="p-3 bg-[#090D16] rounded-lg border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-purple-300">{g.name}</div>
                    <div className="text-[11px] text-slate-400">{g.description}</div>
                  </div>
                  <Badge variant="INFO">{g.policies.length} Policies</Badge>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic p-3 text-center">User does not belong to any RBAC group</div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Effective IAM Policies Breakdown" subtitle="Combined permissions inherited via Groups + Direct Policies">
        <div className="space-y-3">
          {allPolicies.map((p) => (
            <div key={p.id} className="p-4 bg-[#090D16] rounded-lg border border-[#1F293D] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-semibold text-amber-300">{p.name}</div>
                <Badge variant={p.risk_level}>{p.risk_level}</Badge>
              </div>
              <p className="text-xs text-slate-400">{p.description}</p>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500">Allowed Actions:</span>
                  <div className="text-cyan-300 font-semibold">{p.actions.join(', ')}</div>
                </div>
                <div>
                  <span className="text-slate-500">Target Resources:</span>
                  <div className="text-emerald-300 font-semibold">{p.resources.join(', ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
