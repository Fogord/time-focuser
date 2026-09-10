# TimeFocuser — In-Browser Site Firewall

A serverless, tamper-resistant Chrome Extension (Manifest V3) built with **React**, **Tailwind CSS**, and **TypeScript**. TimeFocuser intercepts distracting websites like an in-browser firewall, shows a dedicated blocked screen, and locks all settings while any block schedule is active.

---

## Key Features

1. **Dual-Layer In-Browser Firewall**:
   - **Network Layer**: Uses Chrome Manifest V3 `declarativeNetRequest` dynamic rules to intercept and redirect requests before any network traffic leaves your machine.
   - **Navigation Layer**: Uses `webNavigation.onBeforeNavigate` with immediate tab redirection to catch top-level navigation and pass context (rule name, target URL) to the blocked page.

2. **Strict Anti-Circumvention Lockdown**:
   - As specified: **settings can only be modified when no block is working**.
   - If any rule is actively blocking (by schedule, timer, or 24/7 setting), the Dashboard locks down: all inputs, toggles, delete buttons, and add buttons are disabled.
   - The Background Service Worker cryptographically enforces this constraint: any direct message or programmatic API call attempting to alter rules during an active session is rejected with `SETTINGS_LOCKED`.

3. **Tamper-Resistant Encrypted Storage**:
   - Settings cannot simply be edited in a text editor on your PC (`~/.config/google-chrome` or `~/Library/Application Support/Google/Chrome/...`).
   - Generates a **non-extractable Web Crypto Key** stored inside isolated IndexedDB (`extractable: false`), preventing raw key extraction.
   - Rule configurations stored in `chrome.storage.local` are encrypted using **AES-256-GCM** and signed with an **HMAC-SHA256** digest.
   - If an external process or text editor modifies the storage files on disk, the HMAC signature verification fails, triggering a **failsafe lockdown** that keeps blocks enforced.

4. **Rule & Scheduling Flexibility**:
   - **Pattern Types**: Domain / Subdomain, Exact URL, Wildcard (`*://*.reddit.com/*`), or Regular Expressions.
   - **Schedule Modes**:
     - **Weekly Schedule**: Select active days (e.g. Mon–Fri) and active 24-hour time ranges (e.g. `09:00` to `18:00`). Supports overnight schedules (e.g. `22:00` to `06:00`).
     - **Focus Timer**: Quick-start focus blocks (15m, 25m, 45m, 60m, 120m).
     - **Always Block**: 24/7 perpetual block.

5. **Modern React & Tailwind UI**:
   - **Dashboard (`options.html`)**: Full management console with live rule counters, search/filter, URL testing tool, and security status.
   - **Extension Popup (`popup.html`)**: Quick-glance widget showing current lock status, active rule count, countdown to unlock, and quick Pomodoro focus starters.
   - **Firewall Interception Page (`blocked.html`)**: High-impact full-screen firewall aesthetic displaying the blocked URL, triggering rule, live countdown timer, and quick actions.

---

## Project Structure

```
chrome-timefocuser/
├── dist/                     # Browser distribution targets
│   ├── chrome/               # Ready to load in Google Chrome
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── src/              # Co-located popup, options, blocked HTML
│   │   ├── assets/
│   │   └── icons/
│   ├── firefox/              # Ready to load in Mozilla Firefox
│   └── safari/               # Ready for Xcode converter
├── manifests/                # Browser-specific Manifest V3 templates
│   ├── manifest.chrome.json
│   ├── manifest.firefox.json
│   └── manifest.safari.json
├── src/
│   ├── background/           # Service worker, firewall engine, scheduler, crypto
│   ├── components/           # Reusable UI components (Modals, Cards, Banners)
│   ├── popup/                # Popup feature: index.html, main.tsx, Popup.tsx
│   ├── options/              # Options feature: index.html, main.tsx, Dashboard.tsx
│   ├── blocked/              # Blocked screen feature: index.html, main.tsx, BlockedScreen.tsx
│   ├── types/                # TypeScript definitions
│   └── utils/                # Browser compatibility wrapper
├── scripts/
│   ├── build-targets.js      # Multi-target build orchestrator
│   └── generate-icons.js     # Valid icon generator
├── test/
│   └── core-tests.js         # Automated test suite
└── package.json
```

