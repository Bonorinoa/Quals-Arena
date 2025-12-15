# E2E Test Automation Setup Guide

**Version**: 4.0.0  
**Last Updated**: 2024-12-15  
**Status**: Documentation for future implementation

---

## Overview

This document provides guidance for implementing automated End-to-End (E2E) tests for highBeta using Playwright or Cypress. While comprehensive manual testing is documented in `E2E_TEST_CHECKLIST.md`, automated tests can supplement manual testing for critical user workflows.

---

## Recommended Testing Framework: Playwright

### Why Playwright?
- **Cross-browser support**: Chrome, Firefox, Safari, Edge
- **Mobile emulation**: Test responsive designs
- **Network interception**: Mock Firebase calls
- **Auto-wait mechanisms**: Reduces flaky tests
- **TypeScript support**: Matches our codebase
- **Active development**: Microsoft-maintained

### Alternative: Cypress
- **Pros**: Great DX, real-time test runner, time-travel debugging
- **Cons**: Limited browser support (no Safari), heavier bundle

**Recommendation**: Use Playwright for broader browser coverage and Firebase testing capabilities.

---

## Setup Instructions (Playwright)

### 1. Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Create Playwright Config

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Update package.json

Add test scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 4. Create Test Directory Structure

```
e2e/
├── auth.spec.ts
├── session-workflow.spec.ts
├── session-edit.spec.ts
├── offline-sync.spec.ts
├── fixtures/
│   ├── auth.ts
│   └── firebase-mock.ts
└── utils/
    ├── test-helpers.ts
    └── selectors.ts
```

---

## Critical E2E Test Cases to Automate

### Priority 1: Must Automate (Core User Flows)

#### 1. Complete Session Workflow
```typescript
// e2e/session-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete session workflow', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to arena
  await page.click('text=Enter Arena');
  
  // Select 30-minute duration
  await page.click('text=30m');
  
  // Skip warmup
  await page.click('text=Skip');
  
  // Wait for timer to start
  await expect(page.locator('text=The Arena')).toBeVisible();
  
  // Wait a few seconds (simulated session)
  await page.waitForTimeout(3000);
  
  // Stop timer
  await page.click('[aria-label="Stop timer"]');
  await page.click('text=End');
  
  // Log session
  await page.fill('input[type="number"]', '5'); // reps
  await page.fill('textarea', 'E2E test session'); // notes
  await page.click('text=Log Asset');
  
  // Verify session saved
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

#### 2. Authentication Flow
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('sign in with Google OAuth', async ({ page, context }) => {
  await page.goto('/');
  
  // Mock Firebase Auth popup (requires network interception)
  await context.route('**/identitytoolkit.googleapis.com/**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        kind: 'identitytoolkit#VerifyAssertionResponse',
        localId: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      }),
    });
  });
  
  await page.click('text=Sign in with Google');
  
  // Verify authenticated state
  await expect(page.locator('text=test@example.com')).toBeVisible();
});

test('sign out', async ({ page }) => {
  // Assumes already authenticated (use beforeEach to set auth state)
  await page.goto('/');
  await page.click('text=Sign Out');
  
  await expect(page.locator('text=Sign in with Google')).toBeVisible();
});
```

#### 3. Session Edit
```typescript
// e2e/session-edit.spec.ts
import { test, expect } from '@playwright/test';

test('edit session reps and notes', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to dashboard
  await page.click('text=Dashboard');
  
  // Find first session and click edit
  await page.locator('[aria-label="Edit session"]').first().click();
  
  // Edit fields
  await page.fill('input[type="number"]', '10'); // new reps
  await page.fill('textarea', 'Updated notes');
  
  // Save changes
  await page.click('text=Save Changes');
  
  // Verify update
  await expect(page.locator('text=10 reps')).toBeVisible();
  await expect(page.locator('text=Updated notes')).toBeVisible();
});
```

#### 4. Session Delete
```typescript
test('delete session with confirmation', async ({ page }) => {
  await page.goto('/dashboard');
  
  const sessionCountBefore = await page.locator('[data-testid="session-card"]').count();
  
  // Delete first session
  await page.locator('[aria-label="Delete session"]').first().click();
  
  // Confirm deletion
  await page.click('text=Confirm Delete');
  
  // Verify session removed
  const sessionCountAfter = await page.locator('[data-testid="session-card"]').count();
  expect(sessionCountAfter).toBe(sessionCountBefore - 1);
});
```

