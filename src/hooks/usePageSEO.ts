import { useEffect } from 'react';

export interface SEOProps {
  enabled?: boolean;
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: 'website' | 'article';
  schema?: Record<string, any>;
}

function getDefaultOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://vikingalgeria.com';
}

function getImageMimeType(imageUrl: string): string {
  if (/thumbnails\.odycdn\.com\/card\//i.test(imageUrl)) return 'image/jpeg';
  const clean = imageUrl.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export function usePageSEO({
  enabled = true,
  title,
  description,
  keywords = [],
  canonicalUrl,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  type = 'website',
  schema,
}: SEOProps) {
  const keywordsKey = (keywords || []).join(',');
  const schemaKey = schema ? JSON.stringify(schema) : '';

  useEffect(() => {
    if (!enabled) return;

    document.title = title;

    const setMeta = (attr: 'name' | 'property', name: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const removeMeta = (attr: 'name' | 'property', name: string) => {
      const els = document.querySelectorAll(`meta[${attr}="${name}"]`);
      els.forEach((el) => el.remove());
    };

    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      const selector = extra?.type ? `link[rel="${rel}"][type="${extra.type}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
      }
      el.setAttribute('href', href);
    };

    const origin = getDefaultOrigin();
    const resolvedUrl =
      canonicalUrl ||
      (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : `${origin}/`);
    const resolvedImage = image || `${origin}/og-cover.jpg`;
    const altText = imageAlt || title;

    let resolvedWidth = imageWidth;
    let resolvedHeight = imageHeight;
    if (!resolvedWidth || !resolvedHeight) {
      if (resolvedImage.includes('/og-cover.jpg')) {
        resolvedWidth = 1280;
        resolvedHeight = 720;
      } else if (resolvedImage.includes('maxresdefault.jpg')) {
        resolvedWidth = 1280;
        resolvedHeight = 720;
      } else if (resolvedImage.includes('hqdefault.jpg')) {
        resolvedWidth = 480;
        resolvedHeight = 360;
      } else {
        const odyseeSizeMatch = resolvedImage.match(/thumbnails\.odycdn\.com\/card\/s:(\d+):(\d+)\//i);
        if (odyseeSizeMatch) {
          resolvedWidth = parseInt(odyseeSizeMatch[1], 10);
          resolvedHeight = parseInt(odyseeSizeMatch[2], 10);
        }
      }
    }

    setMeta('name', 'description', description);
    if (keywords.length > 0) {
      setMeta('name', 'keywords', keywords.join(', '));
    }
    setMeta('name', 'author', 'Viking Algeria');
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setLink('canonical', resolvedUrl);
    setLink('alternate', `${origin}/api/oembed?url=${encodeURIComponent(resolvedUrl)}`, {
      type: 'application/json+oembed',
      title,
    });

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Viking Algeria');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', resolvedUrl);
    setMeta('property', 'og:image', resolvedImage);
    if (resolvedImage.startsWith('https://')) {
      setMeta('property', 'og:image:secure_url', resolvedImage);
    } else {
      removeMeta('property', 'og:image:secure_url');
    }
    setMeta('property', 'og:image:type', getImageMimeType(resolvedImage));
    setMeta('property', 'og:image:alt', altText);
    setMeta('property', 'og:locale', 'en_US');

    if (resolvedWidth && resolvedHeight) {
      setMeta('property', 'og:image:width', String(resolvedWidth));
      setMeta('property', 'og:image:height', String(resolvedHeight));
    } else {
      removeMeta('property', 'og:image:width');
      removeMeta('property', 'og:image:height');
    }

    removeMeta('property', 'article:tag');
    if (type === 'article') {
      setMeta('property', 'article:author', 'Viking Algeria');
      setMeta('property', 'article:section', 'Anime Soundtracks & Tracklists');
      keywords.slice(0, 10).forEach((kw) => {
        const tagMeta = document.createElement('meta');
        tagMeta.setAttribute('property', 'article:tag');
        tagMeta.setAttribute('content', kw);
        document.head.appendChild(tagMeta);
      });
    } else {
      removeMeta('property', 'article:author');
      removeMeta('property', 'article:section');
    }

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:site', '@VikingAlgeria');
    setMeta('name', 'twitter:creator', '@VikingAlgeria');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', resolvedImage);
    setMeta('name', 'twitter:image:alt', altText);
    setMeta('name', 'twitter:url', resolvedUrl);

    const scriptId = 'page-schema-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema, null, 2);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      removeMeta('property', 'article:tag');
    };
  }, [enabled, title, description, keywordsKey, canonicalUrl, image, imageAlt, imageWidth, imageHeight, type, schemaKey]);
}
