
import React, { useState, useEffect } from 'react';
import { Timer, LayoutDashboard, Download, Settings, Trash2 } from 'lucide-react';
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

  // Initialize data
  useEffect(() => {
    const isLatest = storage.checkVersion();
    if (!isLatest) {
      console.log("Version mismatch or first run. Clearing legacy/sample data.");
      storage.clearData();
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

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Duration (Seconds),Reps,Notes\n"
      + sessions.map(e => `${e.date},${e.durationSeconds},${e.reps},"${e.notes.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "d1_protocol_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = () => {
    if(confirm("Are you sure? This will delete all 'Assets' built.")) {
      storage.clearData();
      setSessions([]);
      setSessions(storage.getSessions());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-white selection:text-black">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rotate-45"></div>
          <span className="font-mono font-bold tracking-tighter text-lg hidden sm:inline">D1 PROTOCOL</span>
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
           {/* EXIT BUTTON REMOVED IN FOCUS MODE */}
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
        >
          <Settings size={18} />
        </button>

        <button 
          onClick={() => setShowDataMenu(!showDataMenu)}
          className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded-full shadow-lg"
        >
          <Download size={18} />
        </button>
        
        {showDataMenu && (
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl flex flex-col gap-2 animate-in slide-in-from-bottom-5">
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors whitespace-nowrap"
             >
               <Download size={14} /> Export CSV
             </button>
             <button 
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-red-900 hover:text-red-500 hover:bg-red-950/30 rounded transition-colors whitespace-nowrap"
             >
               <Trash2 size={14} /> Reset Protocol
             </button>
             <div className="px-4 py-2 text-[10px] text-zinc-600 max-w-[200px] border-t border-zinc-800 mt-1">
               Data stored locally. Export to sync with Sheets.
             </div>
          </div>
        )}
      </footer>
    </div>
  );
}
