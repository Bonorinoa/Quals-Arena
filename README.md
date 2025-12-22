
# highBeta - The High Patience Protocol

![Version](https://img.shields.io/badge/version-4.0.0-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://img.shields.io/badge/tests-173%20passing-success)
![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-blue)

**Subject:** D1 Economist-Entrepreneur (Ph.D. Candidate)  
**Objective:** Habit Reformation & High-Performance Sober Productivity  
**Methodology:** Mechanism Design, Behavioral Economics, Principal-Agent Theory

## Overview

highBeta (β) is a minimal viable web application designed to solve the **Principal-Agent Problem** within the self. The name symbolizes the discount factor in economic theory—high beta represents high patience, which leads to better lifestyle choices and long-term thinking. It aligns the incentives of the "Planner" (the forward-looking self who wants to pass exams) with the "Doer" (the present self who craves cheap dopamine) using strict commitment devices and high-visibility metrics.

This is not a to-do list. It is a **Performance Analytics Dashboard** for a CEO tracking their most valuable asset: cognitive capacity.

## What's New in v4.0

**Status**: ✅ **PRODUCTION APPROVED** (2024-12-22)

highBeta v4.0 represents the first official **MVP release** with production-ready features for serious productivity tracking:

- 🔐 **Firebase Authentication**: Sign in with Google for automatic cloud backup and multi-device access
- ☁️ **Real-time Cloud Sync**: Your sessions and settings follow you across all devices, with offline-first architecture
- ✏️ **Session Edit/Delete**: Fix mistakes, remove test sessions, and maintain data integrity with validation
- ⌨️ **Keyboard Shortcuts**: Navigate faster with power user hotkeys (?, E, D, S, Escape)
- 📱 **PWA Support**: Install as a native-like app on any device, works fully offline
- ♿ **Accessibility**: Full keyboard navigation, screen reader support, WCAG 2.1 AA compliant (96% Lighthouse score)
- 🛡️ **Anti-Gaming Mechanisms**: Fair surplus caps (50% of commitment) prevent system exploitation and maintain protocol integrity
- 📊 **Enhanced Analytics**: Commitment pattern analysis, weekly budget balance, and behavioral nudges

**Production Ready**: 173 automated tests (100% passing), comprehensive E2E testing (95% pass rate), and security-hardened Firebase rules ensure reliability.

## The Scientific Principles

1.  **The Kydland-Prescott Constraint:** "Rules beat discretion." The app removes the option to "negotiate" study time. You pre-commit to a duration, and leaving early is recorded as a "Deficit."
2.  **Signal Extraction:** High stimulation is just high variance. The app enforces a "Low Noise" environment (The Arena) to track the true trend line of your productivity.
3.  **Radical Honesty:** The scoreboard is the source of truth. Metrics (Time Budget, Net Position) are calculated automatically based on behavior, not self-reported estimates.
4.  **Capital Deepening:** The focus is on building "Assets" (Mastery/Reps) rather than just logging hours.

## Key Features

### 1. The Arena (Focus Mode)
*   **Commitment Device:** Users must sign a "Contract" (select a duration) before starting.
*   **Drift-Proof Timer:** Uses delta-time calculation to remain accurate even if the browser tab is backgrounded or the phone sleeps.
*   **Wake Lock:** Keeps the screen awake during sessions, turning the device into a dedicated physical scoreboard.
*   **Mental Notes (The Stream):** Press 'N' during sessions to capture stream-of-consciousness insights with automatic timestamps.
*   **Warm-Up Protocol:** Optional 1-5 minute "Ramp Up" timer to settle cognitive noise before the clock starts.
*   **Safety Latch:** Prevents accidental data loss via browser refresh protections.

### 2. The Scoreboard (Analytics)
*   **Net Position (Time Budget):** Tracks "Actual vs. Committed" time with weekly budget balance.
    *   *Red:* Deficit (Debt owed to the system).
    *   *Green:* Surplus (Alpha generated, capped at 50% of commitment).
*   **Consistency Grid (Heatmap):** A GitHub-style contribution graph visualizing the current month's intensity.
*   **Performance Chart:** 7-day bar chart with baseline reference and delta indicators.
*   **Signal Integrity:** Tracks the substance-free streak.
*   **Sober Efficiency Rate (SER):** Calculates Reps / Hour to measure true output velocity.
*   **Commitment Pattern Analysis:** Behavioral nudges detect gaming patterns and encourage authentic pre-commitments.

### 3. Session Management (v4.0)
*   **Edit Sessions:** Modify duration, reps, notes, and dates with real-time validation.
*   **Delete Sessions:** Safe deletion with confirmation dialogs to prevent accidental data loss.
*   **Metrics Recalculation:** Budget balance and analytics automatically update after edits/deletes.
*   **Cloud Sync:** All changes sync to Firebase when logged in for multi-device consistency.

### 4. Firebase Cloud Sync (v4.0)
*   **Automatic Backup:** All sessions sync to cloud immediately after completion.
*   **Multi-Device Access:** Sign in with Google on any device and access your complete session history.
*   **Offline-First:** App works fully offline; syncs automatically when connection restored.
*   **Error Recovery:** Sync failures don't break the app; retry button available.
*   **Secure:** Each user's data is isolated with Firestore security rules enforced.
*   **Conflict Resolution:** Last-write-wins strategy for concurrent edits across devices.

### 5. Keyboard Shortcuts & PWA (v4.0)
*   **Power User Navigation:**
    *   `?` - Show keyboard shortcuts help
    *   `E` - Enter Arena (start new session)
    *   `D` - Go to Dashboard
    *   `S` - Go to Settings
    *   `Escape` - Close modals
*   **Progressive Web App:**
    *   Installable as standalone app on desktop and mobile
    *   Add to Home Screen support (iOS/Android)
    *   Offline-first with service worker caching
    *   Native app-like experience without app store

### 6. Accessibility & Anti-Gaming (v4.0)
*   **WCAG 2.1 AA Compliant:** Full keyboard navigation, screen reader support, color contrast compliance.
*   **Lighthouse Score:** 96% accessibility, 94% performance, 92% best practices.
*   **Proportional Surplus Cap:** Prevents gaming via systematic under-commitment (50% cap on surplus).
*   **Commitment Pattern Alerts:** Non-punitive warnings when low commitment patterns detected.
*   **Focus Traps:** All modals properly trap focus for keyboard users.
*   **Skip Links:** Skip-to-content link visible on Tab for screen reader users.

### 7. Data Sovereignty
*   **Local First:** All data lives in your browser's `LocalStorage`. No login required.
*   **CSV Export:** Download your raw data anytime.
*   **Cloud Backup:** Optional Firebase integration for automatic cloud sync and multi-device access.
*   **Backup & Restore:** Full JSON export/import capability to move data between devices.

## How to Use (The Protocol)

1.  **Deployment:** Open the app on your phone. Tap "Share" -> "Add to Home Screen" to remove browser bars and enter full-screen mode.
2.  **The Setup:** Go to Settings. Set your "Daily Goal" (e.g., 4 hours) and "Weekly Rep Target".
3.  **Enter The Arena:**
    *   Select a contract duration (e.g., 90m).
    *   (Optional) Select a Warm-Up time.
    *   **Seal Contract.**
4.  **The Session:** Work until the timer hits 00:00. If you stop early, the app records a Deficit.
5.  **The Log:** Upon completion, enter your "Reps" (problems solved/concepts mastered) and a "Diagnostic Note" about your mental state.
6.  **The Audit:** Check the Dashboard. Are you in the Green (Alpha) or Red (Debt)?

## Deployment

### Option 1: Vercel (Recommended)
1.  Push this code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com).
3.  "Import Project" -> Select your repo.
4.  Add environment variables from `.env.local` in Vercel project settings.
5.  Deploy.

