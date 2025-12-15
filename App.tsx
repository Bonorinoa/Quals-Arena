import React, { useState, useEffect, useRef } from 'react';
import { Timer, LayoutDashboard, Download, Settings, Trash2, Upload, FileJson, HelpCircle, User, Cloud, CloudOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { TimerView } from './components/TimerView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { WelcomeView } from './components/WelcomeView';
import { AuthModal } from './components/AuthModal';
import { DailyLimitWarning } from './components/DailyLimitWarning';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ViewMode, Session, UserSettings, DEFAULT_SETTINGS } from './types';
import * as storage from './services/storage';
import { STORAGE_KEYS } from './services/storage';
import { AuthProvider, useAuth } from './services/AuthContext';
import { performFullSync, syncSingleSessionToCloud, syncSettingsToCloud, SyncError, getUserFriendlyErrorMessage } from './services/firebaseSync';
import { isDailyLimitExceeded, getDailyTotalHours } from './utils/sessionUtils';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './utils/keyboardShortcuts';
import { getVisibleSessions } from './services/storage';
import { applyTheme } from './utils/themes';

// Detailed sync status type
type SyncStatus = 'idle' | 'syncing-initial' | 'syncing-session' | 'syncing-settings' | 'synced' | 'error' | 'offline';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDailyLimitWarning, setShowDailyLimitWarning] = useState(false);
  const [dailyTotalHours, setDailyTotalHours] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any modal is open
  const isModalOpen = showSettingsModal || showWelcome || showAuthModal || showDailyLimitWarning || showKeyboardShortcuts;

  // Initialize data
  useEffect(() => {
    const isLatest = storage.checkVersion();
    if (!isLatest) {
      console.log("Version mismatch or first run. Clearing legacy/sample data.");
      // In production you might want migration logic, but for now we reset to ensure clean state
      // storage.clearData(); 
    }
    setSessions(getVisibleSessions());
    const loadedSettings = storage.getSettings();
    setSettings(loadedSettings);
    
    // Apply theme on initial load
    applyTheme(loadedSettings.theme || 'founder');
    
    // Show welcome page on first visit
    const hasSeenWelcome = localStorage.getItem('highbeta_has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);
  
  // Apply theme when settings change
  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  // Refresh sessions handler for edit/delete
  const handleSessionsChange = () => {
    setSessions(getVisibleSessions());
  };

  // Setup cloud sync callbacks when user is authenticated
  useEffect(() => {
    if (user) {
      // Set up cloud sync callbacks
      storage.setCloudSyncCallback(async (session: Session) => {
        setSyncStatus('syncing-session');
        try {
          await syncSingleSessionToCloud(user.uid, session);
          setSyncStatus('synced');
          setSyncError(null);
          
          // Clear synced status after 3 seconds
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        } catch (error: any) {
          console.error('Session sync failed:', error);
          const errorMessage = error instanceof SyncError ? error.message : 'Failed to sync session';
          setSyncError(errorMessage);
          setSyncStatus('error');
          
          // Don't clear error automatically - let user dismiss or retry
        }
      });
      
      storage.setCloudSettingsSyncCallback(async (settings: UserSettings) => {
        setSyncStatus('syncing-settings');
        try {
          await syncSettingsToCloud(user.uid, settings);
          setSyncStatus('synced');
          setSyncError(null);
          
          // Clear synced status after 3 seconds
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        } catch (error: any) {
          console.error('Settings sync failed:', error);
          const errorMessage = error instanceof SyncError ? error.message : 'Failed to sync settings';
          setSyncError(errorMessage);
          setSyncStatus('error');
          
          // Don't clear error automatically - let user dismiss or retry
        }
      });
      
      // Perform initial sync when user signs in
      performInitialSync();
    } else {
      // Clear callbacks when signed out
      storage.setCloudSyncCallback(null);
      storage.setCloudSettingsSyncCallback(null);
      setSyncStatus('idle');
      setSyncError(null);
    }
  }, [user]);

  const performInitialSync = async () => {
    if (!user) return;
    
    setSyncStatus('syncing-initial');
    setSyncError(null);
    try {
      const { sessions: mergedSessions, settings: mergedSettings } = 
        await performFullSync(user.uid, sessions, settings);
      
      // Update state with merged data
      setSessions(mergedSessions);
      setSettings(mergedSettings);
      
      // Update localStorage with merged data
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(mergedSessions));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mergedSettings));
      
      setSyncStatus('synced');
      setSyncError(null);
      
      // Clear synced status after 3 seconds
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error('Initial sync failed:', error);
      const errorMessage = error instanceof SyncError ? error.message : 'Failed to sync with cloud';
      setSyncError(errorMessage);
      setSyncStatus('error');
    }
  };

  const handleRetrySync = () => {
    if (!user) return;
    performInitialSync();
  };

  const handleDismissError = () => {
    setSyncError(null);
    setSyncStatus('idle');
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('highbeta_has_seen_welcome', 'true');
  };

  const handleCloseModal = () => {
    if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
    else if (showSettingsModal) setShowSettingsModal(false);
    else if (showWelcome) handleCloseWelcome();
    else if (showAuthModal) setShowAuthModal(false);
    else if (showDailyLimitWarning) setShowDailyLimitWarning(false);
  };

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setShowKeyboardShortcuts(true),
    onEnterArena: () => view !== ViewMode.FOCUS && setView(ViewMode.FOCUS),
    onShowDashboard: () => view !== ViewMode.DASHBOARD && setView(ViewMode.DASHBOARD),
    onShowSettings: () => setShowSettingsModal(true),
    onCloseModal: handleCloseModal,
    currentView: view,
    isModalOpen,
  });

  const handleSessionComplete = (session: Session) => {
    storage.saveSession(session);
    setSessions(getVisibleSessions()); // Refresh
    
    // Check if daily limit has been exceeded after this session
    const todayDate = storage.getLocalDate();
    const updatedSessions = getVisibleSessions();
    if (isDailyLimitExceeded(updatedSessions, todayDate)) {
      const totalHours = getDailyTotalHours(updatedSessions, todayDate);
      setDailyTotalHours(totalHours);
      setShowDailyLimitWarning(true);
    }
    
    setView(ViewMode.DASHBOARD);
  };

  const handleStartSession = () => {
    setView(ViewMode.FOCUS);
  };

  const handleRelapse = () => {
    if (window.confirm("WARNING: This will reset your 'Signal Integrity' streak to zero. Confirm relapse?")) {
      const newSettings = {
        ...settings,
        substanceFreeStartDate: new Date().toISOString()
      };
      setSettings(newSettings);
      storage.saveSettings(newSettings);
    }
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Duration (Seconds),Target (Seconds),Reps,Notes\n"
      + sessions.map(e => `${e.date},${e.durationSeconds},${e.targetDurationSeconds || 0},${e.reps},"${e.notes.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "highbeta_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupJSON = () => {
    const jsonString = storage.exportDataJSON();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `highbeta_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm("This will OVERWRITE your current data with the backup. Continue?")) {
          const success = storage.importDataJSON(content);
          if (success) {
             alert("Data restored successfully. The application will now reload.");
             window.location.reload(); // Force reload to ensure clean state
          } else {
             alert("Failed to restore data. Invalid file.");
          }
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if(confirm("Are you sure? This will delete all 'Assets' built locally.")) {
      storage.clearData();
      setSessions([]);
      // Reload from storage just to be safe
      setSessions(getVisibleSessions());
    }
  };

  return (
    <div className="min-h-screen text-zinc-200 font-sans selection:bg-white selection:text-black">
      
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900 glass-strong z-50 flex items-center justify-between px-6" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rotate-45 shadow-glow" aria-hidden="true"></div>
          <span className="font-mono font-bold tracking-tighter text-lg hidden sm:inline">highBeta</span>
        </div>
        
        {/* Auth & Sync Status */}
        <div className="flex items-center gap-2">
          {/* Sync Status Indicator */}
          {user && (
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {(syncStatus === 'syncing-initial' || syncStatus === 'syncing-session' || syncStatus === 'syncing-settings') && (
                <>
                  <Cloud className="text-blue-400 animate-pulse" size={14} aria-hidden="true" />
                  <span className="text-xs text-zinc-400">
                    {syncStatus === 'syncing-initial' && 'Syncing...'}
                    {syncStatus === 'syncing-session' && 'Syncing session...'}
                    {syncStatus === 'syncing-settings' && 'Syncing settings...'}
                  </span>
                </>
              )}
              {syncStatus === 'synced' && (
                <>
                  <CheckCircle2 className="text-green-400" size={14} aria-hidden="true" />
                  <span className="text-xs text-zinc-400">Synced</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertCircle className="text-red-400" size={14} aria-hidden="true" />
                  <span className="text-xs text-zinc-400">Sync Error</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <CloudOff className="text-orange-400" size={14} aria-hidden="true" />
                  <span className="text-xs text-zinc-400">Offline</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <Cloud className="text-zinc-500" size={14} aria-hidden="true" />
                  <span className="text-xs text-zinc-500">Cloud</span>
                </>
              )}
            </div>
          )}
          
          {/* Auth Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={user ? `Account settings for ${user.displayName || 'user'}` : 'Sign in to sync data'}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="" 
                    className="w-6 h-6 rounded-full border border-white/20"
                    aria-hidden="true"
                  />
                ) : (
                  <User className="text-zinc-400" size={16} aria-hidden="true" />
                )}
                <span className="text-xs text-zinc-300 hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </>
            ) : (
              <>
                <User className="text-zinc-400" size={16} aria-hidden="true" />
                <span className="text-xs text-zinc-400 hidden sm:inline">Sign In</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Sync Error Banner */}
      {syncError && (
        <div 
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-400 mb-3">{syncError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetrySync}
                    aria-label="Retry syncing data"
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                    Retry Sync
                  </button>
                  <button
                    onClick={handleDismissError}
                    aria-label="Dismiss error"
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="pt-24 px-4 sm:px-6 max-w-6xl mx-auto">
        {view === ViewMode.DASHBOARD && (
          <DashboardView 
            sessions={sessions} 
            settings={settings} 
            onStartSession={handleStartSession}
            onRelapse={handleRelapse}
            onSessionsChange={handleSessionsChange}
          />
        )}
        
        {view === ViewMode.FOCUS && (
          <TimerView 
            onSessionComplete={handleSessionComplete} 
            onCancel={() => setView(ViewMode.DASHBOARD)} 
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsView 
          settings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeView onClose={handleCloseWelcome} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Daily Limit Warning */}
      {showDailyLimitWarning && (
        <DailyLimitWarning 
          totalHours={dailyTotalHours}
          onClose={() => setShowDailyLimitWarning(false)} 
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Footer / Data Controls */}
      <footer className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-40" aria-label="Quick actions">
        <button 
          onClick={() => setShowWelcome(true)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Welcome and guide"
        >
          <HelpCircle size={18} aria-hidden="true" />
        </button>

        <button 
          onClick={() => setShowSettingsModal(true)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Settings"
        >
          <Settings size={18} aria-hidden="true" />
        </button>

        <button 
          onClick={() => setShowDataMenu(!showDataMenu)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Data management menu"
          aria-expanded={showDataMenu}
          aria-haspopup="menu"
        >
          <Download size={18} aria-hidden="true" />
        </button>
        
        {showDataMenu && (
          <div className="glass border-zinc-800 p-2 rounded-lg shadow-glass-lg flex flex-col gap-2 animate-slide-up w-48" role="menu">
             <button 
                onClick={handleBackupJSON}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left focus:outline-none focus:ring-2 focus:ring-white/20"
                role="menuitem"
                aria-label="Backup data as JSON"
             >
               <FileJson size={14} aria-hidden="true" /> Backup (JSON)
             </button>
             
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left focus:outline-none focus:ring-2 focus:ring-white/20"
                role="menuitem"
                aria-label="Restore data from JSON backup"
             >
               <Upload size={14} aria-hidden="true" /> Restore (JSON)
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleRestoreJSON} 
               accept=".json" 
               className="hidden"
               aria-label="Select JSON file to restore"
             />

             <div className="h-px bg-zinc-800 my-1" role="separator"></div>

             <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left focus:outline-none focus:ring-2 focus:ring-white/20"
                role="menuitem"
                aria-label="Export data as CSV"
             >
               <Download size={14} aria-hidden="true" /> Export CSV
             </button>
             
             <button 
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-red-900 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors whitespace-nowrap text-left focus:outline-none focus:ring-2 focus:ring-red-400"
                role="menuitem"
                aria-label="Reset protocol and clear all data"
             >
               <Trash2 size={14} aria-hidden="true" /> Reset Protocol
             </button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
