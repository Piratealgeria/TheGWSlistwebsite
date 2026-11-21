import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Disc3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils';

interface TopNavHeaderProps {
  onBrandClick?: () => void;
  onSearchFocus?: () => void;
  latestPostId?: string;
}

export const TopNavHeader = ({ onBrandClick, onSearchFocus, latestPostId }: TopNavHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [playerActive, setPlayerActive] = useState(false);

  useEffect(() => {
    const handlePlayerState = (e: Event) => {
      const detail = (e as CustomEvent<{ isOpen: boolean; isPlaying: boolean }>).detail;
      if (detail) {
        setPlayerActive(detail.isOpen && detail.isPlaying);
      }
    };
    window.addEventListener('music-player-state', handlePlayerState);
    return () => window.removeEventListener('music-player-state', handlePlayerState);
  }, []);

  const handleBrand = (e: React.MouseEvent) => {
    if (onBrandClick) {
      e.preventDefault();
      onBrandClick();
    } else if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchNav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/?focus=search');
    } else if (onSearchFocus) {
      onSearchFocus();
    } else {
      window.dispatchEvent(new CustomEvent('focus-archive-search'));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-zinc-800/80 bg-[#F8F6F1]/90 dark:bg-[#0B0B0C]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          onClick={handleBrand}
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hover:text-amber-700 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400 rounded-sm"
        >
          Viking Algeria
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-zinc-400">
          <Link
            to="/"
            onClick={handleBrand}
            className={cn(
              "whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-900/40 dark:hover:border-zinc-100/40 transition-colors",
              location.pathname === '/' && "text-zinc-900 dark:text-zinc-100 border-amber-700 dark:border-amber-400"
            )}
          >
            Archive
          </Link>
          {latestPostId && (
            <Link
              to={`/post/${latestPostId}`}
              className={cn(
                "whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-900/40 dark:hover:border-zinc-100/40 transition-colors",
                location.pathname === `/post/${latestPostId}` && "text-zinc-900 dark:text-zinc-100 border-amber-700 dark:border-amber-400"
              )}
            >
              Latest Note
            </Link>
          )}
          <a
            href="#search"
            onClick={handleSearchNav}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-900/40 dark:hover:border-zinc-100/40 transition-colors"
          >
            Search
          </a>
          <a
            href="https://www.youtube.com/@VikingAlgeria"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-900/40 dark:hover:border-zinc-100/40 transition-colors"
          >
            Channel
          </a>
        </nav>

        {/* Zone 3: Primary Action & Theme Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to Archival Paper (Light)' : 'Switch to Obsidian Cinema (Dark)'}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-stone-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-stone-400 dark:hover:border-zinc-700 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-music-player'))}
            aria-label="Toggle floating music player"
            className={cn(
              "h-10 px-4 inline-flex items-center gap-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400",
              playerActive
                ? "bg-amber-700 dark:bg-amber-400 text-white dark:text-zinc-950"
                : "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-950 hover:bg-amber-700 dark:hover:bg-amber-400 dark:hover:text-zinc-950"
            )}
          >
            <Disc3 className={cn("w-3.5 h-3.5", playerActive && "animate-spin")} />
            <span>{playerActive ? 'Playing' : 'Listen'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
