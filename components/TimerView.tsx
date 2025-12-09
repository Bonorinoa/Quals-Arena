
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Save, ArrowLeft, Target, ShieldAlert, Quote, Zap, Thermometer, Wind, Brain, Send, X } from 'lucide-react';
import { Session, MentalNote } from '../types';
import { getLocalDate } from '../services/storage';
import { formatTime } from '../utils/timeUtils';

interface TimerViewProps {
  onSessionComplete: (session: Session) => void;
  onCancel: () => void;
}

// Extended state machine for the sequential flow
type TimerMode = 'SETUP_DURATION' | 'SETUP_WARMUP' | 'WARMUP' | 'RUNNING' | 'LOGGING';

const ANCHORS = [
  { title: "THE SIGNAL EXTRACTION", text: "\"High stimulation is just high variance.\" You cannot regress on a noisy variable." },
  { title: "THE KYDLAND-PRESCOTT CONSTRAINT", text: "\"Rules beat discretion.\" Discretion eliminates the credibility of the promise." },
  { title: "THE MINSKY MOMENT", text: "\"Lag is Ponzi Finance.\" Stability breeds instability." },
  { title: "THE IDENTITY SHIFT", text: "\"Owners build assets; employees log hours.\" Are you an employee?" },
  { title: "THE AUDIO DEFENSE", text: "Boredom is not an emergency—it is just the absence of noise." },
  { title: "THE ARENA MINDSET", text: "The problem sets are your MVP. Stop acting like a student." },
  { title: "CAPITAL DEEPENING", text: "Build a surplus of cognitive capital. Increase your marginal productivity." },
  { title: "RADICAL HONESTY", text: "The Scoreboard is the source of truth. Writing a '0' is better than lying." }
];

