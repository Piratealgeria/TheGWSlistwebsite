import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, copyToClipboard } from '../utils';

export const ClickToCopy = ({
  text,
  children,
  className,
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent | React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('a')) return;

    const selection = typeof window !== 'undefined' ? window.getSelection()?.toString() : '';
    if (selection && selection.trim().length > 0) return;

    e.stopPropagation();
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy(e);
        }
      }}
      className={cn(
        'cursor-pointer transition-colors relative group/copy inline-flex items-center w-full break-words outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        className
      )}
    >
      <span className="flex-1 min-w-0 break-words">{children}</span>
      <span
        className={cn(
          'relative ml-3 opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0 flex items-center gap-1 text-xs font-mono',
          copied && 'opacity-100'
        )}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--accent)] whitespace-nowrap"
            >
              Copied
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
};
