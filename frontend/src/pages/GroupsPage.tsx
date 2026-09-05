import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Group, Policy, User } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { UserCheck, Plus, ExternalLink, Shield, Link2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GroupsPage: React.FC = () => {
  const { currentActor, executeProtectedAction } = useRole();
  const [groups, setGroups] = useState<Group[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group Policy Attachment Modal State
  const [attachModalGroup, setAttachModalGroup] = useState<Group | null>(null);
  const [selectedAttachPolicyId, setSelectedAttachPolicyId] = useState<string>('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupData, policyData] = await Promise.all([api.getGroups(), api.getPolicies()]);
      setGroups(groupData);
      setPolicies(policyData);
    } catch (err: any) {
      console.error('Failed loading groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroupClick = () => {
    executeProtectedAction('MANAGE_GROUPS', () => {
      setIsModalOpen(true);
    }, `Access Denied: '${currentActor}' role is not authorized to create RBAC groups.`);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await executeProtectedAction('MANAGE_GROUPS', async () => {
      try {
        await api.createGroup({ name, description, policy_ids: selectedPolicyIds }, currentActor);
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setSelectedPolicyIds([]);
        await loadData();
      } catch (err: any) {
        alert(`Error creating group: ${err.message}`);
      }
    });
  };

  const handleAttachPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachModalGroup || !selectedAttachPolicyId) return;

    await executeProtectedAction('MANAGE_GROUPS', async () => {
      try {
        await api.attachPolicyToGroup(attachModalGroup.id, selectedAttachPolicyId, currentActor);
        setAttachModalGroup(null);
        setSelectedAttachPolicyId('');
        await loadData();
      } catch (err: any) {
        alert(`Error attaching policy: ${err.message}`);
      }
    });
  };

  const handleDetachPolicy = async (group: Group, policyId: string) => {
    await executeProtectedAction('MANAGE_GROUPS', async () => {
      try {
        await api.detachPolicyFromGroup(group.id, policyId, currentActor);
        await loadData();
      } catch (err: any) {
        alert(`Error detaching policy: ${err.message}`);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-purple-400 font-mono text-xs">
        <span>Loading RBAC Groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple-400" />
            Role-Based Access Control (RBAC) Groups
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Group policies attach permission sets to roles rather than individual users for security governance.
          </p>
        </div>
        <button
          onClick={handleCreateGroupClick}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs font-mono flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create RBAC Group</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="flex flex-col justify-between hover:border-purple-500/40">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-base text-purple-300">{group.name}</h3>
                <Badge variant="INFO">{group.user_count} Members</Badge>
              </div>
              <p className="text-xs text-slate-400">{group.description}</p>

              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Attached Policies:</span>
                  <button
                    onClick={() => setAttachModalGroup(group)}
                    className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <Link2 className="w-3 h-3" /> Attach
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.policies.length > 0 ? (
                    group.policies.map((p) => (
                      <span
                        key={p.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                          p.risk_level === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <span>{p.name}</span>
                        <button
                          onClick={() => handleDetachPolicy(group, p.id)}
                          className="hover:text-rose-400 text-slate-500"
                          title="Detach policy from group"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No policies attached</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1F293D] flex items-center justify-end">
              <Link
                to={`/groups/${group.id}`}
                className="text-purple-400 hover:underline font-mono text-xs flex items-center gap-1"
              >
                Inspect Group <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Attach Policy to Group Modal */}
      {attachModalGroup && (
        <Modal
          isOpen={!!attachModalGroup}
          onClose={() => setAttachModalGroup(null)}
          title={`Attach Policy to Group: ${attachModalGroup.name}`}
        >
          <form onSubmit={handleAttachPolicy} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Select IAM Policy</label>
              <select
                required
                value={selectedAttachPolicyId}
                onChange={(e) => setSelectedAttachPolicyId(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-purple-300 font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="">Choose a policy to attach...</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.risk_level})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#1F293D]">
              <button
                type="button"
                onClick={() => setAttachModalGroup(null)}
                className="px-4 py-2 bg-[#151D2E] text-slate-300 rounded-lg hover:bg-[#1F293D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg font-mono"
              >
                Attach to Group
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New RBAC Group">
        <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1">Group Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DevOpsEngineers"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities of this RBAC group"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono h-20"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Attach IAM Policies</label>
            <div className="space-y-1 bg-[#090D16] p-3 rounded-lg border border-[#1F293D] max-h-36 overflow-y-auto">
              {policies.map((p) => (
                <label key={p.id} className="flex items-center justify-between text-slate-300 cursor-pointer p-1 hover:bg-[#151D2E] rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPolicyIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPolicyIds([...selectedPolicyIds, p.id]);
                        else setSelectedPolicyIds(selectedPolicyIds.filter((id) => id !== p.id));
                      }}
                      className="rounded border-[#1F293D] text-purple-500 bg-transparent"
                    />
                    <span className="font-mono text-xs">{p.name}</span>
                  </div>
                  <Badge variant={p.risk_level}>{p.risk_level}</Badge>
                </label>
              ))}
            </div>
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg font-mono"
            >
              Create Group
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