export const TimerView: React.FC<TimerViewProps> = ({ onSessionComplete, onCancel }) => {
  const [mode, setMode] = useState<TimerMode>('SETUP_DURATION');
  const [isActive, setIsActive] = useState(false);
  
  // Timer State
  const [seconds, setSeconds] = useState(0); // Display Seconds
  const startTimeRef = useRef<number | null>(null); // When the current segment started
  const accumulatedTimeRef = useRef<number>(0); // Time logged before current pause
  
  const [targetSeconds, setTargetSeconds] = useState<number>(3600); 
  const [stopConfirm, setStopConfirm] = useState(false); 
  const [currentAnchor, setCurrentAnchor] = useState(ANCHORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Warm Up State
  const [warmUpDuration, setWarmUpDuration] = useState(0); 
  const [warmUpSecondsLeft, setWarmUpSecondsLeft] = useState(0);

  // Log form state
  const [reps, setReps] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  // Stream (Mental Notes) State
  const [mentalNotes, setMentalNotes] = useState<MentalNote[]>([]);
  const [showStreamInput, setShowStreamInput] = useState(false);
  const [currentStreamNote, setCurrentStreamNote] = useState('');
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const DURATIONS = [
    { label: '30m', value: 1800 },
    { label: '1h', value: 3600 },
    { label: '90m', value: 5400 },
    { label: '2h', value: 7200 },
    { label: '3h', value: 10800 },
    { label: '4h', value: 14400 },
  ];

  const WARMUPS = [
    { label: 'Skip', value: 0 },
    { label: '1m', value: 60 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 },
  ];

  useEffect(() => {
    setCurrentAnchor(ANCHORS[Math.floor(Math.random() * ANCHORS.length)]);
  }, []);

  // Keyboard Shortcut for Mental Notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent triggering if modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      
      if (e.key.toLowerCase() === 'n' && mode === 'RUNNING' && !showStreamInput) {
        e.preventDefault();
        setShowStreamInput(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, showStreamInput]);

  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && (mode === 'RUNNING' || mode === 'WARMUP')) {
        try {
          const sentinel = await navigator.wakeLock.request('screen');
          wakeLockRef.current = sentinel;
        } catch (err) {
          console.warn('Wake Lock rejected', err);
        }
      }
    };
    
    if (mode === 'RUNNING' || mode === 'WARMUP') {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) wakeLockRef.current.release();
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [mode]);

  // Before Unload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode === 'RUNNING' || mode === 'LOGGING') {
        e.preventDefault();
        e.returnValue = ''; 
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode]);

  // ------------------------------------------
  // CORE TIMER LOGIC (Drift Proof)
  // ------------------------------------------
  useEffect(() => {
    let interval: number;

    if (isActive && mode === 'RUNNING') {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      
      interval = window.setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - (startTimeRef.current || now)) / 1000);
        setSeconds(accumulatedTimeRef.current + delta);
      }, 200); 
    } else if (mode === 'WARMUP' && warmUpSecondsLeft > 0) {
       interval = window.setInterval(() => {
         setWarmUpSecondsLeft((prev) => {
            if (prev <= 1) {
               // Warmup Done -> Auto Start
               setMode('RUNNING');
               startTimeRef.current = Date.now();
               setIsActive(true);
               return 0;
            }
            return prev - 1;
         });
       }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode, warmUpSecondsLeft]);

  // FLOW HANDLERS

  const handleSelectDuration = (seconds: number) => {
    setTargetSeconds(seconds);
    // Smooth transition delay
    setTimeout(() => setMode('SETUP_WARMUP'), 200);
  };

  const handleSelectWarmup = (seconds: number) => {
    setWarmUpDuration(seconds);
    if (seconds > 0) {
      setWarmUpSecondsLeft(seconds);
      setMode('WARMUP');
    } else {
      setMode('RUNNING');
      setIsActive(true);
      startTimeRef.current = Date.now();
    }
  };

  const handleSkipWarmup = () => {
    setWarmUpSecondsLeft(0);
    setMode('RUNNING');
    setIsActive(true);
    startTimeRef.current = Date.now();
  };

  const togglePause = () => {
    if (isActive) {
      // PAUSE: Commit current delta to accumulated
      const now = Date.now();
      const delta = Math.floor((now - (startTimeRef.current || now)) / 1000);
      accumulatedTimeRef.current += delta;
      startTimeRef.current = null;
      setIsActive(false);
    } else {
      // RESUME: Reset start time
      startTimeRef.current = Date.now();
      setIsActive(true);
      setStopConfirm(false);
    }
  };

  const handleStopClick = () => {
    if (!stopConfirm) {
        // First Click: Pause
        if (isActive) togglePause();
        setStopConfirm(true);
    } else {
        // Second Click: Log
        // Note: We no longer consolidate logs automatically, we keep them structured.
        setMode('LOGGING');
        setStopConfirm(false);
    }
  };

  const handleStreamSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentStreamNote.trim()) return;

      setMentalNotes(prev => [...prev, {
        timestamp: seconds,
        text: currentStreamNote
      }]);
      setCurrentStreamNote('');
      setShowStreamInput(false);
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Final sanity check on time
    let finalDuration = seconds;
    if (isActive && startTimeRef.current) {
       const now = Date.now();
       finalDuration = accumulatedTimeRef.current + Math.floor((now - startTimeRef.current) / 1000);
    }

    const session: Session = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now() - (finalDuration * 1000),
      durationSeconds: finalDuration,
      targetDurationSeconds: targetSeconds,
      reps: reps,
      notes: notes,
      mentalNotes: mentalNotes, // Save the structured array
      date: getLocalDate()
    };
    
    onSessionComplete(session);
  };

  // ----------------------------------------------------------------------
  // VIEW: STEP 1 - DURATION
  // ----------------------------------------------------------------------
  if (mode === 'SETUP_DURATION') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
         <h2 className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
            <Target size={14} /> Phase 1: Commitment
         </h2>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
            {DURATIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleSelectDuration(opt.value)}
                className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/50 p-8 rounded-xl transition-all duration-300 hover:bg-zinc-800/60 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all" />
                <span className="text-2xl font-mono text-zinc-300 group-hover:text-white font-bold">{opt.label}</span>
              </button>
            ))}
         </div>

         <button onClick={onCancel} className="mt-16 text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest font-mono flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Abort Protocol
         </button>
       </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: STEP 2 - WARMUP SELECTION
  // ----------------------------------------------------------------------
  if (mode === 'SETUP_WARMUP') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
         <h2 className="text-cyan-500/70 font-mono text-xs uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
            <Thermometer size={14} /> Phase 2: Calibration
         </h2>
         
         <p className="text-zinc-400 text-center max-w-md mb-12 font-light text-lg">
           Do you need to clear cognitive noise before the clock starts?
         </p>

         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {WARMUPS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleSelectWarmup(opt.value)}
                className={`group relative overflow-hidden backdrop-blur-md border p-6 rounded-xl transition-all duration-300 active:scale-95 ${
                  opt.value === 0 
                  ? 'bg-zinc-900/40 border-white/5 hover:border-zinc-500' 
                  : 'bg-cyan-950/10 border-cyan-500/10 hover:border-cyan-400/50 hover:bg-cyan-900/20'
                }`}
              >
                <span className={`text-xl font-mono font-bold ${opt.value === 0 ? 'text-zinc-400' : 'text-cyan-200'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
         </div>

         <button onClick={() => setMode('SETUP_DURATION')} className="mt-16 text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest font-mono flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Back
         </button>
       </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: WARM UP (THE BREATHING ROOM)
  // ----------------------------------------------------------------------
  if (mode === 'WARMUP') {
     return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] w-full animate-in fade-in duration-1000 overflow-hidden">
           {/* Breathing Background Animation */}
           <style>{`
             @keyframes deep-breathe {
               0%, 100% { transform: scale(1); opacity: 0.3; }
               50% { transform: scale(1.3); opacity: 0.6; }
             }
             .animate-deep-breathe { animation: deep-breathe 8s infinite ease-in-out; }
           `}</style>

           {/* The Void Background */}
           <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <div className="w-[60vh] h-[60vh] rounded-full bg-cyan-900/30 blur-[120px] animate-deep-breathe"></div>
           </div>

           <div className="relative z-10 flex flex-col items-center">
              <div className="text-cyan-500/50 font-mono text-xs uppercase tracking-[0.3em] mb-12 flex items-center gap-2">
                  <Wind size={14} /> Decompression
              </div>
              
              <div className="text-8xl sm:text-9xl font-mono text-cyan-100/90 font-bold tracking-tighter tabular-nums drop-shadow-2xl">
                  {Math.floor(warmUpSecondsLeft / 60)}:{(warmUpSecondsLeft % 60).toString().padStart(2, '0')}
              </div>

              <div className="mt-16 text-cyan-200/50 text-sm font-mono max-w-xs text-center leading-relaxed">
                  "Sit in the void.<br/>Let the noise settle."
              </div>
           </div>
           
           <button 
             onClick={handleSkipWarmup}
             className="absolute bottom-12 z-20 text-zinc-600 hover:text-cyan-400 text-[10px] uppercase tracking-widest transition-colors"
           >
             Skip Calibration
           </button>
        </div>
     );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGGING
  // ----------------------------------------------------------------------
  if (mode === 'LOGGING') {
    const deficitMinutes = (targetSeconds - seconds) / 60;
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
        <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold mb-8 text-zinc-200 font-mono border-b border-white/5 pb-4 tracking-wider flex items-center justify-between">
            <span>SESSION LOG</span>
            <span className="text-[10px] text-zinc-500 uppercase">Saving to Local Node</span>
          </h2>
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">Asset Value (Time)</label>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-mono text-white">{formatTime(seconds)}</div>
                {seconds < targetSeconds ? (
                   <div className="text-xs text-red-400 font-mono flex items-center gap-1 bg-red-950/30 px-2 py-1 rounded">
                      <ShieldAlert size={12} /> DEFICIT ({deficitMinutes.toFixed(2)}m)
                   </div>
                ) : (
                   <div className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/30 px-2 py-1 rounded">
                      <Zap size={12} /> SURPLUS (+{Math.abs(deficitMinutes).toFixed(2)}m)
                   </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">Reps (Volume)</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setReps(0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setReps(Math.max(0, Math.min(50, numValue)));
                    }
                  }
                }}
                min="0"
                max="50"
                className="w-full bg-black/40 border border-white/10 text-white p-4 text-2xl font-mono focus:border-white/30 outline-none rounded-lg transition-colors"
                autoFocus
              />
            </div>

            {/* THE STREAM RECEIPT */}
            {mentalNotes.length > 0 && (
              <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-lg p-4">
                 <label className="block text-[10px] uppercase tracking-widest text-cyan-500/70 mb-3 font-mono flex items-center gap-2">
                   <Brain size={12} /> The Stream (Receipt)
                 </label>
                 <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                   {mentalNotes.map((note, idx) => (
                     <div key={idx} className="flex gap-3 text-xs font-mono group">
                        <span className="text-zinc-600 group-hover:text-cyan-500/70 transition-colors">[{formatTime(note.timestamp)}]</span>
                        <span className="text-zinc-300">{note.text}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">Diagnostic Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was the friction? What was the insight?"
                className="w-full bg-black/40 border border-white/10 text-zinc-300 p-4 font-mono text-sm h-32 resize-none focus:border-white/30 outline-none rounded-lg transition-colors"
              />
            </div>

            <div className="pt-4 flex gap-4">
               {seconds <= 600 ? (
                 <button onClick={onCancel} disabled={isSubmitting} className="flex-1 py-4 border border-white/10 text-zinc-400 font-bold hover:bg-white/5 uppercase text-xs tracking-widest rounded-lg">Discard</button>
               ) : (
                 <div className="flex-1 py-4 border border-zinc-800 text-zinc-700 font-bold uppercase text-xs tracking-widest rounded-lg text-center cursor-not-allowed" title="Cannot discard sessions longer than 10 minutes">
                   Discard Locked
                 </div>
               )}
               <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-white text-black font-bold hover:bg-zinc-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-white/10">
                 <Save size={16} /> {isSubmitting ? 'Minting...' : 'Log Asset'}
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: RUNNING (THE ARENA)
  // ----------------------------------------------------------------------
  const progressPercent = Math.min((seconds / targetSeconds) * 100, 100);
  const isOvertime = seconds >= targetSeconds;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in zoom-in-95 duration-1000 relative">
      <div className="mb-12 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
        <h1 className="text-xs text-zinc-500 uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2">
           <Zap size={12} /> The Arena
        </h1>
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-mono">
          <Target size={10} /> Contract: {formatTime(targetSeconds)}
        </div>
      </div>
      
      <div className={`font-mono text-[14vw] sm:text-[9rem] leading-none tracking-tighter tabular-nums mb-12 transition-all duration-500 drop-shadow-2xl ${
        isActive ? (isOvertime ? 'text-emerald-400' : 'text-white') : 'text-zinc-600'
      }`}>
        {formatTime(seconds)}
      </div>

      {/* Progress Line */}
      <div className="w-full max-w-md h-px bg-zinc-800 mb-16 relative">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isOvertime ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'}`} 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* TACTILE TRIAD CONTROL */}
      <div className="flex items-center gap-6 sm:gap-12 mt-8">
        
        {/* LEFT: STOP (The Brake) */}
        <button onClick={handleStopClick} className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-sm ${
            stopConfirm 
            ? 'border-red-500 bg-red-950/30 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
            : 'border-zinc-800 text-zinc-600 hover:bg-red-950/10 hover:border-red-900/50 hover:text-red-900'
        }`}>
          {stopConfirm ? <span className="text-[10px] font-bold uppercase tracking-widest">End</span> : <Square size={20} fill="currentColor" />}
        </button>

        {/* CENTER: PLAY/PAUSE (The Engine) */}
        <button onClick={togglePause} className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-sm ${
            isActive 
            ? 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300' 
            : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
        }`}>
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        {/* RIGHT: NOTE (The Stream) */}
        <button 
           onClick={() => setShowStreamInput(true)} 
           className="group w-16 h-16 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-600 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/10 transition-all duration-300 backdrop-blur-sm" 
           title="Capture Thought (N)"
        >
          <Brain size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Stream Input Modal */}
      {showStreamInput && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleStreamSubmit} className="w-full max-w-md bg-zinc-900/90 border border-white/10 p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] uppercase tracking-widest text-cyan-500/70 font-mono">The Stream // {formatTime(seconds)}</span>
               <button type="button" onClick={() => setShowStreamInput(false)} className="text-zinc-500 hover:text-white">
                 <X size={14} />
               </button>
            </div>
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                value={currentStreamNote}
                onChange={(e) => setCurrentStreamNote(e.target.value)}
                placeholder="Capture the thought..."
                className="w-full bg-black/50 text-white p-3 pr-10 rounded-lg border border-zinc-700 focus:border-cyan-500/50 outline-none font-mono text-sm"
              />
              <button type="submit" className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-cyan-400 transition-colors">
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-24 max-w-lg text-center px-6 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center justify-center gap-2 mb-3 text-amber-700/80 uppercase text-[10px] tracking-widest font-bold">
           <Quote size={10} /> {currentAnchor.title}
        </div>
        <p className="text-sm font-mono text-zinc-400 leading-relaxed">"{currentAnchor.text}"</p>
      </div>
    </div>
  );
};