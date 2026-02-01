/**
 * Weekly Report Generation Utilities
 */

import { Session, UserSettings, WeeklyReport, WeeklyReportSection } from '../types';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, getDay } from 'date-fns';
import { getWeeklyBudgetBalance, getTotalDuration, getTotalReps, calculateSER } from './sessionUtils';
import { getGoalLabels, formatGoalCount } from './goalUtils';
import { calculateAllMetrics } from './customMetrics';
import { formatTimeFull } from './timeUtils';

/**
 * Generate a weekly report for the specified week
 */
export const generateWeeklyReport = (
  sessions: Session[],
  settings: UserSettings,
  weekOffset: number = 0 // 0 = current week, -1 = last week, etc.
): WeeklyReport => {
  const today = new Date();
  const targetDate = weekOffset === 0 ? today : subWeeks(today, Math.abs(weekOffset));
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday
  
  // Filter sessions for this week
  const weekSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });
  
  // Calculate base stats
  const totalDuration = getTotalDuration(weekSessions);
  const totalGoals = getTotalReps(weekSessions);
  const goalLabels = getGoalLabels(settings);
  
  // Get unique active days
  const uniqueDates = new Set(weekSessions.map(s => s.date));
  const activeDaysCount = uniqueDates.size;
  
  // Budget balance
  const budgetBalance = getWeeklyBudgetBalance(sessions, weekStart, weekEnd);
  
  // Calculate metrics
  const allMetrics = calculateAllMetrics(weekSessions, settings.activeDays || [1,2,3,4,5], 7);
  const metricMap = Object.fromEntries(allMetrics.map(m => [m.id, m.value]));
  
  // SER calculation
  const ser = totalDuration > 300 ? calculateSER(totalGoals, totalDuration) : 0;
  
  // Find best day
  const dayStats = new Map<number, { duration: number; goals: number }>();
  weekSessions.forEach(s => {
    const dayOfWeek = getDay(parseISO(s.date));
    const current = dayStats.get(dayOfWeek) || { duration: 0, goals: 0 };
    dayStats.set(dayOfWeek, {
      duration: current.duration + s.durationSeconds,
      goals: current.goals + s.reps
    });
  });
  
  let bestDay: string | undefined;
  let maxDuration = 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayStats.forEach((stats, day) => {
    if (stats.duration > maxDuration) {
      maxDuration = stats.duration;
      bestDay = dayNames[day];
    }
  });
  
  // Longest session
  const longestSession = weekSessions.length > 0 
    ? Math.max(...weekSessions.map(s => s.durationSeconds))
    : undefined;
  
  // Pause patterns (using new fields from PR #33)
  const sessionsWithPauses = weekSessions.filter(s => s.pauseCount && s.pauseCount > 0);
  const pausePatterns = sessionsWithPauses.length > 0 ? {
    avgPausesPerSession: sessionsWithPauses.reduce((sum, s) => sum + (s.pauseCount || 0), 0) / sessionsWithPauses.length,
    avgPauseTime: sessionsWithPauses.reduce((sum, s) => sum + (s.totalPauseTime || 0), 0) / sessionsWithPauses.length
  } : undefined;
  
  // Generate templated sections
  const sections = generateReportSections(
    weekSessions,
    settings,
    totalDuration,
    totalGoals,
    budgetBalance,
    metricMap,
    bestDay,
    longestSession,
    pausePatterns
  );
  
  // Week-over-week comparison
  const prevWeekStart = subWeeks(weekStart, 1);
  const prevWeekEnd = subWeeks(weekEnd, 1);
  const prevWeekSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate >= prevWeekStart && sessionDate <= prevWeekEnd;
  });
  
  const prevDuration = getTotalDuration(prevWeekSessions);
  const prevGoals = getTotalReps(prevWeekSessions);
  const prevBalance = getWeeklyBudgetBalance(sessions, prevWeekStart, prevWeekEnd);
  
  const weekOverWeek = prevWeekSessions.length > 0 ? {
    durationChange: prevDuration > 0 ? ((totalDuration - prevDuration) / prevDuration) * 100 : 0,
    goalsChange: prevGoals > 0 ? ((totalGoals - prevGoals) / prevGoals) * 100 : 0,
    balanceChange: budgetBalance.totalBalance - prevBalance.totalBalance
  } : undefined;
  
  return {
    id: `week-${format(weekStart, 'yyyy-MM-dd')}`,
    generatedAt: Date.now(),
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    totalSessions: weekSessions.length,
    totalDuration,
    totalGoalsCompleted: totalGoals,
    activeDaysCount,
    budgetBalance: {
      total: budgetBalance.totalBalance,
      dailyAverage: budgetBalance.averageDailyBalance,
      totalSurplus: budgetBalance.totalSurplus,
      totalDeficit: budgetBalance.totalDeficit
    },
    metrics: {
      focusQuality: metricMap['focusQuality'],
      deepWorkRatio: metricMap['deepWorkRatio'],
      consistency: metricMap['consistency'],
      avgSessionDuration: metricMap['avgDuration'],
      budgetAdherence: metricMap['budgetAdherence'],
      ser: ser > 0 ? parseFloat(ser.toFixed(1)) : undefined
    },
    insights: {
      bestDay,
      longestSession,
      pausePatterns
    },
    sections,
    weekOverWeek
  };
};

