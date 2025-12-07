# D1 Economist Protocol - MVP Documentation

A mechanism design tool for high-performance sober productivity. This single-page React application uses economic and behavioral economics principles to track focused work sessions, productivity metrics, and maintain accountability through data-driven insights.

---

## 🎯 Core Features

### 1. **The Arena - Focus Timer**
- **Pre-Commitment Contract**: Choose your session duration before starting (30m, 1h, 90m, 2h, 3h, 4h)
- **Real-Time Timer**: Accurate session tracking with pause/resume functionality
- **Two-Step Exit**: Prevents accidental session termination with confirmation requirement
- **Progress Visualization**: Real-time progress bar showing completion vs. commitment
- **Motivational Anchors**: Random economic/behavioral principles displayed during sessions

### 2. **Performance Dashboard**
- **Contract Balance**: Net position showing actual time vs. committed time
- **Signal Integrity Streak**: Days maintained since substance/distraction-free commitment
- **Daily Volume Progress**: Visual progress bar toward daily time goal
- **Weekly Rep Target**: Track progress toward weekly productivity goals
- **7-Day Performance Chart**: Visual comparison of daily reps vs. 7-day baseline

### 3. **Session Logging**
- **Debrief Interface**: Post-session logging of completed "reps" (tasks/problems)
- **Diagnostic Notes**: Optional session notes for pattern recognition
- **Contract Deficit/Surplus Tracking**: Automatic calculation of time commitments met
- **Asset Building Metaphor**: Sessions are framed as "assets built" in a ledger

### 4. **Analytics & Metrics**
- **Sober Efficiency Rate (SER)**: Reps completed per hour (requires >5 min sessions)
- **Daily Alpha**: Today's performance vs. yesterday's
- **Noise Filtering**: Sessions under 5 minutes marked as "NOISE" to prevent false signals
- **Internal Competition**: "You vs. You" performance comparisons
- **Founder Mode Gate**: Saturday protocol unlocked when weekly targets are met

### 5. **Data Management**
- **Local Storage Persistence**: All data stored in browser's localStorage
- **CSV Export**: Download session data for external analysis (e.g., Google Sheets)
- **Protocol Reset**: Clear all session data while preserving settings
- **Version Management**: Automatic data migration for app updates

### 6. **Settings & Configuration**
- **Weekly Rep Target**: Customizable weekly goals
- **Daily Time Goal**: Set daily deep work hour targets
- **Personal Name**: Customize your protocol identity
- **Relapse Tracking**: Reset signal integrity streak when needed

---

## 🚧 Current Limitations

### **No Authentication or User Management**
- No login system - the app is single-device, single-browser only
- Data is tied to the browser's localStorage
- No cloud sync or backup mechanisms
- Clearing browser data will delete all session history

### **No Cross-Device Persistence**
- Sessions logged on one device cannot be accessed from another device
- No database backend for centralized data storage
- Manual CSV export required to transfer data between devices

### **No Multi-User Support**
- Single user per browser installation
- No profiles or account switching
- Not suitable for shared devices without manual data clearing

### **Data Vulnerability**
- Data can be lost if browser cache/localStorage is cleared
- No automatic backup system
- Relies on user to manually export data for preservation

### **Limited Collaboration Features**
- No social features or accountability partners
- No shared goals or team dashboards
- Individual-focused only

---

## 💡 Missing Features & Future Enhancements

### **High Priority**

1. **Warm-Up Period Before Timer**
   - Currently, timer starts immediately after commitment
   - Need: A preparation phase (e.g., 1-2 minutes) to allow user to:
     - Gather materials
     - Settle into workspace
     - Clear mind before focus session begins
   - Would prevent false starts and improve session quality

2. **Session Pause Notes**
   - No way to log why a session was paused
   - Need: Quick note capture when pausing (e.g., "bio break", "urgent call")

3. **Session Templates**
   - No predefined session types
   - Need: Templates for different work types (e.g., "Deep Work", "Problem Sets", "Review")

4. **Notification System**
   - No audio/visual alerts when commitment time is reached
   - Need: Optional sound notification when target duration is hit

### **Medium Priority**

5. **Historical Data Visualization**
   - Limited to 7-day chart currently
   - Need: Monthly/yearly trends, heatmaps, custom date ranges

6. **Goal Adjustment Recommendations**
   - Static goals only
   - Need: Adaptive goal suggestions based on historical performance

7. **Break Scheduling**
   - No built-in break reminders
   - Need: Pomodoro-style break intervals or custom break schedules

8. **Session Tags/Categories**
   - Sessions only have free-form notes
   - Need: Taggable categories (e.g., "Math", "Reading", "Coding")

9. **Streak Recovery Mode**
   - Harsh reset on relapse
   - Need: Grace period or graduated recovery for signal integrity

### **Low Priority**

10. **Dark/Light Theme Toggle**
    - Fixed dark theme only
    - Need: User preference for light mode

11. **Keyboard Shortcuts**
    - Mouse/touch-only interface
    - Need: Quick actions via keyboard (e.g., `Space` to start/pause)

12. **Data Import**
    - Export only, no import
    - Need: CSV import to restore or migrate data

13. **Mobile App Version**
    - Web-only currently
    - Need: Native iOS/Android apps with offline support

14. **Integration APIs**
    - No external integrations
    - Need: Export to productivity tools (Notion, Obsidian, etc.)

---

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Storage**: Browser localStorage (no backend required)

---

## 🚀 Deployment Options

### Option 1: Quick Deploy (StackBlitz)
1. Go to [StackBlitz.com](https://stackblitz.com) → New Project → React (TypeScript)
2. Copy all project files into StackBlitz
3. The preview URL is your live app - bookmark it on your phone

### Option 2: Production Deploy (Vercel/Netlify)

**Prerequisites**: Node.js and a GitHub account

```bash
# Clone and install
git clone https://github.com/your-username/d1-protocol.git
cd d1-protocol
npm install

# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Deploy to Vercel**:
1. Push code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import repository
4. Deploy (automatically detects Vite config)

**Deploy to Netlify**:
1. Push code to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. Add new site from Git
4. Build command: `npm run build`
5. Publish directory: `dist`

---

## 📊 Usage Philosophy

This tool is designed around behavioral economics principles:
- **Pre-commitment**: Reduces decision fatigue and akrasia (weakness of will)
- **Signal vs. Noise**: Filters out low-quality data
- **Loss Aversion**: Contract deficits create motivational pressure
- **Identity Economics**: Framing as "asset building" vs. "time logging"
- **Credible Commitment**: Two-step exit prevents impulsive quitting

The "D1" nomenclature refers to first-order differences in productivity - measuring change rather than absolute levels.

---

## 📝 License

This project is open source. Built for personal productivity enhancement.
