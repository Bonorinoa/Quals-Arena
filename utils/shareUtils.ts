import { Session, UserSettings, WeeklyReport, ShareCardStyle } from '../types';
import { getGoalLabels } from './goalUtils';
import { formatTimeFull } from './timeUtils';

// Instagram Stories dimensions
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// Color palettes for card themes
const cardThemes = {
  founder: {
    bg: '#05050a',
    bgGradient: ['#05050a', '#0a1628'],
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.3)',
    text: '#e4e4e7',
    textMuted: '#71717a',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  calm: {
    bg: '#0a0a18',
    bgGradient: ['#0a0a18', '#141428'],
    accent: '#6366f1',
    accentGlow: 'rgba(99, 102, 241, 0.3)',
    text: '#e4e4e7',
    textMuted: '#71717a',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  dark: {
    bg: '#09090b',
    bgGradient: ['#09090b', '#18181b'],
    accent: '#ffffff',
    accentGlow: 'rgba(255, 255, 255, 0.2)',
    text: '#fafafa',
    textMuted: '#71717a',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    bg: '#fafafa',
    bgGradient: ['#fafafa', '#e4e4e7'],
    accent: '#18181b',
    accentGlow: 'rgba(0, 0, 0, 0.1)',
    text: '#09090b',
    textMuted: '#52525b',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Generate a shareable image canvas for a session
 */
export const generateSessionShareCard = async (
  session: Session,
  settings: UserSettings,
  style: ShareCardStyle = { theme: 'founder', showBranding: true, showWatermark: true }
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  
  const theme = cardThemes[style.theme];
  const goalLabels = getGoalLabels(settings);
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, theme.bgGradient[0]);
  gradient.addColorStop(1, theme.bgGradient[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  
  // Glow effect at top
  const glowGradient = ctx.createRadialGradient(
    CARD_WIDTH / 2, 200, 0,
    CARD_WIDTH / 2, 200, 400
  );
  glowGradient.addColorStop(0, theme.accentGlow);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, CARD_WIDTH, 600);
  
  // Header - "SESSION COMPLETE"
  ctx.fillStyle = theme.textMuted;
  ctx.font = '600 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SESSION COMPLETE', CARD_WIDTH / 2, 300);
  
  // Date
  ctx.fillStyle = theme.textMuted;
  ctx.font = '400 28px Inter, system-ui, sans-serif';
  ctx.fillText(session.date, CARD_WIDTH / 2, 350);
  
  // Main stat - Duration
  ctx.fillStyle = theme.text;
  ctx.font = '700 180px Inter, system-ui, sans-serif';
  const durationStr = formatTimeFull(session.durationSeconds);
  ctx.fillText(durationStr, CARD_WIDTH / 2, 600);
  
  // Duration label
  ctx.fillStyle = theme.textMuted;
  ctx.font = '500 36px Inter, system-ui, sans-serif';
  ctx.fillText('FOCUS TIME', CARD_WIDTH / 2, 680);
  
  // Divider line
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 780);
  ctx.lineTo(CARD_WIDTH - 200, 780);
  ctx.stroke();
  
  // Stats grid
  const statsY = 920;
  const statsSpacing = 300;
  
  // Goals completed
  ctx.fillStyle = theme.accent;
  ctx.font = '700 96px Inter, system-ui, sans-serif';
  ctx.fillText(session.reps.toString(), CARD_WIDTH / 2 - statsSpacing, statsY);
  ctx.fillStyle = theme.textMuted;
  ctx.font = '500 28px Inter, system-ui, sans-serif';
  ctx.fillText(goalLabels.name.toUpperCase(), CARD_WIDTH / 2 - statsSpacing, statsY + 60);
  
  // Pauses (if any)
  if (session.pauseCount !== undefined && session.pauseCount > 0) {
    ctx.fillStyle = theme.text;
    ctx.font = '700 96px Inter, system-ui, sans-serif';
    ctx.fillText(session.pauseCount.toString(), CARD_WIDTH / 2 + statsSpacing, statsY);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '500 28px Inter, system-ui, sans-serif';
    ctx.fillText('PAUSES', CARD_WIDTH / 2 + statsSpacing, statsY + 60);
  } else {
    // Show "UNBROKEN" badge instead
    ctx.fillStyle = theme.accent;
    ctx.font = '700 48px Inter, system-ui, sans-serif';
    ctx.fillText('UNBROKEN', CARD_WIDTH / 2 + statsSpacing, statsY);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '500 28px Inter, system-ui, sans-serif';
    ctx.fillText('NO PAUSES', CARD_WIDTH / 2 + statsSpacing, statsY + 60);
  }
  
  // Note (if exists, truncated)
  if (session.notes && session.notes.length > 0) {
    const noteY = 1150;
    ctx.fillStyle = theme.border;
    ctx.fillRect(100, noteY - 60, CARD_WIDTH - 200, 200);
    
    ctx.fillStyle = theme.textMuted;
    ctx.font = '400 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    
    // Word wrap the note
    const maxWidth = CARD_WIDTH - 240;
    const words = session.notes.split(' ');
    let line = '';
    let y = noteY;
    const lineHeight = 40;
    let lineCount = 0;
    const maxLines = 3;
    let isFirstLine = true;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        const prefix = isFirstLine ? '"' : '';
        ctx.fillText(prefix + line.trim(), 140, y);
        isFirstLine = false;
        line = word + ' ';
        y += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText('...', 140, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line.trim()) {
      const prefix = isFirstLine ? '"' : '';
      ctx.fillText(prefix + line.trim() + '"', 140, y);
    }
    ctx.textAlign = 'center';
  }
  
  // Branding
  if (style.showBranding) {
    ctx.fillStyle = theme.text;
    ctx.font = '700 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('highBeta', CARD_WIDTH / 2, CARD_HEIGHT - 200);
    
    ctx.fillStyle = theme.textMuted;
    ctx.font = '400 24px Inter, system-ui, sans-serif';
    ctx.fillText('Build Assets. Not Hours.', CARD_WIDTH / 2, CARD_HEIGHT - 150);
  }
  
  // Watermark
  if (style.showWatermark) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '300 20px Inter, system-ui, sans-serif';
    ctx.fillText('quals-arena.vercel.app', CARD_WIDTH / 2, CARD_HEIGHT - 80);
  }
  
  return canvas;
};

