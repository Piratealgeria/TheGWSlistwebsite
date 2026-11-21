import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { ArrowLeft, ArrowRight, ArrowUp, Music, Sun, Moon } from 'lucide-react';
import { PostMetadata } from '../types';
import { CopyLinkButton } from '../components/CopyLinkButton';
import { TopBar } from '../components/TopBar';
import { VideoEmbed, CopyableListItem, FormattedLine, CodeBlock } from '../components/MarkdownComponents';
import { CopyHint } from '../components/CopyHint';
import { fetchPosts, fetchPostContent } from '../api';
import { sanitizeHtml, copyToClipboard } from '../utils';
import { usePageSEO } from '../hooks/usePageSEO';
import { useTheme } from '../hooks/useTheme';
import swissPosterFallback from '../assets/images/viking_og_cover_1795291226398.jpg';

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractVideoKey = (url?: string | null): string | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})(?![ \w-])/);
  if (ytMatch) return `yt:${ytMatch[1]}`;
  if (url.includes('odysee.com')) {
    return `odysee:${url.split('?')[0].replace(/https?:\/\/(?:www\.)?odysee\.com\/(?:\$\/embed\/)?/i, '').toLowerCase()}`;
  }
  return null;
};

const isSafeHref = (href?: string): boolean => {
  if (!href) return false;
  const trimmed = href.trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
};

