import React from 'react';
import { Trash2, Power, Lock, Clock, Calendar } from 'lucide-react';
import { Rule } from '../types';
import { Badge } from './ui/Badge';
import { getScheduleDescription } from '../utils/schedule';

interface RuleCardProps {
  rule: Rule;
  isActiveNow: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  isActiveNow,
  onToggle,
  onDelete,
}) => {
  const scheduleInfo = getScheduleDescription(rule);

  return (
    <div
      className={`rounded-xl border transition-all p-4 relative ${
        !rule.enabled
          ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
          : isActiveNow
          ? 'bg-gradient-to-r from-red-950/40 via-slate-900/80 to-slate-900/90 border-red-500/40 shadow-md shadow-red-950/20'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row: title and badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-slate-100 text-sm truncate">{rule.name}</h3>

            <Badge variant={rule.matchType}>{rule.matchType}</Badge>

            {isActiveNow && rule.enabled && (
              <Badge variant="active" pulse>
                BLOCKING NOW
              </Badge>
            )}
            {!isActiveNow && rule.enabled && (
              <Badge variant="scheduled">Scheduled</Badge>
            )}
            {!rule.enabled && (
              <Badge variant="disabled">Disabled</Badge>
            )}
          </div>

          {/* URL pattern display */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 max-w-full overflow-x-auto">
              {rule.urlPattern}
            </div>
          </div>

          {/* Schedule summary */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {scheduleInfo.kind === 'weekly' ? (
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Clock className={`w-3.5 h-3.5 ${scheduleInfo.textColor}`} />
            )}
            <span className={scheduleInfo.textColor}>{scheduleInfo.text}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Toggle Rule */}
          <button
            type="button"
            disabled={isActiveNow}
            onClick={() => onToggle(rule.id, !rule.enabled)}
            title={
              isActiveNow
                ? 'Cannot disable this rule while it is actively blocking'
                : rule.enabled
                ? 'Disable rule'
                : 'Enable rule'
            }
            className={`p-2 rounded-lg transition-colors border ${
              isActiveNow
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : rule.enabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {isActiveNow ? <Lock className="w-4 h-4 text-red-400" /> : <Power className="w-4 h-4" />}
          </button>

          {/* Delete Rule */}
          <button
            type="button"
            disabled={isActiveNow}
            onClick={() => onDelete(rule.id)}
            title={
              isActiveNow
                ? 'Cannot delete this rule while it is actively blocking'
                : 'Delete rule'
            }
            className={`p-2 rounded-lg transition-colors border ${
              isActiveNow
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400'
            }`}
          >
            {isActiveNow ? <Lock className="w-4 h-4 text-red-400" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
