import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Group } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { UserCheck, ArrowLeft } from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getGroup(id).then(setGroup).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !group) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-purple-400 font-mono text-xs">
        <span>Loading Group Details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link to="/groups" className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#E9D5FF] flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple-400" />
            Group: {group.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{group.description}</p>
        </div>
      </div>

      <Card title="Attached IAM Policies">
        <div className="space-y-3">
          {group.policies.map((p) => (
            <div key={p.id} className="p-4 bg-[#090D16] rounded-lg border border-[#1F293D] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-amber-300">{p.name}</span>
                <Badge variant={p.risk_level}>{p.risk_level}</Badge>
              </div>
              <p className="text-xs text-slate-400">{p.description}</p>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500">Actions:</span>
                  <div className="text-cyan-300">{p.actions.join(', ')}</div>
                </div>
                <div>
                  <span className="text-slate-500">Resources:</span>
                  <div className="text-emerald-300">{p.resources.join(', ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
