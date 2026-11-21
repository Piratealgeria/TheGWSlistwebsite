import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { cn } from '../utils';

interface ThumbnailFrameProps {
  src?: string;
  alt: string;
  episodeLabel?: string;
  className?: string;
  aspectClassName?: string;
}

export const ThumbnailFrame = ({
  src,
  alt,
  episodeLabel,
  className,
  aspectClassName = 'aspect-video',
}: ThumbnailFrameProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(!src);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-stone-200 dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800',
        aspectClassName,
        className
      )}
    >
      {!errored && src ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-stone-200 dark:bg-zinc-900 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setErrored(true);
              setLoaded(true);
            }}
            className={cn(
              'w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 text-stone-500 dark:text-zinc-500 p-2 text-center">
          <Film className="w-5 h-5 mb-1 opacity-70" />
          {episodeLabel && (
            <span className="font-mono text-[10px] tracking-wider uppercase opacity-80 tabular-nums">
              {episodeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
