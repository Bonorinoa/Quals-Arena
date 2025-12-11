import { useEffect, useState } from 'react';
import { ViewMode } from '../types';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
}

export interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  onEnterArena?: () => void;
  onShowDashboard?: () => void;
  onShowSettings?: () => void;
  onCloseModal?: () => void;
  currentView?: ViewMode;
  isModalOpen?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const {
    onShowHelp,
    onEnterArena,
    onShowDashboard,
    onShowSettings,
    onCloseModal,
    isModalOpen = false,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
      ) {
        // Exception: Escape key should still work
        if (e.key !== 'Escape') return;
      }

      // Escape key - Close modals
      if (e.key === 'Escape' && isModalOpen && onCloseModal) {
        e.preventDefault();
        onCloseModal();
        return;
      }

      // Don't trigger navigation shortcuts in modals
      if (isModalOpen) return;

      // Ignore shortcuts with modifiers (except Shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Show help
      if (key === '?' && e.shiftKey && onShowHelp) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      // Navigation shortcuts (no modifiers needed)
      switch (key) {
        case 'e':
          if (onEnterArena) {
            e.preventDefault();
            onEnterArena();
          }
          break;
        case 'd':
          if (onShowDashboard) {
            e.preventDefault();
            onShowDashboard();
          }
          break;
        case 's':
          if (onShowSettings) {
            e.preventDefault();
            onShowSettings();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onShowHelp,
    onEnterArena,
    onShowDashboard,
    onShowSettings,
    onCloseModal,
    isModalOpen,
  ]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: '?', description: 'Show keyboard shortcuts', context: 'Global' },
  { key: 'E', description: 'Enter Arena (start session)', context: 'Global' },
  { key: 'D', description: 'View Dashboard', context: 'Global' },
  { key: 'S', description: 'Open Settings', context: 'Global' },
  { key: 'N', description: 'Add mental note', context: 'During Session' },
  { key: 'Esc', description: 'Close modal/dialog', context: 'Global' },
];

export const KeyboardShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong border-zinc-800 shadow-glass-lg animate-scale-in rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 font-mono">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close shortcuts help"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-white font-mono">{shortcut.description}</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono">
                    {shortcut.context}
                  </span>
                </div>
                <kbd className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-zinc-300">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono">
              Press <kbd className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
