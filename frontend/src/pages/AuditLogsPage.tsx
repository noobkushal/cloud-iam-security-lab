import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AuditLog } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { History, Search, Filter, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        actor: actorFilter || undefined,
        action: actionFilter || undefined,
        result: resultFilter || undefined,
        risk_level: riskFilter || undefined,
        search: searchTerm || undefined
      });
      setLogs(data);
    } catch (err: any) {
      console.error('Failed loading audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actorFilter, actionFilter, resultFilter, riskFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Security Audit Trail & Logging
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all administrative changes, policy evaluations, and remediation actions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3 py-1.5 bg-[#151D2E] hover:bg-[#1F293D] text-cyan-400 border border-[#1F293D] rounded-lg text-xs font-mono flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-[#090D16] border border-[#1F293D] rounded px-3 py-1.5 pl-8 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Filter Actor</label>
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="e.g. admin"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Filter Action</label>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="e.g. PolicyModified"
              className="w-full bg-[#090D16] border border-[#1F293D] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Filter Result</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full bg-[#090D16] border border-[#1F293D] rounded px-3 py-1.5 text-slate-200 focus:outline-none font-mono text-xs"
            >
              <option value="">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="ALLOWED">ALLOWED</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[10px] mb-1">Filter Risk</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-[#090D16] border border-[#1F293D] rounded px-3 py-1.5 text-slate-200 focus:outline-none font-mono text-xs"
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-cyan-400 font-mono text-xs">
            <span>Loading Audit Logs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#151D2E] border-b border-[#1F293D] font-mono text-slate-400 text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] font-mono text-slate-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#151D2E]/50 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-300">{log.actor}</td>
                      <td className="py-3 px-4 text-amber-300">{log.action}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{log.resource}</td>
                      <td className="py-3 px-4">
                        <Badge variant={log.result}>{log.result}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{log.ip_address}</td>
                      <td className="py-3 px-4">
                        <Badge variant={log.risk_level}>{log.risk_level}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      No audit logs match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
