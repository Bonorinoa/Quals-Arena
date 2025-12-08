
import React from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { NetPositionMetrics, PenaltyCalculation } from '../types';

interface NetPositionCardProps {
  metrics: NetPositionMetrics;
  penalty: PenaltyCalculation;
}

export const NetPositionCard: React.FC<NetPositionCardProps> = ({ metrics, penalty }) => {
  const formatTime = (secs: number) => {
    const absSecs = Math.abs(secs);
    const h = Math.floor(absSecs / 3600);
    const m = Math.floor((absSecs % 3600) / 60);
    
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getNetPositionColor = (secs: number) => {
    if (secs < 0) return 'text-red-500';
    if (secs > 0) return 'text-emerald-500';
    return 'text-zinc-500';
  };

  const getNetPositionBgColor = (secs: number) => {
    if (secs < 0) return 'bg-red-950/20 border-red-900/30';
    if (secs > 0) return 'bg-emerald-950/20 border-emerald-900/30';
    return 'bg-zinc-900/30 border-zinc-800';
  };

  const getNetPositionIcon = (secs: number) => {
    if (secs < 0) return <TrendingDown size={12} className="text-red-500" />;
    if (secs > 0) return <TrendingUp size={12} className="text-emerald-500" />;
    return <Scale size={12} className="text-zinc-500" />;
  };

  const todaySign = metrics.todayNetPositionSeconds > 0 ? '+' : 
                    metrics.todayNetPositionSeconds < 0 ? '-' : '';
  const weeklySign = metrics.weeklyNetPositionSeconds > 0 ? '+' : 
                     metrics.weeklyNetPositionSeconds < 0 ? '-' : '';

  return (
    <div className={`flex flex-col items-center px-6 py-3 border-b sm:border-b-0 sm:border-r border-zinc-800 w-full sm:w-auto justify-center ${getNetPositionBgColor(metrics.todayNetPositionSeconds)} transition-colors duration-300`}>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1 mb-1">
          <Scale size={10} /> Net Position
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-mono font-bold flex items-center gap-1 ${getNetPositionColor(metrics.todayNetPositionSeconds)}`}>
            {getNetPositionIcon(metrics.todayNetPositionSeconds)}
            {todaySign}{formatTime(metrics.todayNetPositionSeconds)}
          </span>
          <span className="text-zinc-600 text-xs font-mono">today</span>
        </div>
        
        {/* Weekly Summary */}
        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
          <span className="text-zinc-600">Week:</span>
          <span className={getNetPositionColor(metrics.weeklyNetPositionSeconds)}>
            {weeklySign}{formatTime(metrics.weeklyNetPositionSeconds)}
          </span>
        </div>

        {/* Penalty Info (only show if there's a deficit) */}
        {metrics.totalOwedSeconds > 0 && (
          <div className="mt-2 px-2 py-1 bg-red-950/30 border border-red-900/50 rounded text-[9px] text-red-400 font-mono flex items-center gap-1">
            <AlertCircle size={10} />
            <span>Owed: {penalty.totalMinutesOwed}m → ${penalty.penaltyAmount}</span>
          </div>
        )}

        {/* Saturday Unlock Status (only show on Saturday) */}
        {new Date().getDay() === 6 && (
          <div className={`mt-2 px-2 py-1 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
            metrics.isSaturdayUnlocked 
              ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400' 
              : 'bg-red-950/30 border border-red-900/50 text-red-400'
          }`}>
            {metrics.isSaturdayUnlocked ? (
              <>
                <CheckCircle size={10} />
                <span>FOUNDER MODE ACTIVE</span>
              </>
            ) : (
              <>
                <AlertCircle size={10} />
                <span>CHAOS MODE LOCKED</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
