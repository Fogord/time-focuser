import { Rule, LockState } from '../types';

/**
 * Parses "HH:MM" string to minutes from midnight
 */
export const timeStringToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Checks if a rule is currently active at the given date/time
 */
export const isRuleActive = (rule: Rule, date: Date = new Date()): boolean => {
  if (!rule.enabled) return false;

  if (rule.scheduleType === 'always') {
    return true;
  }

  if (rule.scheduleType === 'timer') {
    if (!rule.timerSchedule || !rule.timerSchedule.expiresAt) return false;
    return date.getTime() < rule.timerSchedule.expiresAt;
  }

  if (rule.scheduleType === 'weekly') {
    if (!rule.weeklySchedule) return false;
    const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    if (!rule.weeklySchedule.days.includes(currentDay)) {
      return false;
    }

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = timeStringToMinutes(rule.weeklySchedule.startTime);
    const endMinutes = timeStringToMinutes(rule.weeklySchedule.endTime);

    if (startMinutes <= endMinutes) {
      // Normal range within same day: e.g. 09:00 to 17:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range: e.g. 22:00 to 06:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  return false;
};

/**
 * Computes when a specific active rule's current block period will finish
 */
export const getRuleExpiration = (rule: Rule, date: Date = new Date()): number | null => {
  if (!isRuleActive(rule, date)) return null;

  if (rule.scheduleType === 'always') {
    return null; // never expires
  }

  if (rule.scheduleType === 'timer') {
    return rule.timerSchedule?.expiresAt || null;
  }

  if (rule.scheduleType === 'weekly' && rule.weeklySchedule) {
    const startMinutes = timeStringToMinutes(rule.weeklySchedule.startTime);
    const endMinutes = timeStringToMinutes(rule.weeklySchedule.endTime);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const targetDate = new Date(date);
    targetDate.setSeconds(0, 0);

    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    if (startMinutes <= endMinutes) {
      targetDate.setHours(endH, endM, 0, 0);
      return targetDate.getTime();
    } else {
      // Overnight
      if (currentMinutes >= startMinutes) {
        // Ends tomorrow morning
        targetDate.setDate(targetDate.getDate() + 1);
      }
      targetDate.setHours(endH, endM, 0, 0);
      return targetDate.getTime();
    }
  }

  return null;
};

/**
 * Computes overall LockState for the entire extension
 */
export const computeLockState = (
  rules: Rule[],
  tamperDetected: boolean = false,
  date: Date = new Date()
): LockState => {
  if (tamperDetected) {
    return {
      isLocked: true,
      activeRuleIds: rules.map((r) => r.id),
      lockExpiresAt: null,
      tamperDetected: true,
      lastChecked: date.getTime(),
    };
  }

  const activeRules = rules.filter((r) => isRuleActive(r, date));
  const isLocked = activeRules.length > 0;

  if (!isLocked) {
    return {
      isLocked: false,
      activeRuleIds: [],
      lockExpiresAt: null,
      tamperDetected: false,
      lastChecked: date.getTime(),
    };
  }

  // Find expiration: if any active rule is 'always', block doesn't expire
  let lockExpiresAt: number | null = null;
  let hasAlways = false;

  for (const rule of activeRules) {
    const exp = getRuleExpiration(rule, date);
    if (exp === null) {
      hasAlways = true;
      break;
    }
    if (lockExpiresAt === null || exp > lockExpiresAt) {
      // Lock stays active until ALL currently active rules expire
      lockExpiresAt = exp;
    }
  }

  return {
    isLocked: true,
    activeRuleIds: activeRules.map((r) => r.id),
    lockExpiresAt: hasAlways ? null : lockExpiresAt,
    tamperDetected: false,
    lastChecked: date.getTime(),
  };
};
