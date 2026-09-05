import React, { useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Settings, RefreshCw, ShieldAlert, CheckCircle2, Server } from 'lucide-react';

interface SettingsPageProps {
  onScoreUpdate?: (score: number) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onScoreUpdate }) => {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReseed = async () => {
    if (!window.confirm('Reset database to initial demo state? All custom users, policies, and findings will be refreshed.')) {
      return;
    }
    try {
      setSeeding(true);
      const res = await api.reseedDatabase();
      setMessage(res.message);
      const dash = await api.getDashboard();
      if (onScoreUpdate) onScoreUpdate(dash.security_score);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(`Reseed error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          Lab Environment Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage local SQLite database state, re-seed educational datasets, and view platform configuration.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reset & Reseed Card */}
        <Card title="Database Seed Management">
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Populates the local SQLite database with realistic initial IAM users (`admin`, `alice-dev`, `bob-security`, etc.), RBAC groups, policies (`AdministratorAccess`, `DeveloperAccess`), and intentional security flaws.
            </p>

            <button
              onClick={handleReseed}
              disabled={seeding}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-mono font-semibold flex items-center gap-2 transition-colors"
            >
              {seeding ? (
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Reset & Re-seed Database</span>
            </button>
          </div>
        </Card>

        {/* Educational Disclaimer */}
        <Card title="Educational Sandbox Disclaimer">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Educational Simulation Notice:</span>
                <p className="mt-1 text-slate-300">
                  This application is a simulated IAM security lab built strictly for educational auditing, least privilege analysis, and interview demonstrations. It does NOT connect to or modify real production cloud accounts (AWS, GCP, Azure).
                </p>
              </div>
            </div>
            <div className="text-slate-400 text-[11px] font-mono">
              Engine Version: v1.0.0-Lab | Database: SQLite3 | Framework: FastAPI + React Vite
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