export const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostMetadata | null>(null);
  const [allPosts, setAllPosts] = useState<PostMetadata[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [htmlCopiedText, setHtmlCopiedText] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setContent('');
    setHtmlCopiedText(null);

    fetchPosts()
      .then(async (data: PostMetadata[]) => {
        if (cancelled) return;
        setAllPosts(data);

        const decodedId = safeDecodeURIComponent(id || '').trim().toLowerCase();
        const found = data.find(
          (p) =>
            String(p.id).toLowerCase() === decodedId ||
            p.file?.replace(/\.[^/.]+$/, '').toLowerCase() === decodedId ||
            String(p.title).toLowerCase() === decodedId ||
            String(p.numericId) === decodedId
        );

        if (found) {
          setPost(found);
          let text = found.content || '';

          if (!text) {
            try {
              text = await fetchPostContent(found.file);
            } catch {
              text = 'Could not load post content. Please try again.';
            }
          }

          if (cancelled) return;

          if (text.startsWith('---')) {
            text = text.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]*/, '').trim();
          }

          setContent(text);
          window.scrollTo(0, 0);
        } else {
          setPost(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading post:', err);
        setLoadError('Unable to load episode data. Please check your connection and try again.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentIndex = allPosts.findIndex((p) => p.id === (post?.id || id));
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://vikingalgeria.com';

  const canonicalUrl = `${origin}/post/${encodeURIComponent(post?.id || id || '')}`;

  const twoTagTitle = post
    ? post.tags && post.tags.length > 0
      ? `${post.title} Tracklist — ${post.tags.slice(0, 2).join(', ')} | Viking Algeria`
      : `${post.title} Tracklist | Viking Algeria`
    : 'Episode Not Found | Viking Algeria';
  const oneTagTitle = post
    ? post.tags && post.tags.length > 0
      ? `${post.title} Tracklist — ${post.tags[0]} | Viking Algeria`
      : `${post.title} Tracklist | Viking Algeria`
    : 'Episode Not Found | Viking Algeria';
  const postTitle =
    twoTagTitle.length <= 64
      ? twoTagTitle
      : oneTagTitle.length <= 64
      ? oneTagTitle
      : `${post?.title || 'Episode'} Tracklist | Viking Algeria`;

  const postDescription =
    post?.excerpt ||
    (post
      ? `${post.title} soundtrack tracklist, anime & game credits, and timestamp notes on Viking Algeria.`
      : 'This episode ID or slug is not in the Viking Algeria catalog. Browse all episodes and tracklists on Viking Algeria.');
  const postImage =
    post?.thumbnail && !post.thumbnail.includes('picsum.photos')
      ? post.thumbnail
      : `${origin}/og-cover.jpg`;

  usePageSEO({
    enabled: !loading,
    title: postTitle,
    description: postDescription,
    keywords: post
      ? [
          ...(post.tags || []),
          post.title,
          'Viking Algeria',
          'anime soundtracks',
          'tracklist',
          'timestamps',
        ]
      : ['Viking Algeria'],
    canonicalUrl,
    image: postImage,
    imageAlt: post ? `${post.title} — Viking Algeria episode cover` : 'Viking Algeria — Anime & Gaming Soundtrack Archive',
    type: post ? 'article' : 'website',
    schema: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: `${post.title} — Anime & Gaming Soundtrack Tracklist`,
          description: postDescription,
          image: [postImage],
          url: canonicalUrl,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
          author: {
            '@type': 'Organization',
            name: 'Viking Algeria',
            url: `${origin}/`,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Viking Algeria',
            logo: {
              '@type': 'ImageObject',
              url: `${origin}/icon.png`,
            },
          },
          keywords: [post.title, 'Viking Algeria', ...(post.tags || [])].join(', '),
          ...(post.videoUrl
            ? {
                video: {
                  '@type': 'VideoObject',
                  name: `${post.title} — Viking Algeria`,
                  description: postDescription,
                  thumbnailUrl: [postImage],
                  contentUrl: post.videoUrl,
                  embedUrl: post.videoUrl,
                },
              }
            : {}),
        }
      : undefined,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      if (e.key === 'Escape') {
        navigate('/');
        return;
      }

      if (e.key === 'ArrowLeft' && nextPost) {
        navigate(`/post/${nextPost.id}`);
      } else if (e.key === 'ArrowRight' && prevPost) {
        navigate(`/post/${prevPost.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPost, nextPost, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Loading Episode
          </span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col relative z-10 text-[var(--text-primary)]">
        <TopBar
          navLinks={[{ label: 'Archive', to: '/' }]}
          primaryAction={{
            label: 'Back to Archive',
            onClick: () => navigate('/'),
          }}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="border border-[var(--accent)] bg-[var(--bg-elevated)] p-8 max-w-lg w-full shadow-[6px_6px_0px_var(--shadow-brutal)]">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              Connection Error
            </p>
            <h1 className="font-display text-2xl font-black tracking-tight mb-3">
              Could not load episode
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-[var(--accent)] text-[var(--accent-contrast)] px-5 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openRandomEpisode = () => {
    const candidates = allPosts.filter((p) => p.id !== post?.id);
    const pool = candidates.length > 0 ? candidates : allPosts;
    if (pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) navigate(`/post/${random.id}`);
  };

  if (!post) {
    const cleanId = safeDecodeURIComponent(id || '');
    return (
      <div className="min-h-screen flex flex-col relative z-10 text-[var(--text-primary)]">
        <TopBar
          navLinks={[
            { label: 'Archive', to: '/' },
            ...(allPosts.length > 0 ? [{ label: 'Random', onClick: openRandomEpisode }] : []),
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
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-8 max-w-lg w-full shadow-[6px_6px_0px_var(--shadow-brutal)]">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
              404 · Episode Not Found
            </p>
            <h1 className="font-display text-3xl font-black tracking-tight mb-4">
              Episode "{cleanId}" does not exist
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              This episode ID or slug is not in the Viking Algeria catalog. Return to the main crate
              index to browse available episodes.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Archive</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10 text-[var(--text-primary)]">
      <CopyHint />

      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-[var(--accent)] z-[60] origin-left transition-transform duration-75"
        style={{ width: '100%', transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Strict 3-Zone Top Bar */}
      <TopBar
        navLinks={[
          { label: 'Archive', to: '/' },
          ...(nextPost ? [{ label: 'Older', to: `/post/${nextPost.id}` }] : []),
          ...(prevPost ? [{ label: 'Newer', to: `/post/${prevPost.id}` }] : []),
          ...(allPosts.length > 1 ? [{ label: 'Random', onClick: openRandomEpisode }] : []),
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

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-24">
        {/* Sub-Header Utility Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--border-hairline)]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Archive Index</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="px-3.5 py-2 border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-primary)] inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-music-player'))}
              className="px-3.5 py-2 border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-primary)] inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Music className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Deck</span>
            </button>
            <CopyLinkButton url={typeof window !== 'undefined' ? window.location.href : canonicalUrl} />
          </div>
        </div>

        {/* Editorial Monograph Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
            <span className="text-[var(--accent)] font-bold tabular-nums">Episode {post.id}</span>
            <span aria-hidden="true">·</span>
            <span>{post.videoUrl?.includes('odysee.com') ? 'Odysee Release' : 'YouTube Release'}</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.tags.length} Featured Credits</span>
              </>
            )}
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[0.95] text-[var(--text-primary)] mb-6"
            style={{ textWrap: 'balance' }}
          >
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 text-xs font-medium border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors whitespace-nowrap shrink-0"
                  title={`Filter episodes featuring ${tag}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Embedded Video Stage */}
        {post.videoUrl && <VideoEmbed url={post.videoUrl} />}

        {/* Tracklist & Notes Body */}
        <article className="max-w-3xl">
          {post.type === 'md' ? (
            <div className="break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  ul: ({ children }) => (
                    <ul className="border-t border-[var(--border-hairline)] my-6 divide-y divide-[var(--border-hairline)]">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => <CopyableListItem>{children}</CopyableListItem>,
                  a: ({ href, children }) => {
                    if (!isSafeHref(href)) {
                      return <span>{children}</span>;
                    }
                    const isVideo =
                      href &&
                      (href.includes('youtube.com') ||
                        href.includes('youtu.be') ||
                        href.includes('odysee.com'));
                    if (isVideo) {
                      const mainKey = extractVideoKey(post.videoUrl);
                      const linkKey = extractVideoKey(href);
                      if (mainKey && linkKey && mainKey === linkKey) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline underline-offset-4 font-semibold break-all"
                          >
                            {children}
                          </a>
                        );
                      }
                      return <VideoEmbed url={href} />;
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline underline-offset-4 font-semibold break-all"
                      >
                        {children}
                      </a>
                    );
                  },
                  img: ({ src, alt }) => (
                    <figure className="my-10 border border-[var(--border-strong)] bg-[var(--bg-elevated)] overflow-hidden shadow-[6px_6px_0px_var(--shadow-brutal)]">
                      <img
                        src={src}
                        alt={alt || post.title}
                        className="w-full h-auto object-contain max-h-[75vh]"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.dataset.fallbackApplied !== 'true') {
                            target.dataset.fallbackApplied = 'true';
                            target.src = swissPosterFallback;
                          }
                        }}
                      />
                      {alt && (
                        <figcaption className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] px-4 py-3 border-t border-[var(--border-hairline)]">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  ),
                  h1: ({ children }) => (
                    <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight mt-10 mb-5 text-[var(--text-primary)]">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-display text-xl md:text-2xl font-bold mt-10 mb-4 text-[var(--accent)] tracking-tight">
                      {children}
                    </h2>
                  ),
                  p: ({ children }) => (
                    <div className="text-base md:text-lg text-[var(--text-primary)]/90 leading-relaxed mb-4 break-words">
                      <FormattedLine>{children}</FormattedLine>
                    </div>
                  ),
                  code: ({ node: _node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isCodeBlock =
                      !inline &&
                      (Boolean(match) || (typeof children === 'string' && children.includes('\n')));
                    return isCodeBlock ? (
                      <CodeBlock className={className} {...props}>
                        {children}
                      </CodeBlock>
                    ) : (
                      <code
                        className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-1.5 py-0.5 font-mono text-[var(--accent)] text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              <div
                className="html-post-content max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                onClick={async (e) => {
                  const target = (e.target as HTMLElement).closest('li');
                  if (target && !(e.target as HTMLElement).closest('a')) {
                    const textToCopy = target.innerText.trim();
                    const success = await copyToClipboard(textToCopy);
                    if (success) {
                      setHtmlCopiedText(textToCopy);
                      target.classList.add('bg-[var(--bg-surface)]');
                      setTimeout(() => {
                        target.classList.remove('bg-[var(--bg-surface)]');
                        setHtmlCopiedText((cur) => (cur === textToCopy ? null : cur));
                      }, 1500);
                    }
                  }
                }}
              />
              {htmlCopiedText && (
                <div
                  role="status"
                  aria-live="polite"
                  className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-[95] bg-[var(--bg-elevated)] border border-[var(--accent)] px-4 py-2.5 shadow-[4px_4px_0px_var(--shadow-brutal)] font-mono text-xs uppercase tracking-wider text-[var(--accent)]"
                >
                  Copied to clipboard
                </div>
              )}
            </>
          )}
        </article>

        {/* Next / Previous Episode Navigation */}
        <nav
          aria-label="Episode navigation"
          className="mt-20 pt-10 border-t border-[var(--border-strong)] grid grid-cols-1 md:grid-cols-2 gap-4 relative"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="md:col-span-2 justify-self-center mb-4 px-4 py-2 border border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-2 transition-colors cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>

          {nextPost ? (
            <Link
              to={`/post/${nextPost.id}`}
              className="group p-6 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--accent)] transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Older Episode · {nextPost.id}</span>
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}

          {prevPost ? (
            <Link
              to={`/post/${prevPost.id}`}
              className="group p-6 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--accent)] transition-colors flex flex-col gap-3 md:items-end md:text-right"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Newer Episode · {prevPost.id}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {prevPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden md:block" />
          )}
        </nav>
      </main>

      <footer className="border-t border-[var(--border-hairline)] py-10 px-4 md:px-8 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <Link to="/" className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
            ← Return to Viking Algeria Archive
          </Link>
          <p className="font-mono uppercase tracking-wider">
            Viking Algeria &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};
