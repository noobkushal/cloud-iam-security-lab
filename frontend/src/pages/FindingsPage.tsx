import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SecurityFinding, Severity } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { AlertTriangle, CheckCircle2, ShieldAlert, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FindingsPageProps {
  onScoreUpdate?: (score: number) => void;
  onOpenFindingsChange?: (count: number) => void;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  onScoreUpdate,
  onOpenFindingsChange
}) => {
  const { currentActor, executeProtectedAction } = useRole();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadFindings = async () => {
    try {
      setLoading(true);
      const data = await api.getFindings();
      setFindings(data);

      const openCount = data.filter((f) => f.status === 'OPEN').length;
      if (onOpenFindingsChange) onOpenFindingsChange(openCount);
    } catch (err: any) {
      console.error('Failed loading findings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  const handleRemediate = async (findingId: string) => {
    await executeProtectedAction('REMEDIATE_FINDINGS', async () => {
      try {
        setRemediatingId(findingId);
        const res = await api.remediateFinding(findingId, currentActor);
        setToastMessage(res.message);
        if (onScoreUpdate) onScoreUpdate(res.new_security_score);
        setSelectedFinding(null);
        await loadFindings();
        setTimeout(() => setToastMessage(null), 4000);
      } catch (err: any) {
        alert(`Remediation failed: ${err.message}`);
      } finally {
        setRemediatingId(null);
      }
    }, `Access Denied: '${currentActor}' is not authorized to execute security remediation.`);
  };

  const filteredFindings = findings.filter((f) => {
    if (filterSeverity !== 'ALL' && f.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-rose-400 font-mono text-xs">
        <span>Running Security Analysis Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#111827] border border-emerald-500/50 rounded-xl shadow-2xl flex items-center gap-3 text-emerald-400 text-xs font-mono animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            Security Audit Findings & Vulnerabilities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated backend detection of excessive permissions, wildcards, and least privilege violations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-[#151D2E] p-2 rounded-lg border border-[#1F293D]">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#090D16] border border-[#1F293D] text-xs font-mono text-cyan-300 px-3 py-1.5 rounded focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#090D16] border border-[#1F293D] text-xs font-mono text-cyan-300 px-3 py-1.5 rounded focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="REMEDIATED">REMEDIATED</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => (
          <Card
            key={finding.id}
            className={`transition-colors cursor-pointer ${
              finding.status === 'OPEN' ? 'border-rose-500/30 hover:border-rose-500/60' : 'border-emerald-500/30 opacity-75'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1" onClick={() => setSelectedFinding(finding)}>
                <div className="flex items-center gap-3">
                  <Badge variant={finding.severity}>{finding.severity}</Badge>
                  <Badge variant={finding.status}>{finding.status}</Badge>
                  <h3 className="font-bold text-base text-slate-100">{finding.title}</h3>
                </div>
                <p className="text-xs text-slate-300">{finding.description}</p>
                <div className="text-[11px] font-mono text-slate-400">
                  Affected Entity: <span className="text-cyan-300">{finding.affected_entity}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {finding.status === 'OPEN' ? (
                  <button
                    onClick={() => handleRemediate(finding.id)}
                    disabled={remediatingId === finding.id}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-2"
                  >
                    {remediatingId === finding.id ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Mark as Remediated</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Remediated
                  </span>
                )}
                <button
                  onClick={() => setSelectedFinding(finding)}
                  className="p-2 text-slate-400 hover:text-slate-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Remediation Modal */}
      {selectedFinding && (
        <Modal
          isOpen={!!selectedFinding}
          onClose={() => setSelectedFinding(null)}
          title={`Finding Detail: ${selectedFinding.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant={selectedFinding.severity}>{selectedFinding.severity}</Badge>
              <Badge variant={selectedFinding.status}>{selectedFinding.status}</Badge>
              <span className="text-slate-400 font-mono">Entity: {selectedFinding.affected_entity}</span>
            </div>

            {/* Problem & Impact */}
            <div className="space-y-3">
              <div className="p-3 bg-[#090D16] rounded-lg border border-[#1F293D]">
                <h4 className="font-mono text-rose-400 font-bold mb-1">Problem:</h4>
                <p className="text-slate-200">{selectedFinding.problem || selectedFinding.description}</p>
              </div>

              <div className="p-3 bg-[#090D16] rounded-lg border border-[#1F293D]">
                <h4 className="font-mono text-amber-400 font-bold mb-1">Why It Matters:</h4>
                <p className="text-slate-300">{selectedFinding.why_it_matters || selectedFinding.recommendation}</p>
              </div>
            </div>

            {/* Current vs Recommended Permission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <div className="text-rose-400 font-bold mb-1">Current Permission (Insecure):</div>
                <div className="text-slate-200">{selectedFinding.current_permission || "Unrestricted permissions granted."}</div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="text-emerald-400 font-bold mb-1">Recommended Permission (Least Privilege):</div>
                <div className="text-slate-200">{selectedFinding.recommended_permission || "Restrict to minimal required API actions."}</div>
              </div>
            </div>

            {/* Remediation Action */}
            <div className="pt-4 border-t border-[#1F293D] flex justify-end gap-3">
              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 bg-[#151D2E] text-slate-300 rounded-lg hover:bg-[#1F293D]"
              >
                Close
              </button>
              {selectedFinding.status === 'OPEN' && (
                <button
                  onClick={() => handleRemediate(selectedFinding.id)}
                  disabled={remediatingId === selectedFinding.id}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg font-mono flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Automated Remediation</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
