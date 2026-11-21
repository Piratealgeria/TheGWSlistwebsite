import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils';

export const CopyLinkButton = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const success = await copyToClipboard(targetUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-[var(--text-primary)] transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 cursor-pointer"
      aria-label={copied ? 'Link copied to clipboard' : 'Copy link to clipboard'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
};
