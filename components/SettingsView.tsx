
import React, { useState } from 'react';
import { Save, X, Palette, Calendar, BarChart3 } from 'lucide-react';
import { UserSettings, ThemeName } from '../types';
import { themes } from '../utils/themes';
import { calculateAllMetrics } from '../utils/customMetrics';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get all available metrics for the toggle list
  const availableMetrics = calculateAllMetrics([], formData.activeDays || [1, 2, 3, 4, 5]);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (dayIndex: number) => {
    const activeDays = formData.activeDays || [1, 2, 3, 4, 5];
    if (activeDays.includes(dayIndex)) {
      // Remove day
      handleChange('activeDays', activeDays.filter(d => d !== dayIndex));
    } else {
      // Add day
      handleChange('activeDays', [...activeDays, dayIndex].sort());
    }
  };
  
  const canRemoveMetric = (metricId: string, currentEnabled: string[]): boolean => {
    return currentEnabled.includes(metricId) && currentEnabled.length > 1;
  };
  
  const canAddMetric = (metricId: string, currentEnabled: string[]): boolean => {
    return !currentEnabled.includes(metricId) && currentEnabled.length < 5;
  };

  const handleMetricToggle = (metricId: string) => {
    const enabled = formData.enabledMetrics || ['focusQuality', 'deepWorkRatio', 'consistency'];
    if (enabled.includes(metricId) && canRemoveMetric(metricId, enabled)) {
      handleChange('enabledMetrics', enabled.filter(id => id !== metricId));
    } else if (!enabled.includes(metricId) && canAddMetric(metricId, enabled)) {
      handleChange('enabledMetrics', [...enabled, metricId]);
    }
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

          {/* Theme Selection */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <Palette size={14} />
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(themes) as ThemeName[]).map((themeName) => {
                const theme = themes[themeName];
                const isActive = formData.theme === themeName;
                return (
                  <button
                    key={themeName}
                    type="button"
                    onClick={() => handleChange('theme', themeName)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isActive 
                        ? 'border-white/30 bg-white/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                      />
                      <span className="font-mono font-bold text-sm text-white">
                        {theme.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 text-left">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
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

          {/* Active Days Selection */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <Calendar size={14} />
              Active Days for Daily Goal
            </label>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day, index) => {
                const isActive = (formData.activeDays || [1, 2, 3, 4, 5]).includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`px-2 py-3 rounded-lg border transition-all text-xs font-mono font-bold ${
                      isActive 
                        ? 'border-white/30 bg-white/10 text-white' 
                        : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-400'
                    }`}
                    title={isActive ? `Remove ${day}` : `Add ${day}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Daily goal only applies on selected days
            </p>
          </div>

          {/* Custom Metrics Selection */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <BarChart3 size={14} />
              Custom Metrics (Max 5)
            </label>
            <div className="space-y-2">
              {availableMetrics.map((metric) => {
                const enabled = formData.enabledMetrics || ['focusQuality', 'deepWorkRatio', 'consistency'];
                const isEnabled = enabled.includes(metric.id);
                const isLastEnabled = isEnabled && enabled.length === 1;
                const canToggleMetric = isEnabled ? canRemoveMetric(metric.id, enabled) : canAddMetric(metric.id, enabled);
                
                return (
                  <button
                    key={metric.id}
                    type="button"
                    onClick={() => handleMetricToggle(metric.id)}
                    disabled={!canToggleMetric}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      isEnabled 
                        ? 'border-white/30 bg-white/10' 
                        : canToggleMetric
                        ? 'border-white/10 bg-white/5 hover:border-white/20'
                        : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                    }`}
                    title={isLastEnabled ? 'At least one metric must be enabled' : metric.description}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded border ${
                            isEnabled ? 'bg-white border-white' : 'border-white/30'
                          } flex items-center justify-center`}>
                            {isEnabled && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-mono font-semibold text-white">
                            {metric.name}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 ml-6">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Metrics are calculated from last 7 days of sessions
            </p>
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
