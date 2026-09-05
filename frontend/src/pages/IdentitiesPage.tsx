import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { User, Group, Policy } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { UserCheck, Shield, Plus, ExternalLink, AlertTriangle, Link2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IdentitiesPage: React.FC = () => {
  const { currentActor, executeProtectedAction } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Policy Attachment Modal State
  const [attachModalUser, setAttachModalUser] = useState<User | null>(null);
  const [selectedAttachPolicyId, setSelectedAttachPolicyId] = useState<string>('');

  // New user form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, groupData, policyData] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
        api.getPolicies()
      ]);
      setUsers(userData);
      setGroups(groupData);
      setPolicies(policyData);
    } catch (err: any) {
      console.error('Failed loading users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUserClick = () => {
    executeProtectedAction('MANAGE_USERS', () => {
      setIsModalOpen(true);
    }, `Access Denied: '${currentActor}' role is not authorized to create identities.`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;

    await executeProtectedAction('MANAGE_USERS', async () => {
      try {
        await api.createUser({
          username,
          email,
          group_ids: selectedGroupIds,
          policy_ids: selectedPolicyIds,
          status: 'ACTIVE'
        }, currentActor);
        setIsModalOpen(false);
        setUsername('');
        setEmail('');
        setSelectedGroupIds([]);
        setSelectedPolicyIds([]);
        await loadData();
      } catch (err: any) {
        alert(`Error creating user: ${err.message}`);
      }
    });
  };

  const handleAttachPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachModalUser || !selectedAttachPolicyId) return;

    await executeProtectedAction('MANAGE_POLICIES', async () => {
      try {
        await api.attachPolicyToUser(attachModalUser.id, selectedAttachPolicyId, currentActor);
        setAttachModalUser(null);
        setSelectedAttachPolicyId('');
        await loadData();
      } catch (err: any) {
        alert(`Error attaching policy: ${err.message}`);
      }
    });
  };

  const handleDetachPolicy = async (user: User, policyId: string) => {
    await executeProtectedAction('MANAGE_POLICIES', async () => {
      try {
        await api.detachPolicyFromUser(user.id, policyId, currentActor);
        await loadData();
      } catch (err: any) {
        alert(`Error detaching policy: ${err.message}`);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cyan-400 font-mono text-xs">
        <span>Loading IAM Directory Users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            IAM Identities (Users)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage simulated cloud users, direct policy attachments, and calculated risk scores.
          </p>
        </div>
        <button
          onClick={handleCreateUserClick}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs font-mono flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Identity</span>
        </button>
      </div>

      {/* Users Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="flex flex-col justify-between hover:border-cyan-500/40">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{user.username}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                </div>
                <Badge variant={user.risk_score >= 50 ? 'HIGH' : 'LOW'}>
                  Risk: {user.risk_score}/100
                </Badge>
              </div>

              {/* Groups Badge List */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 mb-1">Assigned Groups:</div>
                <div className="flex flex-wrap gap-1.5">
                  {user.groups.length > 0 ? (
                    user.groups.map((g) => (
                      <span key={g.id} className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No Groups (Standalone)</span>
                  )}
                </div>
              </div>

              {/* Direct Policies */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Direct Policies:
                  </span>
                  <button
                    onClick={() => setAttachModalUser(user)}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <Link2 className="w-3 h-3" /> Attach
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {user.direct_policies.length > 0 ? (
                    user.direct_policies.map((p) => (
                      <span key={p.id} className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <span>{p.name}</span>
                        <button
                          onClick={() => handleDetachPolicy(user, p.id)}
                          className="hover:text-rose-400 text-slate-500"
                          title="Detach policy"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No direct inline policies</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">
                Status: <span className="text-emerald-400">{user.status}</span>
              </span>
              <Link
                to={`/identities/${user.id}`}
                className="text-cyan-400 hover:underline font-mono text-[11px] flex items-center gap-1"
              >
                Inspect User <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Attach Policy Modal */}
      {attachModalUser && (
        <Modal
          isOpen={!!attachModalUser}
          onClose={() => setAttachModalUser(null)}
          title={`Attach Policy to User: ${attachModalUser.username}`}
        >
          <form onSubmit={handleAttachPolicy} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Select Policy</label>
              <select
                required
                value={selectedAttachPolicyId}
                onChange={(e) => setSelectedAttachPolicyId(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-cyan-500"
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
                onClick={() => setAttachModalUser(null)}
                className="px-4 py-2 bg-[#151D2E] text-slate-300 rounded-lg hover:bg-[#1F293D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg font-mono"
              >
                Attach Policy
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Simulated Identity">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dev-user-1"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@cloudlab.local"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Assign to Groups (RBAC)</label>
            <div className="space-y-1 bg-[#090D16] p-3 rounded-lg border border-[#1F293D] max-h-32 overflow-y-auto">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(g.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedGroupIds([...selectedGroupIds, g.id]);
                      else setSelectedGroupIds(selectedGroupIds.filter((id) => id !== g.id));
                    }}
                    className="rounded border-[#1F293D] text-cyan-500 bg-transparent"
                  />
                  <span>{g.name}</span>
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
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg font-mono"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
