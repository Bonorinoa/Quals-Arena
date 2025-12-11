import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed, don't show prompt
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) {
        return; // Don't show again for 30 days
      }
    }

    // Check visit count - show after 3rd visit
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0');
    localStorage.setItem('pwa-visit-count', String(visitCount + 1));

    if (visitCount < 2) {
      return; // Wait until 3rd visit
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after a short delay to not interrupt the user
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 max-w-sm animate-slide-up">
      <div className="glass-strong border-emerald-500/30 shadow-glass-lg rounded-xl p-6 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 glass-subtle border-emerald-500/30 rounded-xl bg-emerald-500/10">
            <Smartphone size={24} className="text-emerald-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider">
              Install highBeta
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono">
              Install this app for a better experience. Works offline and feels like a native app.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-white rounded-lg transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 glass-subtle border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-lg transition-all"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