/**
 * Generate a shareable image canvas for weekly review
 */
export const generateWeeklyShareCard = async (
  report: WeeklyReport,
  settings: UserSettings,
  style: ShareCardStyle = { theme: 'founder', showBranding: true, showWatermark: true }
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  
  const theme = cardThemes[style.theme];
  const goalLabels = getGoalLabels(settings);
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, theme.bgGradient[0]);
  gradient.addColorStop(1, theme.bgGradient[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  
  // Glow effect
  const glowGradient = ctx.createRadialGradient(
    CARD_WIDTH / 2, 300, 0,
    CARD_WIDTH / 2, 300, 500
  );
  glowGradient.addColorStop(0, theme.accentGlow);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, CARD_WIDTH, 700);
  
  // Header
  ctx.fillStyle = theme.textMuted;
  ctx.font = '600 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WEEKLY REVIEW', CARD_WIDTH / 2, 250);
  
  // Week range
  ctx.fillStyle = theme.text;
  ctx.font = '500 36px Inter, system-ui, sans-serif';
  ctx.fillText(`${report.weekStart} — ${report.weekEnd}`, CARD_WIDTH / 2, 310);
  
  // Main stat - Total time
  ctx.fillStyle = theme.text;
  ctx.font = '700 140px Inter, system-ui, sans-serif';
  ctx.fillText(formatTimeFull(report.totalDuration), CARD_WIDTH / 2, 520);
  
  ctx.fillStyle = theme.textMuted;
  ctx.font = '500 32px Inter, system-ui, sans-serif';
  ctx.fillText('TOTAL FOCUS TIME', CARD_WIDTH / 2, 590);
  
  // Stats grid - 2x2
  const gridStartY = 720;
  const gridSpacingX = 270;
  const gridSpacingY = 220;
  
  // Sessions
  drawStatBox(ctx, CARD_WIDTH / 2 - gridSpacingX, gridStartY, 
    report.totalSessions.toString(), 'SESSIONS', theme);
  
  // Goals
  drawStatBox(ctx, CARD_WIDTH / 2 + gridSpacingX, gridStartY,
    report.totalGoalsCompleted.toString(), goalLabels.name.toUpperCase(), theme, theme.accent);
  
  // Active Days
  drawStatBox(ctx, CARD_WIDTH / 2 - gridSpacingX, gridStartY + gridSpacingY,
    report.activeDaysCount.toString(), 'ACTIVE DAYS', theme);
  
  // Budget Balance
  const balanceStr = report.budgetBalance.total >= 0 
    ? `+${formatTimeFull(report.budgetBalance.total)}`
    : `-${formatTimeFull(Math.abs(report.budgetBalance.total))}`;
  const balanceColor = report.budgetBalance.total >= 0 ? '#10b981' : '#ef4444';
  drawStatBox(ctx, CARD_WIDTH / 2 + gridSpacingX, gridStartY + gridSpacingY,
    balanceStr, 'BALANCE', theme, balanceColor);
  
  // Focus Quality bar (if available)
  if (report.metrics.focusQuality !== undefined) {
    const barY = 1250;
    const barWidth = 600;
    const barHeight = 20;
    const barX = (CARD_WIDTH - barWidth) / 2;
    
    // Background
    ctx.fillStyle = theme.border;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 10);
    ctx.fill();
    
    // Progress
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * (report.metrics.focusQuality / 100), barHeight, 10);
    ctx.fill();
    
    ctx.fillStyle = theme.text;
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.fillText(`${report.metrics.focusQuality}% FOCUS QUALITY`, CARD_WIDTH / 2, barY + 70);
  }
  
  // Week-over-week (if available)
  if (report.weekOverWeek) {
    const wowY = 1420;
    ctx.fillStyle = theme.textMuted;
    ctx.font = '400 24px Inter, system-ui, sans-serif';
    ctx.fillText('vs last week', CARD_WIDTH / 2, wowY);
    
    const durationChange = report.weekOverWeek.durationChange;
    const changeColor = durationChange >= 0 ? '#10b981' : '#ef4444';
    const changeSign = durationChange >= 0 ? '↑' : '↓';
    
    ctx.fillStyle = changeColor;
    ctx.font = '700 36px Inter, system-ui, sans-serif';
    ctx.fillText(`${changeSign} ${Math.abs(durationChange).toFixed(0)}%`, CARD_WIDTH / 2, wowY + 50);
  }
  
  // Branding
  if (style.showBranding) {
    ctx.fillStyle = theme.text;
    ctx.font = '700 48px Inter, system-ui, sans-serif';
    ctx.fillText('highBeta', CARD_WIDTH / 2, CARD_HEIGHT - 200);
    
    ctx.fillStyle = theme.textMuted;
    ctx.font = '400 24px Inter, system-ui, sans-serif';
    ctx.fillText('Build Assets. Not Hours.', CARD_WIDTH / 2, CARD_HEIGHT - 150);
  }
  
  if (style.showWatermark) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '300 20px Inter, system-ui, sans-serif';
    ctx.fillText('quals-arena.vercel.app', CARD_WIDTH / 2, CARD_HEIGHT - 80);
  }
  
  return canvas;
};

