
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { 
  ShieldCheck, ChevronDown, ChevronUp, Play, AlertOctagon, 
  TrendingUp, TrendingDown, Minus, Scale, Activity, Grid, FileText, X
} from 'lucide-react';
import { Session, UserSettings } from '../types';
import { Card } from './ui/Card';
import { 
  differenceInDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, format, subDays,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay
} from 'date-fns';
import { getLocalDate } from '../services/storage';
import { formatTimeFull } from '../utils/timeUtils';
import { getYesterdayDate, dateToLocalString } from '../utils/dateUtils';
import { getTotalDuration, getTotalReps, getSessionsByDate, calculateSER, MIN_DURATION_THRESHOLD_SECONDS, getWeeklyBudgetBalance, analyzeCommitmentPatterns } from '../utils/sessionUtils';

/**
 * Penalty threshold for weekly budget balance (in seconds)
 * If average daily deficit exceeds this threshold, a warning is displayed
 */
const PENALTY_THRESHOLD_SECONDS = 3600; // 1 hour

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

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

// Daily Stats Modal
const DailyStatsModal: React.FC<{ date: string; sessions: Session[]; onClose: () => void }> = ({ date, sessions, onClose }) => {
   const daySessions = getSessionsByDate(sessions, date);
   const totalDuration = getTotalDuration(daySessions);
   const totalReps = getTotalReps(daySessions);
   const ser = calculateSER(totalReps, totalDuration, MIN_DURATION_THRESHOLD_SECONDS);
   const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');

   // Handle keyboard navigation
   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
         onClose();
      }
   };

   return (
      <div 
         className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in" 
         onClick={onClose}
         onKeyDown={handleKeyDown}
      >
         <div className="w-full max-w-lg glass-strong border-zinc-800 shadow-glass-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
               <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
                  Daily Summary
               </h2>
               <button onClick={onClose} aria-label="Close modal" className="text-zinc-500 hover:text-white transition-colors interactive">
                  <X size={20} />
               </button>
            </div>

            <div className="p-6 space-y-6">
               <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Date</div>
                  <div className="text-lg text-white font-mono">{formattedDate}</div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Duration</div>
                     <div className="text-xl text-white font-mono font-bold">{formatTimeFull(totalDuration)}</div>
                  </div>
                  <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Reps</div>
                     <div className="text-xl text-ember-500 font-mono font-bold">{totalReps}</div>
                  </div>
                  <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">SER</div>
                     <div className="text-xl text-white font-mono font-bold">
                        {totalDuration > MIN_DURATION_THRESHOLD_SECONDS ? ser.toFixed(1) : 'N/A'}
                     </div>
                  </div>
               </div>

               {daySessions.length > 0 && (
                  <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-3">Sessions ({daySessions.length})</div>
                     <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                        {daySessions.map((session) => (
                           <div key={session.id} className="glass-subtle border-zinc-800 p-3 rounded elevated">
                              <div className="flex justify-between items-start mb-2">
                                 <div className="text-sm text-white font-mono">{(session.durationSeconds / 60).toFixed(0)}m</div>
                                 <div className="text-sm text-ember-500 font-mono font-bold">{session.reps} reps</div>
                              </div>
                              {session.notes && (
                                 <div className="text-xs text-zinc-500 font-mono mt-2 border-t border-zinc-800 pt-2">{session.notes}</div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {daySessions.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-sm font-mono">
                     No sessions logged on this day.
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

// MONTHLY CALENDAR GRID - Displays current month with proper weekday alignment and day numbers
const ConsistencyGrid: React.FC<{ sessions: Session[]; onDayClick: (date: string) => void }> = ({ sessions, onDayClick }) => {
   const calendarData = useMemo(() => {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      
      // Get all days in the current month
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Calculate padding for the start of the month (to align with week grid)
      // Convert JavaScript's Sunday=0 to Monday-first week: Sunday needs 6 padding days, other days need (dayIndex - 1) padding
      const firstDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
      const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0
      
      const result = [];
      
      // Add empty cells for padding (previous month days)
      for (let i = 0; i < startPadding; i++) {
         result.push({ date: '', intensity: 'bg-transparent', reps: 0, isEmpty: true });
      }
      
      // Add actual days of the month
      for (const day of daysInMonth) {
         const dateStr = day.toISOString().split('T')[0];
         const daySessions = getSessionsByDate(sessions, dateStr);
         const reps = getTotalReps(daySessions);
         
         let intensity = 'bg-zinc-900';
         if (reps > 0) intensity = 'bg-emerald-900/40';
         if (reps > 5) intensity = 'bg-emerald-700/60';
         if (reps > 15) intensity = 'bg-emerald-500';
         
         result.push({ 
            date: dateStr, 
            intensity, 
            reps, 
            dayOfMonth: day.getDate(),
            isEmpty: false 
         });
      }
      
      return { days: result, monthName: format(today, 'MMMM yyyy') };
   }, [sessions]);

   return (
      <div>
         <div className="text-[10px] text-zinc-600 font-mono mb-2 flex items-center justify-between">
            <span className="uppercase tracking-wider">{calendarData.monthName}</span>
            <div className="flex gap-3 text-[9px]">
               {WEEKDAY_HEADERS.map((day, idx) => <span key={idx}>{day}</span>)}
            </div>
         </div>
         <div className="grid grid-cols-7 gap-1 w-full">
            {calendarData.days.map((d, idx) => (
               <div 
                  key={`${d.date}-${idx}`}
                  title={d.isEmpty ? '' : `${d.date}: ${d.reps} reps`}
                  onClick={() => !d.isEmpty && onDayClick(d.date)}
                  onKeyDown={(e) => {
                     if (!d.isEmpty && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onDayClick(d.date);
                     }
                  }}
                  tabIndex={d.isEmpty ? undefined : 0}
                  role={d.isEmpty ? undefined : 'button'}
                  aria-label={d.isEmpty ? undefined : `View stats for ${d.date}`}
                  className={`aspect-square rounded-sm ${d.intensity} ${d.isEmpty ? '' : 'hover:border hover:border-ember-500/50 focus:outline-none focus:border-ember-500 focus:shadow-inner-glow transition-all cursor-pointer interactive'} relative group`}
               >
                  {!d.isEmpty && (
                     <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-500 group-hover:text-white font-mono transition-colors">
                        {d.dayOfMonth}
                     </span>
                  )}
               </div>
            ))}
         </div>
      </div>
   );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, settings, onStartSession, onRelapse }) => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // -- Metrics Calculation --
  const stats = useMemo(() => {
    const todayStr = getLocalDate();
    const todayDate = new Date();
    
    const yesterdayStr = getYesterdayDate();

    const todaySessions = getSessionsByDate(sessions, todayStr);
    const todayDuration = getTotalDuration(todaySessions);
    const todayReps = getTotalReps(todaySessions);
    const todayHours = todayDuration / 3600;

    const todayNetPosition = todaySessions.reduce((acc, s) => {
      const target = s.targetDurationSeconds ?? s.durationSeconds;
      return acc + (s.durationSeconds - target);
    }, 0);
    
    const todaySER = calculateSER(todayReps, todayDuration, MIN_DURATION_THRESHOLD_SECONDS);
    const isTodayNoise = todayDuration > 0 && todayDuration <= MIN_DURATION_THRESHOLD_SECONDS;

    const yesterdaySessions = getSessionsByDate(sessions, yesterdayStr);
    const yesterdayDuration = getTotalDuration(yesterdaySessions);
    const yesterdayReps = getTotalReps(yesterdaySessions);
    const yesterdayHours = yesterdayDuration / 3600;
    const yesterdaySER = calculateSER(yesterdayReps, yesterdayDuration, MIN_DURATION_THRESHOLD_SECONDS);

    const start = startOfWeek(todayDate, { weekStartsOn: 1 });
    const end = endOfWeek(todayDate, { weekStartsOn: 1 });
    const weeklySessions = sessions.filter(s => 
      isWithinInterval(parseISO(s.date), { start, end })
    );

    const weeklyReps = getTotalReps(weeklySessions);
    const weeklyBudgetBalance = getWeeklyBudgetBalance(sessions, start, end);
    
    const totalDuration = getTotalDuration(sessions);
    const totalReps = getTotalReps(sessions);
    const globalSER = calculateSER(totalReps, totalDuration, 3600);
    const daysSober = differenceInDays(todayDate, parseISO(settings.substanceFreeStartDate));
    const dailyGoalSeconds = (settings.dailyTimeGoalHours || 4) * 3600;
    const volumeProgress = Math.min((todayDuration / dailyGoalSeconds) * 100, 100);

    // Commitment pattern analysis
    const commitmentPattern = analyzeCommitmentPatterns(sessions);

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
      weeklyBudgetBalance,
      globalSER: globalSER.toFixed(1),
      daysSober: Math.max(0, daysSober),
      timeBudget: {
        goalSeconds: dailyGoalSeconds,
        volumeProgress: volumeProgress,
      },
      commitmentPattern,
    };
  }, [sessions, settings.substanceFreeStartDate, settings.dailyTimeGoalHours]);

  const getBalanceColor = (logged: number, goal: number) => {
    if (logged > goal) return 'text-emerald-500'; // Exceeded goal
    if (logged > 0) return 'text-white'; // Making progress
    return 'text-zinc-600'; // No progress yet
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
    const totalReps7Days = getTotalReps(last7DaysSessions);
    const avgReps7Days = totalReps7Days > 0 ? totalReps7Days / 7 : 0;

    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = dateToLocalString(d);
      const daySessions = getSessionsByDate(sessions, dateStr);
      const reps = getTotalReps(daySessions);
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] animate-fade-in">
      
      {/* HERO SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="relative group cursor-pointer" onClick={onStartSession}>
           <div className="absolute inset-0 bg-ember-500/10 rounded-full blur-3xl group-hover:bg-ember-500/20 transition-all duration-700 animate-pulse-slow"></div>
           <button className="btn-glass relative z-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full elevated hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center">
             <Play size={48} className="text-white mb-4 fill-white" />
             <span className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Enter The Arena</span>
           </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-6 glass rounded-2xl border-zinc-800 p-1 sm:p-2 sm:pr-6 elevated">
              <div className="flex items-center gap-4 px-6 py-3 border-b sm:border-b-0 sm:border-r border-zinc-800 w-full sm:w-auto justify-center">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1 mb-1">
                      <Scale size={10} /> Daily Progress
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-mono font-bold ${getBalanceColor(stats.today.durationSeconds, stats.timeBudget.goalSeconds)}`}>
                        {stats.today.durationSeconds > stats.timeBudget.goalSeconds ? '+' : ''}
                        {formatTimeFull(stats.today.durationSeconds)} 
                      </span>
                      <span className="text-zinc-600 text-sm font-mono">/ {formatTimeFull(settings.dailyTimeGoalHours * 3600)}</span>
                    </div>
                    <div className="w-40 h-1 glass-subtle mt-1 rounded-full overflow-hidden relative" title="Daily Volume Progress">
                       <div className="h-full bg-gradient-to-r from-ember-700 to-ember-500 transition-all duration-500 shadow-glow" style={{ width: `${Math.max(stats.timeBudget.volumeProgress, stats.today.durationSeconds > 0 ? 2 : 0)}%` }} />
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-6 px-4 py-3 sm:py-0 w-full sm:w-auto justify-between sm:justify-start">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-1">Signal Integrity</span>
                    <span className={`text-xl font-mono font-bold ${stats.daysSober > 0 ? 'text-ember-500 glow' : 'text-zinc-500'}`}>
                      {stats.daysSober} DAYS
                    </span>
                 </div>
                 <div className="w-px h-8 bg-zinc-800 mx-2 hidden sm:block"></div>
                 <button onClick={(e) => { e.stopPropagation(); onRelapse(); }} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-500 transition-colors uppercase tracking-wider font-bold px-2 py-1 hover:bg-red-950/10 rounded interactive">
                   <AlertOctagon size={14} /> Relapse
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* EXPANDABLE ANALYTICS */}
      <div className="w-full max-w-4xl mx-auto border-t border-zinc-900">
        <button onClick={() => setShowAnalytics(!showAnalytics)} className="w-full py-4 flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest text-xs font-mono interactive">
          {showAnalytics ? <><ChevronUp size={14} /> Hide Audit</> : <><ChevronDown size={14} /> Audit Performance</>}
        </button>

        {showAnalytics && (
          <div className="pb-20 space-y-6 animate-slide-up px-4">
            
            {/* HEATMAP LEDGER */}
            <div className="card-glass border-zinc-800">
               <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Grid size={12} /> Monthly Consistency Grid
               </div>
               <ConsistencyGrid sessions={sessions} onDayClick={setSelectedDate} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Card className="glass border-zinc-800"><DeltaIndicator label="Daily Alpha (Reps)" current={stats.today.reps} previous={stats.yesterday.reps} /></Card>
               <Card className="glass border-zinc-800">
                 <DeltaIndicator label="Sober Efficiency (SER)" current={stats.today.ser} previous={Number(stats.globalSER)} />
                 {stats.today.ser === "NOISE" && <div className="text-[10px] text-zinc-600 font-mono mt-2 flex items-center gap-1"><Activity size={10} /> Log &gt; 5 mins</div>}
               </Card>
            </div>

            {/* WEEKLY BUDGET BALANCE */}
            <Card className="glass border-zinc-800">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2">
                    <Scale size={12} /> Weekly Budget Balance
                  </div>
                  <div className="text-[9px] text-zinc-600 font-mono">
                    {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Total Balance</div>
                    <div className={`text-2xl font-mono font-bold ${
                      stats.weeklyBudgetBalance.totalBalance > 0 
                        ? 'text-ember-500' 
                        : stats.weeklyBudgetBalance.totalBalance < 0 
                          ? 'text-red-500' 
                          : 'text-zinc-600'
                    }`}>
                      {stats.weeklyBudgetBalance.totalBalance > 0 ? '+' : ''}
                      {formatTimeFull(Math.abs(stats.weeklyBudgetBalance.totalBalance))}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono mt-1">
                      {stats.weeklyBudgetBalance.totalBalance > 0 ? 'Surplus' : stats.weeklyBudgetBalance.totalBalance < 0 ? 'Deficit' : 'Neutral'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Avg Daily</div>
                    <div className={`text-2xl font-mono font-bold ${
                      stats.weeklyBudgetBalance.averageDailyBalance > 0 
                        ? 'text-emerald-500' 
                        : stats.weeklyBudgetBalance.averageDailyBalance < 0 
                          ? 'text-red-500' 
                          : 'text-zinc-600'
                    }`}>
                      {stats.weeklyBudgetBalance.averageDailyBalance > 0 ? '+' : ''}
                      {formatTimeFull(Math.abs(stats.weeklyBudgetBalance.averageDailyBalance))}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono mt-1">
                      Per Day
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Active Days</div>
                    <div className="text-2xl font-mono font-bold text-white">
                      {stats.weeklyBudgetBalance.daysWithSessions}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono mt-1">
                      This Week
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                  <div>
                    <div className="text-[10px] text-emerald-700 uppercase tracking-wider font-mono mb-1">Total Gains</div>
                    <div className="text-lg font-mono text-emerald-500">
                      +{formatTimeFull(stats.weeklyBudgetBalance.totalSurplus)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-red-700 uppercase tracking-wider font-mono mb-1">Total Defaults</div>
                    <div className="text-lg font-mono text-red-500">
                      {formatTimeFull(Math.abs(stats.weeklyBudgetBalance.totalDeficit))}
                    </div>
                  </div>
                </div>

                {/* Penalty Rule Indicator */}
                {stats.weeklyBudgetBalance.averageDailyBalance < -PENALTY_THRESHOLD_SECONDS && (
                  <div className="mt-2 p-3 bg-red-950/30 border border-red-900/50 rounded">
                    <div className="text-[10px] text-red-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                      <AlertOctagon size={10} /> Penalty Warning
                    </div>
                    <div className="text-xs text-red-300 font-mono">
                      Average daily deficit exceeds 1 hour. Consider adjusting commitment levels or increasing work duration.
                    </div>
                  </div>
                )}

                {/* Commitment Pattern Alert */}
                {stats.commitmentPattern.hasLowCommitmentPattern && (
                  <div className="mt-2 p-3 bg-amber-950/30 border border-amber-900/50 rounded">
                    <div className="text-[10px] text-amber-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                      <AlertOctagon size={10} /> Commitment Pattern Alert
                    </div>
                    <div className="text-xs text-amber-300 font-mono mb-1">
                      {Math.round(stats.commitmentPattern.minimumCommitmentRatio * 100)}% of your sessions use the minimum commitment (30m).
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-mono">
                      Current avg: {Math.round(stats.commitmentPattern.averageCommitment / 60)}m • Suggested: 60m+
                    </div>
                    <div className="text-[10px] text-amber-500/60 font-mono mt-1">
                      Higher pre-commitments build genuine alpha. Surplus is capped at 50% of commitment.
                    </div>
                  </div>
                )}
              </div>
            </Card>

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

      {/* Daily Stats Modal */}
      {selectedDate && (
        <DailyStatsModal 
          date={selectedDate} 
          sessions={sessions} 
          onClose={() => setSelectedDate(null)} 
        />
      )}
    </div>
  );
};
