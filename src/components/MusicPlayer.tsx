import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Volume1, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import vinylSleeveFallback from '../assets/images/vinyl_sleeve_art_1795287206426.jpg';

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [ready, setReady] = useState(false);

  // Progress states
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [thumbSrc, setThumbSrc] = useState('https://img.youtube.com/vi/qtp0qyvCC9A/maxresdefault.jpg');

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener('toggle-music-player', handleToggle);
    return () => window.removeEventListener('toggle-music-player', handleToggle);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
    window.dispatchEvent(new CustomEvent('music-player-state', { detail: { isOpen, isPlaying } }));
  }, [isOpen, isPlaying]);

  useEffect(() => {
    const handleSyncRequest = () => {
      window.dispatchEvent(new CustomEvent('music-player-state', { detail: { isOpen, isPlaying } }));
    };
    window.addEventListener('request-music-player-state', handleSyncRequest);
    return () => window.removeEventListener('request-music-player-state', handleSyncRequest);
  }, [isOpen, isPlaying]);

  // Handle global mouseup/touchend to prevent stuck isSeeking state and commit seek position
  useEffect(() => {
    if (!isSeeking) return;
    const handleGlobalRelease = () => {
      if (playerRef.current) {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(played, 'fraction');
        } else if ('currentTime' in playerRef.current && duration > 0) {
          playerRef.current.currentTime = played * duration;
        }
      }
      setIsSeeking(false);
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, [isSeeking, played, duration]);

  // Keyboard controls when player is open: Space to toggle play/pause, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const playerRef = useRef<any>(null);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => {
    if (isMuted && volume === 0) {
      setVolume(0.5);
    }
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (playerRef.current) {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(0);
      } else if ('currentTime' in playerRef.current) {
        playerRef.current.currentTime = 0;
      }
    }
    setPlayed(0);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setPlayed(fraction);
  };

  const handleSeekMouseUp = (
    e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>
  ) => {
    const fraction = parseFloat((e.target as HTMLInputElement).value);
    if (playerRef.current) {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(fraction, 'fraction');
      } else {
        playerRef.current.currentTime = fraction * duration;
      }
    }
    setIsSeeking(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const title = 'Peace and Tranquility';
  const artist = 'Viking Algeria Outro';

  return (
    <>
      {/* Offscreen Player - maintains DOM presence for YouTube API initialization */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '2px',
          height: '2px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <ReactPlayer
          ref={playerRef}
          src="https://youtu.be/qtp0qyvCC9A"
          playing={isPlaying}
          volume={volume}
          muted={isMuted}
          loop={true}
          width="100%"
          height="100%"
          onReady={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e: React.SyntheticEvent<HTMLVideoElement>) => {
            setReady(true);
            const d = e.currentTarget.duration;
            if (d && !isNaN(d) && d > 0) {
              setDuration(d);
            }
          }}
          onDurationChange={(e: React.SyntheticEvent<HTMLVideoElement>) => {
            const d = e.currentTarget.duration;
            if (d && !isNaN(d) && d > 0) {
              setDuration(d);
            }
          }}
          onTimeUpdate={(e: React.SyntheticEvent<HTMLVideoElement>) => {
            const cur = e.currentTarget.currentTime;
            const dur = e.currentTarget.duration || duration;
            if (dur > 0 && typeof cur === 'number' && !isSeeking) {
              setPlayed(cur / dur);
            }
          }}
          config={
            {
              youtube: {
                playerVars: {
                  autoplay: 0,
                  controls: 0,
                  modestbranding: 1,
                },
              },
            } as any
          }
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[440px] z-[100]"
          >
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-[6px_6px_0px_var(--shadow-brutal)] p-4 flex flex-col gap-3.5 relative">
              {/* Top Row: Art, Titles, Controls */}
              <div className="flex items-center gap-3.5 w-full">
                {/* Vinyl Artwork */}
                <div
                  className={cn(
                    'relative w-12 h-12 shrink-0 overflow-hidden rounded-full border border-[var(--border-strong)]',
                    isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                  )}
                >
                  <img
                    src={thumbSrc}
                    alt="Outro Track Artwork"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (thumbSrc.includes('maxresdefault')) {
                        setThumbSrc('https://img.youtube.com/vi/qtp0qyvCC9A/hqdefault.jpg');
                      } else {
                        setThumbSrc(vinylSleeveFallback);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--bg-canvas)] rounded-full border border-[var(--border-strong)]" />
                </div>

                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <span className="text-[var(--text-primary)] font-display font-bold text-sm md:text-base truncate tracking-tight">
                    {title}
                  </span>
                  <span className="text-[var(--accent)] font-mono text-[11px] uppercase tracking-wider truncate">
                    {artist}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleRestart}
                    className="w-9 h-9 hidden sm:flex items-center justify-center border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                    aria-label="Restart song"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    disabled={!ready}
                    className="w-10 h-10 bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 flex items-center justify-center transition-opacity disabled:opacity-40 cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsPlaying(false);
                    }}
                    className="w-9 h-9 flex items-center justify-center border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                    aria-label="Close music player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Progress & Volume */}
              <div className="flex items-center gap-3 w-full pt-1 border-t border-[var(--border-hairline)]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] w-9 text-right shrink-0">
                    {formatTime(played * duration)}
                  </span>
                  <div className="relative h-2 w-full flex items-center group/slider cursor-pointer flex-1">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step="any"
                      value={played}
                      onMouseDown={() => setIsSeeking(true)}
                      onTouchStart={() => setIsSeeking(true)}
                      onChange={handleSeekChange}
                      onMouseUp={(e) => {
                        handleSeekMouseUp(e);
                        setIsSeeking(false);
                      }}
                      onTouchEnd={(e) => {
                        handleSeekMouseUp(e);
                        setIsSeeking(false);
                      }}
                      aria-label="Seek track progress"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-1 bg-[var(--border-hairline)] overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 bottom-0 bg-[var(--accent)]"
                        style={{ width: `${played * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] w-9 shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="hidden md:block w-px h-3 bg-[var(--border-hairline)]" />

                {/* Volume */}
                <div className="hidden md:flex items-center gap-2 w-24 shrink-0">
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
                  >
                    <VolumeIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative flex-1 h-2 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-1 bg-[var(--border-hairline)] overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 bottom-0 bg-[var(--text-primary)]"
                        style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
