import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Music,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Sun,
  Moon,
  List,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '../utils';
import { PostMetadata } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../hooks/useTheme';
import { PostCard } from '../components/PostCard';
import { CrateList } from '../components/CrateList';
import { TopBar } from '../components/TopBar';
import { fetchPosts } from '../api';
import { usePageSEO } from '../hooks/usePageSEO';
import swissPosterFallback from '../assets/images/viking_og_cover_1795291226398.jpg';

const CRATE_PER_PAGE = 12;
const GRID_PER_PAGE = 6;

export const Home = () => {
  const [posts, setPosts] = useState<PostMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [viewMode, setViewMode] = useState<'crate' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'crate';
    try {
      const saved = localStorage.getItem('viking_view_mode');
      if (saved === 'grid' || saved === 'crate') return saved;
    } catch {
      // Ignore storage error
    }
    return 'crate';
  });

  useEffect(() => {
    try {
      localStorage.setItem('viking_view_mode', viewMode);
    } catch {
      // Ignore storage error
    }
  }, [viewMode]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [featuredFallbackTier, setFeaturedFallbackTier] = useState<0 | 1 | 2>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const archiveSectionRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);
  const lastPushedQueryRef = useRef<string>(searchParams.get('q') || '');

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    fetchPosts()
      .then((data: PostMetadata[]) => {
        if (cancelled) return;
        setPosts(data);
        setLoadError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading posts:', err);
        setLoadError('Unable to load the episode archive. Please refresh to retry.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Sync URL query param -> searchQuery (only on external URL changes such as Back/Forward or tag links)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== lastPushedQueryRef.current) {
      lastPushedQueryRef.current = q;
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const nextParam = val.trim() ? val : '';
    lastPushedQueryRef.current = nextParam;
    if (nextParam) {
      setSearchParams({ q: nextParam }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleClearSearch = () => {
    lastPushedQueryRef.current = '';
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  const handleTagSelect = (tag: string) => {
    if (searchQuery.toLowerCase() === tag.toLowerCase()) {
      handleClearSearch();
    } else {
      handleSearchChange(tag);
      archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const focusSearch = () => {
    archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 180);
  };

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [posts]);

  const totalCreditsCount = useMemo(() => {
    return posts.reduce((sum, p) => sum + (p.tags?.length || 0), 0);
  }, [posts]);

  const totalTrackCount = useMemo(() => {
    return posts.reduce((sum, p) => sum + (p.trackCount || 0), 0);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.id.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        post.previewTracks?.some((track) => track.toLowerCase().includes(q)) ||
        post.content?.toLowerCase().includes(q)
    );
  }, [posts, debouncedSearchQuery]);

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://vikingalgeria.com';
  const trimmedSearch = debouncedSearchQuery.trim();
  const episodeCount = posts.length || 102;
  const seoTitle = trimmedSearch
    ? `${trimmedSearch} Soundtracks & Tracklists | Viking Algeria`
    : 'Viking Algeria — Anime & Gaming Soundtrack Tracklists';
  const seoDescription = trimmedSearch
    ? `Browse ${filteredPosts.length} Viking Algeria episode${filteredPosts.length === 1 ? '' : 's'} matching "${trimmedSearch}" with verified soundtracks and timestamps.`
    : `Explore ${episodeCount} Viking Algeria Gifs With Sound episodes featuring verified anime & game sources, song credits, and instant-copy tracklist timestamps.`;
  const seoCanonical = trimmedSearch
    ? `${origin}/?q=${encodeURIComponent(trimmedSearch)}`
    : `${origin}/`;
  const seoImage =
    trimmedSearch && filteredPosts[0]?.thumbnail && !filteredPosts[0].thumbnail.includes('picsum.photos')
      ? filteredPosts[0].thumbnail
      : `${origin}/og-cover.jpg`;

  usePageSEO({
    enabled: !loading,
    title: seoTitle,
    description: seoDescription,
    keywords: [
      'Viking Algeria',
      'anime soundtracks',
      'AMV music notes',
      'anime timestamps',
      'gaming soundtrack',
      'tracklist archive',
      'song timestamps',
      'anime music guide',
      ...popularTags.slice(0, 6),
      ...(trimmedSearch ? [trimmedSearch] : []),
    ],
    canonicalUrl: seoCanonical,
    image: seoImage,
    imageAlt: trimmedSearch
      ? `${trimmedSearch} — Viking Algeria Soundtrack Archive`
      : 'Viking Algeria — Anime & Gaming Soundtrack Archive',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: trimmedSearch ? `${trimmedSearch} | Viking Algeria` : 'Viking Algeria Soundtrack Archive',
      description: seoDescription,
      url: seoCanonical,
      publisher: {
        '@type': 'Organization',
        name: 'Viking Algeria',
        url: `${origin}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/icon.png`,
        },
      },
    },
  });

  // Reset pagination when search or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, viewMode]);

  // Global keyboard shortcuts: / or Ctrl/Cmd+K to focus search, Esc to clear when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !isInputActive) {
        e.preventDefault();
        focusSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to archive top on page change (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const perPage = viewMode === 'crate' ? CRATE_PER_PAGE : GRID_PER_PAGE;
  const totalPages = Math.ceil(filteredPosts.length / perPage);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * perPage, currentPage * perPage);
  const featuredPost = posts[0] || null;
  const rawFeaturedThumb = featuredPost?.thumbnail;
  const featuredThumb =
    !rawFeaturedThumb || rawFeaturedThumb.includes('picsum.photos') || featuredFallbackTier >= 2
      ? swissPosterFallback
      : featuredFallbackTier === 1 && rawFeaturedThumb.includes('maxresdefault.jpg')
      ? rawFeaturedThumb.replace('maxresdefault.jpg', 'hqdefault.jpg')
      : rawFeaturedThumb;

  const openRandomEpisode = () => {
    if (posts.length === 0) return;
    const pool = posts.length > 1 ? posts.slice(1) : posts;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) navigate(`/post/${random.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Loading Catalog
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10 text-[var(--text-primary)]">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        onBrandClick={() => {
          handleClearSearch();
          setCurrentPage(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        navLinks={[
          {
            label: 'Featured',
            href: '#featured-spotlight',
            onClick: () =>
              document
                .getElementById('featured-spotlight')
                ?.scrollIntoView({ behavior: 'smooth' }),
          },
          {
            label: 'Archive',
            href: '#crate-archive',
            onClick: () => archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth' }),
          },
          ...(posts.length > 0
            ? [
                {
                  label: 'Random',
                  onClick: openRandomEpisode,
                },
              ]
            : []),
          {
            label: 'Outro Deck',
            onClick: () => window.dispatchEvent(new CustomEvent('toggle-music-player')),
          },
        ]}
        primaryAction={{
          label: 'Search',
          onClick: focusSearch,
          ariaLabel: 'Focus archive search',
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-20">
        {/* Asymmetric Swiss Poster Hero Split */}
        <section
          id="featured-spotlight"
          className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 border border-[var(--border-strong)] bg-[var(--bg-elevated)] items-stretch"
        >
          {/* Left Column: Oversized Display Title & Actions */}
          <div className="lg:col-span-7 p-6 md:p-10 lg:p-12 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-[var(--border-hairline)]">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-4">
                Soundtrack &amp; Tracklist Index · YouTube &amp; Odysee
              </p>
              <h1
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.94] text-[var(--text-primary)] mb-6"
                style={{ textWrap: 'balance' }}
              >
                Viking Algeria
              </h1>
              <p className="text-base md:text-lg text-[var(--text-muted)] max-w-xl leading-relaxed">
                Curated soundtrack notes, verified anime and gaming sources, and instant-copy
                timestamps for every channel episode.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-music-player'))}
                className="px-5 py-3 bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Music className="w-4 h-4" />
                <span>{isPlayerOpen ? 'Hide Outro Deck' : 'Listen to Outro Deck'}</span>
              </button>
              <a
                href="#crate-archive"
                onClick={(e) => {
                  e.preventDefault();
                  archiveSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-semibold text-xs uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
              >
                Browse {posts.length} Episodes
              </a>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Episode */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[var(--bg-surface)]">
            {featuredPost ? (
              <Link
                to={`/post/${featuredPost.id}`}
                className="group flex flex-col h-full justify-between outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="relative aspect-video lg:aspect-auto lg:flex-1 min-h-[220px] overflow-hidden border-b border-[var(--border-hairline)] bg-black">
                  <img
                    src={featuredThumb}
                    alt={`${featuredPost.title} featured episode cover`}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (featuredFallbackTier === 0 && rawFeaturedThumb?.includes('maxresdefault.jpg')) {
                        setFeaturedFallbackTier(1);
                      } else {
                        setFeaturedFallbackTier(2);
                      }
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
                    <span className="font-mono text-[11px] uppercase tracking-widest bg-black/75 px-2.5 py-1 border border-white/20">
                      Latest Release
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums bg-black/75 px-2.5 py-1 border border-white/20">
                      {featuredPost.id}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {featuredPost.title}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                      {featuredPost.tags && featuredPost.tags.length > 0
                        ? featuredPost.tags.slice(0, 3).join(' · ')
                        : 'Soundtrack Tracklist & Timestamps'}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 border border-[var(--border-strong)] text-[var(--text-primary)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent-contrast)] transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="p-8 flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                No featured episodes available.
              </div>
            )}
          </div>
        </section>

        {/* Full-Width 3-Column Metrics Strip */}
        <section
          aria-label="Archive summary"
          className="grid grid-cols-1 sm:grid-cols-3 border-x border-b border-[var(--border-strong)] bg-[var(--bg-canvas)] mb-12"
        >
          <div className="p-5 md:p-6 border-b sm:border-b-0 sm:border-r border-[var(--border-hairline)] flex items-baseline justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Indexed Episodes
            </span>
            <span className="font-display text-2xl md:text-3xl font-black tabular-nums text-[var(--text-primary)]">
              {posts.length}
            </span>
          </div>
          <div className="p-5 md:p-6 border-b sm:border-b-0 sm:border-r border-[var(--border-hairline)] flex items-baseline justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Anime &amp; Game Credits
            </span>
            <span className="font-display text-2xl md:text-3xl font-black tabular-nums text-[var(--text-primary)]">
              {totalCreditsCount}+
            </span>
          </div>
          <div className="p-5 md:p-6 flex items-baseline justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Track Timestamps
            </span>
            <span className="font-display text-2xl md:text-3xl font-black tabular-nums text-[var(--accent)]">
              {totalTrackCount.toLocaleString()}
            </span>
          </div>
        </section>

        {/* Archive Toolbar & Crate Section */}
        <section id="crate-archive" ref={archiveSectionRef} className="scroll-mt-24">
          {/* Controls Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClearSearch();
                    searchInputRef.current?.blur();
                  }
                }}
                placeholder="Search episodes, anime, games, or songs (Press /)"
                aria-label="Search episodes, anime, games, or songs"
                className="w-full h-11 pl-10 pr-10 bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Utility Controls: View Switcher, Theme Toggle, Audio Deck */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Switcher */}
              <div
                className="inline-flex border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-0.5"
                role="group"
                aria-label="Archive view mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('crate')}
                  className={cn(
                    'h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0',
                    viewMode === 'crate'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Crate List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0',
                    viewMode === 'grid'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Poster Grid</span>
                </button>
              </div>

              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="h-10 px-3.5 border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-primary)] inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              {/* Audio Deck Trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-music-player'))}
                className={cn(
                  'h-10 px-3.5 border inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  isPlayerOpen
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                )}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Audio Deck</span>
              </button>
            </div>
          </div>

          {/* Featured Series Filter Tabs */}
          {popularTags.length > 0 && (
            <div
              id="featured-tags"
              className="py-4 flex flex-wrap items-center gap-2 border-b border-[var(--border-hairline)] scroll-mt-24"
            >
              <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)] mr-1">
                Featured Series:
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border',
                  !searchQuery.trim()
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                )}
              >
                All
              </button>
              {popularTags.map((tag) => {
                const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border',
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] font-semibold'
                        : 'bg-transparent text-[var(--text-muted)] border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Search Banner */}
          {debouncedSearchQuery.trim() && (
            <div className="mt-6 p-4 border border-[var(--border-strong)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-[var(--text-muted)] mr-2">Showing results for</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  "{debouncedSearchQuery}"
                </span>
                <span className="font-mono text-xs tabular-nums text-[var(--accent)] ml-3">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'episode' : 'episodes'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors self-start sm:self-auto cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div className="my-12 p-8 border border-[var(--accent)] bg-[var(--bg-surface)] text-center max-w-lg mx-auto">
              <p className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                Catalog Unavailable
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-5">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty Search State */}
          {!loadError && debouncedSearchQuery.trim() && filteredPosts.length === 0 && (
            <div className="my-14 p-8 border border-[var(--border-strong)] bg-[var(--bg-surface)] max-w-lg mx-auto text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
                No Matching Episodes
              </p>
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
                Nothing matched "{debouncedSearchQuery}"
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Try searching by anime title, game name, or episode number.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Show All Episodes
              </button>
            </div>
          )}

          {/* Archive Listing */}
          {!loadError && paginatedPosts.length > 0 && (
            <div className="mt-6">
              {viewMode === 'crate' ? (
                <CrateList
                  posts={paginatedPosts}
                  onTagSelect={handleTagSelect}
                  activeQuery={searchQuery}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {paginatedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Archive pagination"
              className="mt-14 flex items-center justify-center"
            >
              <div className="inline-flex items-center border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-11 h-11 flex items-center justify-center border-r border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="hidden md:flex items-center divide-x divide-[var(--border-hairline)]">
                  {(() => {
                    const pages: React.ReactNode[] = [];
                    const delta = 2;
                    const left = Math.max(2, currentPage - delta);
                    const right = Math.min(totalPages - 1, currentPage + delta);
                    const startPage = left === 3 ? 2 : left;
                    const endPage = right === totalPages - 2 ? totalPages - 1 : right;

                    const renderPageBtn = (pageNum: number) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                        className={cn(
                          'w-11 h-11 flex items-center justify-center font-mono text-xs font-bold tabular-nums transition-colors cursor-pointer',
                          currentPage === pageNum
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                        )}
                      >
                        {pageNum.toString().padStart(2, '0')}
                      </button>
                    );

                    pages.push(renderPageBtn(1));

                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="ellipsis-left"
                          className="w-10 h-11 flex items-center justify-center text-[var(--text-muted)] font-mono text-xs"
                        >
                          ...
                        </span>
                      );
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(renderPageBtn(i));
                    }

                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span
                          key="ellipsis-right"
                          className="w-10 h-11 flex items-center justify-center text-[var(--text-muted)] font-mono text-xs"
                        >
                          ...
                        </span>
                      );
                    }

                    if (totalPages > 1) {
                      pages.push(renderPageBtn(totalPages));
                    }

                    return pages;
                  })()}
                </div>

                <div className="md:hidden px-4 h-11 flex items-center font-mono text-xs tabular-nums text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text-primary)]">
                    {currentPage.toString().padStart(2, '0')}
                  </span>
                  <span className="mx-1.5">/</span>
                  <span>{totalPages.toString().padStart(2, '0')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-11 h-11 flex items-center justify-center border-l border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  aria-label="Next page"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </nav>
          )}
        </section>
      </main>

      <footer className="border-t border-[var(--border-hairline)] py-10 px-4 md:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p className="font-mono uppercase tracking-wider">
            Viking Algeria &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            <a href="/sitemap.xml" className="hover:text-[var(--text-primary)] transition-colors">
              Sitemap
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? 'Switch to Light Paper' : 'Switch to Dark Studio'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
