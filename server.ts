import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import axios from "axios";
import { parseEpisodeBody } from "./scripts/post-parser.ts";

// Simple in-memory cache for thumbnails, persisted to disk
const CACHE_FILE = path.join(process.cwd(), ".thumbnailCache.json");
let thumbnailCache = new Map<string, string>();
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    thumbnailCache = new Map(Object.entries(data));
  }
} catch (e) {
  console.warn("Could not load thumbnail cache", e);
}

const saveThumbnailCache = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(thumbnailCache)));
  } catch (e) {
    console.error("Could not save thumbnail cache", e);
  }
};

const isSafePublicUrl = (urlStr: string): boolean => {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.startsWith("127.") ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost") ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(hostname) ||
      /^0x[0-9a-f]+/i.test(hostname) ||
      /^\d+$/.test(hostname) ||
      /^\[.*\]$/.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const resolveYouTubeThumbnail = async (videoId: string): Promise<string> => {
  const cacheKey = `yt-res:${videoId}`;
  const cached = thumbnailCache.get(cacheKey);
  if (cached) return cached;

  const maxresUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hqUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const resp = await axios.head(maxresUrl, {
      timeout: 3500,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 500,
    });
    const resolved = resp.status === 200 ? maxresUrl : hqUrl;
    thumbnailCache.set(cacheKey, resolved);
    saveThumbnailCache();
    return resolved;
  } catch {
    return hqUrl;
  }
};

const fetchOgImage = async (url: string) => {
  if (!url || !isSafePublicUrl(url)) return null;
  if (thumbnailCache.has(url)) return thumbnailCache.get(url);

  try {
    const isOdysee = url.includes("odysee.com");
    const targetUrl = isOdysee ? `https://odysee.com/$/oembed?url=${encodeURIComponent(url)}` : url;

    const response = await axios.get(targetUrl, {
      timeout: 5000,
      maxRedirects: 0,
      maxContentLength: 512 * 1024,
      maxBodyLength: 512 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: isOdysee ? "application/json" : "text/html,application/xhtml+xml",
      },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    let imageUrl: string | null = null;
    if (isOdysee && response.data?.thumbnail_url) {
      imageUrl = response.data.thumbnail_url;
    } else if (!isOdysee && typeof response.data === "string") {
      const html = response.data.slice(0, 100000);
      const match =
        html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (match) imageUrl = match[1];
    }

    if (imageUrl && isSafePublicUrl(imageUrl)) {
      thumbnailCache.set(url, imageUrl);
      saveThumbnailCache();
      return imageUrl;
    }
  } catch (err: any) {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      console.warn(`[Timeout] Could not fetch thumbnail for ${url}`);
    } else {
      console.error(`Error fetching thumbnail for ${url}:`, err.message);
    }
  }
  return null;
};

// In-memory cache for parsed post data, validates against mtime
const fileCache = new Map<string, { mtimeMs: number; post: any }>();

function escapeHtml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

let postsJsonCache: { mtimeMs: number; posts: any[] } | null = null;

function loadAllPostsFromDisk(): any[] {
  const postsJsonPath = path.resolve(process.cwd(), "public", "posts.json");
  if (fs.existsSync(postsJsonPath)) {
    try {
      const stats = fs.statSync(postsJsonPath);
      if (postsJsonCache && postsJsonCache.mtimeMs === stats.mtimeMs) {
        return postsJsonCache.posts;
      }
      const parsed = JSON.parse(fs.readFileSync(postsJsonPath, "utf-8"));
      if (Array.isArray(parsed)) {
        postsJsonCache = { mtimeMs: stats.mtimeMs, posts: parsed };
        return parsed;
      }
    } catch {
      // Fall back to in-memory cache
    }
  }
  return Array.from(fileCache.values()).map((entry) => entry.post);
}

function findPostByIdOrSlug(idOrSlug: string): any {
  if (!idOrSlug) return null;
  const decoded = safeDecodeURIComponent(idOrSlug).trim().toLowerCase();
  const posts = loadAllPostsFromDisk();
  return (
    posts.find(
      (p: any) =>
        String(p.id).toLowerCase() === decoded ||
        p.file?.replace(/\.[^/.]+$/, "").toLowerCase() === decoded ||
        String(p.title).toLowerCase() === decoded ||
        String(p.numericId) === decoded
    ) || null
  );
}

