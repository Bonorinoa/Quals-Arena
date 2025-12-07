import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Save, AlertCircle, ArrowRight, Target, ShieldAlert, Quote, Zap, Thermometer } from 'lucide-react';
import { Session } from '../types';
import { getLocalDate } from '../services/storage';

interface TimerViewProps {
  onSessionComplete: (session: Session) => void;
  onCancel: () => void;
}

type TimerMode = 'SETUP' | 'WARMUP' | 'RUNNING' | 'LOGGING';

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
  const [mode, setMode] = useState<TimerMode>('SETUP');
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
  const [warmUpDuration, setWarmUpDuration] = useState(0); // 0, 60, 180...
  const [warmUpSecondsLeft, setWarmUpSecondsLeft] = useState(0);

  // Log form state
  const [reps, setReps] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
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
    { label: 'None', value: 0 },
    { label: '1m', value: 60 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 },
  ];

  useEffect(() => {
    setCurrentAnchor(ANCHORS[Math.floor(Math.random() * ANCHORS.length)]);
  }, []);

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
      }, 200); // Check frequently, but math ensures accuracy
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

  const initiateSequence = () => {
    if (warmUpDuration > 0) {
      setWarmUpSecondsLeft(warmUpDuration);
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
        setMode('LOGGING');
        setStopConfirm(false);
    }
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
      date: getLocalDate()
    };
    
    onSessionComplete(session);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------------------------
  // VIEW: SETUP
  // ----------------------------------------------------------------------
  if (mode === 'SETUP') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in zoom-in-95 duration-300">
        <div className="w-full bg-zinc-900/50 border border-zinc-800 p-8 space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20"></div>
           
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

           <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-4 font-mono flex items-center gap-2">
                <Thermometer size={14} />
                Cognitive Ramp-Up (Warm Up)
              </label>
              <div className="grid grid-cols-4 gap-2">
                 {WARMUPS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setWarmUpDuration(opt.value)}
                      className={`py-2 font-mono text-xs border transition-all ${
                        warmUpDuration === opt.value 
                        ? 'bg-zinc-800 text-white border-zinc-600' 
                        : 'bg-zinc-950 text-zinc-600 border-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                 ))}
              </div>
           </div>

           <div className="flex gap-4 pt-4 border-t border-zinc-800/50">
             <button onClick={onCancel} className="flex-1 py-4 text-zinc-500 font-mono text-xs uppercase tracking-widest hover:text-white">
               Abort
             </button>
             <button 
               onClick={initiateSequence}
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
  // VIEW: WARM UP
  // ----------------------------------------------------------------------
  if (mode === 'WARMUP') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in fade-in duration-500">
           <div className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-8 animate-pulse">
              Cognitive Ramp-Up
           </div>
           <div className="text-8xl font-mono text-zinc-700 font-bold">
              {Math.floor(warmUpSecondsLeft / 60)}:{(warmUpSecondsLeft % 60).toString().padStart(2, '0')}
           </div>
           <div className="mt-8 text-zinc-600 text-xs font-mono max-w-xs text-center">
              "Sit in the void. Let the cello carry the weight."
           </div>
           <button 
             onClick={handleSkipWarmup}
             className="mt-12 text-zinc-800 hover:text-zinc-500 text-xs uppercase tracking-widest"
           >
             Skip Warmup
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg mx-auto p-4 animate-in fade-in duration-300 overflow-y-auto">
        <div className="w-full bg-zinc-900 border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold mb-6 text-zinc-100 font-mono border-b border-zinc-800 pb-4">
            SESSION DEBRIEF
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">Duration (Asset Built)</label>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-mono text-zinc-100">{formatTime(seconds)}</div>
                {seconds < targetSeconds ? (
                   <div className="text-xs text-red-500 font-mono flex items-center gap-1">
                      <ShieldAlert size={12} /> DEFICIT ({deficitMinutes.toFixed(2)}m)
                   </div>
                ) : (
                   <div className="text-xs text-emerald-500 font-mono flex items-center gap-1">
                      <Zap size={12} /> SURPLUS (+{Math.abs(deficitMinutes).toFixed(2)}m)
                   </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">Reps Completed</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 p-4 text-2xl font-mono focus:border-white outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-mono">Diagnostic Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 p-4 font-mono text-sm h-32 resize-none focus:border-white outline-none"
              />
            </div>

            <div className="pt-4 flex gap-4">
               <button onClick={onCancel} disabled={isSubmitting} className="flex-1 py-4 border border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-800 uppercase text-xs tracking-widest">Discard</button>
               <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-white text-black font-bold hover:bg-zinc-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                 <Save size={16} /> {isSubmitting ? 'Minting...' : 'Log Asset'}
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: RUNNING
  // ----------------------------------------------------------------------
  const progressPercent = Math.min((seconds / targetSeconds) * 100, 100);
  const isOvertime = seconds >= targetSeconds;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in zoom-in-95 duration-500">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-xl text-zinc-500 uppercase tracking-[0.3em] font-bold">The Arena</h1>
        <div className="flex items-center justify-center gap-2 text-zinc-600 text-sm font-mono">
          <Target size={14} /> Target: {formatTime(targetSeconds)}
        </div>
      </div>
      
      <div className={`font-mono text-[12vw] sm:text-[8rem] leading-none tracking-tighter tabular-nums mb-8 transition-colors duration-500 ${
        isActive ? (isOvertime ? 'text-emerald-500' : 'text-white') : 'text-zinc-600'
      }`}>
        {formatTime(seconds)}
      </div>

      <div className="w-full max-w-md h-1 bg-zinc-900 mb-12 relative overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${isOvertime ? 'bg-emerald-500' : 'bg-white'}`} style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex gap-6">
        <button onClick={togglePause} className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
            isActive ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500' : 'border-emerald-900/50 text-emerald-500 bg-emerald-950/10'
        }`}>
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>

        <button onClick={handleStopClick} className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
            stopConfirm ? 'border-red-500 bg-red-950/50 text-red-500 animate-pulse' : 'border-red-900/30 text-red-700 hover:bg-red-950/20'
        }`}>
          {stopConfirm ? <span className="text-[10px] font-bold uppercase tracking-widest">Confirm</span> : <Square size={32} fill="currentColor" />}
        </button>
      </div>

      <div className="mt-16 max-w-lg text-center text-zinc-600 font-mono px-4">
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-900/60 uppercase text-[10px] tracking-widest font-bold">
           <Quote size={10} /> {currentAnchor.title}
        </div>
        <p className="text-xs italic leading-relaxed">{currentAnchor.text}</p>
      </div>
    </div>
  );
};