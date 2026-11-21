import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import vinylSleeveImg from '../assets/images/vinyl_sleeve_art_1795287206426.jpg';

const SPECTRUM_DELAYS = [
  0, 0.14, 0.28, 0.08, 0.35, 0.18, 0.42, 0.05,
  0.24, 0.38, 0.12, 0.31, 0.09, 0.27, 0.16, 0.44,
  0.21, 0.04, 0.33, 0.19
];

export const PreloaderCurtain = () => {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'splitting' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const prevOverflowRef = useRef<string>('');
  const hasFinishedRef = useRef(false);
  const splitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishPreloader = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setPhase('splitting');
    try {
      sessionStorage.setItem('viking_preloader_seen', 'true');
    } catch {
      // Ignore storage restriction
    }
    doneTimeoutRef.current = setTimeout(() => {
      setPhase('done');
      document.body.style.overflow = prevOverflowRef.current;
    }, 650);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem('viking_preloader_seen'));
    } catch {
      seen = false;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seen || prefersReducedMotion) {
      setPhase('done');
      return;
    }

    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setPhase('loading');

    const startTime = performance.now();
    const duration = 1150;
    let rafId = 0;

    const tick = (now: number) => {
      if (hasFinishedRef.current) return;
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        splitTimeoutRef.current = setTimeout(finishPreloader, 140);
      }
    };

    rafId = requestAnimationFrame(tick);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        cancelAnimationFrame(rafId);
        if (splitTimeoutRef.current) clearTimeout(splitTimeoutRef.current);
        setProgress(100);
        finishPreloader();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      if (splitTimeoutRef.current) clearTimeout(splitTimeoutRef.current);
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflowRef.current;
    };
  }, [finishPreloader]);

  if (phase === 'idle' || phase === 'done') return null;

  const isSplitting = phase === 'splitting';

  return (
    <div
      className="fixed inset-0 z-[10000] pointer-events-auto"
      role="dialog"
      aria-label="Loading soundtrack archive"
      aria-modal="true"
    >
      {/* Top Curtain Panel */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isSplitting ? '-100%' : '0%' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] overflow-hidden"
      />

      {/* Bottom Curtain Panel */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isSplitting ? '100%' : '0%' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[var(--bg-canvas)] border-t border-[var(--border-hairline)] overflow-hidden"
      />

      {/* Center Stage Content */}
      <AnimatePresence>
        {!isSplitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 h-full w-full flex flex-col justify-between p-6 md:p-12 max-w-6xl mx-auto"
          >
            {/* Top Strip */}
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
              <div className="flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-[var(--text-muted)]">
                <span>Viking Algeria</span>
                <span aria-hidden="true">/</span>
                <span>Soundtrack Archive</span>
              </div>
              <button
                onClick={() => {
                  setProgress(100);
                  finishPreloader();
                }}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Skip Intro
              </button>
            </div>

            {/* Centerpiece: Spinning Vinyl Sleeve & Audio Spectrum */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto py-8">
              <div className="md:col-span-5 flex justify-center md:justify-start">
                <div className="relative w-44 h-44 sm:w-56 sm:h-56 border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                    className="w-full h-full rounded-full overflow-hidden border border-[var(--border-hairline)] relative"
                  >
                    <img
                      src={vinylSleeveImg}
                      alt="Viking Algeria Vinyl Platter"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-strong)]" />
                  </motion.div>
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col gap-6">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-2">
                    Catalog Index · 100+ Episodes
                  </p>
                  <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-[0.95]">
                    Soundtracks, Tracklists &amp; Notes
                  </h2>
                </div>

                {/* Equalizer Spectrum Visualizer */}
                <div
                  className="h-14 flex items-end gap-1.5 border-b border-[var(--border-hairline)] pb-3"
                  aria-hidden="true"
                >
                  {SPECTRUM_DELAYS.map((delay, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-full bg-[var(--accent)] animate-eq-bar"
                      style={{
                        animationDelay: `${delay}s`,
                        opacity: idx % 3 === 0 ? 1 : 0.65,
                      }}
                    />
                  ))}
                </div>

                {/* Progress Readout */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Preparing Crate Index
                  </span>
                  <span className="font-mono text-3xl sm:text-4xl font-bold tabular-nums text-[var(--text-primary)]">
                    {progress.toString().padStart(2, '0')}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Progress Hairline */}
            <div className="w-full h-[2px] bg-[var(--border-hairline)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] origin-left transition-transform duration-75"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
