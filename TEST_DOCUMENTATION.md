# Test Documentation

This document describes the test suite for the highBeta application.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Test Structure

### Unit Tests

#### `tests/sessionUtils.test.ts`
Tests core session calculation utilities:
- `getTotalDuration()` - Sum of session durations
- `getTotalReps()` - Sum of reps across sessions
- `getSessionsByDate()` - Filter sessions by date
- `calculateSER()` - Sober Efficiency Rate (reps/hour)
- `getSessionBudgetBalance()` - Single session deficit/surplus
- `getDailyBudgetBalance()` - Daily aggregate balance
- `getWeeklyBudgetBalance()` - Weekly statistics

**Key validations:**
- Empty array handling
- Threshold enforcement (5-minute minimum for SER)
- Surplus and deficit calculations
- Date range filtering

#### `tests/dateUtils.test.ts`
Tests date manipulation and formatting:
- `getLocalDate()` - Current date in YYYY-MM-DD format
- `dateToLocalString()` - Date object to string conversion
- `getYesterdayDate()` - Calculate yesterday
- `subtractDays()` - Date arithmetic

**Key validations:**
- Timezone offset handling
- Month and year boundary crossing
- Format consistency (YYYY-MM-DD)

#### `tests/timeUtils.test.ts`
Tests time formatting utilities:
- `formatTime()` - Seconds to HH:MM:SS
- `formatTimeFull()` - Handles negative values

**Key validations:**
- Zero-padding
- Large durations (10+ hours)
- Negative value handling
- Fractional second flooring

#### `tests/storage.test.ts`
Tests localStorage abstraction layer:
- `getSessions()` / `saveSession()` - Session CRUD
- `getSettings()` / `saveSettings()` - Settings management
- `clearData()` - Data deletion
- `checkVersion()` - Version migration
- `exportDataJSON()` / `importDataJSON()` - Backup/restore

**Key validations:**
- Corrupted data graceful handling
- Prepend ordering (newest first)
- Default settings merging
- Export/import data integrity
- Version mismatch detection

### Integration/Scenario Tests

#### `tests/scenarios.test.ts`

**Scenario 1: Multi-Day Data Aggregation**
- Generates 3 days of sample sessions with varying patterns
- Validates SER calculations across different intensities
- Tests daily and cumulative metrics
- Validates budget balance with mixed surplus/deficit

**Scenario 2: Heterogeneous Daily Sessions**
- Simulates morning, afternoon, evening, and late-night sessions
- Tests varying performance levels (fresh vs fatigued)
- Validates sessions with and without commitment targets
- Tests daily balance with mixed commitment adherence

**Scenario 3: JSON Backup & Restore**
- Full export/import cycle validation
- Tests data overwriting behavior
- Validates mental notes preservation
- Tests cross-timezone/device migration scenarios

**Scenario 4: Edge Cases & Boundaries**
- Zero-duration sessions
- Very short sessions (below 5-minute threshold)
- Very long sessions (12+ hours)
- Maximum reps (50)
- Large deficits (90%+ below target)
- Empty datasets

**Scenario 5: Week-Long Performance Tracking**
- 7 days of varied performance (weekday vs weekend)
- Tests weekly aggregation functions
- Validates unique date counting
- Tests multi-session days

## Test Data Patterns

### Typical Session Object
```typescript
{
  id: 'unique-id',
  timestamp: 1702080000000, // Unix timestamp
  durationSeconds: 3600, // 1 hour
  targetDurationSeconds: 3600, // Optional commitment
  reps: 5,
  notes: 'Session notes',
  mentalNotes: [ // Optional
    { timestamp: 300, text: 'Thought during session' }
  ],
  date: '2024-01-01' // YYYY-MM-DD
}
```

### Test Date Ranges
- Single day: `getLocalDate()`
- Yesterday: `getYesterdayDate()`
- N days ago: `subtractDays(new Date(), N)`
- Week range: `startOfWeek()` to `endOfWeek()`

## Validation Criteria

### SER (Sober Efficiency Rate)
- Formula: `reps / (durationSeconds / 3600)`
- Returns 0 if duration < 300 seconds (5 minutes)
- Expected ranges:
  - Low intensity: 3-5 reps/hour
  - Medium intensity: 6-10 reps/hour
  - High intensity: 10+ reps/hour

### Budget Balance
- Formula: `actual - target`
- Positive = Surplus (exceeded commitment)
- Negative = Deficit (fell short)
- Zero = Perfect match or no target set

### Weekly Penalty Warning
- Triggers when average daily deficit > 1 hour (-3600 seconds)
- Formula: `totalBalance / 7`

## Mocking

### Browser APIs
- `window.wakeLock` - Mocked in `tests/setup.ts`
- `localStorage` - Provided by happy-dom (auto-cleared between tests)

### Network Requests
- Google Sheets webhook not tested (requires real endpoint)
- Marked as integration point for manual testing

## Coverage Goals

- ✅ **100% of utility functions** - All pure functions tested
- ✅ **100% of storage layer** - CRUD and error handling
- ✅ **Real-world scenarios** - Multi-day, multi-session patterns
- ✅ **Edge cases** - Zero, max, negative, empty values
- ⚠️ **UI Components** - Not tested (React components require different setup)

## Continuous Integration

Tests should be run:
1. Before committing changes
2. In CI/CD pipeline (on push)
3. Before releasing versions

## Future Test Additions

### Potential Coverage Gaps
1. **React Component Tests** - Test UI interactions
2. **Timer Drift Validation** - Test delta-time accuracy
3. **Wake Lock Behavior** - Test screen awake functionality
4. **Google Sheets Sync** - Test webhook integration (requires mock server)
5. **Browser Compatibility** - Test across browsers (Chromium, Firefox, Safari)

### Performance Tests
1. Large dataset handling (1000+ sessions)
2. Export/import performance benchmarks
3. Memory leak detection

## Debugging Failed Tests

### Common Issues

1. **Date/Time Mismatch**
   - Cause: Timezone differences between test environment and local
   - Solution: Use `subtractDays()` and `getLocalDate()` consistently

2. **localStorage Pollution**
   - Cause: Previous test didn't clean up
   - Solution: `beforeEach()` hooks clear localStorage automatically

3. **Floating Point Precision**
   - Cause: SER calculations may have rounding errors
   - Solution: Use `toBeCloseTo(expected, decimals)` instead of `toBe()`

### Debug Commands

```bash
# Run specific test file
npx vitest tests/sessionUtils.test.ts

# Run specific test by name
npx vitest -t "should calculate SER correctly"

# Run with verbose output
npx vitest --reporter=verbose

# Run with UI for debugging
npm run test:ui
```

## Test Maintenance

### When to Update Tests

1. **Adding new features** - Add corresponding tests first (TDD)
2. **Changing calculations** - Update expected values in scenarios
3. **Refactoring** - Tests should still pass (if they don't, behavior changed)
4. **Bug fixes** - Add test case that reproduces bug first

### Test Quality Checklist

- [ ] Test has clear, descriptive name
- [ ] Test validates one specific behavior
- [ ] Test uses realistic data
- [ ] Test cleans up after itself
- [ ] Test is deterministic (no random values)
- [ ] Test has clear assertions with helpful error messages

## Related Documentation

- [README.md](./README.md) - Application features and usage
- [V3_EVALUATION_REPORT.md](./V3_EVALUATION_REPORT.md) - v3.0 evaluation results
- [types.ts](./types.ts) - TypeScript type definitions
