
import React, { useRef } from 'react';
import { AlertTriangle, Coffee, X } from 'lucide-react';
import { useFocusTrap } from '../utils/focusTrap';

interface DailyLimitWarningProps {
  totalHours: number;
  onClose: () => void;
}

/**
 * Warning modal that appears when a user exceeds 6 hours of session time in a single day
 * Maintains the app's cool, minimal tone with a slightly humorous touch
 */
export const DailyLimitWarning: React.FC<DailyLimitWarningProps> = ({ totalHours, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus trap for accessibility
  useFocusTrap(modalRef, true);
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-limit-title"
      aria-describedby="daily-limit-description"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md glass-strong border-amber-900/50 shadow-glass-lg animate-scale-in"
      >
        <div className="flex items-center justify-between p-6 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={24} aria-hidden="true" />
            <h2 id="daily-limit-title" className="text-sm font-bold uppercase tracking-widest text-amber-400 font-mono">
              Protocol Notice
            </h2>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close daily limit warning"
            className="text-zinc-500 hover:text-white transition-colors interactive focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-4">
            <p id="daily-limit-description" className="text-zinc-300 text-sm font-mono leading-relaxed">
              You've logged <span className="text-amber-400 font-bold">{totalHours.toFixed(1)}h</span> today.
            </p>
          </div>

          <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
            <p className="flex items-start gap-2">
              <Coffee className="text-amber-500 flex-shrink-0 mt-1" size={16} aria-hidden="true" />
              <span>
                <strong className="text-zinc-300">Nice work, but even CPUs need cooling breaks.</strong>
                {' '}The 6-hour daily cap isn't a weakness—it's optimal resource allocation.
              </span>
            </p>
            
            <p className="text-xs text-zinc-500 italic pl-6">
              "Marginal returns diminish. Cognitive load compounds. The protocol enforces sustainability over heroics."
            </p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded p-3 mt-4">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">
                Why 6 Hours?
              </h3>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                <li>Prevents burnout and maintains long-term consistency</li>
                <li>Protects signal quality—fatigue degrades decision-making</li>
                <li>You're optimizing for the marathon, not the sprint</li>
              </ul>
            </div>

            <p className="text-xs text-zinc-500 text-center pt-2">
              Rest is not debt. It's compounding interest on tomorrow's performance.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Acknowledge daily limit warning"
            className="btn-primary w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Roger That
          </button>
        </div>
      </div>
    </div>
  );
};
