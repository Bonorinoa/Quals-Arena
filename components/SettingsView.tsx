
import React, { useState, useRef } from 'react';
import { Save, X, Palette, Calendar, BarChart3 } from 'lucide-react';
import { UserSettings, ThemeName } from '../types';
import { themes } from '../utils/themes';
import { calculateAllMetrics } from '../utils/customMetrics';
import { useFocusTrap } from '../utils/focusTrap';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const modalRef = useRef<HTMLDivElement>(null);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Focus trap for accessibility
  useFocusTrap(modalRef, true);
  
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
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-start justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md glass-strong border-zinc-800 shadow-glass-lg animate-scale-in my-4 sm:my-auto" 
        style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 id="settings-title" className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
            Protocol Configuration
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close settings"
            className="text-zinc-500 hover:text-white transition-colors interactive focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="settings-name" className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Subject ID
            </label>
            <input
              id="settings-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              aria-describedby="name-description"
              className="input-glass focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${theme.displayName} theme: ${theme.description}`}
                    className={`p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isActive 
                        ? 'border-white/30 bg-white/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                        aria-hidden="true"
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
              <label htmlFor="settings-daily-goal" className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Daily Goal (Hours)
              </label>
              <input
                id="settings-daily-goal"
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
                aria-describedby="daily-goal-description"
                className="input-glass text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p id="daily-goal-description" className="sr-only">Target hours of focused work per day, between 0 and 6</p>
            </div>
            <div>
              <label htmlFor="settings-weekly-reps" className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Weekly Reps
              </label>
              <input
                id="settings-weekly-reps"
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
                aria-describedby="weekly-reps-description"
                className="input-glass text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p id="weekly-reps-description" className="sr-only">Target number of problems solved per week, between 0 and 50</p>
            </div>
          </div>

          {/* Active Days Selection */}
          <div className="pt-4 border-t border-zinc-800">
            <label id="active-days-label" className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <Calendar size={14} aria-hidden="true" />
              Active Days for Daily Goal
            </label>
            <div className="grid grid-cols-7 gap-2" role="group" aria-labelledby="active-days-label">
              {dayNames.map((day, index) => {
                const isActive = (formData.activeDays || [1, 2, 3, 4, 5]).includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    aria-pressed={isActive}
                    aria-label={`${day}, ${isActive ? 'active' : 'inactive'}`}
                    className={`px-2 py-3 rounded-lg border transition-all text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isActive 
                        ? 'border-white/30 bg-white/10 text-white' 
                        : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-400'
                    }`}
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
            <label id="metrics-label" className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <BarChart3 size={14} aria-hidden="true" />
              Custom Metrics (Max 5)
            </label>
            <div className="space-y-2" role="group" aria-labelledby="metrics-label">
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
                    role="checkbox"
                    aria-checked={isEnabled}
                    aria-disabled={!canToggleMetric}
                    aria-label={`${metric.name}: ${metric.description}`}
                    className={`w-full p-3 rounded-lg border transition-all text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isEnabled 
                        ? 'border-white/30 bg-white/10' 
                        : canToggleMetric
                        ? 'border-white/10 bg-white/5 hover:border-white/20'
                        : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded border ${
                            isEnabled ? 'bg-white border-white' : 'border-white/30'
                          } flex items-center justify-center`} aria-hidden="true">
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
              aria-label="Save settings and update contract"
              className="btn-primary w-full flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Save size={16} aria-hidden="true" />
              Sign & Update Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
