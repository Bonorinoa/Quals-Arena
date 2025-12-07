
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Save, AlertCircle, ArrowRight, Target, ShieldAlert } from 'lucide-react';
import { Session } from '../types';
import { getLocalDate } from '../services/storage';

interface TimerViewProps {
  onSessionComplete: (session: Session) => void;
  onCancel: () => void;
}

type TimerMode = 'SETUP' | 'RUNNING' | 'LOGGING';

export const TimerView: React.FC<TimerViewProps> = ({ onSessionComplete, onCancel }) => {
  const [mode, setMode] = useState<TimerMode>('SETUP');
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState<number>(3600); // Default 1 hour
  const [stopConfirm, setStopConfirm] = useState(false); // For double-click stop
  
  // Log form state
  const [reps, setReps] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // PRESETS for commitment
  const DURATIONS = [
    { label: '30m', value: 1800 },
    { label: '1h', value: 3600 },
    { label: '90m', value: 5400 },
    { label: '2h', value: 7200 },
    { label: '3h', value: 10800 },
    { label: '4h', value: 14400 },
  ];

  const toggleTimer = useCallback(() => {
    if (isActive) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setIsActive(false);
    } else {
      setIsActive(true);
      intervalRef.current = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
      setStopConfirm(false); // Reset stop confirm if user resumes
    }
  }, [isActive]);

  const startSession = () => {
    setMode('RUNNING');
    startTimeRef.current = Date.now();
    toggleTimer(); // Auto-start
  };

  const handleStopClick = () => {
    if (!stopConfirm) {
        // First Click: Pause and Arm
        if (isActive) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            setIsActive(false);
        }
        setStopConfirm(true);
    } else {
        // Second Click: Confirm Exit
        setMode('LOGGING');
        setStopConfirm(false);
    }
  };

  const handleSave = () => {
    if (reps < 0) return;
    
    const session: Session = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: startTimeRef.current,
      durationSeconds: seconds,
      targetDurationSeconds: targetSeconds,
      reps: reps,
      notes: notes,
      date: getLocalDate()
    };
    
    onSessionComplete(session);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------------------------
  // VIEW: SETUP (Pre-Commitment)
  // ----------------------------------------------------------------------
  if (mode === 'SETUP') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in zoom-in-95 duration-300">
        <div className="mb-8 text-center">
          <h1 className="text-xl text-zinc-500 uppercase tracking-[0.3em] font-bold mb-2">Contract Protocol</h1>
          <p className="text-zinc-600 text-sm font-mono">"Discretion eliminates the credibility of the promise."</p>
        </div>

        <div className="w-full bg-zinc-900/50 border border-zinc-800 p-8 space-y-8">
           <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-4 font-mono flex items-center gap-2">
                <Target size={14} />
                Commitment Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                 {DURATIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setTargetSeconds(opt.value)}
                      className={`py-4 font-mono text-sm border transition-all ${
                        targetSeconds === opt.value 
                        ? 'bg-white text-black border-white font-bold' 
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                 ))}
              </div>
           </div>

           <div className="text-center font-mono text-zinc-400 text-xs">
              Expected Finish: {new Date(Date.now() + targetSeconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </div>

           <div className="flex gap-4 pt-4 border-t border-zinc-800/50">
             <button 
               onClick={onCancel}
               className="flex-1 py-4 text-zinc-500 font-mono text-xs uppercase tracking-widest hover:text-white transition-colors"
             >
               Abort
             </button>
             <button 
               onClick={startSession}
               className="flex-[2] py-4 bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 hover:bg-emerald-900/40 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
             >
               Seal Contract <ArrowRight size={16} />
             </button>
           </div>
        </div>
       </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGGING (Debrief)
  // ----------------------------------------------------------------------
  if (mode === 'LOGGING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in fade-in duration-300">
        <div className="w-full bg-zinc-900 border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-100 font-mono border-b border-zinc-800 pb-4">
            SESSION DEBRIEF
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Duration (Asset Built)
              </label>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-mono text-zinc-100">
                  {formatTime(seconds)}
                </div>
                {seconds < targetSeconds && (
                   <div className="text-xs text-red-500 font-mono flex items-center gap-1">
                      <ShieldAlert size={12} />
                      DEFICIT ({(targetSeconds - seconds) / 60}m)
                   </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Reps Completed (Yield)
              </label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-4 text-2xl font-mono focus:border-white outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                Diagnostic Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Diagnostic Note: I got stuck on... / Flow state achieved..."
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-4 font-mono text-sm h-32 resize-none focus:border-white outline-none transition-colors"
              />
            </div>

            <div className="pt-4 flex gap-4">
               <button 
                onClick={onCancel}
                className="flex-1 py-4 border border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 transition-all uppercase tracking-widest text-sm"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-white text-black font-bold hover:bg-zinc-200 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Log Asset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: RUNNING (The Arena)
  // ----------------------------------------------------------------------
  const progressPercent = Math.min((seconds / targetSeconds) * 100, 100);
  const isOvertime = seconds >= targetSeconds;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in zoom-in-95 duration-500">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-xl text-zinc-500 uppercase tracking-[0.3em] font-bold">The Arena</h1>
        <div className="flex items-center justify-center gap-2 text-zinc-600 text-sm font-mono">
          <Target size={14} />
          Target: {formatTime(targetSeconds)}
        </div>
      </div>
      
      {/* Timer Display */}
      <div className={`font-mono text-[12vw] sm:text-[8rem] leading-none tracking-tighter tabular-nums mb-8 transition-colors duration-500 ${
        isActive 
          ? (isOvertime ? 'text-emerald-500' : 'text-white') 
          : 'text-zinc-600'
      }`}>
        {formatTime(seconds)}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md h-1 bg-zinc-900 mb-12 relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${isOvertime ? 'bg-emerald-500' : 'bg-white'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex gap-6">
        {/* Play / Pause / Resume Button */}
        <button 
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
            isActive 
              ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300' 
              : 'border-emerald-900/50 text-emerald-500 bg-emerald-950/10 hover:bg-emerald-900/20'
          }`}
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>

        {/* Stop / Confirm Button */}
        <button 
          onClick={handleStopClick}
          className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
            stopConfirm 
            ? 'border-red-500 bg-red-950/50 text-red-500 animate-pulse' 
            : 'border-red-900/30 text-red-700 hover:bg-red-950/20 hover:border-red-800'
          }`}
        >
          {stopConfirm ? <span className="text-[10px] font-bold uppercase tracking-widest">Confirm</span> : <Square size={32} fill="currentColor" />}
        </button>
      </div>

      <div className="mt-16 max-w-md text-center text-zinc-600 text-xs font-mono">
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-900/60">
           <AlertCircle size={14} />
           <span>THE KYDLAND-PRESCOTT CONSTRAINT</span>
        </div>
        "Rules beat discretion. The clock runs ONLY when eyes are on the paper."
      </div>
    </div>
  );
};