function getSafeSiteUrl(req: express.Request): string {
  const rawProto = String(req.headers["x-forwarded-proto"] || req.protocol || "https")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const rawHost = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  const isLocalHost = /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(rawHost);

  if (rawHost && !isLocalHost && /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(rawHost)) {
    return `https://${rawHost}`;
  }

  const envAppUrl = (process.env.APP_URL || "").trim().replace(/\/+$/, "");
  if (envAppUrl && /^https?:\/\/[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(envAppUrl)) {
    return envAppUrl;
  }

  if (rawHost && /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(rawHost)) {
    const localProto = rawProto === "https" ? "https" : "http";
    return `${localProto}://${rawHost}`;
  }

  return "https://vikingalgeria.com";
}

function removeMetaTags(html: string, attr: "name" | "property", key: string): string {
  const escapedKey = escapeRegex(key);
  const pattern = new RegExp(
    `<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${escapedKey}["'][^>]*>\\s*`,
    "gi"
  );
  return html.replace(pattern, "");
}

function upsertMetaTag(html: string, attr: "name" | "property", key: string, value: string): string {
  const cleaned = removeMetaTags(html, attr, key);
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  return cleaned.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertLinkTag(html: string, rel: string, href: string, extraAttrs = ""): string {
  const escapedRel = escapeRegex(rel);
  const pattern = new RegExp(`<link\\b[^>]*\\brel\\s*=\\s*["']${escapedRel}["'][^>]*>\\s*`, "gi");
  const cleaned = html.replace(pattern, "");
  const tag = `<link rel="${rel}"${extraAttrs ? ` ${extraAttrs}` : ""} href="${escapeHtml(href)}" />`;
  return cleaned.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceJsonLd(html: string, schemaObj: Record<string, any>): string {
  const cleaned = html.replace(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    ""
  );
  const safeJson = JSON.stringify(schemaObj, null, 2).replace(/</g, "\\u003c");
  const script = `<script type="application/ld+json" id="page-schema-jsonld">\n    ${safeJson}\n    </script>`;
  return cleaned.replace("</head>", `    ${script}\n  </head>`);
}

function getImageDimensions(imageUrl: string): { width?: number; height?: number } {
  if (imageUrl.includes("/og-cover.jpg")) return { width: 1280, height: 720 };
  if (imageUrl.includes("maxresdefault.jpg")) return { width: 1280, height: 720 };
  if (imageUrl.includes("hqdefault.jpg")) return { width: 480, height: 360 };
  const odyseeSizeMatch = imageUrl.match(/thumbnails\.odycdn\.com\/card\/s:(\d+):(\d+)\//i);
  if (odyseeSizeMatch) {
    return {
      width: parseInt(odyseeSizeMatch[1], 10),
      height: parseInt(odyseeSizeMatch[2], 10),
    };
  }
  return {};
}

function getImageMimeType(imageUrl: string): string {
  if (/thumbnails\.odycdn\.com\/card\//i.test(imageUrl)) return "image/jpeg";
  const clean = imageUrl.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

interface SeoBundle {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  image: string;
  imageAlt: string;
  ogType: "website" | "article";
  themeColor?: string;
  articleTags?: string[];
  schema: Record<string, any>;
}

function applySeoBundle(html: string, bundle: SeoBundle, siteUrl: string): string {
  const oembedUrl = `${siteUrl}/api/oembed?url=${encodeURIComponent(bundle.canonicalUrl)}`;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(bundle.title)}</title>`);
  html = upsertMetaTag(html, "name", "description", bundle.description);
  html = upsertMetaTag(html, "name", "keywords", bundle.keywords);
  if (bundle.themeColor) {
    html = upsertMetaTag(html, "name", "theme-color", bundle.themeColor);
  }
  html = upsertLinkTag(html, "canonical", bundle.canonicalUrl);
  html = upsertLinkTag(
    html,
    "alternate",
    oembedUrl,
    `type="application/json+oembed" title="${escapeHtml(bundle.title)}"`
  );

  html = upsertMetaTag(html, "property", "og:type", bundle.ogType);
  html = upsertMetaTag(html, "property", "og:site_name", "Viking Algeria");
  html = upsertMetaTag(html, "property", "og:url", bundle.canonicalUrl);
  html = upsertMetaTag(html, "property", "og:title", bundle.title);
  html = upsertMetaTag(html, "property", "og:description", bundle.description);
  html = upsertMetaTag(html, "property", "og:image", bundle.image);
  if (bundle.image.startsWith("https://")) {
    html = upsertMetaTag(html, "property", "og:image:secure_url", bundle.image);
  } else {
    html = removeMetaTags(html, "property", "og:image:secure_url");
  }
  html = upsertMetaTag(html, "property", "og:image:type", getImageMimeType(bundle.image));
  html = upsertMetaTag(html, "property", "og:image:alt", bundle.imageAlt);
  html = upsertMetaTag(html, "property", "og:locale", "en_US");

  const dims = getImageDimensions(bundle.image);
  if (dims.width && dims.height) {
    html = upsertMetaTag(html, "property", "og:image:width", String(dims.width));
    html = upsertMetaTag(html, "property", "og:image:height", String(dims.height));
  } else {
    html = removeMetaTags(html, "property", "og:image:width");
    html = removeMetaTags(html, "property", "og:image:height");
  }

  html = removeMetaTags(html, "property", "article:tag");
  html = removeMetaTags(html, "property", "article:author");
  html = removeMetaTags(html, "property", "article:section");
  if (bundle.ogType === "article") {
    html = upsertMetaTag(html, "property", "article:author", "Viking Algeria");
    html = upsertMetaTag(html, "property", "article:section", "Anime Soundtracks & Tracklists");
    for (const tag of (bundle.articleTags || []).slice(0, 10)) {
      html = html.replace(
        "</head>",
        `    <meta property="article:tag" content="${escapeHtml(tag)}" />\n  </head>`
      );
    }
  }

  html = upsertMetaTag(html, "name", "twitter:card", "summary_large_image");
  html = upsertMetaTag(html, "name", "twitter:site", "@VikingAlgeria");
  html = upsertMetaTag(html, "name", "twitter:creator", "@VikingAlgeria");
  html = upsertMetaTag(html, "name", "twitter:url", bundle.canonicalUrl);
  html = upsertMetaTag(html, "name", "twitter:title", bundle.title);
  html = upsertMetaTag(html, "name", "twitter:description", bundle.description);
  html = upsertMetaTag(html, "name", "twitter:image", bundle.image);
  html = upsertMetaTag(html, "name", "twitter:image:alt", bundle.imageAlt);

  html = replaceJsonLd(html, bundle.schema);
  return html;
}

function buildPostSeoBundle(post: any, siteUrl: string): SeoBundle {
  const canonicalUrl = `${siteUrl}/post/${encodeURIComponent(post.id)}`;
  const twoTagTitle =
    post.tags && post.tags.length > 0
      ? `${post.title} Tracklist — ${post.tags.slice(0, 2).join(", ")} | Viking Algeria`
      : `${post.title} Tracklist | Viking Algeria`;
  const oneTagTitle =
    post.tags && post.tags.length > 0
      ? `${post.title} Tracklist — ${post.tags[0]} | Viking Algeria`
      : `${post.title} Tracklist | Viking Algeria`;
  const title =
    twoTagTitle.length <= 64
      ? twoTagTitle
      : oneTagTitle.length <= 64
      ? oneTagTitle
      : `${post.title} Tracklist | Viking Algeria`;

  const topTags = post.tags && post.tags.length > 0 ? post.tags.slice(0, 3).join(", ") : "";
  const description =
    post.excerpt ||
    (topTags
      ? `${post.title} tracklist and timestamps featuring ${topTags}. Full song credits on Viking Algeria.`
      : `${post.title} soundtrack tracklist, anime & game credits, and timestamps on Viking Algeria.`);

  const image =
    post.thumbnail && !post.thumbnail.includes("picsum.photos")
      ? post.thumbnail
      : `${siteUrl}/og-cover.jpg`;
  const keywords = [
    ...(post.tags || []),
    post.title,
    "Viking Algeria",
    "anime soundtracks",
    "tracklist",
    "timestamps",
  ].join(", ");

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    image,
    imageAlt: `${post.title} — Viking Algeria episode cover`,
    ogType: "article",
    themeColor: "#FF4D29",
    articleTags: post.tags || [],
    schema: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: `${post.title} — Anime & Gaming Soundtrack Tracklist`,
      description,
      image: [image],
      url: canonicalUrl,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      author: {
        "@type": "Organization",
        name: "Viking Algeria",
        url: `${siteUrl}/`,
      },
      publisher: {
        "@type": "Organization",
        name: "Viking Algeria",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon.png`,
        },
      },
      keywords,
      ...(post.videoUrl
        ? {
            video: {
              "@type": "VideoObject",
              name: `${post.title} — Viking Algeria`,
              description,
              thumbnailUrl: [image],
              contentUrl: post.videoUrl,
              embedUrl: post.videoUrl,
            },
          }
        : {}),
    },
  };
}

function buildHomeSeoBundle(siteUrl: string, query?: string): SeoBundle {
  const trimmed = (query || "").trim();
  const posts = loadAllPostsFromDisk();

  if (trimmed) {
    const qLower = trimmed.toLowerCase();
    const matches = posts.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(qLower) ||
        p.id?.toLowerCase().includes(qLower) ||
        p.excerpt?.toLowerCase().includes(qLower) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(qLower)) ||
        p.previewTracks?.some((tr: string) => tr.toLowerCase().includes(qLower))
    );
    const canonicalUrl = `${siteUrl}/?q=${encodeURIComponent(trimmed)}`;
    const image =
      matches[0]?.thumbnail && !matches[0].thumbnail.includes("picsum.photos")
        ? matches[0].thumbnail
        : `${siteUrl}/og-cover.jpg`;
    const description = `Browse ${matches.length} Viking Algeria episode${matches.length === 1 ? "" : "s"} matching "${trimmed}" with verified soundtracks and timestamps.`;

    return {
      title: `${trimmed} Soundtracks & Tracklists | Viking Algeria`,
      description,
      keywords: `${trimmed}, Viking Algeria, anime soundtracks, tracklist, timestamps`,
      canonicalUrl,
      image,
      imageAlt: `${trimmed} — Viking Algeria Soundtrack Archive`,
      ogType: "website",
      themeColor: "#FF4D29",
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${trimmed} | Viking Algeria`,
        description,
        url: canonicalUrl,
        publisher: {
          "@type": "Organization",
          name: "Viking Algeria",
          url: `${siteUrl}/`,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/icon.png`,
          },
        },
      },
    };
  }

  const episodeCount = posts.length || 102;
  const description = `Explore ${episodeCount} Viking Algeria Gifs With Sound episodes featuring verified anime & game sources, song credits, and instant-copy tracklist timestamps.`;
  return {
    title: "Viking Algeria — Anime & Gaming Soundtrack Tracklists",
    description,
    keywords:
      "Viking Algeria, anime soundtracks, AMV tracklist, anime timestamps, anime OST, gaming soundtracks, song list, Demon Slayer, Genshin Impact, Bocchi the Rock",
    canonicalUrl: `${siteUrl}/`,
    image: `${siteUrl}/og-cover.jpg`,
    imageAlt: "Viking Algeria — Anime & Gaming Soundtrack Archive",
    ogType: "website",
    themeColor: "#FF4D29",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: "Viking Algeria",
          description,
          inLanguage: "en-US",
          potentialAction: [
            {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteUrl}/?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          ],
        },
        {
          "@type": "Blog",
          "@id": `${siteUrl}/#blog`,
          url: `${siteUrl}/`,
          name: "Viking Algeria Archives",
          description:
            "Curated anime and gaming soundtrack notes, timestamps, and source credits for Viking Algeria Gifs With Sound episodes.",
          inLanguage: "en-US",
          publisher: {
            "@id": `${siteUrl}/#organization`,
          },
        },
        {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "Viking Algeria",
          url: `${siteUrl}/`,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/icon.png`,
          },
        },
      ],
    },
  };
}

function injectRouteMetadata(html: string, pathname: string, req: express.Request): string {
  const siteUrl = getSafeSiteUrl(req);
  const postMatch = pathname.match(/^\/post\/([^\/?#]+)/);
  if (postMatch) {
    const post = findPostByIdOrSlug(postMatch[1]);
    if (post) {
      return applySeoBundle(html, buildPostSeoBundle(post, siteUrl), siteUrl);
    }
    return applySeoBundle(
      html,
      {
        title: "Episode Not Found | Viking Algeria",
        description:
          "This episode ID or slug is not in the Viking Algeria catalog. Browse all episodes and tracklists on Viking Algeria.",
        keywords: "Viking Algeria, anime soundtracks, tracklist, timestamps",
        canonicalUrl: `${siteUrl}/`,
        image: `${siteUrl}/og-cover.jpg`,
        imageAlt: "Viking Algeria — Anime & Gaming Soundtrack Archive",
        ogType: "website",
        themeColor: "#FF4D29",
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Episode Not Found | Viking Algeria",
          url: `${siteUrl}/`,
        },
      },
      siteUrl
    );
  }
  const query = typeof req.query.q === "string" ? req.query.q : undefined;
  return applySeoBundle(html, buildHomeSeoBundle(siteUrl, query), siteUrl);
}

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const PORT = 3000;

  // oEmbed discovery endpoint for Discord, Slack, and social unfurlers
  app.get("/api/oembed", (req, res) => {
    const siteUrl = getSafeSiteUrl(req);
    const rawUrl = typeof req.query.url === "string" ? req.query.url : `${siteUrl}/`;
    let targetPath = "/";
    let targetQuery: string | undefined;

    try {
      const parsed = new URL(rawUrl, siteUrl);
      targetPath = parsed.pathname;
      targetQuery = parsed.searchParams.get("q") || undefined;
    } catch {
      targetPath = "/";
    }

    const postMatch = targetPath.match(/^\/post\/([^\/?#]+)/);
    const post = postMatch ? findPostByIdOrSlug(postMatch[1]) : null;
    const bundle = post
      ? buildPostSeoBundle(post, siteUrl)
      : buildHomeSeoBundle(siteUrl, targetQuery);
    const dims = getImageDimensions(bundle.image);

    res.json({
      version: "1.0",
      type: "rich",
      provider_name: "Viking Algeria",
      provider_url: `${siteUrl}/`,
      title: bundle.title,
      author_name: "Viking Algeria",
      author_url: `${siteUrl}/`,
      thumbnail_url: bundle.image,
      thumbnail_width: dims.width || 1280,
      thumbnail_height: dims.height || 720,
      description: bundle.description,
    });
  });

  // Dynamic XML Sitemap reflecting live origin
  app.get("/sitemap.xml", (req, res) => {
    const siteUrl = getSafeSiteUrl(req);
    const posts = loadAllPostsFromDisk();
    const today = new Date().toISOString().split("T")[0];
    const urls = [
      `  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...posts.map(
        (p: any) =>
          `  <url>\n    <loc>${siteUrl}/post/${encodeURIComponent(p.id)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
    ];
    res
      .status(200)
      .set("Content-Type", "application/xml; charset=utf-8")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`
      );
  });

  app.get("/robots.txt", (req, res) => {
    const siteUrl = getSafeSiteUrl(req);
    res
      .status(200)
      .set("Content-Type", "text/plain; charset=utf-8")
      .send(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  // API route to list posts
  app.get("/api/posts", async (req, res) => {
    console.log(`[${new Date().toISOString()}] GET /api/posts`);
    const postsDir = path.resolve(process.cwd(), "public", "posts");

    if (!fs.existsSync(postsDir)) {
      console.error(`Posts directory not found at: ${postsDir}`);
      return res.json([]);
    }

    try {
      const files = fs.readdirSync(postsDir);

      const postsPromises = files
        .filter((file) => file.endsWith(".md") || file.endsWith(".html"))
        .map((file) => async () => {
          try {
            const filePath = path.join(postsDir, file);
            const stats = fs.statSync(filePath);
            const cached = fileCache.get(file);

            if (cached && cached.mtimeMs === stats.mtimeMs) {
              return cached.post;
            }

            const fileContent = fs.readFileSync(filePath, "utf-8");
            const { data, content: body } = matter(fileContent);

            const getThumbnailOrYtId = (url: string): { ytId?: string; imgUrl?: string } => {
              if (!url) return {};
              const ytMatch = url.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})(?![ \w-])/
              );
              if (ytMatch) return { ytId: ytMatch[1] };

              const cleanUrl = url.split("?")[0];
              const odyseeMatch =
                cleanUrl.match(/odysee\.com\/.*\/([\w-]{11})(?::[a-f0-9]+)?$/i) ||
                cleanUrl.match(/odysee\.com\/.*?[:\/]([\w-]{11})(?::[a-f0-9]+)?$/i);
              if (odyseeMatch) return { ytId: odyseeMatch[1] };

              if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return { imgUrl: url };
              return {};
            };

            let thumbnail = "";
            let videoUrl: string | null = null;

            if (data.thumbnail) {
              videoUrl = data.thumbnail;
              const parsedThumb = getThumbnailOrYtId(data.thumbnail);
              if (parsedThumb.ytId) {
                thumbnail = await resolveYouTubeThumbnail(parsedThumb.ytId);
              } else if (parsedThumb.imgUrl) {
                thumbnail = parsedThumb.imgUrl;
              } else if (data.thumbnail.includes("odysee.com")) {
                const ogImage = await fetchOgImage(data.thumbnail);
                if (ogImage) thumbnail = ogImage;
              }
            }

            if (!thumbnail) {
              const ytMatch = body.match(
                /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]{11})(?![ \w-])/
              );
              const odyseeMatch = body.match(/(https?:\/\/(?:www\.)?odysee\.com\/[^\s<)\]"']+)/);

              if (ytMatch && (!odyseeMatch || body.indexOf(ytMatch[1]) < body.indexOf(odyseeMatch[1]))) {
                videoUrl = videoUrl || ytMatch[1];
                const idMatch = ytMatch[1].match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
                );
                if (idMatch) thumbnail = await resolveYouTubeThumbnail(idMatch[1]);
              } else if (odyseeMatch) {
                videoUrl = videoUrl || odyseeMatch[1];
                const parsedOdysee = getThumbnailOrYtId(odyseeMatch[1]);
                if (parsedOdysee.ytId) {
                  thumbnail = await resolveYouTubeThumbnail(parsedOdysee.ytId);
                } else {
                  const ogImage = await fetchOgImage(odyseeMatch[1]);
                  if (ogImage) thumbnail = ogImage;
                }
              }

              if (!thumbnail && ytMatch) {
                videoUrl = videoUrl || ytMatch[1];
                const idMatch = ytMatch[1].match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
                );
                if (idMatch) thumbnail = await resolveYouTubeThumbnail(idMatch[1]);
              }

              if (!thumbnail) {
                const imgMatch = body.match(/!\[.*?\]\((.*?)\)/) || body.match(/<img.*?src="(.*?)"/);
                if (imgMatch) {
                  thumbnail = imgMatch[1];
                }
              }
            }

            if (
              !thumbnail ||
              (!thumbnail.includes("img.youtube.com") &&
                !/\.(jpg|jpeg|png|webp|gif|svg)/i.test(thumbnail) &&
                !thumbnail.startsWith("http"))
            ) {
              thumbnail = "";
            }

            const isValidVideoUrl = (url: string | null) => {
              if (!url) return false;
              return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("odysee.com");
            };

            const title = data.title || file.replace(/\.[^/.]+$/, "");
            const { trackCount, previewTracks, tags, excerpt } = parseEpisodeBody(body, data, title);

            const postData = {
              id: data.id?.toString() || file.replace(/\.[^/.]+$/, ""),
              numericId:
                typeof data.id === "number"
                  ? data.id
                  : parseInt(String(data.id || file).replace(/\D/g, "")) || 0,
              title,
              file,
              type: file.endsWith(".md") ? "md" : "html",
              thumbnail,
              videoUrl: isValidVideoUrl(videoUrl)
                ? videoUrl
                : isValidVideoUrl(data.thumbnail)
                ? data.thumbnail
                : null,
              excerpt,
              trackCount,
              previewTracks,
              tags,
              content: body,
            };

            fileCache.set(file, { mtimeMs: stats.mtimeMs, post: postData });
            return postData;
          } catch (err) {
            console.error(`Error processing file ${file}:`, err);
            return null;
          }
        });

      const resolvedPosts: any[] = [];
      const CHUNK_SIZE = 5;
      for (let i = 0; i < postsPromises.length; i += CHUNK_SIZE) {
        const chunk = postsPromises.slice(i, i + CHUNK_SIZE).map((fn) => fn());
        const results = await Promise.all(chunk);
        resolvedPosts.push(...results);
      }

      const posts = resolvedPosts
        .filter((p): p is any => p !== null)
        .sort((a, b) => (b.numericId || 0) - (a.numericId || 0));

      res.json(posts);
    } catch (error) {
      console.error("Error processing posts directory:", error);
      res.status(500).json({ error: "Failed to load posts" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(async (req, res, next) => {
      if (req.method !== "GET") return next();

      const pathname = req.path || "/";
      const isPageRoute = pathname === "/" || /^\/post\/[^\/?#]+\/?$/.test(pathname);
      if (!isPageRoute) return next();

      const fetchDest = req.headers["sec-fetch-dest"];
      if (fetchDest && fetchDest !== "document" && fetchDest !== "empty") {
        return next();
      }

      const accept = req.headers.accept || "";
      if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml("/", template);
        template = injectRouteMetadata(template, pathname, req);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist", { index: false }));
    app.get("*", (req, res) => {
      if (req.path.includes(".")) {
        return res.status(404).end();
      }
      const htmlPath = path.join(process.cwd(), "dist", "index.html");
      if (fs.existsSync(htmlPath)) {
        let template = fs.readFileSync(htmlPath, "utf-8");
        template = injectRouteMetadata(template, req.path || "/", req);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } else {
        res.sendFile(htmlPath);
      }
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof URIError) {
      return res.status(400).send("Bad Request");
    }
    return next(err);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
