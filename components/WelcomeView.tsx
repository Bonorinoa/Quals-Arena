
import React from 'react';
import { X, Zap, Target, TrendingUp, Shield, Keyboard, Clock, Brain, CheckCircle2, Timer } from 'lucide-react';

interface WelcomeViewProps {
  onClose: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        {/* Main Glass Card */}
        <div className="bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="relative border-b border-zinc-800/50 p-8 bg-gradient-to-b from-zinc-900/80 to-transparent">
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              aria-label="Close welcome"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-4 h-4 bg-white rotate-45"></div>
              <h1 className="text-3xl font-mono font-bold tracking-tighter">highBeta</h1>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              Welcome to the <span className="text-white font-semibold">High Patience Protocol</span>. 
              This isn't another to-do app—it's a performance analytics dashboard for tracking your most valuable asset: cognitive capacity.
            </p>
          </div>

          {/* Content Sections */}
          <div className="p-8 space-y-8">
            
            {/* The Vision */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">The Philosophy</h2>
              </div>
              <div className="pl-7 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  High beta (β) represents high patience in economic theory—choosing long-term rewards over instant gratification. 
                  This app solves the <span className="text-white">Principal-Agent Problem within yourself</span>: aligning your forward-looking "Planner" 
                  with your present-focused "Doer" using commitment devices and radical transparency.
                </p>
                <p className="text-zinc-500 text-xs italic">
                  Owners build assets. Employees log hours. Which one are you?
                </p>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">How It Works</h2>
              </div>
              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-white" />
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider">The Arena</h3>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Pre-commit to a duration. Work until the timer hits zero. Leaving early = Deficit. 
                    The app keeps the screen awake and shows you protocol axioms to stay focused.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-white" />
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider">The Scoreboard</h3>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Track your Net Position (time budget), consistency heatmap, and Sober Efficiency Rate. 
                    No self-reported estimates—metrics calculated from actual behavior.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-white" />
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Signal Integrity</h3>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Track your substance-free streak. High stimulation = high noise. 
                    A clean signal lets you see the true trend line of your productivity.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-white" />
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Reps & Assets</h3>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Log problems solved or concepts mastered. Focus on building Assets (Mastery) 
                    rather than just logging hours. Calculate your Reps/Hour efficiency.
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">Quick Start</h2>
              </div>
              <div className="pl-7">
                <ol className="space-y-2 text-sm text-zinc-400">
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-mono font-bold">1.</span>
                    <span>Open Settings (bottom right) and set your <span className="text-white">Daily Goal</span> and <span className="text-white">Weekly Rep Target</span></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-mono font-bold">2.</span>
                    <span>Click <span className="text-white">"Enter The Arena"</span> and select a contract duration (e.g., 90 minutes)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-mono font-bold">3.</span>
                    <span>Work distraction-free until the timer completes. Press <span className="text-white font-mono">N</span> during a session to log mental notes</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-mono font-bold">4.</span>
                    <span>When done, log your Reps (problems/concepts completed) and add a diagnostic note</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-mono font-bold">5.</span>
                    <span>Check the Dashboard to see if you're in the Green (surplus) or Red (deficit)</span>
                  </li>
                </ol>
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Keyboard size={18} className="text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">Keyboard Shortcuts</h2>
              </div>
              <div className="pl-7">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="font-mono">
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-3 px-4 text-zinc-400 text-xs">During Focus Session</td>
                        <td className="py-3 px-4 text-right">
                          <kbd className="bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-xs text-white">N</kbd>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-xs">Log mental note</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-3 px-4 text-zinc-400 text-xs">Mobile Tip</td>
                        <td className="py-3 px-4 text-right text-zinc-500 text-xs" colspan="2">
                          Add to Home Screen for fullscreen experience
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-zinc-600 text-xs mt-3 italic">
                  More shortcuts coming soon. For now, keep it simple: focus on the work, not the interface.
                </p>
              </div>
            </section>

            {/* Data Sovereignty */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">Your Data, Your Control</h2>
              </div>
              <div className="pl-7 text-sm text-zinc-400 space-y-2">
                <p>
                  Everything lives in your browser's local storage. No accounts, no servers, no tracking. 
                  Export to CSV or backup as JSON anytime. Optional Google Sheets integration available for cloud backup.
                </p>
                <p className="text-zinc-600 text-xs italic">
                  Warning: Clearing browser data = losing local sessions. Back up regularly.
                </p>
              </div>
            </section>

          </div>

          {/* Footer CTA */}
          <div className="border-t border-zinc-800/50 p-6 bg-gradient-to-t from-zinc-900/80 to-transparent">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
            >
              Enter The Protocol
            </button>
            <p className="text-center text-zinc-600 text-xs mt-3 font-mono">
              "Rules beat discretion. Time for work."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
