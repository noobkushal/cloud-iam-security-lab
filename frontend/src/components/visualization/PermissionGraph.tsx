import React, { useState } from 'react';
import { User, Group, Policy, Resource } from '../../types';
import { ArrowRight, UserCheck, Shield, FileCode, HardDrive } from 'lucide-react';

interface PermissionGraphProps {
  users: User[];
  groups: Group[];
  policies: Policy[];
  resources: Resource[];
}

export const PermissionGraph: React.FC<PermissionGraphProps> = ({
  users,
  groups,
  policies,
  resources
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');

  const currentUser = users.find((u) => u.id === selectedUserId || u.username === selectedUserId) || users[0];
  
  if (!currentUser) return null;

  const userGroups = currentUser.groups || [];
  const directPolicies = currentUser.direct_policies || [];
  
  // Aggregate policies attached through groups + direct policies
  const activePolicies: Policy[] = [...directPolicies];
  userGroups.forEach((g) => {
    (g.policies || []).forEach((p) => {
      if (!activePolicies.some((ap) => ap.id === p.id)) {
        activePolicies.push(p);
      }
    });
  });

  // Calculate resources targeted by these policies
  const targetedResources: Resource[] = resources.filter((res) => {
    return activePolicies.some((p) => {
      if (p.effect !== 'ALLOW') return false;
      return p.resources.includes('*') || p.resources.includes(res.name);
    });
  });

  return (
    <div className="space-y-4">
      {/* Identity Filter Selector */}
      <div className="flex items-center justify-between bg-[#151D2E] p-3 rounded-lg border border-[#1F293D]">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-cyan-400">Trace Permission Path for Identity:</span>
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="bg-[#090D16] border border-[#1F293D] text-xs font-mono text-cyan-300 px-3 py-1.5 rounded-md focus:outline-none focus:border-cyan-500"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              User: {u.username} ({u.groups.map(g => g.name).join(', ') || 'No Group'})
            </option>
          ))}
        </select>
      </div>

      {/* Relationship Graph Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Step 1: User Identity */}
        <div className="cyber-panel p-4 space-y-3 border-cyan-500/30">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold border-b border-[#1F293D] pb-2">
            <UserCheck className="w-4 h-4" />
            <span>1. Identity</span>
          </div>
          <div className="p-3 bg-[#090D16] rounded-lg border border-cyan-500/40">
            <div className="font-semibold text-sm text-slate-100">{currentUser.username}</div>
            <div className="text-xs text-slate-400">{currentUser.email}</div>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
              Risk Score: {currentUser.risk_score}/100
            </div>
          </div>
        </div>

        {/* Step 2: RBAC Groups */}
        <div className="cyber-panel p-4 space-y-3 border-purple-500/30">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>2. Assigned Groups</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
          </div>
          <div className="space-y-2">
            {userGroups.length > 0 ? (
              userGroups.map((g) => (
                <div key={g.id} className="p-2.5 bg-[#090D16] rounded-lg border border-purple-500/30">
                  <div className="font-mono text-xs font-semibold text-purple-300">{g.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{g.description}</div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#090D16] rounded-lg border border-slate-800 text-xs text-slate-500 italic">
                No groups assigned
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Effective Policies */}
        <div className="cyber-panel p-4 space-y-3 border-amber-500/30">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
              <FileCode className="w-4 h-4" />
              <span>3. IAM Policies</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {activePolicies.length > 0 ? (
              activePolicies.map((p) => (
                <div key={p.id} className="p-2.5 bg-[#090D16] rounded-lg border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-amber-300">{p.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 rounded ${
                      p.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {p.risk_level}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                    Actions: {p.actions.join(', ')}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#090D16] rounded-lg border border-slate-800 text-xs text-slate-500 italic">
                No policies attached
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Accessible Resources */}
        <div className="cyber-panel p-4 space-y-3 border-emerald-500/30">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>4. Target Resources</span>
            </div>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {targetedResources.length > 0 ? (
              targetedResources.map((res) => (
                <div key={res.id} className="p-2.5 bg-[#090D16] rounded-lg border border-emerald-500/30">
                  <div className="font-mono text-xs font-semibold text-emerald-300">{res.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{res.resource_type}</span>
                    <span className="text-amber-400">{res.sensitivity}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#090D16] rounded-lg border border-slate-800 text-xs text-slate-500 italic">
                No resources accessible
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