/**
 * Generate templated report sections with insights
 */
const generateReportSections = (
  sessions: Session[],
  settings: UserSettings,
  totalDuration: number,
  totalGoals: number,
  budgetBalance: ReturnType<typeof getWeeklyBudgetBalance>,
  metrics: Record<string, number | undefined>,
  bestDay?: string,
  longestSession?: number,
  pausePatterns?: { avgPausesPerSession: number; avgPauseTime: number }
): WeeklyReportSection[] => {
  const goalLabels = getGoalLabels(settings);
  const sections: WeeklyReportSection[] = [];
  
  // Executive Summary
  sections.push({
    title: 'Executive Summary',
    emoji: '📊',
    content: `You logged ${formatTimeFull(totalDuration)} across ${sessions.length} sessions, completing ${formatGoalCount(totalGoals, settings)}.`,
    highlight: sessions.length > 0 ? 'neutral' : 'negative'
  });
  
  // Budget Health
  if (budgetBalance.totalBalance > 0) {
    sections.push({
      title: 'Budget Health',
      emoji: '✅',
      content: `Surplus of ${formatTimeFull(budgetBalance.totalBalance)}. You exceeded your commitments this week.`,
      highlight: 'positive'
    });
  } else if (budgetBalance.totalBalance < 0) {
    sections.push({
      title: 'Budget Health',
      emoji: '⚠️',
      content: `Deficit of ${formatTimeFull(Math.abs(budgetBalance.totalBalance))}. Consider adjusting your commitment levels or scheduling more sessions.`,
      highlight: 'negative'
    });
  } else {
    sections.push({
      title: 'Budget Health',
      emoji: '⚖️',
      content: 'Budget balanced. You met your commitments exactly.',
      highlight: 'neutral'
    });
  }
  
  // Focus Quality
  if (metrics['focusQuality'] !== undefined) {
    const quality = metrics['focusQuality'];
    let qualityInsight = '';
    if (quality >= 90) qualityInsight = 'Exceptional focus! You consistently meet your commitments.';
    else if (quality >= 70) qualityInsight = 'Solid focus quality. Minor room for improvement.';
    else if (quality >= 50) qualityInsight = 'Moderate focus. Consider setting more realistic commitments.';
    else qualityInsight = 'Focus quality needs attention. Start with smaller, achievable commitments.';
    
    sections.push({
      title: 'Focus Quality',
      emoji: quality >= 70 ? '🎯' : '📉',
      content: `${quality}% commitment completion rate. ${qualityInsight}`,
      highlight: quality >= 70 ? 'positive' : quality >= 50 ? 'neutral' : 'negative'
    });
  }
  
  // Best Performance
  if (bestDay) {
    sections.push({
      title: 'Peak Performance',
      emoji: '🏆',
      content: `${bestDay} was your most productive day this week.`,
      highlight: 'positive'
    });
  }
  
  // Deep Work
  if (metrics['deepWorkRatio'] !== undefined) {
    const ratio = metrics['deepWorkRatio'];
    sections.push({
      title: 'Deep Work',
      emoji: ratio >= 50 ? '🧠' : '💡',
      content: `${ratio}% of sessions were 60+ minutes. ${ratio >= 50 ? 'Strong deep work practice!' : 'Try scheduling longer, uninterrupted sessions.'}`,
      highlight: ratio >= 50 ? 'positive' : 'neutral'
    });
  }
  
  // Pause Patterns (NEW from PR #33)
  if (pausePatterns && pausePatterns.avgPausesPerSession > 0) {
    const avgPauseMins = Math.round(pausePatterns.avgPauseTime / 60);
    sections.push({
      title: 'Session Flow',
      emoji: '⏸️',
      content: `Average ${pausePatterns.avgPausesPerSession.toFixed(1)} pauses per session (${avgPauseMins}m total pause time). ${pausePatterns.avgPausesPerSession > 3 ? 'Consider reducing interruptions.' : 'Good flow management!'}`,
      highlight: pausePatterns.avgPausesPerSession <= 3 ? 'positive' : 'neutral'
    });
  }
  
  // Weekly Contract Progress
  const weeklyProgress = (totalGoals / settings.weeklyRepTarget) * 100;
  sections.push({
    title: 'Weekly Contract',
    emoji: weeklyProgress >= 100 ? '🎉' : '📈',
    content: `${totalGoals} / ${settings.weeklyRepTarget} ${goalLabels.plural} (${Math.round(weeklyProgress)}%)`,
    highlight: weeklyProgress >= 100 ? 'positive' : weeklyProgress >= 70 ? 'neutral' : 'negative'
  });
  
  return sections;
};

