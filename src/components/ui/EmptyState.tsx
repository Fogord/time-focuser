import React from 'react';
import { Shield } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Shield className="w-10 h-10 text-slate-600" />,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center select-none ${className}`}
    >
      <div className="flex justify-center mb-3 text-slate-600">{icon}</div>
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};
