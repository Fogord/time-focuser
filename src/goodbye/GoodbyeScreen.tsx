import React from 'react';
import { WatchIcon } from '../components/WatchIcon';
import { useGoodbyeScreen } from './useGoodbyeScreen';
import { Clock, Shield, Award, Calendar, RefreshCw, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';

import { FEEDBACK_OPTIONS as feedbackOptions } from '../constnats';

export const GoodbyeScreen: React.FC = () => {
  const {
    stats,
    daysActive,
    formattedFocusTime,
    hoursFocused,
    booksEquivalent,
    walksEquivalent,
    selectedFeedback,
    feedbackStatus,
    feedbackSubmitted,
    message,
    setMessage,
    submitFeedback,
    handleSubmit,
    handleReinstall,
  } = useGoodbyeScreen();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-red-500/30">
      <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-500">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl shadow-red-950/20">
            <WatchIcon className="w-16 h-16 drop-shadow-md" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Your Focus Journey
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            We’re sorry to see you go! Before you leave, here is the focus and uninterrupted time
            you reclaimed with <span className="text-red-400 font-semibold">TimeFocuser</span>:
          </p>
        </div>

        {/* Primary Milestone Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Focused Time */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-red-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="flex items-center justify-between text-red-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Focused Time
              </span>
              <Clock className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {formattedFocusTime}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ~{hoursFocused} total hours kept away from distractions
            </p>
          </div>

          {/* Card 2: Distractions Blocked */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-red-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Firewall Blocks
              </span>
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {stats.blocksIntercepted.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Times you were prevented from opening distracting sites
            </p>
          </div>

          {/* Card 3: Deep Work Sessions */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-red-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Focus Sessions
              </span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {stats.sessionsCompleted.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Dedicated work sprints completed
            </p>
          </div>

          {/* Card 4: Days Active */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-red-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shield Duration
              </span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {daysActive} {daysActive === 1 ? 'Day' : 'Days'}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Of disciplined browsing & attention protection
            </p>
          </div>
        </div>

        {/* Real-World Impact Callout */}
        <div className="bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-900 border border-red-900/30 rounded-xl p-5 text-sm text-slate-300 flex items-start gap-4">
          <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400 shrink-0 mt-0.5">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-1">Perspective on your time</div>
            <p className="text-slate-400 leading-relaxed">
              Spending <span className="text-slate-200 font-medium">{formattedFocusTime}</span> focused
              is roughly equivalent to reading{' '}
              <span className="text-red-300 font-medium">~{booksEquivalent} books 📚</span> or taking{' '}
              <span className="text-red-300 font-medium">~{walksEquivalent} long walks in nature 🌲</span>{' '}
              free from algorithmic feeds. Every minute you protected mattered.
            </p>
          </div>
        </div>

        {/* Exit Feedback Poll (Submits directly to Google Docs / Google Sheet) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Quick Feedback (Optional)
            </h2>
            <span className="text-xs text-slate-500">Recorded to Google Docs</span>
          </div>

          {feedbackStatus === 'submitting' && (
            <div className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-lg flex items-center gap-3 text-slate-300 text-sm">
              <Loader2 className="w-5 h-5 text-red-400 animate-spin shrink-0" />
              <span>Sending feedback ({selectedFeedback}) to Google Docs...</span>
            </div>
          )}

          {feedbackStatus === 'success' && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Thank you! Your feedback ({selectedFeedback}) has been saved to Google Docs.
              </span>
            </div>
          )}

          {feedbackStatus === 'error' && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-lg flex items-center gap-3 text-slate-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Thank you for your feedback ({selectedFeedback})!
              </span>
            </div>
          )}

          {!feedbackSubmitted && feedbackStatus !== 'submitting' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400">Quick reasons:</span>
                <div className="flex flex-wrap gap-2">
                  {feedbackOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => submitFeedback(option)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700/60 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-800/60">

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Message / Feature Request
                    </label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What can we improve or add?"
                      className="w-full text-xs px-3 py-2 bg-slate-800/60 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 transition-colors"
                    />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={!message.trim()}
                    icon={<Send className="w-3.5 h-3.5 text-red-400" />}
                    className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 text-xs px-4"
                  >
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleReinstall}
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto px-8"
          >
            Reinstall TimeFocuser
          </Button>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-600 pt-4">
          TimeFocuser — Zero Telemetry, 100% In-Browser Cryptographic Site Firewall
        </div>
      </div>
    </div>
  );
};
