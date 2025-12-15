
import React, { useRef } from 'react';
import { X, Zap, Target, TrendingUp, Shield, Timer, CheckCircle2 } from 'lucide-react';
import { useFocusTrap } from '../utils/focusTrap';

interface WelcomeViewProps {
  onClose: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus trap for accessibility
  useFocusTrap(modalRef, true);
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-start justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="w-full max-w-2xl my-4 sm:my-auto">
        {/* Main Glass Card */}
        <div 
          ref={modalRef}
          className="glass-strong shadow-glass-lg rounded-lg animate-scale-in" 
          style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
        >
          
          {/* Header */}
          <div className="relative p-4 sm:p-8 pb-4 sm:pb-6">
            <button 
              onClick={onClose} 
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full interactive focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Close welcome guide"
            >
              <X size={20} aria-hidden="true" />
            </button>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rotate-45 shadow-glow" aria-hidden="true"></div>
              <h1 id="welcome-title" className="text-2xl sm:text-4xl font-mono font-bold tracking-tighter text-white">highBeta</h1>
            </div>
            
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-2">
              Welcome to the <span className="text-white font-semibold">High Patience Protocol</span>
            </p>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              A performance analytics dashboard for tracking your most valuable asset: <span className="text-gradient font-semibold">cognitive capacity</span>.
            </p>
          </div>

          {/* Core Concepts - Condensed */}
          <div className="px-4 sm:px-8 pb-4 sm:pb-6">
            <h2 className="sr-only">Core Concepts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="glass border-zinc-700/50 p-3 sm:p-4 rounded-lg elevated interactive">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Timer size={14} className="text-ember-500" aria-hidden="true" />
                  <h3 className="text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider">The Arena</h3>
                </div>
                <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                  Pre-commit to a duration. Complete the full session to build your time budget.
                </p>
              </div>

              <div className="glass border-zinc-700/50 p-3 sm:p-4 rounded-lg elevated interactive">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <TrendingUp size={14} className="text-ember-500" aria-hidden="true" />
                  <h3 className="text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Track Progress</h3>
                </div>
                <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                  Monitor your Net Position, consistency, and efficiency metrics.
                </p>
              </div>

              <div className="glass border-zinc-700/50 p-3 sm:p-4 rounded-lg elevated interactive">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Shield size={14} className="text-ember-500" aria-hidden="true" />
                  <h3 className="text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Signal Integrity</h3>
                </div>
                <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                  Track your substance-free streak for a clean productivity signal.
                </p>
              </div>

              <div className="glass border-zinc-700/50 p-3 sm:p-4 rounded-lg elevated interactive">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Zap size={14} className="text-ember-500" aria-hidden="true" />
                  <h3 className="text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Build Assets</h3>
                </div>
                <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                  Log reps (problems solved) to focus on mastery, not just hours.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Start - Simplified */}
          <div className="px-4 sm:px-8 pb-4 sm:pb-6">
            <div className="glass border-zinc-700/50 p-4 sm:p-5 rounded-lg elevated">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <CheckCircle2 size={14} className="text-ember-500" aria-hidden="true" />
                <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-white font-mono">Quick Start</h2>
              </div>
              <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-ember-500 font-mono font-bold min-w-[1.5rem]" aria-hidden="true">1.</span>
                  <span>Configure your daily goal in <span className="text-white">Settings</span> (bottom right)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-ember-500 font-mono font-bold min-w-[1.5rem]" aria-hidden="true">2.</span>
                  <span>Click <span className="text-white">"Enter The Arena"</span> and choose a duration</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-ember-500 font-mono font-bold min-w-[1.5rem]" aria-hidden="true">3.</span>
                  <span>Work distraction-free until completion</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-ember-500 font-mono font-bold min-w-[1.5rem]" aria-hidden="true">4.</span>
                  <span>Log your reps and review your progress</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-zinc-900/50 to-transparent">
            <button 
              onClick={onClose}
              aria-label="Close welcome guide and start using highBeta"
              className="btn-primary w-full focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Enter The Protocol
            </button>
            <p className="text-center text-zinc-500 text-[10px] sm:text-xs mt-2 sm:mt-3 font-mono">
              "Owners build assets. Employees log hours."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
