import React from 'react';
import { Lock, Clock, ExternalLink, XCircle } from 'lucide-react';
import { useBlockedScreen } from './useBlockedScreen';
import { WatchIcon } from '../components/WatchIcon';
import { Button } from '../components/ui/Button';

export const BlockedScreen: React.FC = () => {
  const {
    blockedUrl,
    ruleName,
    countdown,
    closeTab,
    openDashboard,
  } = useBlockedScreen();

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl shadow-red-950/40 text-center space-y-6 relative overflow-hidden backdrop-blur-xl">
      {/* Background glowing gradient effects */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Animated Glowing Watch Dial Icon */}
      <div className="relative inline-flex items-center justify-center p-3 bg-gradient-to-b from-red-500/20 to-red-950/40 border border-red-500/40 rounded-3xl shadow-xl shadow-red-900/30">
        <WatchIcon className="w-20 h-20 animate-pulse" />
        <div className="absolute -bottom-1 -right-1 p-1.5 bg-slate-950 rounded-full border border-red-500/50">
          <Lock className="w-4 h-4 text-red-400" />
        </div>
      </div>

      {/* Headings */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Access Blocked by Firewall
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          TimeFocuser has intercepted this page. Stay dedicated to your deep work session.
        </p>
      </div>

      {/* Blocked Target & Rule Details Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <span className="text-xs text-slate-400 font-medium">Triggered Rule:</span>
          <span className="text-xs font-semibold text-red-300 bg-red-950/60 border border-red-500/30 px-2.5 py-0.5 rounded-full">
            {ruleName}
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 block mb-1">Attempted Destination:</span>
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
            {blockedUrl}
          </div>
        </div>

        {countdown && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span>Unlocks in:</span>
            </span>
            <span className="font-mono font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Granular Lockdown Notice */}
      <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-300/90 text-left space-y-1">
        <div className="font-semibold text-red-200 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Active Rule Locked</span>
        </div>
        <p className="text-[11px] text-red-300/80">
          This rule cannot be disabled, edited, or bypassed while actively blocking. You can still add new rules from the dashboard anytime.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={closeTab}
          icon={<XCircle className="w-4 h-4" />}
          className="w-full sm:w-auto px-6"
        >
          Close This Tab
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={openDashboard}
          icon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
          className="w-full sm:w-auto px-5"
        >
          View Rules Dashboard
        </Button>
      </div>
    </div>
  );
};
