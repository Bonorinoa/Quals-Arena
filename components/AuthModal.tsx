import React, { useState, useRef } from 'react';
import { User, LogIn, LogOut, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth, AuthErrorType } from '../services/AuthContext';
import { useFocusTrap } from '../utils/focusTrap';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { user, signIn, signOut, error, errorType } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus trap for accessibility
  useFocusTrap(modalRef, true);

  const handleSignIn = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      // Don't set local error - the AuthContext will handle it
      // Only set local error for popup-closed to not be too intrusive
      if (errorType === AuthErrorType.POPUP_CLOSED) {
        setLocalError(null);
      } else {
        setLocalError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await signOut();
      onClose();
    } catch (err: any) {
      console.error('Sign out failed:', err);
      setLocalError(err.message || 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || error;
  const showError = errorMessage && errorType !== AuthErrorType.POPUP_CLOSED;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center" aria-hidden="true">
            <User className="text-zinc-400" size={20} aria-hidden="true" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold text-white">
            {user ? 'Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close auth modal"
            className="ml-auto text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Error Message */}
        {showError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3" role="alert" aria-live="assertive">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <p className="text-sm text-red-400 flex-1">{errorMessage}</p>
          </div>
        )}

        {/* Signed In View */}
        {user ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                    <User className="text-zinc-400" size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                  Cloud Sync: Active
                </p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your data is encrypted and only accessible by you. Sessions and settings sync automatically across devices.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <LogOut size={16} />
                )}
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Sign In View */
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sign in to enable cloud backup and sync your sessions across devices.
              </p>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Automatic backup of all sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Access your data from any device</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Your data remains private and secure</span>
                </li>
              </ul>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-400">Optional:</strong> The app works fully offline. Sign in only if you want cloud features.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <LogIn size={18} />
                )}
                Sign in with Google
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-300 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all"
              >
                Continue without signing in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
