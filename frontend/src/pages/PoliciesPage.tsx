import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Policy } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { FileCode2, Plus, ExternalLink, ShieldAlert, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PoliciesPage: React.FC = () => {
  const { currentActor, executeProtectedAction } = useRole();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Policy Edit State
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editJsonInput, setEditJsonInput] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [actionsInput, setActionsInput] = useState('storage:GetObject, storage:PutObject');
  const [resourcesInput, setResourcesInput] = useState('arn:aws:s3:::production-bucket/*');
  const [riskLevel, setRiskLevel] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err: any) {
      console.error('Failed loading policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreatePolicyClick = () => {
    executeProtectedAction('MANAGE_POLICIES', () => {
      setIsModalOpen(true);
    }, `Access Denied: '${currentActor}' role is not authorized to create IAM policies.`);
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const actions = actionsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const resources = resourcesInput.split(',').map((s) => s.trim()).filter(Boolean);

    await executeProtectedAction('MANAGE_POLICIES', async () => {
      try {
        await api.createPolicy({
          name,
          description,
          effect,
          actions,
          resources,
          risk_level: riskLevel
        });
        setIsModalOpen(false);
        setName('');
        setDescription('');
        await loadPolicies();
      } catch (err: any) {
        alert(`Error creating policy: ${err.message}`);
      }
    });
  };

  const handleEditClick = (policy: Policy) => {
    executeProtectedAction('MANAGE_POLICIES', () => {
      setEditingPolicy(policy);
      setEditJsonInput(JSON.stringify({
        actions: policy.actions,
        resources: policy.resources,
        risk_level: policy.risk_level
      }, null, 2));
    }, `Access Denied: '${currentActor}' role is not authorized to edit IAM policies.`);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    try {
      const parsed = JSON.parse(editJsonInput);
      await executeProtectedAction('MANAGE_POLICIES', async () => {
        await api.updatePolicy(editingPolicy.id, {
          actions: parsed.actions,
          resources: parsed.resources,
          risk_level: parsed.risk_level
        });
        setEditingPolicy(null);
        await loadPolicies();
      });
    } catch (err: any) {
      alert(`Invalid JSON format or edit error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-amber-400 font-mono text-xs">
        <span>Loading IAM Policy Definitions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-amber-400" />
            IAM Security Policies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Declarative statements defining allowed or denied cloud API actions and resource targets.
          </p>
        </div>
        <button
          onClick={handleCreatePolicyClick}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs font-mono flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Policy</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => {
          const isWildcardAdmin = '*' in policy.actions && '*' in policy.resources;
          return (
            <Card
              key={policy.id}
              className={`flex flex-col justify-between hover:border-amber-500/40 ${
                isWildcardAdmin ? 'border-rose-500/60 bg-rose-950/20' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-amber-300 flex items-center gap-2">
                      {policy.name}
                      {isWildcardAdmin && (
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500 text-white rounded font-extrabold animate-pulse">
                          CRITICAL WILDCARD
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{policy.description}</p>
                  </div>
                  <Badge variant={policy.risk_level}>{policy.risk_level}</Badge>
                </div>

                {/* Structured Visual JSON View */}
                <div className="bg-[#090D16] p-3 rounded-lg border border-[#1F293D] font-mono text-[11px] space-y-1.5 relative group">
                  <button
                    onClick={() => handleEditClick(policy)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-amber-400 hover:bg-[#151D2E] rounded transition-colors"
                    title="Edit Policy JSON"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-slate-500">{"{"}</div>
                  <div className="pl-4">
                    <span className="text-purple-400">"Effect"</span>: <span className={policy.effect === 'ALLOW' ? 'text-emerald-400' : 'text-rose-400'}>"{policy.effect}"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">"Action"</span>: <span className="text-cyan-300">{JSON.stringify(policy.actions)}</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">"Resource"</span>: <span className="text-amber-300">{JSON.stringify(policy.resources)}</span>
                  </div>
                  <div className="text-slate-500">{"}"}</div>
                </div>

                {isWildcardAdmin && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2 text-xs text-rose-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <span className="font-bold">Dangerous Policy:</span> ALLOW * / RESOURCE * allows unrestrained administrative takeover.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-[#1F293D] flex items-center justify-between">
                <button
                  onClick={() => handleEditClick(policy)}
                  className="text-slate-400 hover:text-amber-400 font-mono text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Quick Edit JSON
                </button>
                <Link
                  to={`/policies/${policy.id}`}
                  className="text-amber-400 hover:underline font-mono text-xs flex items-center gap-1"
                >
                  Inspect Policy & Remediation <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Policy JSON Modal */}
      {editingPolicy && (
        <Modal
          isOpen={!!editingPolicy}
          onClose={() => setEditingPolicy(null)}
          title={`Edit Policy: ${editingPolicy.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Edit Policy Rules (JSON)</label>
              <textarea
                required
                value={editJsonInput}
                onChange={(e) => setEditJsonInput(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg p-3 text-cyan-300 font-mono text-xs h-40 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#1F293D]">
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="px-4 py-2 bg-[#151D2E] text-slate-300 rounded-lg hover:bg-[#1F293D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg font-mono"
              >
                Save & Rescan Security Engine
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Policy Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Custom IAM Policy">
        <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1">Policy Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S3BucketReadOnly"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Policy scope and purpose"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono h-16"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Effect</label>
              <select
                value={effect}
                onChange={(e: any) => setEffect(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 font-mono"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-mono mb-1">Risk Rating</label>
              <select
                value={riskLevel}
                onChange={(e: any) => setRiskLevel(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Allowed Actions (Comma Separated)</label>
            <input
              type="text"
              required
              value={actionsInput}
              onChange={(e) => setActionsInput(e.target.value)}
              placeholder="storage:GetObject, storage:PutObject"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-[#06B6D4] focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Target Resources (Comma Separated)</label>
            <input
              type="text"
              required
              value={resourcesInput}
              onChange={(e) => setResourcesInput(e.target.value)}
              placeholder="production-bucket, development-bucket"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1F293D]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#151D2E] text-slate-300 rounded-lg hover:bg-[#1F293D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg font-mono"
            >
              Create Policy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
