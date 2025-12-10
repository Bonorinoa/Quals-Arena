# Changelog

All notable changes to the highBeta project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2024-12-10

### Added - Sustainable Productivity & Protocol Simplification
- **Daily Limit Warning (6-Hour Cap)**: New safety mechanism for sustainable performance
  - Automatically displays an encouraging warning modal when daily session time exceeds 6 hours
  - Message maintains the app's cool, analytical tone with a touch of humor
  - Explains the rationale behind the 6-hour daily limit (marginal returns, cognitive load, sustainability)
  - Non-blocking: users acknowledge and continue using the app
  - Implemented in `DailyLimitWarning.tsx` component
  - New utility functions: `getDailyTotalHours()` and `isDailyLimitExceeded()` in sessionUtils.ts
- **Audio Features Planning**: Comprehensive analysis document for binaural beats and playlist support
  - Created `AUDIO_FEATURES_ANALYSIS.md` in `/docs/planning`
  - Evaluates pros/cons of audio integration
  - Analyzes philosophical alignment with "low noise" protocol
  - Provides multiple implementation options (binaural beats only, custom playlists, hybrid, documentation-only)
  - Recommendation: Do not implement at this stage to preserve minimalism
  - Includes discussion questions and decision framework

### Removed - Legacy Features
- **Google Sheets Integration**: Completely removed legacy sync feature
  - Removed Google Sheets URL field from Settings view
  - Removed `syncToGoogleSheets()`, `testCloudConnection()`, and `processSyncQueue()` functions from storage.ts
  - Removed `googleSheetsUrl` from UserSettings interface and DEFAULT_SETTINGS
  - Removed sync queue management and related types
  - Cleaned up documentation in README.md (removed "Option 3: Google Sheets Sync" section)
  - Firebase Cloud Sync remains as the primary cloud backup solution
  - Simplifies codebase and reduces maintenance burden

### Changed
- **README.md**: Updated Data Sovereignty section to reference Firebase instead of Google Sheets
- **Settings UI**: Streamlined settings panel with removal of cloud backup configuration

### Technical
- Reduced code complexity by removing ~90 lines of Google Sheets sync logic
- Cleaner separation between local storage and Firebase sync
- Improved type safety with removal of optional googleSheetsUrl field

### Documentation
- Added comprehensive audio features analysis document
- Updated README to reflect current backup options
- Documented 6-hour daily limit rationale

### Next Steps
- Monitor user feedback on 6-hour daily limit
- Gather user requests for audio features before implementation
- Continue focus on core productivity metrics (Time Budget, SER, Consistency)

---

## [3.1.0] - 2024-12-09

### Added - Gaming Prevention & Protocol Integrity
- **Proportional Surplus Cap**: Surpluses now capped at 50% of commitment
  - Prevents gaming via systematic under-commitment
  - Maintains fairness: 2h commitment → max 1h surplus, 30m commitment → max 15m surplus
  - Deficits never capped (full accountability)
  - Backward compatible with existing sessions
  - Documented in SURPLUS_CAP_STRATEGY.md
- **Commitment Pattern Analysis**: Behavioral nudge system
  - Tracks average commitment levels across sessions
  - Detects low commitment patterns (70%+ minimum commitment with 10+ sessions)
  - Non-punitive educational warnings
  - Displays on Dashboard with actionable suggestions
- **Enhanced Dashboard Warnings**: New alert card system
  - Commitment Pattern Alert (amber) when gaming detected
  - Shows minimum commitment ratio and average
  - Suggests higher pre-commitments for building genuine alpha
  - Explains surplus cap mechanism

### Changed
- **Budget Balance Calculation**: Now includes proportional cap logic
  - `getSessionBudgetBalance()` updated with MAX_SURPLUS_RATIO (0.5)
  - Weekly budget calculations use capped values
  - Clear documentation in code comments

### Technical
- **Test Coverage**: Expanded from 81 to 95 tests
  - 7 new tests for surplus cap edge cases
  - 7 new tests for commitment pattern analysis
  - All tests passing (100% pass rate)
- **Code Quality**: Enhanced documentation
  - Added comprehensive JSDoc comments
  - Included usage examples in function documentation
  - Updated type definitions

