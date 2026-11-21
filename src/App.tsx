/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MusicPlayer } from './components/MusicPlayer';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { BackgroundGrid } from './components/BackgroundGrid';
import { CustomCursor } from './components/CustomCursor';
import { PreloaderCurtain } from './components/PreloaderCurtain';
import { TopBar } from './components/TopBar';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative z-10 text-[var(--text-primary)]">
      <TopBar
        navLinks={[
          { label: 'Archive', to: '/' },
          {
            label: 'Outro Deck',
            onClick: () => window.dispatchEvent(new CustomEvent('toggle-music-player')),
          },
        ]}
        primaryAction={{
          label: 'Back to Archive',
          onClick: () => navigate('/'),
        }}
      />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-8 max-w-lg w-full shadow-[6px_6px_0px_var(--shadow-brutal)]">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
            404 · Page Not Found
          </p>
          <h1 className="font-display text-3xl font-black tracking-tight mb-4">
            This route is outside the catalog
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
            The page you requested does not exist. Head back to the Viking Algeria archive to browse
            all episodes and tracklists.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Archive</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-sans bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
        <BackgroundGrid />
        <CustomCursor />
        <PreloaderCurtain />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MusicPlayer />
      </div>
    </Router>
  );
}
