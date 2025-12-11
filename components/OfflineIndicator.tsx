import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      
      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not just came back online
  if (isOnline && !justCameOnline) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`glass-strong border shadow-glass-lg rounded-xl px-4 py-3 backdrop-blur-xl flex items-center gap-3 ${
        isOnline 
          ? 'border-emerald-500/30 bg-emerald-500/10' 
          : 'border-orange-500/30 bg-orange-500/10'
      }`}>
        {isOnline ? (
          <>
            <Wifi size={16} className="text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                Back Online
              </p>
              <p className="text-[10px] text-emerald-500/70 font-mono">
                Syncing data...
              </p>
            </div>
          </>
        ) : (
          <>
            <WifiOff size={16} className="text-orange-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-orange-400 font-mono uppercase tracking-wider">
                Offline Mode
              </p>
              <p className="text-[10px] text-orange-500/70 font-mono">
                Changes will sync when back online
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
