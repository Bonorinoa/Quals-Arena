# Firebase Authentication & Firestore Sync - Implementation Guide

## Overview

This implementation adds Firebase Authentication with Google sign-in and Firestore data synchronization to highBeta v4.0. The app maintains its local-first architecture while adding optional cloud backup and multi-device sync capabilities.

## Features Implemented

### 1. Firebase Authentication
- **Google OAuth Sign-in**: One-click authentication using Google accounts
- **Auth State Management**: Persistent authentication across page reloads
- **Auth Context**: React Context API for global auth state management
- **Error Handling**: Graceful error messages for failed authentication attempts

### 2. Firestore Data Sync
- **Session Sync**: Automatic backup of completed sessions to cloud
- **Settings Sync**: Real-time synchronization of user settings
- **Merge Strategy**: Smart deduplication and merging of local and cloud data
- **Offline-First**: localStorage remains primary storage, cloud is optional enhancement

### 3. UI Components
- **Auth Modal**: Beautiful glass morphism design matching existing aesthetic
- **Sync Status Indicator**: Visual feedback for sync state (syncing/synced/error)
- **Sign In Button**: Integrated into navigation bar with user avatar when signed in
- **Responsive Design**: Mobile-friendly authentication flow

### 4. Security
- **Firestore Rules**: User data isolation - users can only access their own data
- **Environment Variables**: Secure configuration management via Vite env vars
- **Optional Feature**: App works fully without signing in (local-only mode)

## Architecture

### File Structure
```
services/
  ├── firebase.ts           # Firebase SDK initialization
  ├── AuthContext.tsx       # React Context for auth state
  ├── firebaseSync.ts       # Firestore sync operations
  └── storage.ts            # Enhanced with cloud sync callbacks

components/
  └── AuthModal.tsx         # Sign in/out UI component

App.tsx                     # Integrated with AuthProvider and sync logic
firestore.rules            # Security rules for Firestore
.env.example               # Template for Firebase configuration
```

### Data Flow

1. **Local-First**: All data writes go to localStorage first
2. **Optional Cloud Sync**: If user is authenticated, data is also synced to Firestore
3. **Merge on Sign-In**: When user signs in, local and cloud data are merged intelligently
4. **Deduplication**: Sessions are deduplicated by ID to prevent duplicates

### Sync Strategy

#### Sessions
- **Upload**: After each session completion (if signed in)
- **Download**: On initial sign-in
- **Merge**: Deduplicate by session ID, keep all unique sessions
- **Sort**: By timestamp descending

#### Settings
- **Upload**: Whenever settings are saved (if signed in)
- **Download**: On initial sign-in
- **Merge**: Cloud settings take precedence if available

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name your project (e.g., "highbeta-prod")
4. Disable Google Analytics (optional, for privacy)
5. Click "Create Project"

### 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains (for production)
6. Click "Save"

### 3. Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Select "Start in production mode"
4. Choose location closest to your users (e.g., us-central1)
5. Click "Enable"

### 4. Deploy Security Rules

1. In Firestore Console, go to "Rules" tab
2. Copy contents of `firestore.rules` file
3. Paste into the rules editor
4. Click "Publish"

Alternatively, use Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Configure Environment Variables

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</>)
4. Register your app
5. Copy the config values
6. Create `.env.local` file:

```bash
cp .env.example .env.local
```

7. Fill in your Firebase config values in `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6. Test the Implementation

```bash
npm install
npm run dev
```

Open http://localhost:3000 and:
1. Click "Sign In" button in navigation
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify sync status indicator appears
5. Complete a session and verify it syncs to Firestore

## Security Considerations

### Firestore Rules
The implemented security rules ensure:
- Users can only read/write their own data
- All data is scoped under `/users/{userId}/`
- Anonymous access is completely blocked
- Cross-user data access is impossible

```javascript
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Environment Variables
- Firebase config values are NOT secret (they're meant to be public)
- Security is enforced by Firestore rules, not by hiding config
- Never commit `.env.local` to version control
- `.env.example` provides a template without real values

### Privacy
- Users must explicitly sign in to enable cloud features
- App works fully offline without authentication
- Users can sign out at any time
- Local data is never deleted when signing out
- Cloud data can be deleted by deleting the Firebase project

## Testing Checklist

### Manual Testing
- [X] Sign in with Google works
- [X] Sign out works
- [X] Auth state persists across page reloads
- [X] Sessions sync to Firestore on completion
- [X] Settings sync when changed
- [X] Sync status indicator shows correct states
- [ ] Error messages display for failed auth
- [X] App works without signing in (local mode)
- [X] Multi-device sync works (test on 2 devices)

### Automated Testing
```bash
npm test
```
All 95 existing tests should pass.

### Security Testing
- [ ] Verify users cannot access other users' data
- [ ] Test with multiple accounts
- [ ] Verify anonymous access is blocked
- [ ] Check Firestore rules in Firebase Console

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that `VITE_FIREBASE_API_KEY` is correct in `.env.local`
- Ensure `.env.local` file exists and is in project root
- Restart dev server after changing env vars

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Firebase Console → Authentication → Settings → Authorized domains
- For localhost, this should work by default

### "Insufficient permissions"
- Verify Firestore security rules are deployed
- Check Firebase Console → Firestore → Rules tab
- Ensure rules match `firestore.rules` file

### Sync not working
- Check browser console for errors
- Verify user is signed in (check Auth button shows user avatar)
- Check Firestore Console → Data to see if documents are created
- Enable Firestore debug logs: `firebase.firestore.setLogLevel('debug')`

### Offline persistence errors
- This is expected if multiple tabs are open
- Close other tabs and reload
- Error is non-fatal and won't affect functionality

## Performance Considerations

### Bundle Size
- Firebase SDK adds ~300KB to bundle (gzipped)
- Consider code splitting if this is a concern
- Lazy load Firebase SDK only when user clicks sign in

### Firestore Costs
With Firebase free tier:
- 50K reads/day, 20K writes/day
- 1 GB stored data
- 10 GB bandwidth/month

Typical usage per user:
- ~10 sessions/day = 10 writes
- Settings sync = 1-2 writes/day
- Initial sync = ~100 reads (one-time)

Free tier supports ~2000 active users easily.

### Offline Performance
- Firestore offline persistence caches data locally
- No performance impact when offline
- Automatic background sync when online

## Future Enhancements

### Phase 2 (v4.1)
- Real-time sync (Firestore snapshots)
- Conflict resolution UI for simultaneous edits
- Backup history/versioning
- Data export tools

### Phase 3 (v4.2)
- Multiple auth providers (GitHub, Apple)
- Session sharing/collaboration
- Public profile pages
- Leaderboards (opt-in)

## Support

For issues or questions:
1. Check this README first
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check existing issues on GitHub
4. Open a new issue with:
   - Browser console errors
   - Steps to reproduce
   - Firebase config (sanitized)

## License

Same as parent project.
