import React, { useState, useMemo } from 'react';
import { Zap, CheckSquare, Square, Search, ShieldCheck } from 'lucide-react';
import { Rule } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: Rule[];
  onStart: (ruleIds: string[], durationMinutes: number) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  rules,
  onStart,
}) => {
  const [mode, setMode] = useState<'all' | 'some'>('all');
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // When opening or switching to 'some', default selected to all enabled rules if empty
  const handleModeChange = (newMode: 'all' | 'some') => {
    setMode(newMode);
    if (newMode === 'some' && selectedRuleIds.length === 0) {
      setSelectedRuleIds(rules.map((r) => r.id));
    }
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRuleIds(rules.map((r) => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedRuleIds([]);
  };

  const filteredRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) => r.name.toLowerCase().includes(q) || r.urlPattern.toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  const handleStartSession = () => {
    if (mode === 'all') {
      onStart(['*'], 60);
    } else {
      if (selectedRuleIds.length === 0) return;
      onStart(selectedRuleIds, 60);
    }
    onClose();
  };

  const selectedCount = mode === 'all' ? rules.length : selectedRuleIds.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Focus Session (1 Hour)"
      icon={<Zap className="w-5 h-5 text-amber-400" />}
      maxWidth="md"
    >
      <div className="p-5 space-y-4">
        {/* Mode Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Choose Scope for 1-Hour Focus:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                mode === 'all'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">All Rules (1H)</span>
                <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                  {rules.length} sites
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instantly block all configured sites for 60 minutes.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('some')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                mode === 'some'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Some Rules (1H)</span>
                <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                  Select with checkboxes
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pick specific sites to block with checkboxes.
              </p>
            </button>
          </div>
        </div>

        {/* Checkbox selector when mode is 'some' */}
        {mode === 'some' && (
          <div className="space-y-2 border border-slate-800/90 rounded-xl p-3 bg-slate-950/40">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <span className="text-xs text-slate-300 font-medium">
                Select sites to block ({selectedRuleIds.length} of {rules.length} selected):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Select All
                </button>
                <span className="text-slate-600 text-xs">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Filter */}
            {rules.length > 5 && (
              <Input
                placeholder="Filter rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
                className="text-xs py-1.5"
              />
            )}

            {/* Rule Checkbox List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 pt-1">
              {filteredRules.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">No matching rules</div>
              ) : (
                filteredRules.map((rule) => {
                  const isChecked = selectedRuleIds.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleRule(rule.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-amber-950/30 border-amber-500/40 text-slate-100'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate text-slate-200">
                            {rule.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {rule.urlPattern}
                          </div>
                        </div>
                      </div>
                      <Badge variant={rule.matchType}>{rule.matchType}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Informative Guarantee */}
        <div className="flex items-start gap-2 p-3 bg-emerald-950/25 border border-emerald-500/30 rounded-xl text-emerald-300/90 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Preserves your settings:</strong> Quick Focus will not overwrite your manual
            rule configurations or weekly schedules. When the 1 hour expires, all rules
            automatically revert to their configured settings.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={selectedCount === 0}
            onClick={handleStartSession}
            icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
            className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold"
          >
            Start 1H Focus ({selectedCount} {selectedCount === 1 ? 'rule' : 'rules'})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