### Priority 2: Should Automate (Important Flows)

#### 5. Offline Session Creation
```typescript
// e2e/offline-sync.spec.ts
import { test, expect } from '@playwright/test';

test('create session offline and sync when online', async ({ page, context }) => {
  await page.goto('/');
  
  // Go offline
  await context.setOffline(true);
  
  // Verify offline indicator
  await expect(page.locator('text=Offline')).toBeVisible();
  
  // Create session
  await page.click('text=Enter Arena');
  await page.click('text=30m');
  await page.click('text=Skip');
  
  // Wait and stop
  await page.waitForTimeout(2000);
  await page.click('[aria-label="Stop timer"]');
  await page.click('text=End');
  await page.fill('input[type="number"]', '3');
  await page.click('text=Log Asset');
  
  // Verify offline queue indicator (if implemented)
  await expect(page.locator('text=Pending sync')).toBeVisible();
  
  // Go online
  await context.setOffline(false);
  
  // Wait for sync
  await page.waitForTimeout(3000);
  
  // Verify sync complete
  await expect(page.locator('text=Synced')).toBeVisible();
});
```

#### 6. Keyboard Shortcuts
```typescript
test('keyboard shortcuts work', async ({ page }) => {
  await page.goto('/');
  
  // Press 'E' to enter arena
  await page.keyboard.press('e');
  await expect(page.locator('text=Phase 1: Commitment')).toBeVisible();
  
  // Press 'D' to go to dashboard
  await page.keyboard.press('d');
  await expect(page.locator('text=Dashboard')).toBeVisible();
  
  // Press '?' to show help
  await page.keyboard.press('?');
  await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
  
  // Press Escape to close
  await page.keyboard.press('Escape');
  await expect(page.locator('text=Keyboard Shortcuts')).not.toBeVisible();
});
```

### Priority 3: Nice to Automate (Edge Cases)

#### 7. Mental Notes During Session
```typescript
test('add mental notes during session', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Enter Arena');
  await page.click('text=30m');
  await page.click('text=Skip');
  
  // Wait for timer to start
  await page.waitForTimeout(2000);
  
  // Press 'N' to add mental note
  await page.keyboard.press('n');
  await page.fill('input[placeholder="Capture the thought..."]', 'Test mental note');
  await page.keyboard.press('Enter');
  
  // Stop and verify note appears in logging
  await page.click('[aria-label="Stop timer"]');
  await page.click('text=End');
  
  await expect(page.locator('text=Test mental note')).toBeVisible();
});
```

#### 8. Surplus Cap Validation
```typescript
test('surplus cap applied at 50%', async ({ page }) => {
  await page.goto('/');
  
  // Create overtime session (simulate long duration)
  // This would require either:
  // 1. Mocking timer to advance quickly
  // 2. Directly manipulating session data via localStorage
  // 3. Using Firebase emulator to inject sessions
  
  // For demonstration, use localStorage injection:
  await page.evaluate(() => {
    const session = {
      id: 'test-session-surplus',
      timestamp: Date.now() - 90 * 60 * 1000, // 90 minutes ago
      durationSeconds: 5400, // 90 minutes
      targetDurationSeconds: 3600, // 60 minutes (commitment)
      reps: 5,
      notes: 'Surplus cap test',
      date: new Date().toISOString().split('T')[0],
    };
    
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('sessions', JSON.stringify(sessions));
  });
  
  await page.reload();
  await page.click('text=Dashboard');
  
  // Verify surplus capped at 30 minutes (50% of 60min commitment)
  await expect(page.locator('text=+30m')).toBeVisible(); // Capped surplus
  await expect(page.locator('text=Cap Applied')).toBeVisible();
});
```

---

## Test Utilities

### Fixtures for Auth State

```typescript
// e2e/fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Set auth state in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      }));
    });
    await page.reload();
    await use(page);
  },
});
```

### Firebase Emulator Mock

