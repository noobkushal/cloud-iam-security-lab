import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { IdentitiesPage } from './pages/IdentitiesPage';
import { IdentityDetailPage } from './pages/IdentityDetailPage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { PolicyDetailPage } from './pages/PolicyDetailPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { FindingsPage } from './pages/FindingsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';

export const AppContent: React.FC = () => {
  const [securityScore, setSecurityScore] = useState<number>(100);
  const [openFindingsCount, setOpenFindingsCount] = useState<number>(0);

  const refreshScore = async () => {
    try {
      const data = await api.getDashboard();
      setSecurityScore(data.security_score);
      const openCount = data.security_findings.filter((f) => f.status === 'OPEN').length;
      setOpenFindingsCount(openCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshScore();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex">
        {/* Sidebar */}
        <Sidebar openFindingsCount={openFindingsCount} />

        {/* Main Wrapper */}
        <div className="flex-1 ml-64 flex flex-col min-w-0">
          {/* Header */}
          <Header securityScore={securityScore} onRefresh={refreshScore} />

          {/* Page Container */}
          <main className="p-8 mt-16 max-w-7xl w-full mx-auto flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardPage
                    onScoreUpdate={setSecurityScore}
                    onOpenFindingsChange={setOpenFindingsCount}
                  />
                }
              />
              <Route path="/identities" element={<IdentitiesPage />} />
              <Route path="/identities/:id" element={<IdentityDetailPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:id" element={<GroupDetailPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/policies/:id" element={<PolicyDetailPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route
                path="/findings"
                element={
                  <FindingsPage
                    onScoreUpdate={setSecurityScore}
                    onOpenFindingsChange={setOpenFindingsCount}
                  />
                }
              />
              <Route path="/simulator" element={<SimulatorPage currentActor="admin" />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage onScoreUpdate={setSecurityScore} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
};