---

## Multi-Browser Build Commands

You can build dedicated distributions for each browser or all at once:

```bash
# Build for all supported browsers (Chrome, Firefox, Safari)
npm run build:all

# Or build for a specific browser:
npm run build:chrome    # Outputs to dist/chrome/
npm run build:firefox   # Outputs to dist/firefox/
npm run build:safari    # Outputs to dist/safari/
```

---

## How to Install and Load

### Google Chrome (Chromium)
1. Open Google Chrome and visit `chrome://extensions/`.
2. Enable **Developer mode** (toggle in upper-right corner).
3. Click **Load unpacked** and select:
   ```
   /Users/artem/Documents/Web/chrome-timefocuser/dist/chrome
   ```

### Mozilla Firefox (Gecko)
1. Open Firefox and visit `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` inside:
   ```
   /Users/artem/Documents/Web/chrome-timefocuser/dist/firefox/manifest.json
   ```

### Apple Safari (WebKit / macOS)
1. In macOS Safari, enable the **Develop** menu (*Safari Settings > Advanced > Show features for web developers*).
2. Allow unsigned extensions (*Develop > Allow Unsigned Extensions*).
3. You can convert the built WebExtension directory using Xcode's standard CLI converter:
   ```bash
   xcrun safari-web-extension-converter /Users/artem/Documents/Web/chrome-timefocuser/dist/safari
   ```
   This generates an Xcode project that builds the native macOS/iOS companion app containing the extension.

---

## Enterprise Lockdown & MDM Guide

### 1. Is It Possible to Disallow Users From Deleting the Extension?
**Yes, 100% possible via Chrome Enterprise Policies & MDM (Mobile Device Management).**

In standard browser environments, Chrome intentionally allows users to remove any extension they manually added. However, using **Chromium Enterprise Management Policies**, administrators (or personal users configuring local OS policies) can enforce **`ExtensionInstallForcelist`** or **`ExtensionSettings`**.

When an extension is force-installed via policy:
- The extension is automatically installed and permanently enabled in the browser.
- The user **CANNOT disable, turn off, or uninstall/delete** the extension.
- On `chrome://extensions`, the toggle switch and "Remove" trash button are disabled, displaying a padlock icon: *"Installed by your administrator"*.

#### Configuration by Operating System:

- **macOS (MDM like Jamf / Kandji / Intune or Local Configuration Profile)**:
  Configure `/Library/Managed Preferences/com.google.Chrome.plist` or install an `.unsigned` mobileconfig profile:
  ```xml
  <key>ExtensionInstallForcelist</key>
  <array>
      <!-- Format: <EXTENSION_ID>;<UPDATE_URL> -->
      <string>your_extension_id_here;https://clients2.google.com/service/update2/crx</string>
  </array>
  ```

- **Windows (Group Policy / GPO or Registry)**:
  Configure via Windows Registry under:
  ```
  HKLM\Software\Policies\Google\Chrome\ExtensionInstallForcelist
  ```
  Create a String value (`REG_SZ`) with name `1` and value:
  `your_extension_id_here;https://clients2.google.com/service/update2/crx`

- **Linux**:
  Create `/etc/opt/chrome/policies/managed/timefocuser_policy.json`:
  ```json
  {
    "ExtensionInstallForcelist": [
      "your_extension_id_here;https://clients2.google.com/service/update2/crx"
    ]
  }
  ```

- **Google Workspace / Managed Chromebooks**:
  In Google Admin Console (`admin.google.com`):
  Navigate to **Devices > Chrome > Apps & Extensions > Users & Browsers**, search for TimeFocuser, and set the policy to **"Force install + pin to browser toolbar"**.

