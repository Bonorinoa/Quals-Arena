import React, { useMemo, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Minus, FileText, Copy, Check, Share2 } from 'lucide-react';
import { Session, UserSettings, WeeklyReport } from '../types';
import { generateWeeklyReport, exportReportAsMarkdown } from '../utils/weeklyReportUtils';
import { formatTimeFull } from '../utils/timeUtils';
import { getGoalLabels } from '../utils/goalUtils';
import { format, subWeeks, startOfWeek } from 'date-fns';
import { ShareModal } from './ShareModal';

interface WeeklyReviewModalProps {
  sessions: Session[];
  settings: UserSettings;
  onClose: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({ 
  sessions, 
  settings, 
  onClose 
}) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const report = useMemo(() => 
    generateWeeklyReport(sessions, settings, weekOffset),
    [sessions, settings, weekOffset]
  );
  
  const goalLabels = useMemo(() => getGoalLabels(settings), [settings]);
  
  const handleExportMarkdown = () => {
    const markdown = exportReportAsMarkdown(report, settings);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-review-${report.weekStart}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleCopyToClipboard = async () => {
    const markdown = exportReportAsMarkdown(report, settings);
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getHighlightClass = (highlight?: string) => {
    switch (highlight) {
      case 'positive': return 'border-emerald-500/30 bg-emerald-950/20';
      case 'negative': return 'border-red-500/30 bg-red-950/20';
      default: return 'border-zinc-700 bg-zinc-900/30';
    }
  };
  
  const weekLabel = weekOffset === 0 
    ? 'This Week' 
    : weekOffset === -1 
      ? 'Last Week' 
      : format(startOfWeek(subWeeks(new Date(), Math.abs(weekOffset)), { weekStartsOn: 1 }), 'MMM d');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="text-emerald-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Weekly Review Report</h2>
              <p className="text-sm text-zinc-400">
                {report.weekStart} to {report.weekEnd}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Week Navigation */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="text-sm">Previous Week</span>
          </button>
          
          <div className="flex items-center gap-2 text-white font-mono">
            <Calendar size={16} className="text-emerald-500" />
            <span className="font-semibold">{weekLabel}</span>
          </div>
          
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">Next Week</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {report.totalSessions > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Sessions</div>
                  <div className="text-2xl font-bold text-white">{report.totalSessions}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Duration</div>
                  <div className="text-2xl font-bold text-white">{formatTimeFull(report.totalDuration)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{goalLabels.name}</div>
                  <div className="text-2xl font-bold text-white">{report.totalGoalsCompleted}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Active Days</div>
                  <div className="text-2xl font-bold text-white">{report.activeDaysCount}/7</div>
                </div>
              </div>

              {/* Week-over-Week Comparison */}
              {report.weekOverWeek && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Week-over-Week Comparison
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Duration</div>
                      <div className={`text-lg font-mono font-bold flex items-center gap-1 ${
                        report.weekOverWeek.durationChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {report.weekOverWeek.durationChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {report.weekOverWeek.durationChange >= 0 ? '+' : ''}{report.weekOverWeek.durationChange.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">{goalLabels.name}</div>
                      <div className={`text-lg font-mono font-bold flex items-center gap-1 ${
                        report.weekOverWeek.goalsChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {report.weekOverWeek.goalsChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {report.weekOverWeek.goalsChange >= 0 ? '+' : ''}{report.weekOverWeek.goalsChange.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Balance</div>
                      <div className={`text-lg font-mono font-bold flex items-center gap-1 ${
                        report.weekOverWeek.balanceChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {report.weekOverWeek.balanceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {report.weekOverWeek.balanceChange >= 0 ? '+' : ''}{formatTimeFull(Math.abs(report.weekOverWeek.balanceChange))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Report Sections */}
              <div className="space-y-4">
                {report.sections.map((section, idx) => (
                  <div 
                    key={idx}
                    className={`border rounded-lg p-4 ${getHighlightClass(section.highlight)}`}
                  >
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      {section.emoji && <span>{section.emoji}</span>}
                      {section.title}
                    </h3>
                    {Array.isArray(section.content) ? (
                      <ul className="space-y-1">
                        {section.content.map((line, i) => (
                          <li key={i} className="text-sm text-zinc-300">• {line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-zinc-300">{section.content}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Detailed Metrics */}
              {(report.metrics.focusQuality || report.metrics.deepWorkRatio || report.metrics.ser) && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {report.metrics.focusQuality !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Focus Quality</div>
                        <div className="text-xl font-bold text-white">{report.metrics.focusQuality}%</div>
                      </div>
                    )}
                    {report.metrics.deepWorkRatio !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Deep Work Ratio</div>
                        <div className="text-xl font-bold text-white">{report.metrics.deepWorkRatio}%</div>
                      </div>
                    )}
                    {report.metrics.consistency !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Consistency</div>
                        <div className="text-xl font-bold text-white">{report.metrics.consistency}%</div>
                      </div>
                    )}
                    {report.metrics.budgetAdherence !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Budget Adherence</div>
                        <div className="text-xl font-bold text-white">{report.metrics.budgetAdherence}%</div>
                      </div>
                    )}
                    {report.metrics.ser !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">SER</div>
                        <div className="text-xl font-bold text-white">{report.metrics.ser}</div>
                      </div>
                    )}
                    {report.insights.longestSession !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Longest Session</div>
                        <div className="text-xl font-bold text-white">{formatTimeFull(report.insights.longestSession)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-zinc-600 mb-4" size={48} />
              <p className="text-zinc-400">No sessions logged this week.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              title="Share to Instagram"
            >
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="text-sm">Copy Markdown</span>
                </>
              )}
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
            >
              <Download size={16} />
              <span className="text-sm">Export Markdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          type="weekly"
          report={report}
          settings={settings}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
