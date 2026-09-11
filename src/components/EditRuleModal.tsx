import React, { useState, useEffect } from 'react';
import { Pencil, Shield } from 'lucide-react';
import { MatchType, Rule, ScheduleType } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { WEEK_DAYS_CONFIG } from '../utils/schedule';
import {
  DEFAULT_RULE_START_TIME,
  DEFAULT_RULE_END_TIME,
  DEFAULT_TIMER_DURATION_MINUTES,
} from '../constants';

interface EditRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: Rule | null;
  onSave: (updatedRule: Rule) => void;
}

export const EditRuleModal: React.FC<EditRuleModalProps> = ({ isOpen, onClose, rule, onSave }) => {
  const [name, setName] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('domain');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('weekly');

  // Weekly config
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(DEFAULT_RULE_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_RULE_END_TIME);

  // Timer config
  const [timerDuration, setTimerDuration] = useState<number>(DEFAULT_TIMER_DURATION_MINUTES);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setUrlPattern(rule.urlPattern);
      setMatchType(rule.matchType);
      setScheduleType(rule.scheduleType);

      if (rule.weeklySchedule) {
        setSelectedDays(rule.weeklySchedule.days);
        setStartTime(rule.weeklySchedule.startTime);
        setEndTime(rule.weeklySchedule.endTime);
      } else {
        setSelectedDays([1, 2, 3, 4, 5]);
        setStartTime(DEFAULT_RULE_START_TIME);
        setEndTime(DEFAULT_RULE_END_TIME);
      }

      if (rule.timerSchedule) {
        setTimerDuration(rule.timerSchedule.durationMinutes);
      } else {
        setTimerDuration(DEFAULT_TIMER_DURATION_MINUTES);
      }

      setError(null);
    }
  }, [rule, isOpen]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Keep at least one day
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rule) return;
    setError(null);

    const cleanName = name.trim();
    const cleanPattern = urlPattern.trim();

    if (!cleanName) {
      setError('Please provide a name for this rule.');
      return;
    }

    if (!cleanPattern) {
      setError('Please enter a website URL or pattern.');
      return;
    }

    if (matchType === 'regex') {
      try {
        new RegExp(cleanPattern);
      } catch {
        setError('Invalid regular expression syntax.');
        return;
      }
    }

    const updated: Rule = {
      ...rule,
      name: cleanName,
      urlPattern: cleanPattern,
      matchType,
      scheduleType,
      updatedAt: Date.now(),
    };

    if (scheduleType === 'weekly') {
      updated.weeklySchedule = {
        days: selectedDays,
        startTime,
        endTime,
      };
      delete updated.timerSchedule;
    } else if (scheduleType === 'timer') {
      updated.timerSchedule = {
        durationMinutes: timerDuration,
        expiresAt: Date.now() + timerDuration * 60 * 1000,
      };
      delete updated.weeklySchedule;
    } else {
      delete updated.weeklySchedule;
      delete updated.timerSchedule;
    }

    onSave(updated);
    onClose();
  };

  if (!rule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Rule: ${rule.name}`}
      icon={<Pencil className="w-5 h-5 text-indigo-400" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 font-medium">
            {error}
          </div>
        )}

        {/* Rule Name */}
        <Input
          label="Rule Name"
          placeholder="e.g., Social Media, Streaming, Reddit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        {/* URL Pattern & Match Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Target URL or Domain"
              placeholder="e.g. twitter.com or https://..."
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              monospace
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Match Type</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as MatchType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500/80 transition-all"
            >
              <option value="domain">Domain</option>
              <option value="exact">Exact URL</option>
              <option value="wildcard">Wildcard</option>
              <option value="regex">Regex</option>
            </select>
          </div>
        </div>

        {/* Match type helper explanation */}
        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          {matchType === 'domain' &&
            'Matches the entire domain and any subdomains (e.g., twitter.com, mobile.twitter.com).'}
          {matchType === 'exact' && 'Only blocks when the exact full URL is visited.'}
          {matchType === 'wildcard' && 'Uses wildcard pattern matching (e.g., *://*.reddit.com/*).'}
          {matchType === 'regex' &&
            'Applies a full regular expression match against the entire URL.'}
        </div>

        {/* Schedule Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Block Schedule</label>
          <div className="grid grid-cols-3 gap-2">
            {(['weekly', 'timer', 'always'] as ScheduleType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setScheduleType(type)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                  scheduleType === type
                    ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                {type === 'weekly' && 'Weekly Hours'}
                {type === 'timer' && 'Focus Timer'}
                {type === 'always' && 'Always Block'}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Config: Weekly */}
        {scheduleType === 'weekly' && (
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Active Days</label>
              <div className="flex gap-1.5">
                {WEEK_DAYS_CONFIG.map((d) => {
                  const isSelected = selectedDays.includes(d.day);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => toggleDay(d.day)}
                      title={d.title}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/60'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Time (24h)</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Time (24h)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Schedule Config: Timer */}
        {scheduleType === 'timer' && (
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="block text-xs text-slate-400 font-medium">Duration (minutes)</label>
            <div className="flex gap-2">
              {[15, 25, 45, 60, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimerDuration(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    timerDuration === m
                      ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Saving will activate a {timerDuration}-minute focus block for this rule.
            </p>
          </div>
        )}

        {/* Always explanation */}
        {scheduleType === 'always' && (
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
            This rule will block the site 24/7 continuously until manually modified during an
            unlocked period.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<Shield className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
