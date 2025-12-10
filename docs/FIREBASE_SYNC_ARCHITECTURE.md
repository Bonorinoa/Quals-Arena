# Firebase Authentication & Cloud Sync - Technical Documentation

## Architecture Overview

The highBeta app uses a **local-first** architecture where localStorage is the primary data store, with Firebase providing optional cloud backup and cross-device sync capabilities.

### Key Design Principles

1. **Local-First**: The app works fully offline without authentication
2. **Optional Cloud Sync**: Firebase is an enhancement, not a requirement
3. **Callback Pattern**: localStorage triggers cloud sync via callbacks
4. **Error Resilience**: Sync failures don't break the app
5. **Automatic Retry**: Transient errors are retried with exponential backoff

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         App.tsx                         │
│  - Manages sync status UI                               │
│  - Sets up cloud sync callbacks when user signs in      │
│  - Handles initial sync on authentication               │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│   AuthContext.tsx    │          │    storage.ts        │
│                      │          │                      │
│ - Auth state mgmt    │          │ - LocalStorage ops   │
│ - Sign in/out        │          │ - Cloud callbacks    │
│ - Error handling     │          │ - Offline fallback   │
└──────────────────────┘          └──────────────────────┘
          │                                   │
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│    firebase.ts       │          │  firebaseSync.ts     │
│                      │          │                      │
│ - SDK initialization │          │ - CRUD operations    │
│ - Auth provider      │          │ - Retry logic        │
│ - Firestore client   │          │ - Merge strategies   │
└──────────────────────┘          └──────────────────────┘
```

## Data Flow

### 1. User Sign-In Flow

```
User clicks "Sign In"
  → AuthModal calls authContext.signIn()
  → signInWithPopup() opens Google OAuth
  → onAuthStateChanged fires with user
  → App.tsx detects user change
  → Calls performInitialSync()
  → Merges local + cloud data
  → Updates localStorage + state
  → Sets up sync callbacks
```

### 2. Session Complete Flow

```
User completes session
  → TimerView calls onSessionComplete(session)
  → App saves to localStorage via storage.saveSession()
  → storage.saveSession() triggers cloudSyncCallback
  → syncSingleSessionToCloud() uploads to Firestore
  → Success: UI shows "Synced" status
  → Failure: UI shows error with retry button
```

### 3. Settings Update Flow

```
User updates settings
  → SettingsView calls onSave(settings)
  → App saves to localStorage via storage.saveSettings()
  → storage.saveSettings() triggers cloudSettingsSyncCallback
  → syncSettingsToCloud() uploads to Firestore
  → Success: UI shows "Synced" status
  → Failure: Shows error, data safe in localStorage
```

### 4. Offline Operation

```
User is offline
  → Authentication still works (cached credentials)
  → All operations save to localStorage first
  → Cloud sync callbacks fail
  → Error handling catches failures
  → UI shows "offline" or "error" status
  → When online, retry button allows manual sync
```

## Error Handling Strategy

### Error Types

| Error Type | Cause | User Impact | Retry Strategy |
|------------|-------|-------------|----------------|
| `NETWORK_ERROR` | No internet connection | "Check your connection" | Auto-retry with backoff |
| `PERMISSION_ERROR` | Invalid/expired auth | "Sign in again" | No retry (user action required) |
| `QUOTA_EXCEEDED` | Firebase quota hit | "Contact support" | No retry (admin action required) |
| `UNKNOWN_ERROR` | Other failures | "Data saved locally" | Auto-retry with backoff |

### Retry Configuration

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds (cap)
};
```

**Backoff Formula**: `delay = min(baseDelay * 2^(attempt-1), maxDelay)`

- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4+: 10 seconds (capped)

### When Retries are Skipped

- **Permission errors**: User must re-authenticate
- **Quota errors**: Admin must increase quotas
- **Popup closed by user**: Not an error, just cancelled

## Merge Strategy (Initial Sync)

When a user signs in, local and cloud data must be merged:

### Sessions Merge Logic

```typescript
// 1. Combine local + cloud sessions
const allSessions = [...localSessions, ...cloudSessions];

// 2. Deduplicate by ID, keeping most recent timestamp
const sessionMap = new Map();
allSessions.forEach(session => {
  const existing = sessionMap.get(session.id);
  if (!existing || session.timestamp > existing.timestamp) {
    sessionMap.set(session.id, session);
  }
});

// 3. Sort by timestamp (newest first)
const merged = Array.from(sessionMap.values())
  .sort((a, b) => b.timestamp - a.timestamp);

// 4. Upload merged sessions back to cloud
await syncSessionsToCloud(userId, merged);
```

