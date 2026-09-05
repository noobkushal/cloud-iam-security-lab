import React from 'react';
import { Severity, RiskLevel } from '../../types';

interface BadgeProps {
  variant?: Severity | RiskLevel | 'ALLOWED' | 'DENIED' | 'OPEN' | 'REMEDIATED' | string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'INFO', children, size = 'sm' }) => {
  const getColors = () => {
    switch (variant?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ALLOWED':
      case 'SUCCESS':
      case 'REMEDIATED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DENIED':
      case 'FAILURE':
      case 'OPEN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'INFO':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-mono font-medium',
    md: 'px-2.5 py-1 text-xs font-mono font-semibold',
    lg: 'px-3 py-1.5 text-sm font-mono font-bold'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${getColors()} ${sizeClasses[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children}
    </span>
  );
};