/**
 * Export report as markdown text
 */
export const exportReportAsMarkdown = (report: WeeklyReport, settings: UserSettings): string => {
  const goalLabels = getGoalLabels(settings);
  
  let md = `# Weekly Review Report\n\n`;
  md += `**Week:** ${report.weekStart} to ${report.weekEnd}\n`;
  md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;
  md += `---\n\n`;
  
  // Sections
  report.sections.forEach(section => {
    md += `## ${section.emoji || ''} ${section.title}\n\n`;
    if (Array.isArray(section.content)) {
      section.content.forEach(line => md += `- ${line}\n`);
    } else {
      md += `${section.content}\n`;
    }
    md += `\n`;
  });
  
  // Stats Table
  md += `## 📊 Statistics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Sessions | ${report.totalSessions} |\n`;
  md += `| Total Duration | ${formatTimeFull(report.totalDuration)} |\n`;
  md += `| ${goalLabels.name} | ${report.totalGoalsCompleted} |\n`;
  md += `| Active Days | ${report.activeDaysCount} |\n`;
  md += `| Budget Balance | ${report.budgetBalance.total >= 0 ? '+' : ''}${formatTimeFull(Math.abs(report.budgetBalance.total))} |\n`;
  
  if (report.metrics.focusQuality) md += `| Focus Quality | ${report.metrics.focusQuality}% |\n`;
  if (report.metrics.deepWorkRatio) md += `| Deep Work Ratio | ${report.metrics.deepWorkRatio}% |\n`;
  if (report.metrics.consistency) md += `| Consistency | ${report.metrics.consistency}% |\n`;
  if (report.metrics.ser) md += `| SER | ${report.metrics.ser} |\n`;
  
  md += `\n`;
  
  // Week-over-Week
  if (report.weekOverWeek) {
    md += `## 📈 Week-over-Week\n\n`;
    const durChange = report.weekOverWeek.durationChange;
    const goalsChange = report.weekOverWeek.goalsChange;
    md += `- Duration: ${durChange >= 0 ? '+' : ''}${durChange.toFixed(0)}%\n`;
    md += `- ${goalLabels.name}: ${goalsChange >= 0 ? '+' : ''}${goalsChange.toFixed(0)}%\n`;
    md += `\n`;
  }
  
  return md;
};