/**
 * Helper to draw a stat box
 */
const drawStatBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  label: string,
  theme: typeof cardThemes.founder,
  valueColor?: string
) => {
  ctx.textAlign = 'center';
  ctx.fillStyle = valueColor || theme.text;
  ctx.font = '700 64px Inter, system-ui, sans-serif';
  ctx.fillText(value, x, y);
  
  ctx.fillStyle = theme.textMuted;
  ctx.font = '500 24px Inter, system-ui, sans-serif';
  ctx.fillText(label, x, y + 45);
};

/**
 * Download canvas as PNG
 */
export const downloadCanvasAsPNG = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};

/**
 * Share via Web Share API (if available) or download
 */
export const shareOrDownload = async (
  canvas: HTMLCanvasElement,
  filename: string,
  title: string
): Promise<'shared' | 'downloaded'> => {
  // Convert canvas to blob
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
    } catch (error) {
      reject(error);
    }
  });
  
  if (!blob) {
    // Fallback to download if blob creation failed
    downloadCanvasAsPNG(canvas, filename);
    return 'downloaded';
  }
  
  // Try Web Share API first
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    const shareData = { files: [file], title };
    
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return 'shared';
      } catch (e) {
        // User cancelled or share failed, fall through to download
      }
    }
  }
  
  // Fallback to download
  downloadCanvasAsPNG(canvas, filename);
  return 'downloaded';
};
