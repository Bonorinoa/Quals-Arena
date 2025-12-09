
import React, { useState } from 'react';
import { Save, X, Cloud, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '../types';
import { processSyncQueue, testCloudConnection } from '../services/storage';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'googleSheetsUrl') setUrlError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.googleSheetsUrl && !formData.googleSheetsUrl.includes('script.google.com')) {
      setUrlError('Must be a "script.google.com" Web App URL, not a spreadsheet link.');
      return;
    }
    onSave(formData);
    onClose();
  };
  
  const handleManualSync = async () => {
    setIsSyncing(true);
    await processSyncQueue();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleTestConnection = async () => {
    if (!formData.googleSheetsUrl) return;
    setIsTesting(true);
    const success = await testCloudConnection(formData.googleSheetsUrl);
    setIsTesting(false);
    if (success) {
      alert("Request sent! Check your Google Sheet for a 'Connection Test' row.");
    } else {
      alert("Connection failed. Check console for network errors.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-start justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md glass-strong border-zinc-800 shadow-glass-lg animate-scale-in my-4 sm:my-auto" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
            Protocol Configuration
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors interactive">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Subject ID
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input-glass"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Daily Goal (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="6"
                value={formData.dailyTimeGoalHours}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleChange('dailyTimeGoalHours', 0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      handleChange('dailyTimeGoalHours', Math.max(0, Math.min(6, numValue)));
                    }
                  }
                }}
                className="input-glass text-xl"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Weekly Reps
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.weeklyRepTarget}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleChange('weeklyRepTarget', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      handleChange('weeklyRepTarget', Math.max(0, Math.min(50, numValue)));
                    }
                  }
                }}
                className="input-glass text-xl"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono flex items-center gap-2">
              <Cloud size={14} /> Cloud Backup URL (Push Only)
            </label>
            <p className="text-[10px] text-zinc-600 mb-2">
              Back up your assets to Google Sheets. Data flows one way (App to Cloud).
            </p>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/..."
              value={formData.googleSheetsUrl || ''}
              onChange={(e) => handleChange('googleSheetsUrl', e.target.value)}
              className={`input-glass ${urlError ? 'border-red-500' : ''} mb-2`}
            />
            {urlError && <p className="text-red-500 text-[10px] flex items-center gap-1 mb-2"><AlertTriangle size={10} /> {urlError}</p>}
            
             {formData.googleSheetsUrl && !urlError && (
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={handleTestConnection}
                   disabled={isTesting}
                   className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 glass px-3 py-2 rounded interactive"
                 >
                   {isTesting ? 'Pinging...' : 'Test Connection'}
                 </button>
                 <button
                   type="button"
                   onClick={handleManualSync}
                   disabled={isSyncing}
                   className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 glass px-3 py-2 rounded interactive"
                 >
                   <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} /> 
                   {isSyncing ? 'Syncing...' : 'Force Sync'}
                 </button>
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Sign & Update Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
