# End-to-End Testing Checklist for highBeta v4.0

**Version**: 4.0.0  
**Last Updated**: 2024-12-15  
**Test Environment**: Production-like (Firebase emulators + deployed build)  
**Purpose**: Comprehensive manual E2E testing to validate all critical user workflows before v4.0 release

---

## Table of Contents
1. [Authentication Flows](#1-authentication-flows)
2. [Session Workflows](#2-session-workflows)
3. [Firebase Sync](#3-firebase-sync)
4. [Multi-Device Scenarios](#4-multi-device-scenarios)
5. [PWA Functionality](#5-pwa-functionality)
6. [UI/UX Features](#6-uiux-features)
7. [Anti-Gaming Features](#7-anti-gaming-features)
8. [Edge Cases](#8-edge-cases)

---

## 1. Authentication Flows

### 1.1 Sign In (Google OAuth)
- [ ] **Happy Path**: Click sign-in button → Google OAuth popup appears → Select account → Successfully authenticated
  - **Expected**: User redirected to dashboard, user email displayed in UI
  - **Verify**: Auth state persisted in localStorage
  - **Browser**: Chrome, Firefox, Safari

- [ ] **Popup Blocked**: Block popups in browser → Attempt sign-in
  - **Expected**: Clear error message instructing user to allow popups
  - **Verify**: No silent failures or console errors

- [ ] **User Cancels**: Open Google OAuth popup → Close without selecting account
  - **Expected**: Graceful error handling, user remains on welcome screen
  - **Verify**: Error message: "Sign-in was cancelled"

- [ ] **Network Error During Sign-In**: Disable network mid-authentication
  - **Expected**: Network error message displayed
  - **Verify**: User can retry after network restored

- [ ] **Unauthorized Domain**: Test with unauthorized domain (staging/dev)
  - **Expected**: Clear error message about domain authorization
  - **Verify**: Firebase console shows proper domain configuration

### 1.2 Sign Out
- [ ] **Standard Sign Out**: Click sign-out button while authenticated
  - **Expected**: User redirected to welcome screen, auth state cleared
  - **Verify**: localStorage cleared, Firebase auth state reset

- [ ] **Sign Out Error Handling**: Simulate sign-out failure (network issue)
  - **Expected**: Error message displayed, user can retry
  - **Verify**: User remains authenticated if sign-out fails

### 1.3 Auth Persistence
- [ ] **Page Refresh**: Sign in → Refresh page
  - **Expected**: User remains authenticated, session data intact
  - **Verify**: No unnecessary re-authentication

- [ ] **Browser Close/Reopen**: Sign in → Close browser → Reopen
  - **Expected**: User still authenticated (unless sign-out was clicked)
  - **Verify**: Auth token valid, no expired session errors

- [ ] **Tab Duplication**: Open authenticated session → Duplicate tab
  - **Expected**: Both tabs show authenticated state
  - **Verify**: Sync state consistent across tabs

---

## 2. Session Workflows

### 2.1 Create Session (Complete Flow)
- [ ] **30-Minute Session**: Select 30m duration → Skip warmup → Run timer → Stop → Log session
  - **Expected**: Timer accurate, session saved with correct duration
  - **Verify**: Session appears in dashboard, metrics updated

- [ ] **1-Hour Session with Warmup**: Select 1h duration → 3m warmup → Complete session
  - **Expected**: Warmup countdown works, timer starts after warmup
  - **Verify**: Warmup time NOT counted in session duration

- [ ] **Overtime Session (Surplus)**: Commit 30m → Run for 45m → Complete
  - **Expected**: Surplus calculated as 15m (capped at 50% = 15m)
  - **Verify**: Surplus cap indicator shown, budget balance updated correctly

- [ ] **Deficit Session**: Commit 1h → Run for 45m → Complete
  - **Expected**: Deficit shown as -15m, budget balance decreases
  - **Verify**: Red deficit indicator displayed in logging view

- [ ] **Pause/Resume**: Start session → Pause → Wait → Resume → Complete
  - **Expected**: Timer pauses accurately, no drift on resume
  - **Verify**: Accumulated time is correct

- [ ] **Multiple Pauses**: Start → Pause → Resume → Pause → Resume → Complete
  - **Expected**: Time tracked accurately across multiple pauses
  - **Verify**: No time loss or drift

### 2.2 Mental Notes (The Stream)
- [ ] **Add Mental Note During Session**: Press 'N' key during running session
  - **Expected**: Mental note input modal appears, timestamp captured
  - **Verify**: Note saved with correct timestamp

- [ ] **Multiple Mental Notes**: Add 3+ mental notes at different timestamps
  - **Expected**: All notes saved with unique timestamps
  - **Verify**: Notes displayed in logging view, sorted chronologically

- [ ] **Mental Note with Keyboard Shortcut**: Press 'N' → Type note → Press Enter
  - **Expected**: Note saved, modal closes
  - **Verify**: Keyboard shortcut disabled in input fields

- [ ] **Cancel Mental Note**: Press 'N' → Press Escape
  - **Expected**: Modal closes without saving
  - **Verify**: No empty notes added

### 2.3 Session Logging
- [ ] **Session with Reps**: Complete session → Enter 5 reps → Add diagnostic note → Save
  - **Expected**: Session saved with reps and notes
  - **Verify**: Reps displayed in dashboard session card

- [ ] **Session with Zero Reps**: Complete session → Leave reps at 0 → Save
  - **Expected**: Session saved with 0 reps (valid)
  - **Verify**: No validation errors

- [ ] **Session with Invalid Reps**: Attempt to enter negative reps
  - **Expected**: Input clamped to 0 minimum
  - **Verify**: Cannot save negative reps

- [ ] **Session with Long Note**: Enter 500+ character diagnostic note
  - **Expected**: Full note saved without truncation
  - **Verify**: Note displayed correctly in dashboard

### 2.4 Discard Sessions
- [ ] **Discard Short Session (<10 minutes)**: Run session for 5 minutes → Stop → Click Discard
  - **Expected**: Session discarded, user returned to welcome/arena
  - **Verify**: No session saved, metrics unchanged

- [ ] **Discard Locked (>10 minutes)**: Run session for 15 minutes → Stop → Attempt discard
  - **Expected**: Discard button shows "Discard Locked" (not clickable)
  - **Verify**: User must save session, cannot discard

- [ ] **Discard at Exactly 10 Minutes**: Run for exactly 600 seconds → Stop
  - **Expected**: Discard button available (≤600s allows discard)
  - **Verify**: Edge case handled correctly

### 2.5 Session Edit
- [ ] **Edit Session Reps**: Dashboard → Select session → Edit → Change reps → Save
  - **Expected**: Reps updated, metrics recalculated
  - **Verify**: Budget balance updates correctly

- [ ] **Edit Session Duration**: Edit session → Change duration from 60m to 90m → Save
  - **Expected**: Duration updated, surplus/deficit recalculated
  - **Verify**: Session timestamp adjusted correctly

- [ ] **Edit Session Date**: Edit session → Change date to yesterday → Save
  - **Expected**: Session moved to correct day bucket
  - **Verify**: Daily metrics updated for both days

- [ ] **Edit Session Notes**: Edit session → Update notes → Save
  - **Expected**: Notes updated without affecting other fields
  - **Verify**: No data loss in other fields

- [ ] **Cancel Edit**: Edit session → Change fields → Cancel
  - **Expected**: No changes saved, modal closes
  - **Verify**: Original session data intact

### 2.6 Session Delete
- [ ] **Delete Single Session**: Dashboard → Select session → Delete → Confirm
  - **Expected**: Session removed, metrics recalculated
  - **Verify**: Budget balance, streak, patterns updated

- [ ] **Delete with Confirmation**: Click delete → Confirmation dialog appears
  - **Expected**: User must confirm deletion (prevent accidental loss)
  - **Verify**: Can cancel deletion

- [ ] **Delete Multiple Sessions**: Delete 3 sessions in sequence
  - **Expected**: Each deletion processed correctly
  - **Verify**: Metrics accurate after multiple deletions

---

## 3. Firebase Sync

### 3.1 Initial Sync
- [ ] **First Sign-In (No Local Data)**: Sign in for first time → No local sessions
  - **Expected**: Cloud data synced down (if any)
  - **Verify**: No duplicate sessions created

- [ ] **First Sign-In (With Local Data)**: Create sessions while offline → Sign in
  - **Expected**: Local sessions uploaded to cloud
  - **Verify**: Data migration successful, no data loss

- [ ] **Merge Local + Cloud**: Local has sessions A, B → Cloud has sessions B, C
  - **Expected**: Merged result has A, B, C (B deduplicated by ID)
  - **Verify**: No duplicate sessions, newest version wins

### 3.2 Real-Time Sync
- [ ] **Create Session While Online**: Create session → Verify in Firebase Console
  - **Expected**: Session appears in Firestore within 2-3 seconds
  - **Verify**: Session document structure correct

- [ ] **Update Session While Online**: Edit session → Verify in Firebase Console
  - **Expected**: Firestore document updated in real-time
  - **Verify**: Updated fields reflect changes

- [ ] **Delete Session While Online**: Delete session → Verify in Firebase Console
  - **Expected**: Session document removed from Firestore
  - **Verify**: Clean deletion, no orphaned data

### 3.3 Offline Mode
- [ ] **Create Session Offline**: Disconnect network → Create session → Complete
  - **Expected**: Session saved locally, queued for sync
  - **Verify**: Offline indicator shown, session in local storage

- [ ] **Reconnect After Offline Session**: Create session offline → Reconnect
  - **Expected**: Session automatically synced to cloud
  - **Verify**: Firestore document created, offline queue cleared

- [ ] **Multiple Offline Sessions**: Create 3 sessions offline → Reconnect
  - **Expected**: All sessions synced in batch
  - **Verify**: Sync completes successfully, no duplicates

- [ ] **Edit Session Offline**: Edit session while offline → Reconnect
  - **Expected**: Edits synced when online
  - **Verify**: Correct version saved to cloud

### 3.4 Conflict Resolution
- [ ] **Concurrent Edits (Same Session)**: 
  - Device A: Edit session → Save (offline)
  - Device B: Edit same session → Save (online)
  - Device A: Reconnect
  - **Expected**: Newest timestamp wins (Device B version kept)
  - **Verify**: Timestamp-based merge strategy applied

- [ ] **Settings Sync Conflict**: 
  - Device A: Change settings (offline)
  - Device B: Change settings (online)
  - Device A: Reconnect
  - **Expected**: Cloud settings take precedence
  - **Verify**: Settings from Device B preserved

---

## 4. Multi-Device Scenarios

### 4.1 Cross-Device Sync
- [ ] **Two Devices, Same Account**: 
  - Device 1: Create session
  - Device 2: Wait 5 seconds → Refresh
  - **Expected**: Session appears on Device 2
  - **Verify**: Real-time listener updates both devices

- [ ] **Session Created on Mobile, Edited on Desktop**:
  - Mobile: Create session
  - Desktop: Edit session (change reps, notes)
  - Mobile: Refresh
  - **Expected**: Edits appear on mobile
  - **Verify**: No data corruption

- [ ] **Simultaneous Session Creation**:
  - Device 1: Create session at 10:00:00
  - Device 2: Create session at 10:00:05
  - **Expected**: Both sessions saved, no overwrite
  - **Verify**: Both devices show both sessions

### 4.2 Session Deduplication
- [ ] **Same Session ID on Multiple Devices**:
  - Device A: Create session offline (ID: abc123)
  - Device B: Sync receives session (ID: abc123)
  - Device A: Reconnect
  - **Expected**: Only one copy of session exists
  - **Verify**: Deduplication by session ID

---

## 5. PWA Functionality

### 5.1 Installation
- [ ] **Install on Desktop (Chrome)**: Visit app → Click install prompt → Install
  - **Expected**: App opens in standalone window
  - **Verify**: Manifest.json loaded correctly

- [ ] **Install on Mobile (iOS Safari)**: Safari → Share → Add to Home Screen
  - **Expected**: App icon added to home screen
  - **Verify**: App opens in standalone mode

- [ ] **Install on Mobile (Android Chrome)**: Chrome → Install app banner
  - **Expected**: App installed via Chrome's install flow
  - **Verify**: App appears in app drawer

### 5.2 Offline Mode
- [ ] **Load App Offline**: Install app → Go offline → Open app
  - **Expected**: App loads from service worker cache
  - **Verify**: Static assets cached, UI renders

- [ ] **Navigate Offline**: App open offline → Navigate to Dashboard → Settings
  - **Expected**: Navigation works, cached data displayed
  - **Verify**: Offline indicator visible

- [ ] **Create Session Offline (PWA)**: Open PWA offline → Create session
  - **Expected**: Session saved locally, syncs on reconnect
  - **Verify**: Offline queue functional

### 5.3 Service Worker Updates
- [ ] **New Version Available**: Deploy new version → User has old version open
  - **Expected**: "Update available" prompt shown (if implemented)
  - **Verify**: Service worker updates on page reload

- [ ] **Force Update**: Clear cache → Reload app
  - **Expected**: Latest version loaded
  - **Verify**: Service worker re-installs

---

## 6. UI/UX Features

### 6.1 Keyboard Shortcuts
- [ ] **Show Shortcuts Help**: Press '?' key
  - **Expected**: Keyboard shortcuts modal appears
  - **Verify**: All shortcuts listed

- [ ] **Enter Arena Shortcut**: Press 'E' key (from dashboard)
  - **Expected**: Navigate to Arena (new session)
  - **Verify**: Shortcut disabled in input fields

- [ ] **Dashboard Shortcut**: Press 'D' key (from arena)
  - **Expected**: Navigate to Dashboard
  - **Verify**: Confirmation if session in progress

- [ ] **Settings Shortcut**: Press 'S' key
  - **Expected**: Navigate to Settings
  - **Verify**: Settings view loads

- [ ] **Close Modal Shortcut**: Open modal → Press Escape
  - **Expected**: Modal closes
  - **Verify**: Works for all modals (edit, delete, shortcuts)

### 6.2 Timer View UX
- [ ] **Glass Morphism Consistency**: Review timer view visual design
  - **Expected**: Glass effects match session cards, modals
  - **Verify**: Consistent backdrop blur, borders, shadows

- [ ] **State Transitions**: Idle → Running → Paused → Completed
  - **Expected**: Smooth animations between states
  - **Verify**: No jarring transitions or flickers

- [ ] **Atmospheric Effects**: Review subtle gradients, glows, depth
  - **Expected**: Visual polish enhances focus, not distracts
  - **Verify**: Animations performant (60fps)

- [ ] **Visual Feedback**: Click buttons, pause/resume, add notes
  - **Expected**: Clear visual feedback for all interactions
  - **Verify**: Hover states, active states work

### 6.3 Responsive Design
- [ ] **Mobile Portrait (375px)**: Test on iPhone SE size
  - **Expected**: UI adapts, no horizontal scroll
  - **Verify**: Touch targets minimum 44px

- [ ] **Mobile Landscape**: Rotate device to landscape
  - **Expected**: Layout adjusts appropriately
  - **Verify**: Critical content visible

- [ ] **Tablet (768px)**: Test on iPad size
  - **Expected**: Optimal use of space
  - **Verify**: Multi-column layouts work

- [ ] **Desktop (1920px)**: Test on large monitor
  - **Expected**: Max-width constraints applied, not stretched
  - **Verify**: Content centered, readable

### 6.4 Accessibility
- [ ] **Keyboard Navigation**: Navigate entire app using only keyboard
  - **Expected**: All interactive elements reachable
  - **Verify**: Logical tab order, visible focus states

- [ ] **Screen Reader (NVDA/VoiceOver)**: Navigate with screen reader
  - **Expected**: All content announced correctly
  - **Verify**: ARIA labels present, landmarks defined

- [ ] **Color Contrast**: Check contrast ratios (WCAG AA)
  - **Expected**: All text meets 4.5:1 ratio (normal text)
  - **Verify**: Tool: WAVE, Lighthouse, or manual check

- [ ] **Focus States**: Tab through all buttons, inputs
  - **Expected**: Clear focus indicators visible
  - **Verify**: No focus traps

---

## 7. Anti-Gaming Features

### 7.1 Proportional Surplus Cap
- [ ] **50% Surplus Cap**: Commit 60m → Run for 120m (60m surplus)
  - **Expected**: Surplus capped at 30m (50% of 60m commitment)
  - **Verify**: UI shows cap applied, budget balance correct

- [ ] **Cap Not Applied (Under 50%)**: Commit 60m → Run for 80m (20m surplus)
  - **Expected**: Full 20m surplus counted (under 50% cap)
  - **Verify**: No cap indicator shown

- [ ] **Cap with Different Durations**: Test with 30m, 1h, 2h, 4h commitments
  - **Expected**: Cap scales proportionally (always 50%)
  - **Verify**: Math accurate for all durations

### 7.2 Commitment Pattern Analysis
- [ ] **Low Commitment Pattern (70%+ Minimum)**: 
  - Create 10 sessions over 7 days, all at minimum duration
  - **Expected**: Warning card shown on dashboard
  - **Verify**: Message: "Commitment pattern suggests gaming"

- [ ] **Healthy Pattern**: Mix of min, target, overtime sessions
  - **Expected**: No warning shown
  - **Verify**: Pattern analysis accurate

- [ ] **Pattern Alert Dismissal**: Dismiss pattern warning
  - **Expected**: Warning dismissed, can be re-shown if pattern continues
  - **Verify**: Dismissal state saved

---

## 8. Edge Cases

### 8.1 Data Integrity
- [ ] **Empty State**: New user, no sessions
  - **Expected**: Welcome message, prompts to create first session
  - **Verify**: No errors with empty data

- [ ] **Large Dataset**: Import 100+ sessions
  - **Expected**: App remains performant, no lag
  - **Verify**: Pagination or virtualization works

- [ ] **Corrupted LocalStorage**: Manually corrupt localStorage data
  - **Expected**: Graceful error handling, data reset offered
  - **Verify**: No infinite error loops

### 8.2 Network Edge Cases
- [ ] **Slow Network (3G)**: Throttle network to 3G speed
  - **Expected**: App loads slowly but correctly
  - **Verify**: Loading states shown, no timeouts

- [ ] **Intermittent Connectivity**: Toggle network on/off during session
  - **Expected**: Offline mode activates/deactivates smoothly
  - **Verify**: Sync resumes when online

- [ ] **Firebase Connection Lost**: Simulate Firestore connection failure
  - **Expected**: Offline queue activates, retry logic triggers
  - **Verify**: Data syncs when connection restored

### 8.3 Browser Compatibility
- [ ] **Chrome (Desktop & Mobile)**: Full test suite
  - **Expected**: All features work
  - **Verify**: Latest version + previous major version

- [ ] **Firefox (Desktop & Mobile)**: Full test suite
  - **Expected**: All features work
  - **Verify**: Latest version

- [ ] **Safari (Desktop & Mobile)**: Full test suite
  - **Expected**: All features work (note: Safari quirks)
  - **Verify**: iOS 15+, macOS Safari 15+

- [ ] **Edge**: Core workflows test
  - **Expected**: All features work (Chromium-based)
  - **Verify**: Latest version

### 8.4 Boundary Conditions
- [ ] **Session at Midnight**: Create session at 23:59, complete at 00:01
  - **Expected**: Session attributed to correct day
  - **Verify**: Date handling across midnight boundary

- [ ] **Very Long Session**: Run session for 8+ hours
  - **Expected**: Timer accurate, no overflow errors
  - **Verify**: Wake lock maintained (if device allows)

- [ ] **Very Short Session**: Run session for 5 seconds → Stop
  - **Expected**: Session can be discarded (under 10 minutes)
  - **Verify**: Minimum duration validation (if any)

- [ ] **Maximum Reps**: Enter 50 reps (maximum)
  - **Expected**: Reps saved as 50
  - **Verify**: Input clamped to max value

- [ ] **Date in Future**: Edit session date to tomorrow
  - **Expected**: Validation error or warning
  - **Verify**: Cannot create future sessions

---

## Test Execution Notes

### Prerequisites
- [ ] Firebase emulators running (Auth, Firestore)
- [ ] App deployed to staging environment or served locally
- [ ] Multiple test devices/browsers available
- [ ] Test accounts created (Google OAuth)
- [ ] Screen reader software installed (NVDA, VoiceOver)

### Test Data Preparation
- [ ] Seed data: 20 sample sessions across 14 days
- [ ] Test user 1: Fresh account (no data)
- [ ] Test user 2: Account with existing sessions
- [ ] Test user 3: Account with corrupted data (for error testing)

### Bug Reporting Format
When a test fails, document:
- **Test ID**: Section + test name
- **Steps to Reproduce**: Exact steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happened
- **Environment**: Browser, OS, device
- **Screenshots**: Attach if applicable
- **Console Errors**: Copy any errors from console

### Sign-Off
- **Tester Name**: ________________
- **Test Date**: ________________
- **Pass Rate**: _____ / _____ tests passed
- **Critical Failures**: _____ (blocking release)
- **Minor Issues**: _____ (can be deferred)
- **Notes**: ________________

---

## Automated E2E Test Coverage (Optional)

If automated E2E tests are implemented (Playwright/Cypress), they should cover:

### Critical Paths (Must Automate)
1. **Authentication Flow**: Sign in → Create session → Sign out
2. **Complete Session Workflow**: Enter arena → Select duration → Run timer → Stop → Log → Save
3. **Session Edit**: Create session → Edit reps/notes → Save → Verify changes
4. **Session Delete**: Create session → Delete → Confirm deletion → Verify removal
5. **Offline Recovery**: Create session offline → Go online → Verify sync

### Nice-to-Have Automation
- Mental notes workflow
- Keyboard shortcuts
- Multi-device sync (complex, may need manual testing)
- PWA installation (complex, browser-specific)

---

**Last Review**: 2024-12-15  
**Next Review**: Before v4.0 production release  
**Status**: Draft - Pending team review