```typescript
// e2e/fixtures/firebase-mock.ts
import { Page } from '@playwright/test';

export async function mockFirebase(page: Page) {
  await page.route('**/firestore.googleapis.com/**', route => {
    const url = route.request().url();
    
    if (url.includes('runQuery')) {
      // Mock Firestore queries
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      });
    } else if (url.includes('commit')) {
      // Mock Firestore writes
      route.fulfill({
        status: 200,
        body: JSON.stringify({ writeResults: [] }),
      });
    } else {
      route.continue();
    }
  });
}
```

---

## Running E2E Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/session-workflow.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug

# Run on specific browser
npx playwright test --project=chromium
```

### CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Best Practices

### 1. Use Data Attributes for Selectors
```typescript
// ✅ Good - stable selector
await page.click('[data-testid="session-edit-button"]');

// ❌ Avoid - brittle selector
await page.click('button:has-text("Edit")');
```

Add to components:
```tsx
<button data-testid="session-edit-button" onClick={handleEdit}>
  Edit
</button>
```

### 2. Avoid Hardcoded Waits
```typescript
// ✅ Good - wait for specific condition
await expect(page.locator('text=Session saved')).toBeVisible();

// ❌ Avoid - arbitrary timeout
await page.waitForTimeout(5000);
```

### 3. Use Page Object Model (POM)
```typescript
// e2e/pages/arena.page.ts
export class ArenaPage {
  constructor(private page: Page) {}
  
  async selectDuration(duration: '30m' | '1h' | '2h') {
    await this.page.click(`text=${duration}`);
  }
  
  async skipWarmup() {
    await this.page.click('text=Skip');
  }
  
  async stopSession() {
    await this.page.click('[aria-label="Stop timer"]');
    await this.page.click('text=End');
  }
}

// Use in tests:
test('use arena page object', async ({ page }) => {
  const arena = new ArenaPage(page);
  await arena.selectDuration('30m');
  await arena.skipWarmup();
});
```

### 4. Clean Up After Tests
```typescript
test.afterEach(async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  
  // Clear cookies
  await page.context().clearCookies();
});
```

### 5. Firebase Emulator for Consistent State
```bash
# Install Firebase tools
npm install --save-dev firebase-tools

# Start emulators
firebase emulators:start

# In tests, point to emulator
await page.goto('http://localhost:5173?useEmulator=true');
```

---

## Coverage Goals

| Category | Manual Tests | Automated Tests | Coverage Goal |
|----------|--------------|-----------------|---------------|
| Critical Paths | 30+ | 5-8 | 100% automated |
| Important Flows | 50+ | 10-15 | 70% automated |
| Edge Cases | 40+ | 5-10 | 30% automated |
| **Total** | **120+** | **20-30** | **60% automated** |

---

## Maintenance

### When to Update E2E Tests
- [ ] When user flows change
- [ ] When new features are added
- [ ] When critical bugs are fixed (add regression test)
- [ ] When UI selectors change (update page objects)

### Test Review Cadence
- **Weekly**: Review flaky tests, update brittle selectors
- **Monthly**: Review coverage, add tests for new features
- **Quarterly**: Audit test suite, remove obsolete tests

---

## Troubleshooting

### Common Issues

**Problem**: Tests fail with "Element not found"
**Solution**: Use `await expect(...).toBeVisible()` instead of direct clicks

**Problem**: Flaky tests (pass/fail inconsistently)
**Solution**: 
- Add explicit waits for dynamic content
- Use Playwright's auto-wait instead of timeouts
- Check for race conditions in app code

**Problem**: Firebase Auth mocking fails
**Solution**: 
- Use Firebase emulators instead of mocking
- Or use localStorage to inject auth state

**Problem**: Slow test execution
**Solution**:
- Run tests in parallel (`fullyParallel: true`)
- Use headless mode in CI
- Reduce test scope (focus on critical paths)

---

## Next Steps

1. **Install Playwright**: Follow setup instructions above
2. **Implement Priority 1 Tests**: Complete session workflow, auth, edit, delete
3. **Add Data Attributes**: Update components with `data-testid` attributes
4. **Set Up CI Integration**: Add GitHub Actions workflow
5. **Expand Coverage**: Add Priority 2 and 3 tests over time
6. **Monitor Flakiness**: Track and fix flaky tests promptly

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Firebase Emulator Setup](https://firebase.google.com/docs/emulator-suite)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-15  
**Status**: Ready for implementation  
**Estimated Effort**: 3-4 days to implement Priority 1 tests
