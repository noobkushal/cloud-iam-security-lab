import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Resource } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { HardDrive, Server, Database, FileText } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResources().then(setResources).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'S3_BUCKET':
        return <HardDrive className="w-5 h-5 text-cyan-400" />;
      case 'COMPUTE_INSTANCE':
        return <Server className="w-5 h-5 text-purple-400" />;
      case 'LOG_GROUP':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'DATABASE':
      default:
        return <Database className="w-5 h-5 text-emerald-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-emerald-400 font-mono text-xs">
        <span>Loading Managed Cloud Resources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-emerald-400" />
          Simulated Cloud Resources
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Cloud assets, storage buckets, compute nodes, and log streams requiring authorization governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <Card key={res.id} className="hover:border-emerald-500/40">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#090D16] rounded-lg border border-[#1F293D]">{getIcon(res.resource_type)}</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 font-mono">{res.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">{res.resource_type}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#1F293D] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Environment:</span>
                  <span className="text-cyan-300 font-semibold">{res.environment}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Sensitivity:</span>
                  <Badge variant={res.sensitivity === 'RESTRICTED' || res.sensitivity === 'CONFIDENTIAL' ? 'CRITICAL' : 'LOW'}>
                    {res.sensitivity}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
