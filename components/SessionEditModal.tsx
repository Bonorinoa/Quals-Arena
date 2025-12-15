import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Session } from '../types';
import { format, parseISO } from 'date-fns';
import { useFocusTrap } from '../utils/focusTrap';

interface SessionEditModalProps {
  session: Session;
  onSave: (sessionId: string, updates: Partial<Session>) => void;
  onClose: () => void;
}

export const SessionEditModal: React.FC<SessionEditModalProps> = ({ session, onSave, onClose }) => {
  const [reps, setReps] = useState(session.reps);
  const [notes, setNotes] = useState(session.notes);
  const [durationMinutes, setDurationMinutes] = useState(Math.round(session.durationSeconds / 60));
  const [date, setDate] = useState(session.date);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus trap for accessibility
  useFocusTrap(modalRef, true);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (reps < 0) {
      setError('Reps cannot be negative');
      return;
    }

    if (durationMinutes <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    // Normalize dates to start of day for comparison
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      setError('Date cannot be in the future');
      return;
    }

    setIsSaving(true);

    const updates: Partial<Session> = {
      reps,
      notes,
      durationSeconds: durationMinutes * 60,
      date,
    };

    onSave(session.id, updates);
    setIsSaving(false);
    onClose();
  };

  const formatEditHistory = () => {
    if (!session.lastModified) return null;
    const editedDate = format(new Date(session.lastModified), 'MMM d, yyyy HH:mm');
    const editCount = session.editCount || 0;
    return (
      <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
        <AlertTriangle size={10} />
        Last edited: {editedDate} {editCount > 1 && `(${editCount} times)`}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-session-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md glass-strong border-zinc-800 shadow-glass-lg animate-scale-in rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 id="edit-session-title" className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
              Edit Session
            </h2>
            {formatEditHistory()}
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit session modal"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div 
              className="glass-subtle border-red-500/30 bg-red-500/10 p-3 rounded-lg text-red-400 text-sm font-mono"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="session-reps" className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Reps
            </label>
            <input
              id="session-reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
              min="0"
              max="50"
              aria-required="true"
              aria-invalid={reps < 0 ? 'true' : 'false'}
              aria-describedby="reps-description"
              className="w-full glass-subtle text-white p-3 rounded-lg border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-lg transition-all"
              autoFocus
            />
            <p id="reps-description" className="sr-only">Number of problems solved or concepts mastered, between 0 and 50</p>
          </div>

          <div>
            <label htmlFor="session-duration" className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Duration (minutes)
            </label>
            <input
              id="session-duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              aria-required="true"
              aria-invalid={durationMinutes <= 0 ? 'true' : 'false'}
              aria-describedby="duration-description"
              className="w-full glass-subtle text-white p-3 rounded-lg border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-lg transition-all"
            />
            <p id="duration-description" className="text-[10px] text-zinc-600 mt-1 font-mono">
              Current: {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
            </p>
          </div>

          <div>
            <label htmlFor="session-date" className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Date
            </label>
            <input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              aria-required="true"
              aria-describedby="date-description"
              className="w-full glass-subtle text-white p-3 rounded-lg border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm transition-all"
            />
            <p id="date-description" className="sr-only">Date of the session, cannot be in the future</p>
          </div>

          <div>
            <label htmlFor="session-notes" className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">
              Notes
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was the friction? What was the insight?"
              rows={4}
              aria-describedby="notes-description"
              className="w-full glass-subtle text-zinc-300 p-3 rounded-lg border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm resize-none transition-all"
            />
            <p id="notes-description" className="sr-only">Optional notes about the session</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Cancel editing session"
              className="flex-1 glass-subtle px-6 py-3 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg transition-all uppercase text-xs tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              aria-label={isSaving ? 'Saving changes' : 'Save changes to session'}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed px-6 py-3 text-white rounded-lg transition-all uppercase text-xs tracking-widest font-mono flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Save size={14} aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center font-mono">
            Changes sync to all devices • Press Esc to cancel
          </p>
        </form>
      </div>
    </div>
  );
};
