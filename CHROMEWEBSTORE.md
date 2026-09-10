# Chrome Web Store Listing — TimeFocuser

> Last Updated: 2026-09-10

## Store Listing

**Extension Name**
TimeFocuser — In-Browser Site Firewall

**Short Description**
Firewall-grade website blocker with time-based schedules, tamper-resistant encrypted rules, and locked settings during focus sessions.

**Detailed Description**
TimeFocuser is a serverless, privacy-first in-browser firewall extension designed to protect your deep work and productivity. It intercepts distracting websites and redirects to a focused blocker screen.

Key Features:
- Rule-by-rule site firewall supporting domain, exact URL, wildcard (*://*.example.com/*), and regular expression patterns.
- Flexible block scheduling: configure weekly working hours (e.g. Mon-Fri 09:00 to 18:00), focus timers (25m, 60m), or 24/7 perpetual blocks.
- Strict anti-circumvention: Settings, rules, and schedules are strictly locked whenever a block rule is active. No impulsively disabling blocks mid-session.
- Tamper-resistant storage: All rules and settings are encrypted using AES-256-GCM and verified with HMAC-SHA256 via non-extractable Web Crypto keys in IndexedDB. Manipulating disk files on PC triggers a failsafe lockdown.
- 100% Serverless & Private: Runs completely in your local browser with zero telemetry or remote server dependencies.

How to use:
1. Open the TimeFocuser Dashboard (from the extension popup or options).
2. While the firewall is in standby (unlocked), add your blocking rules and time schedules.
3. Once your scheduled focus window starts or a timer is activated, the firewall engages, intercepting matching pages and locking configuration until the window ends.

**Category**
Productivity

**Single Purpose**
Blocks user-specified distracting websites on custom schedules and locks configuration during active focus windows to prevent bypass.

**Primary Language**
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `public/icons/icon-128.png` |
| Extension Icon 48 | 48×48 PNG | ✅ Ready | `public/icons/icon-48.png` |
| Extension Icon 16 | 16×16 PNG | ✅ Ready | `public/icons/icon-16.png` |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Persists encrypted user-defined rules, schedules, and cryptographic verification signatures locally. |
| `declarativeNetRequest` | permissions | Enforces network-level firewall redirects to the internal blocked page before network requests reach blocked servers. |
| `webNavigation` | permissions | Intercepts top-level navigation attempts to matching blocked websites and redirects to the custom blocked page with rule details. |
| `alarms` | permissions | Periodically checks time schedules (minute-level resolution) to transition firewall states and manage lock timers. |
| `tabs` | permissions | Redirects the active browser tab to the local blocked.html landing page upon rule match. |
| `<all_urls>` | host_permissions | Allows declarativeNetRequest and navigation listeners to evaluate and block user-specified target domains across the web. |

---

## Privacy & Data Use

### Data Collection
**Does the extension collect user data?** No.
All rules, schedules, and cryptographic keys remain 100% local on the user's device. No data is transmitted to external servers.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-10 | Initial release: dual-layer firewall, React + Tailwind dashboard, tamper-resistant encryption, strict settings lock. | Draft |
