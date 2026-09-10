import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Rule } from '../types';
import { matchesRule } from '../background/firewall';
import { isRuleActive } from '../background/scheduler';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TestUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: Rule[];
}

export const TestUrlModal: React.FC<TestUrlModalProps> = ({ isOpen, onClose, rules }) => {
  const [testUrl, setTestUrl] = useState('');
  const [result, setResult] = useState<{
    tested: boolean;
    isBlocked: boolean;
    matchingRule?: Rule;
    isRuleCurrentlyActive?: boolean;
  }>({ tested: false, isBlocked: false });

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = testUrl.trim();
    if (!cleanUrl) return;

    // Ensure scheme for URL parsing if missing
    let urlToEvaluate = cleanUrl;
    if (!/^https?:\/\//i.test(urlToEvaluate)) {
      urlToEvaluate = 'https://' + urlToEvaluate;
    }

    const matched = rules.find((r) => r.enabled && matchesRule(urlToEvaluate, r));
    const isCurrentlyActive = matched ? isRuleActive(matched) : false;

    setResult({
      tested: true,
      isBlocked: !!matched && isCurrentlyActive,
      matchingRule: matched,
      isRuleCurrentlyActive: isCurrentlyActive,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firewall URL Tester"
      icon={<Search className="w-5 h-5 text-blue-400" />}
      maxWidth="md"
    >
      <div className="p-6 space-y-4">
        <form onSubmit={handleTest} className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Enter any URL to test against your firewall rules:
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. reddit.com/r/webdev or https://instagram.com"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                monospace
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-600/30 shrink-0"
            >
              Test URL
            </Button>
          </div>
        </form>

        {result.tested && (
          <div className="pt-2">
            {result.isBlocked ? (
              <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-4 text-red-200 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-100">Access Would Be Blocked Right Now</h4>
                  <p className="text-xs text-red-300/90 mt-1">
                    Matched active rule: <strong className="text-red-100">{result.matchingRule?.name}</strong> (
                    {result.matchingRule?.matchType} pattern: <code className="font-mono bg-red-950 px-1 py-0.5 rounded">{result.matchingRule?.urlPattern}</code>).
                  </p>
                </div>
              </div>
            ) : result.matchingRule && !result.isRuleCurrentlyActive ? (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-100">Rule Matches, but Schedule Is Inactive</h4>
                  <p className="text-xs text-amber-300/90 mt-1">
                    Matched rule: <strong className="text-amber-100">{result.matchingRule?.name}</strong>, but the current time does not fall within its active blocking hours.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-100">Access Permitted</h4>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    No active rules match this URL. The page would load normally.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
