import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PostMetadata } from '../types';
import { fetchPostContent } from '../api';
import swissPosterFallback from '../assets/images/viking_og_cover_1795291226398.jpg';

interface CrateListProps {
  posts: PostMetadata[];
  onTagSelect: (tag: string) => void;
  activeQuery: string;
}

const getSourceLabel = (post: PostMetadata): string => {
  if (post.videoUrl?.includes('odysee.com')) return 'Odysee';
  if (post.videoUrl?.includes('youtu')) return 'YouTube';
  return post.type === 'html' ? 'HTML Note' : 'Markdown';
};

export const CrateList = ({ posts, onTagSelect, activeQuery }: CrateListProps) => {
  const navigate = useNavigate();
  const [hoveredPost, setHoveredPost] = useState<PostMetadata | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, 1 | 2>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clearHover = () => setHoveredPost(null);
    window.addEventListener('scroll', clearHover, { passive: true });
    window.addEventListener('blur', clearHover);
    return () => {
      window.removeEventListener('scroll', clearHover);
      window.removeEventListener('blur', clearHover);
    };
  }, []);

  const pointerX = useMotionValue(-400);
  const pointerY = useMotionValue(-400);
  const springX = useSpring(pointerX, { stiffness: 320, damping: 28 });
  const springY = useSpring(pointerY, { stiffness: 320, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Offset floating preview to the right and slightly above cursor, clamped cleanly within viewport
    const previewW = 300;
    const previewH = 210;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

    const nextX = e.clientX + 24 + previewW > vw ? e.clientX - previewW - 24 : e.clientX + 24;
    const nextY = Math.max(24, Math.min(vh - previewH - 24, e.clientY - previewH / 2));

    pointerX.set(nextX);
    pointerY.set(nextY);
  };

  const handleRowEnter = (post: PostMetadata) => {
    setHoveredPost(post);
    fetchPostContent(post.file).catch(() => {});
  };

  const getSafeThumb = (post: PostMetadata) => {
    const tier = failedImages[post.id] || 0;
    if (tier >= 2 || !post.thumbnail || post.thumbnail.includes('picsum.photos')) {
      return swissPosterFallback;
    }
    if (tier === 1 && post.thumbnail.includes('maxresdefault.jpg')) {
      return post.thumbnail.replace('maxresdefault.jpg', 'hqdefault.jpg');
    }
    return post.thumbnail;
  };

  const handleThumbError = (post: PostMetadata) => {
    setFailedImages((prev) => {
      const current = prev[post.id] || 0;
      if (current === 0 && post.thumbnail?.includes('maxresdefault.jpg')) {
        return { ...prev, [post.id]: 1 };
      }
      return { ...prev, [post.id]: 2 };
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredPost(null)}
      className="relative border-t border-[var(--border-strong)]"
    >
      {/* Table / Crate Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-3 border-b border-[var(--border-hairline)] text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
        <div className="col-span-1">No.</div>
        <div className="col-span-5">Episode Title</div>
        <div className="col-span-4">Featured Credits</div>
        <div className="col-span-1">Source</div>
        <div className="col-span-1 text-right">Open</div>
      </div>

      {/* Crate Rows */}
      <div className="divide-y divide-[var(--border-hairline)]">
        {posts.map((post) => {
          const sourceLabel = getSourceLabel(post);
          const thumbSrc = getSafeThumb(post);
          const displayId = post.numericId ? String(post.numericId).padStart(3, '0') : post.id;

          return (
            <div
              key={post.id}
              onMouseEnter={() => handleRowEnter(post)}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a, button')) return;
                navigate(`/post/${post.id}`);
              }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center py-4 px-3 transition-colors duration-150 hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              {/* Catalog Index + Mobile Thumbnail */}
              <div className="md:col-span-1 flex items-center justify-between md:justify-start gap-3">
                <Link
                  to={`/post/${post.id}`}
                  className="font-mono text-xs font-bold tabular-nums text-[var(--accent)] hover:underline underline-offset-4"
                >
                  {displayId}
                </Link>
                <span className="md:hidden text-xs font-mono tabular-nums text-[var(--text-muted)]">
                  {post.trackCount ? `${post.trackCount} tracks · ` : ''}{sourceLabel}
                </span>
              </div>

              {/* Mobile Thumbnail + Title */}
              <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                <Link
                  to={`/post/${post.id}`}
                  className="md:hidden w-16 h-10 shrink-0 border border-[var(--border-hairline)] overflow-hidden bg-[var(--bg-surface)]"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <img
                    src={thumbSrc}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => handleThumbError(post)}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <Link
                  to={`/post/${post.id}`}
                  onFocus={() => handleRowEnter(post)}
                  className="font-display font-bold text-base md:text-lg tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate block"
                >
                  {post.title}
                </Link>
              </div>

              {/* Featured Credits (Unboxed text buttons separated by middle dot) */}
              <div className="md:col-span-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] min-w-0">
                {post.tags && post.tags.length > 0 ? (
                  post.tags.slice(0, 3).map((tag, idx) => {
                    const isActive = activeQuery.toLowerCase() === tag.toLowerCase();
                    return (
                      <React.Fragment key={tag}>
                        {idx > 0 && <span aria-hidden="true" className="opacity-40">·</span>}
                        <button
                          type="button"
                          onClick={() => onTagSelect(tag)}
                          className={`text-left transition-colors cursor-pointer truncate max-w-[140px] ${
                            isActive
                              ? 'text-[var(--accent)] font-semibold underline underline-offset-4'
                              : 'hover:text-[var(--text-primary)] hover:underline underline-offset-4'
                          }`}
                        >
                          {tag}
                        </button>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <span className="truncate opacity-60">Soundtrack &amp; Tracklist Notes</span>
                )}
              </div>

              {/* Source & Track Count */}
              <div className="hidden md:block md:col-span-1 text-xs font-mono tabular-nums text-[var(--text-muted)] whitespace-nowrap">
                <div>{sourceLabel}</div>
                {post.trackCount ? (
                  <div className="text-[10px] opacity-70">{post.trackCount} tracks</div>
                ) : null}
              </div>

              {/* Open Action */}
              <div className="hidden md:flex md:col-span-1 justify-end">
                <Link
                  to={`/post/${post.id}`}
                  aria-label={`Open ${post.title}`}
                  className="inline-flex items-center justify-center w-9 h-9 border border-[var(--border-hairline)] text-[var(--text-primary)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)] transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Floating Hover Artwork Preview */}
      {hoveredPost && (
        <motion.div
          aria-hidden="true"
          className="hidden lg:block fixed top-0 left-0 z-50 pointer-events-none w-[300px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-[8px_8px_0px_var(--shadow-brutal)] overflow-hidden"
          style={{
            x: springX,
            y: springY,
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative aspect-video w-full bg-[var(--bg-surface)] overflow-hidden border-b border-[var(--border-hairline)]">
            <img
              src={getSafeThumb(hoveredPost)}
              alt={`${hoveredPost.title} episode cover`}
              referrerPolicy="no-referrer"
              onError={() => handleThumbError(hoveredPost)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-3 font-mono text-[11px] font-bold tabular-nums text-white tracking-wider">
              {hoveredPost.id} · {getSourceLabel(hoveredPost)}
            </span>
          </div>
          <div className="p-3">
            <p className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
              {hoveredPost.title}
            </p>
            {hoveredPost.tags && hoveredPost.tags.length > 0 && (
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                {hoveredPost.tags.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