**Why this works:**
- Same session ID with different timestamps = same session edited on different devices
- We keep the newest version (last-write-wins)
- All unique sessions from both sources are preserved
- Cloud becomes source of truth after merge

### Settings Merge Logic

```typescript
// Simple: Cloud settings take precedence
const merged = cloudSettings || localSettings;
await syncSettingsToCloud(userId, merged);
```

**Why this works:**
- Settings are a single document (not a list)
- Cloud is newer if it exists (user probably edited on another device)
- Fallback to local for first-time sync

## Security Model

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                       && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Key Points:**
1. Users must be authenticated (`request.auth != null`)
2. Users can only access paths under their own UID
3. No cross-user data access
4. Everything else is denied by default

### Authentication Edge Cases

| Scenario | Handling |
|----------|----------|
| Popup blocked | Show error: "Allow popups for this site" |
| User cancels | Silent (don't show intrusive error) |
| Token expires | Firebase auto-refreshes via `onAuthStateChanged` |
| Network failure | Show error: "Check your connection" |
| Account switch | New `onAuthStateChanged` event, re-sync automatically |
| Sign out | Clear callbacks, set status to 'idle' |

## Sync Status States

| State | Meaning | UI Display |
|-------|---------|------------|
| `idle` | No sync activity | Cloud icon (gray) |
| `syncing-initial` | First sync after sign-in | Cloud icon (blue, pulsing) + "Syncing..." |
| `syncing-session` | Uploading a session | Cloud icon (blue, pulsing) + "Syncing session..." |
| `syncing-settings` | Uploading settings | Cloud icon (blue, pulsing) + "Syncing settings..." |
| `synced` | Sync completed | Checkmark icon (green) + "Synced" |
| `error` | Sync failed | Alert icon (red) + "Sync Error" |
| `offline` | No network detected | CloudOff icon (orange) + "Offline" |

## Testing Strategy

### Unit Tests

1. **firebaseSync.test.ts**: Tests all CRUD operations with mocked Firestore
   - Successful syncs
   - Error handling
   - Retry logic
   - Merge strategies

2. **AuthContext.test.tsx**: Tests authentication flows with mocked Firebase Auth
   - Sign in/out
   - Error classification
   - Token refresh (via onAuthStateChanged)

3. **storage.test.ts**: Tests localStorage operations (already exists)
   - Save/retrieve sessions
   - Save/retrieve settings
   - Export/import data

### Integration Tests (Manual)

See "Testing Checklist" section below.

## Testing Checklist

### Fresh Install Flow
- [ ] Open app (no existing data)
- [ ] Sign in with Google
- [ ] Complete a session
- [ ] Verify session syncs to Firestore (check Firebase Console)
- [ ] Sign out and sign back in
- [ ] Verify session persists

### Existing Data + First Sign-In
- [ ] Create local sessions without signing in
- [ ] Sign in with Google
- [ ] Verify initial sync merges local + cloud data
- [ ] Verify no duplicate sessions
- [ ] Verify all sessions visible in dashboard

### Multi-Device Sync
- [ ] Sign in on Device A
- [ ] Complete session on Device A
- [ ] Sign in on Device B with same account
- [ ] Verify session from Device A appears on Device B
- [ ] Complete session on Device B
- [ ] Return to Device A and reload
- [ ] Verify session from Device B appears on Device A

### Offline Behavior
- [ ] Sign in while online
- [ ] Complete session while online (verify sync)
- [ ] Disconnect from internet
- [ ] Complete another session offline
- [ ] Verify session saves to localStorage
- [ ] Verify UI shows offline/error status
- [ ] Reconnect to internet
- [ ] Click "Retry Sync" button
- [ ] Verify offline session syncs to cloud

### Account Switching
- [ ] Sign in with Account A
- [ ] Complete sessions
- [ ] Sign out
- [ ] Sign in with Account B (different Google account)
- [ ] Verify only Account B's data is visible
- [ ] Verify Account A's data doesn't appear
- [ ] Switch back to Account A
- [ ] Verify Account A's data reappears

### Popup Blocked
- [ ] Enable popup blocker
- [ ] Try to sign in
- [ ] Verify error message mentions allowing popups
- [ ] Allow popups for the site
- [ ] Try again and verify success

### Token Expiration
- [ ] Sign in and keep app open for >1 hour
- [ ] Complete a session
- [ ] Verify sync still works (token auto-refreshed)
- [ ] Check browser dev tools for no auth errors

## Common Issues & Troubleshooting

### "auth/unauthorized-domain" Error

**Problem**: The deployed URL is not in Firebase's authorized domains list.

**Solution**: 
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Add your Vercel/deployment URL (e.g., `your-app.vercel.app`)
4. Try signing in again

### Sync Shows "Error" But Data Exists Locally

**Problem**: Network issues or Firestore permission errors.

**Solution**:
1. Check browser console for specific error
2. Verify you're online
3. Try clicking "Retry Sync" button
4. If permission error, sign out and sign in again
5. If problem persists, check Firestore rules are deployed

### Sessions Duplicated After Sign-In

**Problem**: Merge logic may have a bug.

**Debug**:
1. Check browser localStorage: `localStorage.getItem('highbeta_sessions')`
2. Check Firestore Console: View user's sessions collection
3. Look for sessions with same ID but different timestamps
4. Report bug with session IDs and timestamps

### "Synced" Status Shows But Data Not in Firestore

**Problem**: Firestore rules may be blocking writes.

**Solution**:
1. Check Firestore Console → Rules tab
2. Verify rules match `firestore.rules` file
3. Check "Usage" tab for permission-denied errors
4. Deploy correct rules: `firebase deploy --only firestore:rules`

### Sync Slow or Hanging

**Problem**: Large number of sessions being synced.

**Explanation**: 
- `performFullSync` uploads all sessions in parallel
- Network speed affects upload time
- Firestore has rate limits (500 writes/second)

**Solution**:
- Be patient during initial sync
- Subsequent syncs only upload one session at a time
- Consider implementing pagination for large datasets (future enhancement)

## Future Enhancements

### Potential Improvements

1. **Real-time Sync**: Use Firestore listeners to sync changes across devices instantly
2. **Conflict Resolution**: Better handling of same session edited on multiple devices
3. **Batch Uploads**: Optimize initial sync for users with 1000+ sessions
4. **Sync History**: Show user a log of sync operations for debugging
5. **Selective Sync**: Let user choose which data to sync (sessions, settings, etc.)
6. **Sync Status Persistence**: Remember last sync time in localStorage
7. **Background Sync**: Use Service Workers to sync when app is closed
8. **Delta Sync**: Only sync sessions that changed since last sync
9. **Compression**: Compress large notes before uploading

### Not Recommended

- **Two-way Real-time Sync**: Adds complexity, increases costs
- **Firebase Offline Persistence for All Users**: Only helps authenticated users, adds overhead
- **Custom Auth Backend**: Firebase handles it well, no need to reinvent

## Performance Considerations

### Current Performance

- **Initial Sync**: ~1-3 seconds for 10-50 sessions
- **Single Session Sync**: ~200-500ms
- **Settings Sync**: ~100-200ms

### Bottlenecks

1. **Network Latency**: Biggest factor, especially on mobile
2. **Firestore Pricing**: Each operation counts toward quotas
3. **Bundle Size**: Firebase SDK adds ~300KB to bundle

### Optimization Tips

- Keep sessions and notes reasonably sized
- Avoid excessive settings changes
- Use batch operations where possible
- Monitor Firestore usage dashboard

## Cost Analysis

### Firebase Free Tier (Spark Plan)

- **Firestore**: 50K reads, 20K writes, 1GB storage per day
- **Authentication**: Unlimited sign-ins

### Estimated Usage Per User

- **Initial Sync**: 100 reads + 100 writes (first time)
- **Daily Usage**: 1-5 writes (sessions), 1-2 reads (settings)
- **Storage**: ~1MB per 1000 sessions

**Conclusion**: Free tier easily supports hundreds of active users.

## Maintenance

### Regular Tasks

- Monitor Firestore usage dashboard weekly
- Check for auth errors in Firebase Console
- Review sync error patterns
- Update Firebase SDK quarterly

### Before Major Releases

- Test auth flow on all browsers
- Verify Firestore rules are correct
- Check Firebase quota usage
- Test offline scenarios
- Run full test suite

---

**Last Updated**: December 2024  
**Version**: 1.3  
**Maintained By**: highBeta Team
