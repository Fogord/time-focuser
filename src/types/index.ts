export type MatchType = 'domain' | 'exact' | 'wildcard' | 'regex';

export type ScheduleType = 'weekly' | 'timer' | 'always';

export interface WeeklySchedule {
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // 'HH:MM' 24-hour format
  endTime: string; // 'HH:MM' 24-hour format
}

export interface TimerSchedule {
  durationMinutes: number;
  expiresAt: number; // UTC timestamp in milliseconds
}

export interface Rule {
  id: string;
  name: string;
  urlPattern: string;
  matchType: MatchType;
  scheduleType: ScheduleType;
  weeklySchedule?: WeeklySchedule;
  timerSchedule?: TimerSchedule;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface QuickFocusSession {
  expiresAt: number; // UTC timestamp in milliseconds
  durationMinutes: number;
  startedAt: number;
  ruleIds: string[]; // specific rule IDs or ['*'] for all rules
}

export interface LockState {
  isLocked: boolean;
  activeRuleIds: string[];
  lockExpiresAt: number | null; // Earliest timestamp when block ends, or null if perpetual
  tamperDetected: boolean;
  lastChecked: number;
  quickFocusSession?: QuickFocusSession | null;
}

export interface EncryptedStore {
  version: number;
  iv: string;
  ciphertext: string;
  hmac: string;
  timestamp: number;
}

export interface FocusStats {
  totalFocusMinutes: number;
  sessionsCompleted: number;
  blocksIntercepted: number;
  firstInstalledAt: number;
  lastActiveAt: number;
}

export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'GET_STATS' }
  | { type: 'RESET_STATS' }
  | { type: 'SAVE_RULES'; payload: { rules: Rule[] } }
  | { type: 'ADD_RULE'; payload: { rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_RULE'; payload: { rule: Rule } }
  | { type: 'DELETE_RULE'; payload: { ruleId: string } }
  | { type: 'TOGGLE_RULE'; payload: { ruleId: string; enabled: boolean } }
  | { type: 'START_TIMER'; payload: { ruleId: string; durationMinutes: number } }
  | { type: 'START_QUICK_FOCUS'; payload: { ruleIds: string[]; durationMinutes: number } }
  | { type: 'CHECK_URL'; payload: { url: string } };

export interface ExtensionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
