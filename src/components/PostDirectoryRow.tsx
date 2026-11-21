import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PostMetadata } from '../types';
import { fetchPostContent } from '../api';
import { ThumbnailFrame } from './ThumbnailFrame';

interface PostDirectoryRowProps {
  post: PostMetadata;
  index: number;
}

export const PostDirectoryRow = ({ post, index }: PostDirectoryRowProps) => {
  const handlePrefetch = () => {
    if (!post.content) {
      fetchPostContent(post.file).catch(() => {});
    }
  };

  const trackPreview =
    post.previewTracks && post.previewTracks.length > 0
      ? post.previewTracks.join(' · ')
      : post.excerpt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.25), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/post/${post.id}`}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-4 sm:py-5 px-3 -mx-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-zinc-900/70 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400"
      >
        {/* Tabular Episode Number + Thumbnail */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="w-10 font-mono text-xs font-medium tabular-nums text-stone-500 dark:text-zinc-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            #{post.id.padStart(3, '0')}
          </span>
          <ThumbnailFrame
            src={post.thumbnail}
            alt={post.title}
            episodeLabel={post.title}
            className="w-28 sm:w-32 md:w-36 rounded-lg shrink-0"
          />
        </div>

        {/* Episode Title, Clean Unboxed Metadata, and Tracklist Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-zinc-400 mb-1">
            <span>{post.videoUrl ? (post.videoUrl.includes('odysee.com') ? 'Odysee Video' : 'YouTube Video') : 'Archive Note'}</span>
            {typeof post.trackCount === 'number' && post.trackCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{post.trackCount} tracks</span>
              </>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.tags.slice(0, 2).join(' · ')}</span>
              </>
            )}
          </div>

          <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
            {post.title}
          </h2>

          {trackPreview && (
            <p className="text-sm text-stone-600 dark:text-zinc-400 line-clamp-1 mt-1">
              {trackPreview}
            </p>
          )}
        </div>

        {/* Action Affordance */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors shrink-0 whitespace-nowrap">
          <span>Open Notes</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </motion.div>
  );
};
