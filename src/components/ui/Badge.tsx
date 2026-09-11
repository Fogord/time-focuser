import React from 'react';
import { MatchType } from '../../types';

export type BadgeVariant =
  MatchType | 'active' | 'scheduled' | 'disabled' | 'success' | 'danger' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  pulse = false,
  children,
  className = '',
}) => {
  const styles: Record<BadgeVariant, string> = {
    domain: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    exact: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    wildcard: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    regex: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    active: 'bg-red-500/20 border-red-500/40 text-red-300 font-bold',
    scheduled: 'bg-slate-800 border-slate-700 text-slate-300',
    disabled: 'bg-slate-950 border-slate-800 text-slate-500',
    success: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
    danger: 'bg-red-950/60 border-red-500/50 text-red-300',
    neutral: 'bg-slate-900 border-slate-800 text-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold select-none ${styles[variant]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
      {children}
    </span>
  );
};
