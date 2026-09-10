import { Rule } from '../types';

import { DAYS_SHORT, WEEK_DAYS_CONFIG } from '../constants';

export { DAYS_SHORT, WEEK_DAYS_CONFIG };

/**
 * Formats millisecond duration into HH:MM:SS
 */
export const formatDuration = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export interface ScheduleDescription {
  kind: 'always' | 'timer' | 'weekly' | 'none';
  text: string;
  textColor: string;
}

/**
 * Returns user-friendly summary of a rule's schedule
 */
export const getScheduleDescription = (rule: Rule): ScheduleDescription => {
  if (rule.scheduleType === 'always') {
    return {
      kind: 'always',
      text: 'Always Blocked (24/7)',
      textColor: 'text-amber-400',
    };
  }

  if (rule.scheduleType === 'timer' && rule.timerSchedule) {
    const diff = rule.timerSchedule.expiresAt - Date.now();
    const isRunning = diff > 0;
    const minutesLeft = Math.max(0, Math.ceil(diff / 60000));
    return {
      kind: 'timer',
      text: isRunning ? `Timer: ${minutesLeft} min remaining` : 'Timer Finished',
      textColor: 'text-indigo-400',
    };
  }

  if (rule.scheduleType === 'weekly' && rule.weeklySchedule) {
    const { days, startTime, endTime } = rule.weeklySchedule;
    const daysStr = days.map((d) => DAYS_SHORT[d]).join(', ');
    return {
      kind: 'weekly',
      text: `${daysStr} • ${startTime} - ${endTime}`,
      textColor: 'text-slate-400',
    };
  }

  return {
    kind: 'none',
    text: 'No schedule configured',
    textColor: 'text-slate-500',
  };
};
