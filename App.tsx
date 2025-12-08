
import React, { useState, useEffect, useRef } from 'react';
import { Timer, LayoutDashboard, Download, Settings, Trash2, Upload, FileJson } from 'lucide-react';
import { TimerView } from './components/TimerView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { ViewMode, Session, UserSettings, DEFAULT_SETTINGS } from './types';
import * as storage from './services/storage';

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-white selection:text-black">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rotate-45"></div>
          <span className="font-mono font-bold tracking-tighter text-lg hidden sm:inline">HIGHβ</span>
        </div>
        
        <div className="flex gap-2">
           {view === ViewMode.DASHBOARD && (
             <button 
              onClick={() => setView(ViewMode.FOCUS)}
              className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
             >
               Enter The Arena
             </button>
           )}
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

      {/* Footer / Data Controls */}
      <footer className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-40">
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-lg"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <button 
          onClick={() => setShowDataMenu(!showDataMenu)}
          className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-lg"
          title="Data Management"
        >
          <Download size={18} />
        </button>
        
        {showDataMenu && (
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl flex flex-col gap-2 animate-in slide-in-from-bottom-5 w-48">
             <button 
                onClick={handleBackupJSON}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors whitespace-nowrap text-left"
             >
               <FileJson size={14} /> Backup (JSON)
             </button>
             
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors whitespace-nowrap text-left"
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
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors whitespace-nowrap text-left"
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
