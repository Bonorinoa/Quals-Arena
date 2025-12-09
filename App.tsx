
import React, { useState, useEffect, useRef } from 'react';
import { Timer, LayoutDashboard, Download, Settings, Trash2, Upload, FileJson, HelpCircle, User, Cloud, CloudOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { TimerView } from './components/TimerView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { WelcomeView } from './components/WelcomeView';
import { AuthModal } from './components/AuthModal';
import { ViewMode, Session, UserSettings, DEFAULT_SETTINGS } from './types';
import * as storage from './services/storage';
import { STORAGE_KEYS } from './services/storage';
import { AuthProvider, useAuth } from './services/AuthContext';
import { performFullSync, syncSingleSessionToCloud, syncSettingsToCloud } from './services/firebaseSync';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data
  useEffect(() => {
    const isLatest = storage.checkVersion();
    if (!isLatest) {
      console.log("Version mismatch or first run. Clearing legacy/sample data.");
      // In production you might want migration logic, but for now we reset to ensure clean state
      // storage.clearData(); 
    }
    setSessions(storage.getSessions());
    setSettings(storage.getSettings());
    
    // Show welcome page on first visit
    const hasSeenWelcome = localStorage.getItem('highbeta_has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Setup cloud sync callbacks when user is authenticated
  useEffect(() => {
    if (user) {
      // Set up cloud sync callbacks
      storage.setCloudSyncCallback(async (session: Session) => {
        await syncSingleSessionToCloud(user.uid, session);
      });
      
      storage.setCloudSettingsSyncCallback(async (settings: UserSettings) => {
        await syncSettingsToCloud(user.uid, settings);
      });
      
      // Perform initial sync when user signs in
      performInitialSync();
    } else {
      // Clear callbacks when signed out
      storage.setCloudSyncCallback(null);
      storage.setCloudSettingsSyncCallback(null);
      setSyncStatus('idle');
    }
  }, [user]);

  const performInitialSync = async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
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
      
      // Clear synced status after 3 seconds
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      
      // Clear error status after 5 seconds
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('highbeta_has_seen_welcome', 'true');
  };

  const handleSessionComplete = (session: Session) => {
    storage.saveSession(session);
    setSessions(storage.getSessions()); // Refresh
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
      setSessions(storage.getSessions());
    }
  };

  return (
    <div className="min-h-screen text-zinc-200 font-sans selection:bg-white selection:text-black">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900 glass-strong z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rotate-45 shadow-glow"></div>
          <span className="font-mono font-bold tracking-tighter text-lg hidden sm:inline">highBeta</span>
        </div>
        
        {/* Auth & Sync Status */}
        <div className="flex items-center gap-2">
          {/* Sync Status Indicator */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              {syncStatus === 'syncing' && (
                <>
                  <Cloud className="text-blue-400 animate-pulse" size={14} />
                  <span className="text-xs text-zinc-400">Syncing...</span>
                </>
              )}
              {syncStatus === 'synced' && (
                <>
                  <CheckCircle2 className="text-green-400" size={14} />
                  <span className="text-xs text-zinc-400">Synced</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertCircle className="text-red-400" size={14} />
                  <span className="text-xs text-zinc-400">Sync Error</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <Cloud className="text-zinc-500" size={14} />
                  <span className="text-xs text-zinc-500">Cloud</span>
                </>
              )}
            </div>
          )}
          
          {/* Auth Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all"
            title={user ? 'Account' : 'Sign In'}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-6 h-6 rounded-full border border-white/20"
                  />
                ) : (
                  <User className="text-zinc-400" size={16} />
                )}
                <span className="text-xs text-zinc-300 hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </>
            ) : (
              <>
                <User className="text-zinc-400" size={16} />
                <span className="text-xs text-zinc-400 hidden sm:inline">Sign In</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 px-4 sm:px-6 max-w-6xl mx-auto">
        {view === ViewMode.DASHBOARD && (
          <DashboardView 
            sessions={sessions} 
            settings={settings} 
            onStartSession={handleStartSession}
            onRelapse={handleRelapse}
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

      {/* Footer / Data Controls */}
      <footer className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-40">
        <button 
          onClick={() => setShowWelcome(true)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive"
          title="Welcome & Guide"
        >
          <HelpCircle size={18} />
        </button>

        <button 
          onClick={() => setShowSettingsModal(true)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <button 
          onClick={() => setShowDataMenu(!showDataMenu)}
          className="w-10 h-10 glass border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-glass interactive"
          title="Data Management"
        >
          <Download size={18} />
        </button>
        
        {showDataMenu && (
          <div className="glass border-zinc-800 p-2 rounded-lg shadow-glass-lg flex flex-col gap-2 animate-slide-up w-48">
             <button 
                onClick={handleBackupJSON}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left"
             >
               <FileJson size={14} /> Backup (JSON)
             </button>
             
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left"
             >
               <Upload size={14} /> Restore (JSON)
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleRestoreJSON} 
               accept=".json" 
               className="hidden" 
             />

             <div className="h-px bg-zinc-800 my-1"></div>

             <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap text-left"
             >
               <Download size={14} /> Export CSV
             </button>
             
             <button 
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-red-900 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors whitespace-nowrap text-left"
             >
               <Trash2 size={14} /> Reset Protocol
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
