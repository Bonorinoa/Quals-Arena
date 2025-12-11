import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Session } from '../types';
import { format } from 'date-fns';

interface SessionDeleteDialogProps {
  session: Session;
  onConfirm: (sessionId: string) => void;
  onClose: () => void;
}

export const SessionDeleteDialog: React.FC<SessionDeleteDialogProps> = ({ session, onConfirm, onClose }) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm(session.id);
    onClose();
  };

  const formatSessionDetails = () => {
    const durationMinutes = Math.round(session.durationSeconds / 60);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return {
      date: format(new Date(session.timestamp), 'MMM d, yyyy HH:mm'),
      duration: timeStr,
      reps: session.reps,
    };
  };

  const details = formatSessionDetails();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong border-red-500/30 shadow-glass-lg animate-scale-in rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-red-500/30 bg-red-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2 glass-subtle border-red-500/30 rounded-lg">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-400 font-mono">
              Delete Session
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-zinc-300 text-sm font-mono">
              Are you sure you want to delete this session?
            </p>
            
            <div className="glass-subtle border-red-500/20 p-4 rounded-lg space-y-2 bg-red-950/5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Date</span>
                <span className="text-sm text-zinc-300 font-mono">{details.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Duration</span>
                <span className="text-sm text-zinc-300 font-mono">{details.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Reps</span>
                <span className="text-sm text-emerald-400 font-mono font-bold">{details.reps}</span>
              </div>
              {session.notes && (
                <div className="pt-2 border-t border-red-500/20">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-1">Notes</div>
                  <div className="text-xs text-zinc-400 font-mono line-clamp-2">{session.notes}</div>
                </div>
              )}
            </div>

            <div className="glass-subtle border-amber-500/30 bg-amber-950/10 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-400 font-mono">
                  <p className="font-bold mb-1">This action cannot be undone</p>
                  <p className="text-amber-500/80">
                    The session will be permanently removed from your dashboard and cloud storage.
                    Consider editing instead if you need to fix errors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-subtle px-6 py-3 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg transition-all uppercase text-xs tracking-widest font-mono"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 px-6 py-3 text-white rounded-lg transition-all uppercase text-xs tracking-widest font-mono flex items-center justify-center gap-2 shadow-lg"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center font-mono">
            Press Esc to cancel
          </p>
        </div>
      </div>
    </div>
  );
};
