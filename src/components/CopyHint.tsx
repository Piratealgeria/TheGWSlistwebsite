import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, X } from 'lucide-react';

export const CopyHint = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const handlePlayerState = (e: Event) => {
      const detail = (e as CustomEvent<{ isOpen: boolean }>).detail;
      if (detail && typeof detail.isOpen === 'boolean') {
        setIsPlayerOpen(detail.isOpen);
      }
    };
    window.addEventListener('music-player-state', handlePlayerState);
    window.dispatchEvent(new CustomEvent('request-music-player-state'));
    return () => window.removeEventListener('music-player-state', handlePlayerState);
  }, []);

  useEffect(() => {
    let lastSeen: string | null = null;
    try {
      lastSeen = localStorage.getItem('viking_copy_hint_seen_timestamp');
    } catch {
      lastSeen = null;
    }
    const now = Date.now();
    const HOURS_24 = 24 * 60 * 60 * 1000;

    if (!lastSeen || now - parseInt(lastSeen, 10) > HOURS_24) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      const autoDismiss = setTimeout(() => {
        setIsVisible(false);
        try {
          localStorage.setItem('viking_copy_hint_seen_timestamp', Date.now().toString());
        } catch {
          // Ignore
        }
      }, 7000);
      return () => clearTimeout(autoDismiss);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('viking_copy_hint_seen_timestamp', Date.now().toString());
    } catch {
      // Ignore
    }
  };

  return (
    <AnimatePresence>
      {isVisible && !isPlayerOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[90] max-w-[290px]"
        >
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-3.5 shadow-[4px_4px_0px_var(--shadow-brutal)] flex items-start gap-3">
            <Copy className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-primary)] text-xs leading-relaxed">
                <span className="font-mono font-bold text-[var(--accent)] uppercase tracking-wider text-[10px] block mb-0.5">
                  Quick Copy
                </span>
                Tap any tracklist row to copy its song or anime title.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss hint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
