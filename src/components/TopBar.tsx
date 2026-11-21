import React from 'react';
import { Link } from 'react-router-dom';

interface TopBarProps {
  onBrandClick?: () => void;
  navLinks: Array<{
    label: string;
    href?: string;
    to?: string;
    onClick?: () => void;
  }>;
  primaryAction: {
    label: string;
    onClick: () => void;
    ariaLabel?: string;
  };
}

export const TopBar = ({ onBrandClick, navLinks, primaryAction }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-hairline)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          onClick={onBrandClick}
          className="font-display text-lg md:text-xl font-black tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors whitespace-nowrap shrink-0"
        >
          Viking Algeria
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
          {navLinks.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={item.onClick}
                className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href || '#'}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={primaryAction.onClick}
            aria-label={primaryAction.ariaLabel || primaryAction.label}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {primaryAction.label}
          </button>
        </div>
      </div>
    </header>
  );
};
