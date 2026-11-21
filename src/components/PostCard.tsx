import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../utils';
import { PostMetadata } from '../types';
import { fetchPostContent } from '../api';
import swissPosterFallback from '../assets/images/viking_og_cover_1795291226398.jpg';

export const PostCard = ({ post }: { post: PostMetadata; index?: number }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackTier, setFallbackTier] = useState<0 | 1 | 2>(() =>
    !post.thumbnail || post.thumbnail.includes('picsum.photos') ? 2 : 0
  );

  const imgSrc =
    fallbackTier >= 2 || !post.thumbnail
      ? swissPosterFallback
      : fallbackTier === 1 && post.thumbnail.includes('maxresdefault.jpg')
      ? post.thumbnail.replace('maxresdefault.jpg', 'hqdefault.jpg')
      : post.thumbnail;
  const displayId = post.numericId ? String(post.numericId).padStart(3, '0') : post.id;

  return (
    <Link
      to={`/post/${post.id}`}
      onMouseEnter={() => fetchPostContent(post.file).catch(() => {})}
      className="group flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--accent)] transition-colors duration-200 hover:shadow-[6px_6px_0px_var(--shadow-brutal)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {/* Artwork Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-surface)] border-b border-[var(--border-hairline)]">
        {!isLoaded && (
          <div className="absolute inset-0 bg-[var(--bg-surface)] animate-pulse" />
        )}
        <img
          src={imgSrc}
          alt={`${post.title} soundtrack tracklist - Viking Algeria`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (fallbackTier === 0 && post.thumbnail?.includes('maxresdefault.jpg')) {
              setFallbackTier(1);
            } else {
              setIsLoaded(true);
              setFallbackTier(2);
            }
          }}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
          <span className="font-mono text-xs font-bold tabular-nums tracking-wider">
            {displayId}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            Open <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Clean Unboxed Metadata & Title */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-display text-lg md:text-xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {post.title}
          </h3>
        </div>

        <div className="text-xs text-[var(--text-muted)] truncate">
          {post.tags && post.tags.length > 0
            ? post.tags.slice(0, 3).join(' · ')
            : 'Soundtrack Tracklist · Timestamps'}
        </div>
      </div>
    </Link>
  );
};