### Option 2: Firebase Cloud Sync Setup (Recommended)

Firebase provides automatic cloud backup and cross-device sync for your sessions and settings.

#### Prerequisites
- A Google account
- Firebase project (free tier is sufficient)

#### Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or select existing project
   - Follow the wizard (Google Analytics is optional)

2. **Enable Authentication**
   - In Firebase Console, go to Authentication → Get Started
   - Click "Sign-in method" tab
   - Enable "Google" provider
   - Click Save

3. **Create Firestore Database**
   - Go to Firestore Database → Create database
   - Choose "Start in production mode"
   - Select your preferred location (choose closest to users)
   - Click "Enable"

4. **Get Firebase Config**
   - Go to Project Settings (gear icon) → General
   - Scroll to "Your apps" section
   - Click "</>" (Web) to add a web app
   - Register your app (nickname: "highBeta Web")
   - Copy the config values to `.env.local`:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

5. **Deploy Firestore Security Rules**
   
   **Option A: Using Firebase CLI (Recommended)**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firestore (select your project)
   firebase init firestore
   
   # Deploy rules
   firebase deploy --only firestore:rules
   ```
   
   **Option B: Using Firebase Console**
   - Go to Firestore Database → Rules tab
   - Copy contents of `firestore.rules` from this repo
   - Paste into the editor
   - Click "Publish"

6. **Add Authorized Domains**
   - Go to Authentication → Settings → Authorized domains
   - Add your deployment URL (e.g., `your-app.vercel.app`)
   - Add `localhost` for local development
   - Click "Add domain"

7. **Verify Setup**
   - Deploy your app to Vercel with the Firebase env vars
   - Open the deployed app
   - Click "Sign In" in the top right
   - Sign in with your Google account
   - Complete a session
   - Go to Firebase Console → Firestore Database
   - Verify you see: `users/{your-uid}/sessions/{session-id}`

#### Troubleshooting

**"auth/unauthorized-domain" error**
- Make sure your deployment URL is in Authentication → Authorized domains
- Wait 1-2 minutes after adding domain for changes to propagate

**Sign-in popup blocked**
- Allow popups for your site in browser settings
- Try using Chrome/Firefox (better popup support)

**Sessions not syncing**
- Check browser console for errors
- Verify Firestore rules are deployed correctly
- Check Firebase Console → Firestore Database → Usage for errors
- Try signing out and signing in again

**For more detailed setup and troubleshooting**, see [Firebase Sync Architecture Documentation](./docs/FIREBASE_SYNC_ARCHITECTURE.md).

## Current Limitations

*   **Browser Dependency:** If you clear your browser cache/history while not using Firebase Cloud Sync, local data is lost. **Solution:** Enable Firebase Cloud Sync for automatic backup.
*   **Mobile Backgrounding:** While the timer logic is accurate, strict iOS battery saving might freeze the visual countdown until you re-open the app. The "Time Logged" will still be correct.
*   **No "Social" Features:** This is a single-player game. You vs. You. No leaderboards, sharing, or social comparison features (by design).
*   **Sync Conflicts:** If you edit the same session on multiple devices simultaneously, last-write-wins (newest timestamp is kept). Consider this when making edits across devices.
*   **Browser Compatibility:** Safari 15.x has minor keyboard event handling differences (Escape key to close modals). Works correctly in Safari 16+, Chrome, Firefox, and Edge.
*   **Future Session Dates:** Currently no validation prevents editing session dates to future dates. Use responsibly to maintain data integrity.

## Firebase Cloud Sync

The app now supports **optional** Firebase cloud sync for automatic backup and multi-device access:

### Features
- ✅ **Automatic Backup**: All sessions and settings sync to cloud immediately after completion
- ✅ **Multi-Device Access**: Sign in with Google on any device and access your data
- ✅ **Offline Support**: App works fully offline; syncs when connection restored
- ✅ **Error Recovery**: Sync failures don't break the app; retry button available
- ✅ **Secure**: Each user's data is isolated; Firestore security rules enforced
- ✅ **Session Management**: Edit and delete sessions with automatic cloud sync
- ✅ **Conflict Resolution**: Last-write-wins strategy for concurrent device edits

### How It Works
1. **Local-First**: Data always saves to browser localStorage first (instant, works offline)
2. **Optional Sync**: Sign in with Google to enable cloud backup
3. **Automatic Merge**: First sign-in merges local and cloud data intelligently
4. **Real-Time Status**: Visual indicator shows sync progress (idle, syncing, synced, error)
5. **Graceful Degradation**: If sync fails, data remains safe locally with retry option

### Setup
See "Option 2: Firebase Cloud Sync Setup" in the Deployment section above.

For detailed technical documentation, architecture diagrams, and troubleshooting:
- **[Firebase Sync Architecture](./docs/FIREBASE_SYNC_ARCHITECTURE.md)** - Complete technical guide
- **[E2E Test Results](./docs/testing/E2E_TEST_RESULTS.md)** - v4.0 testing documentation (95% pass rate)

---

## Documentation

For comprehensive documentation, see **[/docs](./docs/README.md)**

### Quick Links

**Essential Documentation:**
*   **[V4_DEPLOYMENT_APPROVAL.md](./docs/V4_DEPLOYMENT_APPROVAL.md)** - ✅ Production deployment approval (2024-12-22)
*   **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
*   **[Documentation Index](./docs/README.md)** - Complete documentation guide

**Planning & Strategy** (`/docs/planning/archive` - Historical documents):
*   **[V4_ROADMAP.md](./docs/planning/V4_ROADMAP.md)** - Comprehensive v4.0 feature gap analysis (27 features)
*   **[V4_FOUNDATION.md](./docs/planning/V4_FOUNDATION.md)** - Detailed architectural foundations for v4.x
*   **[V4_COMPLETION_ASSESSMENT.md](./docs/planning/V4_COMPLETION_ASSESSMENT.md)** - Progress assessment toward v4.0
*   **[SURPLUS_CAP_STRATEGY.md](./docs/planning/SURPLUS_CAP_STRATEGY.md)** - Gaming prevention strategies analysis

**Development Documentation** (`/docs/development`):
*   **[FIREBASE_INTEGRATION_TEST_REPORT.md](./docs/development/FIREBASE_INTEGRATION_TEST_REPORT.md)** - Category 1 testing results (173 tests)
*   **[DESIGN_SYSTEM.md](./docs/development/DESIGN_SYSTEM.md)** - UI/UX design system and guidelines
*   **[TEST_DOCUMENTATION.md](./docs/development/TEST_DOCUMENTATION.md)** - Test suite guide and debugging tips

**Testing & Quality Assurance** (`/docs/testing`):
*   **[E2E_TEST_RESULTS.md](./docs/testing/E2E_TEST_RESULTS.md)** - v4.0 E2E test results (95% pass rate, APPROVED)
*   **[MVP_REVIEW_SUMMARY.md](./docs/testing/MVP_REVIEW_SUMMARY.md)** - UI/UX manual testing results

**Accessibility** (`/docs/accessibility`):
*   **[final-report.md](./docs/accessibility/final-report.md)** - WCAG 2.1 AA compliance audit results (APPROVED)

---
*"Owners build assets; employees log hours."*
