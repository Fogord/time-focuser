import React from 'react';
import { ExternalLink, Lock, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { usePopup } from './usePopup';
import { WatchIcon } from '../components/WatchIcon';
import { Button } from '../components/ui/Button';

export const Popup: React.FC = () => {
  const {
    rules,
    lockState,
    countdown,
    startQuickTimer,
    openDashboard,
  } = usePopup();

  return (
    <div className="w-[360px] bg-slate-950 text-slate-100 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <WatchIcon className="w-6 h-6 shrink-0" />
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-100">TimeFocuser</h1>
            <p className="text-[10px] text-slate-400">Site Firewall</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openDashboard}
          title="Open Dashboard"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Main Status Display */}
      <div className="my-4">
        {lockState.tamperDetected ? (
          <div className="bg-red-950/70 border border-red-500/50 rounded-xl p-3 text-red-200 flex items-start gap-2.5 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-red-100">Tamper Detected!</div>
              <p className="text-[11px] text-red-300 mt-0.5">
                Local file manipulation detected. Failsafe lockdown is engaged.
              </p>
            </div>
          </div>
        ) : lockState.isLocked ? (
          <div className="bg-gradient-to-br from-red-950/60 via-slate-900 to-red-950/40 border border-red-500/40 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-300 tracking-wide uppercase">
                  Firewall Active
                </span>
              </div>
              <Lock className="w-4 h-4 text-red-400" />
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Active Rules Locked</span>
              {countdown ? (
                <span className="font-mono text-sm font-semibold text-red-200 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                  {countdown}
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-300">Always Active</span>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
              <span>Blocking:</span>
              <span className="text-slate-200 font-medium">
                {lockState.activeRuleIds.length} active {lockState.activeRuleIds.length === 1 ? 'rule' : 'rules'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                  Standby Mode
                </span>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-1.5">
              Firewall is idle. Settings can currently be modified in the Dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!lockState.isLocked && !lockState.tamperDetected && rules.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Quick Focus Session (Locks Settings):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="xs"
              variant="secondary"
              onClick={() => startQuickTimer(25)}
              className="py-1.5 hover:border-red-500/50"
            >
              25m Pomodoro
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => startQuickTimer(60)}
              className="py-1.5 hover:border-red-500/50"
            >
              60m Deep Work
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard Button */}
      <Button
        variant="secondary"
        size="md"
        onClick={openDashboard}
        className="w-full justify-center"
        icon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
      >
        Open Rules Dashboard
      </Button>
    </div>
  );
};
