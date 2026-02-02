import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, Check, Palette } from 'lucide-react';
import { Session, UserSettings, WeeklyReport } from '../types';
import { 
  generateSessionShareCard, 
  generateWeeklyShareCard, 
  shareOrDownload 
} from '../utils/shareUtils';

type ShareType = 'session' | 'weekly';
type CardTheme = 'founder' | 'calm' | 'dark' | 'light';

interface ShareModalProps {
  type: ShareType;
  session?: Session;
  report?: WeeklyReport;
  settings: UserSettings;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  type,
  session,
  report,
  settings,
  onClose
}) => {
  const [cardTheme, setCardTheme] = useState<CardTheme>('founder');
  const [showBranding, setShowBranding] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'downloaded'>('idle');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Generate preview when options change
  useEffect(() => {
    const generatePreview = async () => {
      try {
        setIsGenerating(true);
        setError(null);
        
        const style = { 
          theme: cardTheme, 
          showBranding, 
          showWatermark: true 
        };
        
        let canvas: HTMLCanvasElement;
        
        if (type === 'session' && session) {
          canvas = await generateSessionShareCard(session, settings, style);
        } else if (type === 'weekly' && report) {
          canvas = await generateWeeklyShareCard(report, settings, style);
        } else {
          setIsGenerating(false);
          return;
        }
        
        canvasRef.current = canvas;
        setPreviewUrl(canvas.toDataURL('image/png'));
        setIsGenerating(false);
      } catch (err) {
        setError('Failed to generate preview. Please try again.');
        console.error('Share card generation error:', err);
        setIsGenerating(false);
      }
    };
    
    generatePreview();
  }, [type, session, report, settings, cardTheme, showBranding]);
  
  const handleShare = async () => {
    if (!canvasRef.current) return;
    
    try {
      setError(null);
      const filename = type === 'session' 
        ? `highbeta-session-${session?.date}.png`
        : `highbeta-weekly-${report?.weekStart}.png`;
      const title = type === 'session' 
        ? 'My Focus Session'
        : 'My Weekly Review';
      
      const result = await shareOrDownload(canvasRef.current, filename, title);
      setShareStatus(result === 'shared' ? 'success' : 'downloaded');
      
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch (err) {
      setError('Failed to share/download image. Please try again.');
      console.error('Share error:', err);
    }
  };
  
  const themeOptions: { value: CardTheme; label: string; preview: string }[] = [
    { value: 'founder', label: 'Founder', preview: '#10b981' },
    { value: 'calm', label: 'Calm', preview: '#6366f1' },
    { value: 'dark', label: 'Dark', preview: '#18181b' },
    { value: 'light', label: 'Light', preview: '#fafafa' },
  ];
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="text-emerald-500" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">
                Share to Instagram
              </h2>
              <p className="text-xs text-zinc-500">
                {type === 'session' ? 'Share your focus session' : 'Share your weekly stats'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 glass-subtle border-zinc-700 hover:border-white/20 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Preview */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          
          <div className="aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 mb-6">
            {isGenerating ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-zinc-500">Generating...</div>
              </div>
            ) : previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Share card preview" 
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>
          
          {/* Theme Selector */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              <Palette size={14} />
              Card Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setCardTheme(theme.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    cardTheme === theme.value
                      ? 'border-white/30 bg-white/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mx-auto mb-2 border border-white/20"
                    style={{ backgroundColor: theme.preview }}
                  />
                  <div className="text-xs text-zinc-400 text-center">{theme.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-sm text-zinc-300">Show branding</span>
              <button
                onClick={() => setShowBranding(!showBranding)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  showBranding ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                  showBranding ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </label>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={handleShare}
            disabled={isGenerating || !previewUrl}
            className={`w-full py-4 rounded-xl font-mono uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
              shareStatus === 'success' 
                ? 'bg-emerald-500 text-white'
                : shareStatus === 'downloaded'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-black hover:bg-zinc-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {shareStatus === 'success' ? (
              <>
                <Check size={20} />
                Shared!
              </>
            ) : shareStatus === 'downloaded' ? (
              <>
                <Download size={20} />
                Downloaded!
              </>
            ) : (
              <>
                <Share2 size={20} />
                Share / Download
              </>
            )}
          </button>
          <p className="text-xs text-zinc-600 text-center mt-3">
            On mobile, this will open the share menu. On desktop, it will download the image.
          </p>
        </div>
      </div>
    </div>
  );
};
