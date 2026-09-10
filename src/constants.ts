import { Rule, FocusStats } from './types';

// ============================================================================
// Schedule & Time Constants
// ============================================================================

export const ALARM_NAME = 'timefocuser_schedule_alarm';

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WEEK_DAYS_CONFIG = [
    { label: 'S', day: 0, title: 'Sunday' },
    { label: 'M', day: 1, title: 'Monday' },
    { label: 'T', day: 2, title: 'Tuesday' },
    { label: 'W', day: 3, title: 'Wednesday' },
    { label: 'T', day: 4, title: 'Thursday' },
    { label: 'F', day: 5, title: 'Friday' },
    { label: 'S', day: 6, title: 'Saturday' },
];

export const DEFAULT_RULE_START_TIME = '09:00';
export const DEFAULT_RULE_END_TIME = '09:15';
export const DEFAULT_TIMER_DURATION_MINUTES = 15;

// ============================================================================
// Default Firewall Rules
// (All major social media, short-form video & distraction feeds with 15m default window)
// ============================================================================

export const DEFAULT_RULES: Rule[] = [
    {
        id: 'default-youtube-shorts',
        name: 'YouTube Shorts',
        urlPattern: '*://*.youtube.com/shorts*',
        matchType: 'wildcard',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-instagram',
        name: 'Instagram',
        urlPattern: 'instagram.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-tiktok',
        name: 'TikTok',
        urlPattern: 'tiktok.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-twitter-x',
        name: 'X / Twitter',
        urlPattern: 'x.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-reddit',
        name: 'Reddit',
        urlPattern: 'reddit.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-facebook',
        name: 'Facebook',
        urlPattern: 'facebook.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-twitch',
        name: 'Twitch',
        urlPattern: 'twitch.tv',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-netflix',
        name: 'Netflix',
        urlPattern: 'netflix.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-threads',
        name: 'Threads',
        urlPattern: 'threads.net',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-pinterest',
        name: 'Pinterest',
        urlPattern: 'pinterest.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-discord',
        name: 'Discord Web',
        urlPattern: 'discord.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-9gag',
        name: '9GAG',
        urlPattern: '9gag.com',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
    {
        id: 'default-bsky',
        name: 'Bluesky',
        urlPattern: 'bsky.app',
        matchType: 'domain',
        scheduleType: 'weekly',
        weeklySchedule: {
            days: [1, 2, 3, 4, 5],
            startTime: DEFAULT_RULE_START_TIME,
            endTime: DEFAULT_RULE_END_TIME,
        },
        enabled: true,
        createdAt: 1710000000000,
        updatedAt: 1710000000000,
    },
];

// Alias for dev storage
export const DEV_DEFAULT_RULES = DEFAULT_RULES;

// ============================================================================
// Focus Statistics Defaults
// ============================================================================

export const DEFAULT_STATS: FocusStats = {
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    blocksIntercepted: 0,
    firstInstalledAt: Date.now(),
    lastActiveAt: Date.now(),
};

export const DEFAULT_DEMO_STATS: FocusStats = {
    totalFocusMinutes: 1260, // 21 hours
    sessionsCompleted: 24,
    blocksIntercepted: 385,
    firstInstalledAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    lastActiveAt: Date.now(),
};

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEY_RULES = 'timefocuser_rules';
export const STORAGE_KEY_RULES_BACKUP = 'rulesBackup';
export const STORAGE_KEY_SECURE_STORE = 'secureStore';
export const STORAGE_KEY_STATS = 'focusStats';
export const DEV_STORAGE_KEY = 'timefocuser_dev_rules';
export const DEV_STATS_KEY = 'timefocuser_dev_stats';

// ============================================================================
// Security & Cryptographic Storage Constants
// ============================================================================

export const SECURITY_DB_NAME = 'TimeFocuserSecurityDB';
export const SECURITY_STORE_NAME = 'KeyStore';
export const SECURITY_AES_KEY_ID = 'aes_master_key_v1';
export const SECURITY_HMAC_KEY_ID = 'hmac_integrity_key_v1';
export const SECURITY_VERSION = 1;

// ============================================================================
// Firewall & Navigation Constants
// ============================================================================

export const BLOCKED_PAGE_PATH = '/src/blocked/index.html';

// ============================================================================
// Feedback, Uninstall & Google Docs / Sheets Endpoints
// ============================================================================

export const CONTACT_FORM_URL =
    'https://docs.google.com/forms/d/e/1FAIpQLSfZajZE5JT7d5OZOEHWkuNAGeOa-Al9-CTui44Fh6BsqhFFfA/formResponse';

export const MESSAGE_ENTRY = 'entry.918692367';

export const SUGGESTIONS_SHEET_URL =
    'https://docs.google.com/spreadsheets/d/1t9EJw9q3lmxLcfybWOjQdW1FcIWp2YnQz7EH6QWpIPs/edit?gid=0#gid=0';

export const PROD_UNINSTALL_BASE_URL = 'https://timefocuser.github.io/goodbye.html';

export const LOCAL_UNINSTALL_BASE_URL = 'http://localhost:5173/src/goodbye/index.html';

export const FEEDBACK_OPTIONS = [
    'Lockdown was too strict',
    'Just testing the extension',
    'Missing custom features',
    'Switching to another device',
    'Needed a distraction break',
];
