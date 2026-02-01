
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Save, ArrowLeft, Target, ShieldAlert, Quote, Zap, Thermometer, Wind, Brain, Send, X } from 'lucide-react';
import { Session, MentalNote, PauseEvent } from '../types';
import { getLocalDate, STORAGE_KEYS } from '../services/storage';
import { formatTime } from '../utils/timeUtils';
import * as storage from '../services/storage';
import { getGoalLabels } from '../utils/goalUtils';

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
  
  // Pause tracking state
  const [pauseEvents, setPauseEvents] = useState<PauseEvent[]>([]);
  
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

  // Session Recovery on Mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const timeSinceLastSave = Date.now() - parsed.lastSaved;
        
        // If saved state is recent (within 4 hours) and was running, offer to restore
        if (timeSinceLastSave < 4 * 60 * 60 * 1000 && parsed.mode === 'RUNNING') {
          const shouldRestore = window.confirm(
            `Found an interrupted session (${Math.floor(parsed.totalElapsed / 60)} minutes). Resume?`
          );
          if (shouldRestore) {
            setSeconds(parsed.totalElapsed + Math.floor(timeSinceLastSave / 1000));
            setTargetSeconds(parsed.targetSeconds);
            setMode('RUNNING');
            startTimeRef.current = Date.now();
            accumulatedTimeRef.current = parsed.totalElapsed + Math.floor(timeSinceLastSave / 1000);
            setIsActive(true);
            if (parsed.pauseEvents) {
              setPauseEvents(parsed.pauseEvents);
            }
          } else {
            localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
          }
        } else if (timeSinceLastSave >= 4 * 60 * 60 * 1000) {
          // Clear stale state
          localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
        }
      } catch (e) {
        console.error('Failed to restore timer state:', e);
        localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
      }
    }
  }, []); // Run once on mount

  // Visibility Change Handler for Background Recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && startTimeRef.current) {
        // Recalculate elapsed time when app becomes visible
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTimeRef.current) / 1000);
        const totalElapsed = accumulatedTimeRef.current + elapsedSinceStart;
        setSeconds(totalElapsed);
        
        // Also restore from localStorage backup if needed
        const savedState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            // Use the larger value to prevent time loss
            if (parsed.totalElapsed > totalElapsed) {
              setSeconds(parsed.totalElapsed);
              accumulatedTimeRef.current = parsed.totalElapsed;
              startTimeRef.current = now;
            }
          } catch (e) {
            console.error('Failed to parse saved timer state:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // Persist Timer State to localStorage
  useEffect(() => {
    if (!isActive || mode !== 'RUNNING') return;
    
    const saveInterval = setInterval(() => {
      const timerState = {
        totalElapsed: seconds,
        targetSeconds,
        startTime: startTimeRef.current,
        lastSaved: Date.now(),
        mode,
        pauseEvents
      };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerState));
    }, 5000); // Save every 5 seconds
    
    return () => clearInterval(saveInterval);
  }, [isActive, mode, seconds, targetSeconds, pauseEvents]);

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

  const handleCancel = () => {
    // Clear timer state from localStorage when cancelling
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    onCancel();
  };

  const togglePause = () => {
    if (isActive) {
      // PAUSE: Commit current delta to accumulated
      const now = Date.now();
      const delta = Math.floor((now - (startTimeRef.current || now)) / 1000);
      const totalElapsed = accumulatedTimeRef.current + delta;
      accumulatedTimeRef.current = totalElapsed;
      
      // Record pause event
      const pauseEvent: PauseEvent = {
        pausedAt: now,
        elapsedAtPause: totalElapsed,
      };
      setPauseEvents(prev => [...prev, pauseEvent]);
      
      startTimeRef.current = null;
      setIsActive(false);
      
      // Log pause for debugging
      console.log(`Paused at ${formatTime(totalElapsed)} elapsed`);
    } else {
      // RESUME: Reset start time
      const now = Date.now();
      
      // Update the last pause event with resume time
      setPauseEvents(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastPause = updated[updated.length - 1];
        lastPause.resumedAt = now;
        lastPause.pauseDuration = Math.floor((now - lastPause.pausedAt) / 1000);
        return updated;
      });
      
      startTimeRef.current = now;
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

    // Calculate total pause time
    const totalPauseTime = pauseEvents.reduce((acc, event) => {
      return acc + (event.pauseDuration || 0);
    }, 0);

    const settings = storage.getSettings();

    const session: Session = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now() - (finalDuration * 1000),
      durationSeconds: finalDuration,
      targetDurationSeconds: targetSeconds,
      reps: reps,
      notes: notes,
      mentalNotes: mentalNotes, // Save the structured array
      date: getLocalDate(),
      pauseEvents: pauseEvents,
      totalPauseTime: totalPauseTime,
      pauseCount: pauseEvents.length,
      goalCategoryId: settings.goalCategoryId,
      sessionGoalTarget: settings.defaultSessionGoal,
    };
    
    // Clear timer state from localStorage
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    
    onSessionComplete(session);
  };

  // ----------------------------------------------------------------------
  // VIEW: STEP 1 - DURATION - Enhanced with glass morphism
  // ----------------------------------------------------------------------
  if (mode === 'SETUP_DURATION') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4 animate-fade-in">
         <div className="glass-subtle px-6 py-3 rounded-full border-zinc-800 mb-12 flex items-center gap-2 backdrop-blur-sm animate-scale-in">
           <Target size={14} className="text-zinc-500" />
           <h2 className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">
              Phase 1: Commitment
           </h2>
         </div>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
            {DURATIONS.map((opt, idx) => (
              <button
                key={opt.label}
                onClick={() => handleSelectDuration(opt.value)}
                className="group relative overflow-hidden glass border-white/5 hover:border-emerald-500/50 p-8 rounded-xl transition-all duration-300 hover:bg-emerald-500/5 active:scale-95 shadow-glass hover:shadow-glass-lg animate-scale-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-transparent transition-all" />
                <span className="relative text-2xl font-mono text-zinc-300 group-hover:text-white font-bold transition-colors">{opt.label}</span>
              </button>
            ))}
         </div>

         <button onClick={handleCancel} className="mt-16 glass-subtle px-6 py-3 rounded-full border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 text-xs uppercase tracking-widest font-mono flex items-center gap-2 transition-all backdrop-blur-sm">
            <ArrowLeft size={14} /> Abort Protocol
         </button>
       </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: STEP 2 - WARMUP SELECTION - Enhanced with glass morphism
  // ----------------------------------------------------------------------
  if (mode === 'SETUP_WARMUP') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4 animate-fade-in">
         <div className="glass-subtle px-6 py-3 rounded-full border-cyan-500/20 mb-12 flex items-center gap-2 backdrop-blur-sm animate-scale-in">
           <Thermometer size={14} className="text-cyan-500/70" />
           <h2 className="text-cyan-500/70 font-mono text-xs uppercase tracking-[0.2em]">
              Phase 2: Calibration
           </h2>
         </div>
         
         <p className="text-zinc-400 text-center max-w-md mb-12 font-light text-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
           Do you need to clear cognitive noise before the clock starts?
         </p>

         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {WARMUPS.map((opt, idx) => (
              <button
                key={opt.label}
                onClick={() => handleSelectWarmup(opt.value)}
                className={`group relative overflow-hidden glass border p-6 rounded-xl transition-all duration-300 active:scale-95 shadow-glass hover:shadow-glass-lg animate-scale-in ${
                  opt.value === 0 
                  ? 'border-white/5 hover:border-zinc-500 hover:bg-white/5' 
                  : 'border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className={`text-xl font-mono font-bold transition-colors ${opt.value === 0 ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-cyan-200 group-hover:text-cyan-100'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
         </div>

         <button onClick={() => setMode('SETUP_DURATION')} className="mt-16 glass-subtle px-6 py-3 rounded-full border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 text-xs uppercase tracking-widest font-mono flex items-center gap-2 transition-all backdrop-blur-sm">
            <ArrowLeft size={14} /> Back
         </button>
       </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: WARM UP (THE BREATHING ROOM) - Enhanced with glass morphism
  // ----------------------------------------------------------------------
  if (mode === 'WARMUP') {
     return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] w-full animate-fade-in overflow-hidden">
           {/* Enhanced Breathing Background Animation */}
           <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <div className="w-[60vh] h-[60vh] rounded-full bg-cyan-900/30 animate-enhanced-breathe"></div>
           </div>

           <div className="relative z-10 flex flex-col items-center">
              <div className="glass-subtle px-6 py-3 rounded-full border-cyan-500/20 text-cyan-500/70 font-mono text-xs uppercase tracking-[0.3em] mb-12 flex items-center gap-2 backdrop-blur-xl animate-scale-in">
                  <Wind size={14} /> Decompression
              </div>
              
              {/* Glass morphism timer display */}
              <div className="glass-strong px-16 py-12 rounded-3xl border-cyan-500/20 shadow-glass-lg backdrop-blur-xl animate-scale-in mb-8">
                 <div className="text-8xl sm:text-9xl font-mono text-cyan-100/90 font-bold tracking-tighter tabular-nums drop-shadow-2xl">
                    {Math.floor(warmUpSecondsLeft / 60)}:{(warmUpSecondsLeft % 60).toString().padStart(2, '0')}
                 </div>
              </div>

              <div className="mt-16 text-cyan-200/50 text-sm font-mono max-w-xs text-center leading-relaxed animate-fade-in">
                  "Sit in the void.<br/>Let the noise settle."
              </div>
           </div>
           
           <button 
             onClick={handleSkipWarmup}
             className="absolute bottom-12 z-20 glass-subtle px-6 py-3 rounded-full border-zinc-800 text-zinc-600 hover:text-cyan-400 hover:border-cyan-500/30 text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm"
           >
             Skip Calibration
           </button>
        </div>
     );
  }

  // ----------------------------------------------------------------------
  // VIEW: LOGGING - Enhanced with glass morphism
  // ----------------------------------------------------------------------
  if (mode === 'LOGGING') {
    const deficitMinutes = (targetSeconds - seconds) / 60;
    const settings = storage.getSettings();
    const goalLabels = getGoalLabels(settings);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
        <div className="w-full glass-strong border-white/10 p-8 rounded-2xl shadow-glass-lg backdrop-blur-xl">
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
                   <div className="text-xs text-red-400 font-mono flex items-center gap-1 glass-subtle bg-red-950/30 border-red-500/20 px-3 py-1.5 rounded-lg">
                      <ShieldAlert size={12} /> DEFICIT ({deficitMinutes.toFixed(2)}m)
                   </div>
                ) : (
                   <div className="text-xs text-emerald-400 font-mono flex items-center gap-1 glass-subtle bg-emerald-950/30 border-emerald-500/20 px-3 py-1.5 rounded-lg">
                      <Zap size={12} /> SURPLUS (+{Math.abs(deficitMinutes).toFixed(2)}m)
                   </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">
                {goalLabels.name} ({goalLabels.plural.charAt(0).toUpperCase() + goalLabels.plural.slice(1)})
              </label>
              <div className="flex items-center gap-3">
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
                  className="w-full glass-subtle text-white p-4 text-2xl font-mono focus:border-white/30 outline-none rounded-lg transition-all"
                  autoFocus
                />
                <span className="text-zinc-500 font-mono text-sm whitespace-nowrap">
                  {reps === 1 ? goalLabels.singular : goalLabels.plural}
                </span>
              </div>
              {settings.defaultSessionGoal && (
                <div className="mt-2 flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500">Target:</span>
                  <span className={reps >= settings.defaultSessionGoal ? 'text-emerald-400' : 'text-zinc-400'}>
                    {settings.defaultSessionGoal} {settings.defaultSessionGoal === 1 ? goalLabels.singular : goalLabels.plural}
                  </span>
                  {reps >= settings.defaultSessionGoal && (
                    <span className="text-emerald-400">✓</span>
                  )}
                </div>
              )}
            </div>

            {/* PAUSE STATS DISPLAY */}
            {pauseEvents.length > 0 && (
              <div className="glass-subtle p-4 rounded-lg border-amber-500/20 backdrop-blur-sm animate-scale-in shadow-glass">
                <div className="text-xs uppercase tracking-widest text-amber-500/70 mb-2 font-mono">
                  Session Flow
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Pauses:</span>{' '}
                    <span className="text-white font-mono">{pauseEvents.length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Total Pause Time:</span>{' '}
                    <span className="text-white font-mono">
                      {formatTime(pauseEvents.reduce((acc, e) => acc + (e.pauseDuration || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* THE STREAM RECEIPT - Enhanced with glass styling */}
            {mentalNotes.length > 0 && (
              <div className="glass-subtle border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm animate-scale-in shadow-glass">
                 <label className="block text-[10px] uppercase tracking-widest text-cyan-500/70 mb-3 font-mono flex items-center gap-2">
                   <Brain size={12} /> The Stream (Receipt)
                 </label>
                 <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                   {mentalNotes.map((note, idx) => (
                     <div key={idx} className="flex gap-3 text-xs font-mono group glass-subtle p-2 rounded border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                        <span className="text-zinc-600 group-hover:text-cyan-500/70 transition-colors font-bold px-2 py-0.5 bg-cyan-950/20 rounded">[{formatTime(note.timestamp)}]</span>
                        <span className="text-zinc-300 flex-1">{note.text}</span>
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
                className="w-full glass-subtle text-zinc-300 p-4 font-mono text-sm h-32 resize-none focus:border-white/30 outline-none rounded-lg transition-all"
              />
            </div>

            <div className="pt-4 flex gap-4">
               {seconds <= 600 ? (
                 <button onClick={handleCancel} disabled={isSubmitting} className="flex-1 py-4 glass-subtle border-white/10 text-zinc-400 font-bold hover:bg-white/5 hover:border-white/20 uppercase text-xs tracking-widest rounded-lg transition-all active:scale-95">Discard</button>
               ) : (
                 <div className="flex-1 py-4 glass-subtle border-zinc-800 text-zinc-700 font-bold uppercase text-xs tracking-widest rounded-lg text-center cursor-not-allowed" title="Cannot discard sessions longer than 10 minutes">
                   Discard Locked
                 </div>
               )}
               <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-white text-black font-bold hover:bg-zinc-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-white/10 transition-all active:scale-95">
                 <Save size={16} /> {isSubmitting ? 'Minting...' : 'Log Asset'}
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: RUNNING (THE ARENA) - Enhanced with glass morphism
  // ----------------------------------------------------------------------
  const progressPercent = Math.min((seconds / targetSeconds) * 100, 100);
  const isOvertime = seconds >= targetSeconds;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in zoom-in-95 duration-1000 relative">
      {/* Ambient glow effect when timer is active */}
      {isActive && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className={`w-[40vh] h-[40vh] rounded-full ${isOvertime ? 'bg-emerald-500/20' : 'bg-white/10'} blur-[120px] animate-glow-pulse`}></div>
        </div>
      )}
      
      <div className="relative z-10 mb-12 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
        <div className="glass-subtle px-4 py-2 rounded-full inline-flex items-center justify-center gap-2 border-zinc-800 backdrop-blur-sm">
          <h1 className="text-xs text-zinc-500 uppercase tracking-[0.4em] font-bold flex items-center gap-2">
             <Zap size={12} /> The Arena
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-mono">
          <Target size={10} /> Contract: {formatTime(targetSeconds)}
        </div>
      </div>
      
      {/* Enhanced timer display with glass morphism */}
      <div className="glass-strong px-12 py-8 rounded-3xl border-white/10 shadow-glass-lg backdrop-blur-xl mb-8 relative z-10">
        <div className={`font-mono text-[14vw] sm:text-[9rem] leading-none tracking-tighter tabular-nums transition-all duration-500 drop-shadow-2xl ${
          isActive ? (isOvertime ? 'text-emerald-400 animate-number-pulse' : 'text-white') : 'text-zinc-600'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>

      {/* Progress Line - Enhanced with depth */}
      <div className="w-full max-w-md h-1 bg-zinc-900/50 mb-16 relative rounded-full overflow-hidden backdrop-blur-sm border border-zinc-800/50">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-1000 rounded-full ${
            isOvertime 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
              : 'bg-gradient-to-r from-white to-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
          }`} 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* TACTILE TRIAD CONTROL */}
      <div className="flex items-center gap-6 sm:gap-12 mt-8">
        
        {/* LEFT: STOP (The Brake) */}
        <button onClick={handleStopClick} className={`glass-subtle w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md active:scale-95 ${
            stopConfirm 
            ? 'border-red-500 bg-red-950/30 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
            : 'border-zinc-800 text-zinc-600 hover:bg-red-950/10 hover:border-red-900/50 hover:text-red-900 hover:shadow-glass'
        }`}>
          {stopConfirm ? <span className="text-[10px] font-bold uppercase tracking-widest">End</span> : <Square size={20} fill="currentColor" />}
        </button>

        {/* CENTER: PLAY/PAUSE (The Engine) */}
        <button onClick={togglePause} className={`glass w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-lg active:scale-95 ${
            isActive 
            ? 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 hover:shadow-glass' 
            : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]'
        }`}>
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        {/* RIGHT: NOTE (The Stream) */}
        <button 
           onClick={() => setShowStreamInput(true)} 
           className="glass-subtle group w-16 h-16 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-600 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/10 transition-all duration-300 backdrop-blur-md hover:shadow-glass active:scale-95" 
           title="Capture Thought (N)"
        >
          <Brain size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Stream Input Modal - Enhanced with glass styling */}
      {showStreamInput && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-lg animate-fade-in">
          <form onSubmit={handleStreamSubmit} className="w-full max-w-md glass-strong border-cyan-500/30 p-6 rounded-2xl shadow-glass-lg backdrop-blur-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Brain size={14} className="text-cyan-500/70" />
                 <span className="text-[10px] uppercase tracking-widest text-cyan-500/70 font-mono">The Stream // {formatTime(seconds)}</span>
               </div>
               <button type="button" onClick={() => setShowStreamInput(false)} className="text-zinc-500 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                value={currentStreamNote}
                onChange={(e) => setCurrentStreamNote(e.target.value)}
                placeholder="Capture the thought..."
                className="w-full glass-subtle text-white p-4 pr-12 rounded-xl border-cyan-500/20 focus:border-cyan-500/50 outline-none font-mono text-sm transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 glass-subtle border-cyan-500/30 rounded-lg text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-3 font-mono">Press Enter to save • Esc to cancel</p>
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