#### Preventing Policy Circumvention:
- **Block Chrome DevTools**: Set policy `DeveloperToolsAvailability: 2` so users cannot open `chrome-extension://...` background pages in DevTools.
- **Enforce in Incognito**: Configure `ExtensionSettings` with `"incognito": "spanning"` so firewall rules apply to incognito windows.

---

### 2. Is It Really Possible to Restrict Users From Scrolling Media (Shorts, Reels, Feeds)?
**Yes, through two proven techniques:**

#### Approach A: Dedicated URL & Endpoint Firewall (Built into TimeFocuser)
TimeFocuser's dual-layer firewall (`declarativeNetRequest` + `webNavigation`) intercepts short-form video paths before pages load:
- **YouTube Shorts**: Pattern `*://*.youtube.com/shorts*` (wildcard)
- **Instagram Reels**: Pattern `*://*.instagram.com/reels*`
- **Facebook Reels**: Pattern `*://*.facebook.com/reel*`
- **TikTok**: Pattern `tiktok.com`

When the user clicks on or navigates to any short-form video URL, TimeFocuser instantly redirects to `blocked.html`, terminating the infinite scroll loop before content can stream.

#### Approach B: DOM Feed Hiding & Scroll Disabling (Feed Restrictor)
If a user needs productive access to a platform (e.g. searching educational videos on YouTube or messaging on LinkedIn) while **blocking infinite doom-scrolling feeds**:
1. **Hide Infinite Feed Containers via Injected CSS**:
   ```css
   /* Completely remove YouTube home recommendation feed */
   ytd-browse[page-subtype="home"] #contents,
   ytd-rich-grid-renderer {
     display: none !important;
   }

   /* Remove Instagram Explore / Home algorithmic feed */
   [role="feed"], main article {
     display: none !important;
   }

   /* Remove Reddit infinite recommendation feed */
   shreddit-feed {
     display: none !important;
   }
   ```
2. **Lock Scroll Engine**:
   Injected scripts can enforce `document.body.style.overflow = 'hidden'` or intercept `wheel`, `touchmove`, and keyboard navigation (`ArrowDown`, `PageDown`, `Space`) specifically on feed containers, making it impossible to scroll for algorithmic dopamine hits.

---

## Development Workflows

You have two powerful development modes depending on what you're working on:

### Mode 1: Fast UI Development with Instant HMR (`npm run dev`)
Use this mode when designing UI components, adjusting Tailwind CSS styling, or testing dialogs:
```bash
npm run dev
```
- Starts the Vite local dev server at `http://localhost:5173`.
- Opens the **TimeFocuser Dev Center** with direct links to:
  - **Options Dashboard**: `http://localhost:5173/src/options/index.html`
  - **Popup Preview**: `http://localhost:5173/src/popup/index.html`
  - **Blocked Interception Screen**: `http://localhost:5173/src/blocked/index.html`
- **Instant Hot Module Replacement (HMR)**: Changes to React components or Tailwind classes update immediately without reloading the page.
- **Local State Fallback**: When running in a normal browser tab (outside extension sandbox), rules and lock calculations seamlessly fall back to `localStorage` so you can add, toggle, and delete rules interactively.

### Mode 2: Live Extension Watch Mode (`npm run dev:watch`)
Use this mode when testing real Chrome extension APIs (`declarativeNetRequest`, `webNavigation`, alarms, background service worker, and browser lockdown):
```bash
npm run dev:watch
```
- Watches `src/`, `manifests/`, and `public/`.
- Rebuilds `dist/chrome/` in real time (~100ms) on every file save.
- Keep `dist/chrome/` loaded unpacked in `chrome://extensions/` and simply click the refresh icon on the extension card to test live updates.

---

## Testing & Production Builds

```bash
# Run automated test suite
npm test

# Build production bundles for all browsers (Chrome, Firefox, Safari)
npm run build:all
```

