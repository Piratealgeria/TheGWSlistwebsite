import React, { useState } from 'react';
import { ClickToCopy } from './ClickToCopy';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../utils';

export const CodeBlock = ({ children, className }: any) => {
  const [copied, setCopied] = useState(false);

  const getText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getText).join('');
    if (node?.props?.children) return getText(node.props.children);
    return '';
  };

  const textContent = getText(children).trim();

  const handleCopy = async () => {
    const success = await copyToClipboard(textContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-8 border border-[var(--border-strong)] bg-[var(--bg-surface)]">
      <div className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          Notes Snippet
        </span>
        <button
          onClick={handleCopy}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[var(--accent)] font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-sm font-mono text-[var(--text-primary)] leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export const FormattedLine = ({ children }: { children: React.ReactNode }) => {
  const getText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getText).join('');
    if (node?.props?.children) return getText(node.props.children);
    return '';
  };

  const fullText = getText(children);
  const timestampRegex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*(.*)/;
  const match = fullText.match(timestampRegex);

  const categoryRegex = /^(-?\s*(?!http|https)[a-zA-Z0-9_]+)\s*:\s*(.*)/i;
  const categoryMatch = fullText.match(categoryRegex);

  if (match) {
    const timestamp = match[1];
    const rest = match[2].trim();

    const restNodes = React.Children.map(children, (child, index) => {
      if (index === 0 && typeof child === 'string') {
        const tsMatch = child.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*(.*)/);
        if (tsMatch) return tsMatch[2].trim();
      }
      return child;
    });

    return (
      <span className="flex items-baseline gap-4 w-full break-words">
        <span className="text-[var(--accent)] font-mono tabular-nums shrink-0 font-bold text-sm">
          {timestamp}
        </span>
        {rest ? (
          <ClickToCopy text={rest} className="flex-1">
            {restNodes}
          </ClickToCopy>
        ) : null}
      </span>
    );
  }

  if (categoryMatch) {
    const textToCopy = categoryMatch[2].trim();
    return (
      <ClickToCopy text={textToCopy} className="w-full">
        {children}
      </ClickToCopy>
    );
  }

  return (
    <ClickToCopy text={fullText} className="w-full">
      {children}
    </ClickToCopy>
  );
};

export const CopyableListItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <li className="relative py-3.5 px-4 transition-colors duration-150 list-none border-b border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] flex items-baseline gap-4 text-sm md:text-base">
      <div className="flex-1 min-w-0 break-words text-[var(--text-primary)]">
        <FormattedLine>{children}</FormattedLine>
      </div>
    </li>
  );
};

export const VideoEmbed = ({ url }: { url: string }) => {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return null;
  }

  const isYoutube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  const isOdysee = cleanUrl.includes('odysee.com');

  let embedUrl = '';
  if (isYoutube) {
    const ytMatch = cleanUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})(?![ \w-])/
    );
    if (ytMatch && ytMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;

      const timeMatch = cleanUrl.match(/[?&](?:t|start)=([0-9hms]+)/i);
      if (timeMatch) {
        const rawTime = timeMatch[1];
        if (/^\d+$/.test(rawTime)) {
          const sec = parseInt(rawTime, 10);
          if (sec > 0) embedUrl += `?start=${sec}`;
        } else {
          const hours = (rawTime.match(/(\d+)h/i) || [])[1];
          const minutes = (rawTime.match(/(\d+)m/i) || [])[1];
          const seconds = (rawTime.match(/(\d+)s/i) || [])[1];
          let total = 0;
          if (hours) total += parseInt(hours, 10) * 3600;
          if (minutes) total += parseInt(minutes, 10) * 60;
          if (seconds) total += parseInt(seconds, 10);
          if (total > 0) embedUrl += `?start=${total}`;
        }
      }
    }
  } else if (isOdysee) {
    if (cleanUrl.includes('odysee.com/$/embed/')) {
      embedUrl = cleanUrl;
    } else {
      embedUrl = cleanUrl.replace(/https?:\/\/(?:www\.)?odysee\.com\//i, 'https://odysee.com/$/embed/');
    }
  }

  if (!embedUrl) {
    return (
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] hover:underline underline-offset-4 font-semibold break-all"
      >
        {cleanUrl}
      </a>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black border border-[var(--border-strong)] overflow-hidden my-10 shadow-[6px_6px_0px_var(--shadow-brutal)]">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="Video player"
      />
    </div>
  );
};
