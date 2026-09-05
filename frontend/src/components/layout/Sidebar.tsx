import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  UserCheck,
  FileCode2,
  HardDrive,
  AlertTriangle,
  PlaySquare,
  History,
  Settings,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface SidebarProps {
  openFindingsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ openFindingsCount = 0 }) => {
  const { currentActor, roleType, roleBadgeColor } = useRole();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Identities', path: '/identities', icon: Users },
    { label: 'Groups', path: '/groups', icon: UserCheck },
    { label: 'Policies', path: '/policies', icon: FileCode2 },
    { label: 'Resources', path: '/resources', icon: HardDrive },
    { 
      label: 'Security Findings', 
      path: '/findings', 
      icon: AlertTriangle,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined 
    },
    { label: 'IAM Simulator', path: '/simulator', icon: PlaySquare },
    { label: 'Audit Logs', path: '/audit-logs', icon: History },
    { label: 'Lab Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0D1322] border-r border-[#1F293D] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1F293D] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide">Cloud IAM</h1>
          <p className="text-[11px] font-mono text-cyan-400">Security Audit Lab</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold text-slate-400 tracking-wider uppercase flex items-center justify-between">
          <span>Navigation Scope</span>
          <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border ${roleBadgeColor}`}>
            {roleType}
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-[#151D2E] hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role Notice Footer */}
      <div className="p-4 border-t border-[#1F293D] bg-[#111827]/60 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300 font-mono mb-1">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Role: <strong className="text-cyan-400">{currentActor}</strong></span>
        </div>
        <div className="text-[10px] text-slate-400">
          UI controls adapt to active role authorization scope.
        </div>
      </div>
    </aside>
  );
};
