
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { 
  ShieldCheck, ChevronDown, ChevronUp, Play, AlertOctagon, 
  TrendingUp, TrendingDown, Minus, Scale, Activity, Grid, FileText
} from 'lucide-react';
import { Session, UserSettings } from '../types';
import { Card } from './ui/Card';
import { 
  differenceInDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, format, subDays 
} from 'date-fns';
import { getLocalDate } from '../services/storage';

interface DashboardViewProps {
  sessions: Session[];
  settings: UserSettings;
  onStartSession: () => void;
  onRelapse: () => void;
}

const DeltaIndicator: React.FC<{ current: number | string; previous: number | string; label: string; suffix?: string; isInverse?: boolean }> = ({ 
  current, previous, label, suffix = '', isInverse = false 
}) => {
  if (typeof current === 'string' || typeof previous === 'string') {
    return (
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-mono text-white font-bold">{current}</span>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono mt-1">gathering signal...</span>
      </div>
    );
  }

  const delta = current - previous;
  const percentChange = previous > 0 
    ? ((delta / previous) * 100).toFixed(0) 
    : (current > 0 ? 100 : 0);
  
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  
  let colorClass = "text-zinc-500";
  if (!isNeutral) {
     if (isInverse) {
        colorClass = isPositive ? "text-red-500" : "text-emerald-500";
     } else {
        colorClass = isPositive ? "text-emerald-500" : "text-red-500"; 
     }
  }

  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono text-white font-bold">{current}{suffix}</span>
        {!isNeutral && (
           <span className={`text-xs font-mono flex items-center ${colorClass}`}>
             {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
             {Math.abs(Number(percentChange))}%
           </span>
        )}
        {isNeutral && <span className="text-xs text-zinc-700 font-mono flex items-center"><Minus size={12} /> 0%</span>}
      </div>
      <span className="text-[10px] text-zinc-600 font-mono mt-1">vs {previous}{suffix} (Prev)</span>
    </div>
  );
};

