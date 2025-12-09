
# highBeta - The High Patience Protocol

**Subject:** D1 Economist-Entrepreneur (Ph.D. Candidate)  
**Objective:** Habit Reformation & High-Performance Sober Productivity  
**Methodology:** Mechanism Design, Behavioral Economics, Principal-Agent Theory

## Overview

highBeta (β) is a minimal viable web application designed to solve the **Principal-Agent Problem** within the self. The name symbolizes the discount factor in economic theory—high beta represents high patience, which leads to better lifestyle choices and long-term thinking. It aligns the incentives of the "Planner" (the forward-looking self who wants to pass exams) with the "Doer" (the present self who craves cheap dopamine) using strict commitment devices and high-visibility metrics.

This is not a to-do list. It is a **Performance Analytics Dashboard** for a CEO tracking their most valuable asset: cognitive capacity.

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
*   **Noble Insights:** Randomly samples protocol axioms (e.g., "Lag is Ponzi Finance") to reinforce motivation.
*   **Warm-Up Protocol:** Optional 1-5 minute "Ramp Up" timer to settle cognitive noise before the clock starts.
*   **Safety Latch:** Prevents accidental data loss via browser refresh protections.

### 2. The Scoreboard (Analytics)
*   **Net Position (Time Budget):** Tracks "Actual vs. Committed" time.
    *   *Red:* Deficit (Debt owed to the system).
    *   *Green:* Surplus (Alpha generated).
*   **Consistency Grid (Heatmap):** A GitHub-style contribution graph visualizing the last 60 days of intensity.
*   **Signal Integrity:** Tracks the substance-free streak.
*   **Sober Efficiency Rate (SER):** Calculates Reps / Hour to measure true output velocity.

### 3. Data Sovereignty
*   **Local First:** All data lives in your browser's `LocalStorage`. No login required.
*   **CSV Export:** Download your raw data anytime.
*   **Cloud Backup:** Optional integration with Google Sheets via Webhook. This is a one-way PUSH system to keep a permanent backup of your work.
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
4.  Deploy.

### Option 2: Cloud Sync Setup (Optional)
To enable the "Back up to Google Sheets" feature:
1.  Create a new Google Sheet.
2.  Extensions -> Apps Script.
3.  Paste the following code (replaces the default code):
    ```javascript
    function doPost(e) {
      try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data = JSON.parse(e.postData.contents);
        
        // Handle Test Ping
        if (data.id === "PING") {
           sheet.appendRow(["PING", new Date().toISOString(), "Connection Verified", "", "", "", ""]);
           return ContentService.createTextOutput(JSON.stringify({"status":"success", "message": "Pong"}));
        }
        
        // Add header if empty
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["ID", "Date", "Duration", "Target", "Reps", "Notes", "Timestamp"]);
        }
        
        sheet.appendRow([
          data.id, 
          data.date, 
          data.durationSeconds, 
          data.targetDurationSeconds, 
          data.reps, 
          data.notes, 
          new Date(data.timestamp).toISOString()
        ]);
        
        return ContentService.createTextOutput(JSON.stringify({"status":"success"}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch(err) {
        return ContentService.createTextOutput(JSON.stringify({"status":"error", "message": err.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Handles browser visits to the URL to prevent "Script function not found" errors
    function doGet(e) {
      return ContentService.createTextOutput("highBeta Cloud Node: Online");
    }
    ```
4.  Click **Deploy** -> **New Deployment**.
5.  Select **Type: Web App**.
6.  Set "Who has access" to **Anyone** (Required so the client-side app can POST to it without OAuth).
7.  Copy the **Web App URL**.
8.  Paste this URL into the **Settings** menu of the highBeta app.
9.  Click "Test Connection" to verify.

## Current Limitations

*   **Browser Dependency:** If you clear your browser cache/history, local data is lost (unless Cloud Backup is enabled).
*   **Mobile Backgrounding:** While the timer logic is accurate, strict iOS battery saving might freeze the visual countdown until you re-open the app. The "Time Logged" will still be correct.
*   **No "Social" Features:** This is a single-player game. You vs. You.

---

## Documentation

For comprehensive documentation, see **[/docs](./docs/README.md)**

### Quick Links

**Essential Documentation:**
*   **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
*   **[Documentation Index](./docs/README.md)** - Complete documentation guide

**Planning & Strategy** (`/docs/planning`):
*   **[V4_FOUNDATION.md](./docs/planning/V4_FOUNDATION.md)** - Detailed architectural foundations for v4.x (NEW ✨)
*   **[V4_ROADMAP.md](./docs/planning/V4_ROADMAP.md)** - Comprehensive v4.0 feature gap analysis (27 features)
*   **[SURPLUS_CAP_STRATEGY.md](./docs/planning/SURPLUS_CAP_STRATEGY.md)** - Gaming prevention strategies analysis
*   **[CLOUD_BACKUP_ALTERNATIVES.md](./docs/planning/CLOUD_BACKUP_ALTERNATIVES.md)** - Authentication options guide

**Development Documentation** (`/docs/development`):
*   **[DESIGN_SYSTEM.md](./docs/development/DESIGN_SYSTEM.md)** - UI/UX design system and guidelines
*   **[TEST_DOCUMENTATION.md](./docs/development/TEST_DOCUMENTATION.md)** - Test suite guide and debugging tips
*   **[V3_EVALUATION_REPORT.md](./docs/development/V3_EVALUATION_REPORT.md)** - v3.0 testing results (95 tests)

---
*"Owners build assets; employees log hours."*