### Documentation
- Implemented recommendations from SURPLUS_CAP_STRATEGY.md
- Completed v3.x development as outlined in V4_ROADMAP.md
- Phase 1 (Proportional Cap) and Phase 2 (Behavioral Nudge) complete

---

## [3.0.0] - 2024-12-09

### Added
- **Comprehensive Test Suite**: 77 automated tests covering all core functionality
  - Unit tests for utility functions (sessionUtils, dateUtils, timeUtils)
  - Integration tests for storage layer
  - Scenario-based tests for real-world usage patterns
  - Edge case and boundary condition tests
- **Weekly Budget Balance Metric**: New comprehensive time accounting system
  - Total balance (surplus/deficit)
  - Average daily balance
  - Separate tracking of gains and defaults
  - Penalty warning when average daily deficit exceeds 1 hour
- **Monthly Consistency Grid**: Enhanced calendar view
  - Displays current month with proper weekday alignment
  - Shows day numbers for easier navigation
  - Click on any day to view detailed session breakdown
- **Daily Stats Modal**: Interactive day-detail view
  - View all sessions for a specific day
  - See aggregated metrics (duration, reps, SER)
  - Access via clicking on calendar grid days
- **Mental Notes System**: Stream of consciousness capture during sessions
  - Press "N" during a session to capture thoughts
  - Timestamps automatically recorded
  - Preserved in session data and visible in logging view
- **Enhanced Timer View**: Multi-phase session flow
  - Duration selection (30m to 4h)
  - Optional warm-up/calibration phase (1-5 minutes)
  - Immersive breathing animation during warm-up
  - Mental notes capture during active sessions
- **Performance Insights**: 7-day performance chart
  - Bar chart showing daily reps
  - Baseline reference line (7-day average)
  - Color coding for above/below baseline performance
- **Delta Indicators**: Day-over-day comparison
  - Daily reps comparison with previous day
  - Percentage change calculation
  - Visual trend indicators (up/down arrows)
- **Test Documentation**: Comprehensive guides for testing
  - Test execution instructions
  - Scenario descriptions
  - Debugging guide

### Changed
- **Consistency Grid**: Now shows current month instead of last 60 days
- **Navigation**: Improved keyboard navigation and accessibility
- **Error Handling**: Enhanced corrupted data recovery
- **Storage Version**: Updated to 1.3 with migration support

### Fixed
- Timezone handling in date calculations
- Budget balance calculation edge cases
- Weekly metrics date range filtering
- Session ordering (newest first)

### Technical
- **Build**: Successfully compiles to 599.61 kB (171.24 kB gzipped)
- **Dependencies**: Updated to latest stable versions
  - React 18.3.1
  - Vite 5.1.4
  - TypeScript 5.2.2
- **Testing**: Vitest 4.0.15 with happy-dom environment
- **Code Quality**: Full TypeScript coverage, no implicit any

### Documentation
- Added V3_EVALUATION_REPORT.md with comprehensive testing results
- Added TEST_DOCUMENTATION.md with test suite guide
- Updated metadata.json with version 3.0.0

### Performance
- 77 tests execute in 56ms (average 0.73ms per test)
- Build completes in 5.34 seconds
- No runtime performance degradation

---

## [2.x] - Previous Versions

### Major Features from v2.x
- The Arena (Focus Mode) with drift-proof timer
- The Scoreboard (Analytics Dashboard)
- Data export/import (CSV and JSON)
- Google Sheets webhook integration
- Wake Lock API integration
- Session commitment tracking
- Signal Integrity (sober streak) tracking
- Responsive mobile-first design
- Dark mode UI with minimal design

---

## Future Roadmap (Post-v3.0)

### Potential v3.1 Features
- Code-splitting for reduced bundle size
- Undo/redo for session edits
- Export charts as images
- Enhanced accessibility (screen reader support)
- Service worker for offline support

### Potential v4.0 Features
- Multiple user profiles
- AI-powered insights and recommendations
- Theme customization
- Advanced analytics (trends, predictions)
- Social features (optional leaderboards)

---

## Version History Summary

- **v3.0.0** (2024-12-09) - Weekly budget balance, monthly grid, comprehensive tests, mental notes
- **v2.x** - Core functionality (Timer, Dashboard, Analytics, Export/Import)
- **v1.x** - Initial release (Basic timer and session tracking)

---

**Note**: This project follows semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes or significant new features
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible
