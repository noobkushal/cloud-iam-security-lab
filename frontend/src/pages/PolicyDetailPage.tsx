import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Policy } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FileCode2, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const PolicyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getPolicy(id).then(setPolicy).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !policy) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-amber-400 font-mono text-xs">
        <span>Loading Policy Details...</span>
      </div>
    );
  }

  const isWildcard = '*' in policy.actions || '*' in policy.resources;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link to="/policies" className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Policies
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-amber-400" />
            Policy: {policy.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{policy.description}</p>
        </div>
        <Badge variant={policy.risk_level}>{policy.risk_level}</Badge>
      </div>

      {/* JSON Viewer */}
      <Card title="Raw JSON Policy Document">
        <pre className="p-4 bg-[#090D16] rounded-lg border border-[#1F293D] text-xs font-mono text-slate-200 overflow-x-auto">
          {JSON.stringify(policy, null, 2)}
        </pre>
      </Card>

      {/* Security Analysis & Remediation Recommendation */}
      <Card title="Policy Risk Analysis & Remediation">
        <div className="space-y-4 text-xs">
          {isWildcard ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg space-y-2 text-rose-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Overly Permissive Wildcard Detected
              </div>
              <p>
                This policy contains wildcard matching patterns (`*`). In cloud computing environments, wildcards violate the Principle of Least Privilege and significantly expand potential breach impact.
              </p>
              <div className="pt-2 border-t border-rose-500/20 font-mono">
                <span className="text-slate-400">Recommended Remediation: </span>
                <span className="text-emerald-400 font-semibold">
                  Replace wildcards with explicit required actions (e.g. storage:GetObject) and scoped resource ARNs.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2 text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Granular Scoped Policy
              </div>
              <p>
                Permissions are explicitly restricted to granular actions and resource scopes. This policy adheres to cloud security best practices.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
