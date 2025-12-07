
import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
              Subject ID (Name)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-sm focus:border-white outline-none transition-colors"
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
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-xl focus:border-emerald-500 outline-none transition-colors"
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
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-3 font-mono text-xl focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-600 font-mono">
               * "Daily Goal" sets the Time Budget visualization.<br/>
               * "Weekly Reps" controls the Saturday Founder Mode gate.
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
