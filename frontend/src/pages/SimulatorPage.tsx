import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { SimulationResponse, User, Group, Resource } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PlaySquare, Shield, CheckCircle2, XCircle, ArrowRight, FileCode2 } from 'lucide-react';

interface SimulatorPageProps {
  currentActor: string;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ currentActor }) => {
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [identity, setIdentity] = useState<string>(searchParams.get('identity') || 'alice-dev');
  const [action, setAction] = useState<string>('storage:DeleteObject');
  const [resource, setResource] = useState<string>('production-bucket');

  const [response, setResponse] = useState<SimulationResponse | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getGroups(), api.getResources()])
      .then(([u, g, r]) => {
        setUsers(u);
        setGroups(g);
        setResources(r);
      })
      .catch(console.error);
  }, []);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identity || !action || !resource) return;

    try {
      setEvaluating(true);
      const res = await api.evaluateSimulation({
        identity,
        action,
        resource,
        actor_context: currentActor
      });
      setResponse(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const sampleScenarios = [
    { identity: 'alice-dev', action: 'storage:DeleteObject', resource: 'production-bucket', title: 'Dev Delete Prod Bucket' },
    { identity: 'admin', action: 'storage:DeleteObject', resource: 'production-bucket', title: 'Admin Full Access' },
    { identity: 'charlie-auditor', action: 'storage:DeleteObject', resource: 'production-bucket', title: 'Auditor Delete Check' },
    { identity: 'alice-dev', action: 'storage:GetObject', resource: 'development-bucket', title: 'Dev Read Dev Bucket' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <PlaySquare className="w-6 h-6 text-cyan-400" />
          IAM Permission Simulator Workbench
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate IAM access decisions to evaluate effective permissions against policies and detect privilege escalation risks.
        </p>
      </div>

      {/* Quick Scenario Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-slate-400 shrink-0">Preset Scenarios:</span>
        {sampleScenarios.map((sc, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIdentity(sc.identity);
              setAction(sc.action);
              setResource(sc.resource);
            }}
            className="px-3 py-1 bg-[#151D2E] hover:bg-[#1F293D] text-cyan-300 border border-[#1F293D] rounded-full text-xs font-mono shrink-0 transition-colors"
          >
            {sc.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Form Control */}
        <Card title="Simulation Parameters">
          <form onSubmit={handleEvaluate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Target Identity (User or Group)</label>
              <select
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              >
                <optgroup label="Simulated Users">
                  {users.map((u) => (
                    <option key={u.id} value={u.username}>
                      User: {u.username}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="RBAC Groups">
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      Group: {g.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-mono mb-1">Requested Action</label>
              <input
                type="text"
                required
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="e.g. storage:DeleteObject"
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono mb-1">Target Resource</label>
              <input
                type="text"
                required
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="e.g. production-bucket"
                className="w-full bg-[#090D16] border border-[#1F293D] rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg font-mono text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              {evaluating ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlaySquare className="w-4 h-4" />
              )}
              <span>Evaluate IAM Access Decision</span>
            </button>
          </form>
        </Card>

        {/* Simulation Output Card */}
        <Card title="Evaluation Decision & Policy Analysis">
          {response ? (
            <div className="space-y-4 text-xs animate-fadeIn">
              {/* Result Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  response.decision === 'ALLOWED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {response.decision === 'ALLOWED' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-mono text-lg font-extrabold tracking-wider">{response.decision}</div>
                  <div className="text-xs text-slate-200 mt-0.5">{response.reason}</div>
                </div>
              </div>

              {/* Evaluated Policies list */}
              <div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">Evaluated Policies:</div>
                <div className="flex flex-wrap gap-1.5">
                  {response.evaluated_policies.map((pName) => (
                    <span
                      key={pName}
                      className={`px-2.5 py-1 rounded text-xs font-mono border ${
                        pName === response.matching_policy
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-[#090D16] text-slate-400 border-[#1F293D]'
                      }`}
                    >
                      {pName} {pName === response.matching_policy && '✓ (Matching Policy)'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Structured Output JSON Format */}
              <div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">Raw Evaluated JSON Response:</div>
                <pre className="p-3 bg-[#090D16] rounded-lg border border-[#1F293D] font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  {JSON.stringify(
                    {
                      decision: response.decision,
                      reason: response.reason,
                      evaluated_policies: response.evaluated_policies,
                      matching_policy: response.matching_policy
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 italic text-xs">
              Select parameters and click "Evaluate IAM Access Decision" to view evaluation trace.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
