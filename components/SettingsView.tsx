
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