// HEATMAP COMPONENT
const ConsistencyGrid: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
   const days = useMemo(() => {
      const result = [];
      const today = new Date();
      // Generate last 60 days
      for (let i = 59; i >= 0; i--) {
         const d = subDays(today, i);
         const dateStr = d.toISOString().split('T')[0]; 
         
         const daySessions = sessions.filter(s => s.date === dateStr);
         const reps = daySessions.reduce((acc, s) => acc + s.reps, 0);
         
         let intensity = 'bg-zinc-900';
         if (reps > 0) intensity = 'bg-emerald-900/40';
         if (reps > 5) intensity = 'bg-emerald-700/60';
         if (reps > 15) intensity = 'bg-emerald-500';

         result.push({ date: dateStr, intensity, reps });
      }
      return result;
   }, [sessions]);

   return (
      <div className="flex flex-wrap gap-1 w-full justify-start">
         {days.map((d) => (
            <div 
               key={d.date} 
               title={`${d.date}: ${d.reps} reps`}
               className={`w-2 h-2 rounded-sm ${d.intensity} hover:border hover:border-white/50 transition-all cursor-help`}
            />
         ))}
      </div>
   );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, settings, onStartSession, onRelapse }) => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // -- Metrics Calculation --
  const stats = useMemo(() => {
    const todayStr = getLocalDate();
    const todayDate = new Date();
    
    const yesterdayDate = subDays(todayDate, 1);
    const offset = yesterdayDate.getTimezoneOffset();
    const localYesterday = new Date(yesterdayDate.getTime() - (offset * 60 * 1000));
    const yesterdayStr = localYesterday.toISOString().split('T')[0];

    const todaySessions = sessions.filter(s => s.date === todayStr);
    const todayDuration = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const todayReps = todaySessions.reduce((acc, s) => acc + s.reps, 0);
    const todayHours = todayDuration / 3600;

    const todayNetPosition = todaySessions.reduce((acc, s) => {
      const target = s.targetDurationSeconds ?? s.durationSeconds;
      return acc + (s.durationSeconds - target);
    }, 0);
    
    const MIN_DURATION_FOR_SER = 300; 
    const todaySER = todayDuration > MIN_DURATION_FOR_SER ? (todayReps / todayHours) : 0;
    const isTodayNoise = todayDuration > 0 && todayDuration <= MIN_DURATION_FOR_SER;

    const yesterdaySessions = sessions.filter(s => s.date === yesterdayStr);
    const yesterdayDuration = yesterdaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const yesterdayReps = yesterdaySessions.reduce((acc, s) => acc + s.reps, 0);
    const yesterdayHours = yesterdayDuration / 3600;
    const yesterdaySER = yesterdayDuration > MIN_DURATION_FOR_SER ? (yesterdayReps / yesterdayHours) : 0;

    const start = startOfWeek(todayDate, { weekStartsOn: 1 });
    const end = endOfWeek(todayDate, { weekStartsOn: 1 });
    const weeklySessions = sessions.filter(s => 
      isWithinInterval(parseISO(s.date), { start, end })
    );

    const weeklyReps = weeklySessions.reduce((acc, s) => acc + s.reps, 0);
    const totalDuration = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalReps = sessions.reduce((acc, s) => acc + s.reps, 0);
    const globalSER = totalDuration > 3600 ? (totalReps / (totalDuration / 3600)) : 0;
    const daysSober = differenceInDays(todayDate, parseISO(settings.substanceFreeStartDate));
    const dailyGoalSeconds = (settings.dailyTimeGoalHours || 4) * 3600;
    const volumeProgress = Math.min((todayDuration / dailyGoalSeconds) * 100, 100);

    return {
      today: { 
        reps: todayReps, 
        ser: isTodayNoise ? "NOISE" : todaySER.toFixed(1), 
        durationSeconds: todayDuration,
        netPositionSeconds: todayNetPosition,
        rawSer: todaySER 
      },
      yesterday: { 
        reps: yesterdayReps, 
        ser: yesterdaySER.toFixed(1),
        rawSer: yesterdaySER
      },
      weeklyReps,
      globalSER: globalSER.toFixed(1),
      daysSober: Math.max(0, daysSober),
      timeBudget: {
        goalSeconds: dailyGoalSeconds,
        volumeProgress: volumeProgress,
      }
    };
  }, [sessions, settings.substanceFreeStartDate, settings.dailyTimeGoalHours]);

  const formatTimeFull = (secs: number) => {
    const absSecs = Math.abs(secs);
    const h = Math.floor(absSecs / 3600);
    const m = Math.floor((absSecs % 3600) / 60);
    const s = Math.floor(absSecs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getNetPositionColor = (secs: number) => {
    if (secs < 0) return 'text-red-500';
    if (secs > 0) return 'text-emerald-500';
    return 'text-white';
  };

  // Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    const last7DaysSessions = sessions.filter(s => {
       const d = parseISO(s.date);
       const diff = differenceInDays(now, d);
       return diff < 7 && diff >= 0;
    });
    const totalReps7Days = last7DaysSessions.reduce((acc, s) => acc + s.reps, 0);
    const avgReps7Days = totalReps7Days > 0 ? totalReps7Days / 7 : 0;

    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const offset = d.getTimezoneOffset();
      const localD = new Date(d.getTime() - (offset * 60 * 1000));
      const dateStr = localD.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      const reps = daySessions.reduce((acc, s) => acc + s.reps, 0);
      data.push({
        day: format(d, 'EEE'),
        reps: reps,
        fullDate: dateStr,
        baseline: avgReps7Days
      });
    }
    return { data, avgReps7Days };
  }, [sessions]);

  const targetMet = stats.weeklyReps >= settings.weeklyRepTarget;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      
      {/* HERO SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="relative group cursor-pointer" onClick={onStartSession}>
           <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
           <button className="relative z-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center hover:border-zinc-400 hover:scale-105 transition-all duration-300 shadow-2xl shadow-black">
             <Play size={48} className="text-white mb-4 fill-white" />
             <span className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Enter The Arena</span>
           </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-1 sm:p-2 sm:pr-6">
              <div className="flex items-center gap-4 px-6 py-3 border-b sm:border-b-0 sm:border-r border-zinc-800 w-full sm:w-auto justify-center">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1 mb-1">
                      <Scale size={10} /> Contract Balance
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-mono font-bold ${getNetPositionColor(stats.today.netPositionSeconds)}`}>
                        {stats.today.netPositionSeconds < 0 ? '-' : (stats.today.netPositionSeconds > 0 ? '+' : '')}
                        {formatTimeFull(stats.today.netPositionSeconds)} 
                      </span>
                      <span className="text-zinc-600 text-sm font-mono">/ {settings.dailyTimeGoalHours}:00:00</span>
                    </div>
                    <div className="w-40 h-1 bg-zinc-800 mt-1 rounded-full overflow-hidden relative" title="Daily Volume Progress">
                       <div className="h-full bg-zinc-400 transition-all duration-500" style={{ width: `${Math.max(stats.timeBudget.volumeProgress, stats.today.durationSeconds > 0 ? 2 : 0)}%` }} />
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-6 px-4 py-3 sm:py-0 w-full sm:w-auto justify-between sm:justify-start">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-1">Signal Integrity</span>
                    <span className={`text-xl font-mono font-bold ${stats.daysSober > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                      {stats.daysSober} DAYS
                    </span>
                 </div>
                 <div className="w-px h-8 bg-zinc-800 mx-2 hidden sm:block"></div>
                 <button onClick={(e) => { e.stopPropagation(); onRelapse(); }} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-500 transition-colors uppercase tracking-wider font-bold px-2 py-1 hover:bg-red-950/10 rounded">
                   <AlertOctagon size={14} /> Relapse
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* EXPANDABLE ANALYTICS */}
      <div className="w-full max-w-4xl mx-auto border-t border-zinc-900">
        <button onClick={() => setShowAnalytics(!showAnalytics)} className="w-full py-4 flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest text-xs font-mono">
          {showAnalytics ? <><ChevronUp size={14} /> Hide Audit</> : <><ChevronDown size={14} /> Audit Performance</>}
        </button>

        {showAnalytics && (
          <div className="pb-20 space-y-6 animate-in slide-in-from-bottom-4 duration-500 px-4">
            
            {/* HEATMAP LEDGER */}
            <div className="p-6 border border-zinc-800 bg-zinc-950/50">
               <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Grid size={12} /> Consistency Grid (60d)
               </div>
               <ConsistencyGrid sessions={sessions} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Card className="bg-zinc-900/30"><DeltaIndicator label="Daily Alpha (Reps)" current={stats.today.reps} previous={stats.yesterday.reps} /></Card>
               <Card className="bg-zinc-900/30">
                 <DeltaIndicator label="Sober Efficiency (SER)" current={stats.today.ser} previous={Number(stats.globalSER)} />
                 {stats.today.ser === "NOISE" && <div className="text-[10px] text-zinc-600 font-mono mt-2 flex items-center gap-1"><Activity size={10} /> Log &gt; 5 mins</div>}
               </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 flex flex-col justify-between">
                <div>
                  <div className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Weekly Contract</div>
                  <div className="text-3xl font-mono text-white flex items-baseline gap-2">{stats.weeklyReps} <span className="text-sm text-zinc-600 font-sans">/ {settings.weeklyRepTarget}</span></div>
                  <div className="mt-2 h-1 w-full bg-zinc-800">
                    <div className={`h-full transition-all duration-1000 ${targetMet ? 'bg-emerald-500' : 'bg-zinc-200'}`} style={{ width: `${Math.min((stats.weeklyReps / settings.weeklyRepTarget) * 100, 100)}%` }} />
                  </div>
                </div>
              </Card>

              <Card title="Performance vs Baseline (7 Day)" className="md:col-span-2">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.data}>
                      <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#18181b'}} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }} />
                      <Bar dataKey="reps" radius={[2, 2, 0, 0]} maxBarSize={40}>
                         {chartData.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.reps > 0 && entry.reps >= chartData.avgReps7Days ? '#fff' : '#3f3f46'} />
                         ))}
                      </Bar>
                      {chartData.avgReps7Days > 0 && <ReferenceLine y={chartData.avgReps7Days} stroke="#10b981" strokeDasharray="3 3" />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            
            <div className={`p-6 border ${targetMet ? 'border-emerald-900/30 bg-emerald-950/10' : 'border-zinc-800 bg-zinc-900/30'} transition-colors`}>
               <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                 {targetMet ? <ShieldCheck size={16} className="text-emerald-500" /> : <AlertOctagon size={16} className="text-zinc-500" />}
                 {targetMet ? <span className="text-emerald-500">FOUNDER MODE UNLOCKED</span> : <span className="text-zinc-500">EMPLOYEE MODE</span>}
               </h3>
               <p className="text-xs text-zinc-400 font-mono">{targetMet ? "Weekly Variance Positive. Chaos Authorized." : `Target Deficit: ${settings.weeklyRepTarget - stats.weeklyReps} Reps.`}</p>
            </div>

            {/* SESSION LEDGER */}
            <div className="pt-6 border-t border-zinc-900">
               <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={12} /> Asset Ledger (History)
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="text-[10px] uppercase text-zinc-600 font-mono border-b border-zinc-800">
                       <th className="py-2 pr-4">Date</th>
                       <th className="py-2 pr-4">Duration</th>
                       <th className="py-2 pr-4">Contract</th>
                       <th className="py-2 pr-4 text-right">Net</th>
                       <th className="py-2 px-4 text-right">Reps</th>
                     </tr>
                   </thead>
                   <tbody className="font-mono text-xs">
                     {sessions.slice(0, 10).map((s) => {
                       const net = s.durationSeconds - (s.targetDurationSeconds || s.durationSeconds);
                       return (
                         <tr key={s.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                           <td className="py-3 pr-4 text-zinc-400">{s.date}</td>
                           <td className="py-3 pr-4 text-white">{(s.durationSeconds / 60).toFixed(0)}m</td>
                           <td className="py-3 pr-4 text-zinc-500">{(s.targetDurationSeconds || 0) / 60}m</td>
                           <td className={`py-3 pr-4 text-right ${net < 0 ? 'text-red-500' : (net > 0 ? 'text-emerald-500' : 'text-zinc-600')}`}>
                             {net > 0 ? '+' : ''}{(net / 60).toFixed(0)}m
                           </td>
                           <td className="py-3 px-4 text-right text-white">{s.reps}</td>
                         </tr>
                       );
                     })}
                     {sessions.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-zinc-700 italic">No assets built yet.</td></tr>
                     )}
                   </tbody>
                 </table>
                 {sessions.length > 10 && (
                    <div className="text-center py-2 text-[10px] text-zinc-600 uppercase">
                       Showing last 10 of {sessions.length} sessions
                    </div>
                 )}
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
