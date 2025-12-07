
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
            Protocol Configuration
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
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
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-sm focus:border-white outline-none"
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
                value={formData.dailyTimeGoalHours}
                onChange={(e) => handleChange('dailyTimeGoalHours', parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Weekly Reps
              </label>
              <input
                type="number"
                value={formData.weeklyRepTarget}
                onChange={(e) => handleChange('weeklyRepTarget', parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-xl focus:border-emerald-500 outline-none"
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
              className={`w-full bg-zinc-950 border ${urlError ? 'border-red-500' : 'border-zinc-700'} text-zinc-100 p-3 font-mono text-xs focus:border-white outline-none mb-2`}
            />
            {urlError && <p className="text-red-500 text-[10px] flex items-center gap-1 mb-2"><AlertTriangle size={10} /> {urlError}</p>}
            
             {formData.googleSheetsUrl && !urlError && (
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={handleTestConnection}
                   disabled={isTesting}
                   className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 bg-zinc-800 px-3 py-2 rounded"
                 >
                   {isTesting ? 'Pinging...' : 'Test Connection'}
                 </button>
                 <button
                   type="button"
                   onClick={handleManualSync}
                   disabled={isSyncing}
                   className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 bg-zinc-800 px-3 py-2 rounded"
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
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm"
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
