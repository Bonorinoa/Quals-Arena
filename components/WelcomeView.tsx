
import React from 'react';
import { X, Zap, Target, TrendingUp, Shield, Timer, CheckCircle2 } from 'lucide-react';

interface WelcomeViewProps {
  onClose: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl">
        {/* Main Glass Card */}
        <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-700/50 shadow-2xl rounded-lg animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="relative p-8 pb-6">
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              aria-label="Close welcome"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-5 h-5 bg-white rotate-45"></div>
              <h1 className="text-4xl font-mono font-bold tracking-tighter text-white">highBeta</h1>
            </div>
            
            <p className="text-zinc-300 text-base leading-relaxed mb-2">
              Welcome to the <span className="text-white font-semibold">High Patience Protocol</span>
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              A performance analytics dashboard for tracking your most valuable asset: <span className="text-white">cognitive capacity</span>.
            </p>
          </div>

          {/* Core Concepts - Condensed */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Timer size={16} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-xs uppercase tracking-wider">The Arena</h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Pre-commit to a duration. Complete the full session to build your time budget.
                </p>
              </div>

              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Track Progress</h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Monitor your Net Position, consistency, and efficiency metrics.
                </p>
              </div>

              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Signal Integrity</h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Track your substance-free streak for a clean productivity signal.
                </p>
              </div>

              <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Build Assets</h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Log reps (problems solved) to focus on mastery, not just hours.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Start - Simplified */}
          <div className="px-8 pb-6">
            <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-white font-mono">Quick Start</h2>
              </div>
              <ol className="space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono font-bold min-w-[1.5rem]">1.</span>
                  <span>Configure your daily goal in <span className="text-white">Settings</span> (bottom right)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono font-bold min-w-[1.5rem]">2.</span>
                  <span>Click <span className="text-white">"Enter The Arena"</span> and choose a duration</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono font-bold min-w-[1.5rem]">3.</span>
                  <span>Work distraction-free until completion</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-mono font-bold min-w-[1.5rem]">4.</span>
                  <span>Log your reps and review your progress</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-6 bg-gradient-to-t from-zinc-900/50 to-transparent">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors rounded"
            >
              Enter The Protocol
            </button>
            <p className="text-center text-zinc-500 text-xs mt-3 font-mono">
              "Owners build assets. Employees log hours."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
