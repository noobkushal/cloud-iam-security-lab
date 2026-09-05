import React from 'react';
import { useRole } from '../../context/RoleContext';
import { Shield, UserCheck, RefreshCw, Activity, Lock, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  securityScore?: number;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  securityScore = 100,
  onRefresh
}) => {
  const { currentActor, setCurrentActor, roleType, roleBadgeColor, authWarning, clearAuthWarning } = useRole();
  const simulatedActors = ['admin', 'alice-dev', 'bob-security', 'charlie-auditor', 'david-developer'];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <header className="h-16 bg-[#0D1322]/90 backdrop-blur-md border-b border-[#1F293D] fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6">
      {/* Role Authorization Warning Toast */}
      {authWarning && (
        <div className="absolute top-16 right-6 z-50 p-4 bg-rose-950/90 border border-rose-500/50 rounded-xl shadow-2xl flex items-center gap-3 text-rose-300 text-xs font-mono animate-bounce backdrop-blur-md">
          <Lock className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{authWarning}</span>
        </div>
      )}

      {/* Engine Status Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400">Engine Realtime Active</span>
          <span className="text-slate-600">|</span>
          <span>SQLite Engine</span>
        </div>
      </div>

      {/* Control Actions & Active Identity Context */}
      <div className="flex items-center gap-4">
        {/* Security Score Badge */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${getScoreColor(securityScore)}`}>
          <Shield className="w-4 h-4" />
          <span>Score: {securityScore} / 100</span>
        </div>

        {/* Refresh Data Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-[#1F293D] text-slate-400 hover:text-cyan-400 hover:bg-[#151D2E] transition-colors"
            title="Re-evaluate IAM Engine"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Active Simulated Identity Selector with Dynamic Role Badge */}
        <div className="flex items-center gap-3 bg-[#151D2E] border border-[#1F293D] px-3 py-1.5 rounded-lg">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Actor:</span>
            <select
              value={currentActor}
              onChange={(e) => setCurrentActor(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {simulatedActors.map((actor) => (
                <option key={actor} value={actor} className="bg-[#111827] text-slate-200">
                  {actor}
                </option>
              ))}
            </select>
          </div>

          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${roleBadgeColor}`}>
            {roleType}
          </span>
        </div>
      </div>
    </header>
  );
};
