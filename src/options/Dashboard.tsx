import React from 'react';
import { Plus, Search, KeyRound, FileKey2, Clock, RefreshCw, Award, Zap } from 'lucide-react';
import { useDashboard } from './useDashboard';
import { isRuleActive, isRuleQuickFocused } from '../background/scheduler';
import { useCountdown } from '../hooks/useCountdown';
import { LockBanner } from '../components/LockBanner';
import { RuleCard } from '../components/RuleCard';
import { AddRuleModal } from '../components/AddRuleModal';
import { EditRuleModal } from '../components/EditRuleModal';
import { QuickActionModal } from '../components/QuickActionModal';
import { TestUrlModal } from '../components/TestUrlModal';
import { WatchIcon } from '../components/WatchIcon';
import { Button, Input, EmptyState } from '../components/ui';

export const Dashboard: React.FC = () => {
  const {
    isExtensionEnv,
    rules,
    lockState,
    searchQuery,
    setSearchQuery,
    filteredRules,
    activeBlockingCount,
    currentTime,
    errorMessage,
    setErrorMessage,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRule,
    setEditingRule,
    isQuickModalOpen,
    setIsQuickModalOpen,
    isTestModalOpen,
    setIsTestModalOpen,
    handleAddRule,
    handleEditClick,
    handleUpdateRule,
    handleToggleRule,
    handleDeleteRule,
    handleStartQuickFocusSession,
    handleReloadExtension,
  } = useDashboard();

  const { countdown } = useCountdown(lockState.quickFocusSession?.expiresAt ?? null);

  const handleOpenGoodbyePreview = () => {
    if (isExtensionEnv && typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      window.open(chrome.runtime.getURL('src/goodbye/index.html'), '_blank');
    } else {
      window.open('/src/goodbye/index.html', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <WatchIcon className="w-10 h-10 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  TimeFocuser
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                  Firewall
                </span>
                {!isExtensionEnv && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                    Dev Mode (HMR)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Strict Anti-Circumvention Site Blocker</p>
            </div>
          </div>

          {/* Clock, Encryption Badge, Focus Journey & Reload */}
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-1.5 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={handleOpenGoodbyePreview}
              title="Preview the Focus Journey / Post-Uninstall Summary page"
              icon={<Award className="w-3.5 h-3.5 text-amber-400" />}
              className="bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
            >
              Focus Journey
            </Button>

            <div className="hidden md:flex items-center gap-1 text-[11px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg">
              <KeyRound className="w-3 h-3 text-emerald-400" />
              <span>AES-256-GCM Secure</span>
            </div>

            {isExtensionEnv && (
              <Button
                variant="secondary"
                size="xs"
                onClick={handleReloadExtension}
                title="Force reload extension and background service worker from disk"
                icon={<RefreshCw className="w-3 h-3 text-indigo-400" />}
                className="bg-indigo-950/60 hover:bg-indigo-900/80 border-indigo-500/40 text-indigo-300"
              >
                Reload Extension
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Error notification banner if action was rejected */}
        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <span>{errorMessage}</span>
              {errorMessage.includes('SETTINGS_LOCKED') && isExtensionEnv && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleReloadExtension}
                  icon={<RefreshCw className="w-3 h-3" />}
                >
                  Reload Service Worker Now
                </Button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Focus Session Active Banner (Visible on settings page) */}
        {lockState.quickFocusSession && (
          <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/50 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-amber-200">
                    Quick Focus Session Active (1 Hour)
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Enforcing
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Blocking{' '}
                  {lockState.quickFocusSession.ruleIds.includes('*')
                    ? `all ${rules.length} configured rules`
                    : `${lockState.quickFocusSession.ruleIds.length} selected rules`}
                  . Your underlying manual schedules and settings remain preserved and will resume
                  automatically.
                </p>
              </div>
            </div>

            {countdown && (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400 font-medium">Remaining:</span>
                <span className="font-mono text-sm font-bold text-amber-200">{countdown}</span>
              </div>
            )}
          </div>
        )}

        {/* Security Tamper Alert (Only renders if storage corruption/tamper is detected) */}
        <LockBanner lockState={lockState} />

        {/* Control & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search rules by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsQuickModalOpen(true)}
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
              className="hover:border-amber-500/50 text-amber-200"
            >
              Quick Focus (1H)
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsTestModalOpen(true)}
              icon={<Search className="w-3.5 h-3.5" />}
            >
              Test URL
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add New Rule
            </Button>
          </div>
        </div>

        {/* Rules List Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-semibold text-slate-200">
            Configured Rules ({filteredRules.length})
          </h2>
          <span className="text-xs text-slate-400">{activeBlockingCount} Currently Blocking</span>
        </div>

        {/* Rules Grid / List */}
        {filteredRules.length === 0 ? (
          <EmptyState
            title="No rules found"
            description={
              searchQuery
                ? 'Try adjusting your search query.'
                : 'Click "Add New Rule" above to create your first website firewall rule.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => {
              const isQuickFocused = isRuleQuickFocused(
                rule.id,
                lockState.quickFocusSession,
                currentTime
              );
              const isActiveNow =
                (rule.enabled || isQuickFocused) &&
                isRuleActive(rule, currentTime, lockState.quickFocusSession);

              return (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  isActiveNow={isActiveNow}
                  isQuickFocused={isQuickFocused}
                  onToggle={handleToggleRule}
                  onDelete={handleDeleteRule}
                  onEdit={handleEditClick}
                />
              );
            })}
          </div>
        )}

        {/* Security & Anti-Tamper Architecture Details */}
        <div className="pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <FileKey2 className="w-4 h-4 text-emerald-400" />
              <span>Anti-Tamper & Security Guarantees</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <span className="font-medium text-slate-300 block">
                  Non-Extractable Crypto Keys
                </span>
                <p className="text-[11px] text-slate-500">
                  Encryption keys are generated inside isolated browser IndexedDB with{' '}
                  <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">
                    extractable: false
                  </code>
                  , making them inaccessible to external desktop programs.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-300 block">AES-GCM + HMAC-SHA256</span>
                <p className="text-[11px] text-slate-500">
                  Stored settings are encrypted with AES-256-GCM and signed with an HMAC digest.
                  Manual file modifications on disk will invalidate the hash and trigger failsafe
                  lock.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-300 block">
                  Granular Anti-Circumvention
                </span>
                <p className="text-[11px] text-slate-500">
                  Actively blocking rules cannot be modified, turned off, or removed while their
                  schedule is enforcing. You can add new rules anytime without interrupting active
                  blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRule}
      />

      <EditRuleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        onSave={handleUpdateRule}
      />

      <QuickActionModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        rules={rules}
        onStart={handleStartQuickFocusSession}
      />

      <TestUrlModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        rules={rules}
      />
    </div>
  );
};
