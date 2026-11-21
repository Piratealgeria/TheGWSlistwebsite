import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { parseEpisodeBody } from './post-parser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.resolve(__dirname, '../.thumbnailCache.json');
let thumbnailCache = new Map<string, string>();
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    thumbnailCache = new Map(Object.entries(data));
  }
} catch (e) {
  console.warn('Could not load thumbnail cache', e);
}

const saveThumbnailCache = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(thumbnailCache)));
  } catch (e) {
    console.error('Could not save thumbnail cache', e);
  }
};

const isSafePublicUrl = (urlStr: string): boolean => {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('127.') ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
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
    const isOdysee = url.includes('odysee.com');
    const targetUrl = isOdysee ? `https://odysee.com/$/oembed?url=${encodeURIComponent(url)}` : url;

    const response = await axios.get(targetUrl, {
      timeout: 10000,
      maxRedirects: 0,
      maxContentLength: 512 * 1024,
      maxBodyLength: 512 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: isOdysee ? 'application/json' : 'text/html,application/xhtml+xml',
      },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    let imageUrl: string | null = null;
    if (isOdysee && response.data?.thumbnail_url) {
      imageUrl = response.data.thumbnail_url;
    } else if (!isOdysee && typeof response.data === 'string') {
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
    console.error(`Error fetching thumbnail for ${url}:`, err.message);
  }
  return null;
};

async function generate() {
  const postsDir = path.resolve(__dirname, '../public/posts');

  if (!fs.existsSync(postsDir)) {
    console.error(`Posts directory not found at: ${postsDir}`);
    fs.writeFileSync(path.resolve(__dirname, '../public/posts.json'), '[]');
    return;
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md') || f.endsWith('.html'));
  console.log(`Generating cache for ${files.length} posts...`);

  let index = 0;
  const postsPromises = files.map((file) => async () => {
    try {
      const filePath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(fileContent);

      const getThumbnailOrYtId = (url: string): { ytId?: string; imgUrl?: string } => {
        if (!url) return {};
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})(?![ \w-])/);
        if (ytMatch) return { ytId: ytMatch[1] };

        const cleanUrl = url.split('?')[0];
        const odyseeMatch =
          cleanUrl.match(/odysee\.com\/.*\/([\w-]{11})(?::[a-f0-9]+)?$/i) ||
          cleanUrl.match(/odysee\.com\/.*?[:\/]([\w-]{11})(?::[a-f0-9]+)?$/i);
        if (odyseeMatch) return { ytId: odyseeMatch[1] };

        if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return { imgUrl: url };
        return {};
      };

      let thumbnail = '';
      let videoUrl: string | null = null;

      if (data.thumbnail) {
        videoUrl = data.thumbnail;
        const parsedThumb = getThumbnailOrYtId(data.thumbnail);
        if (parsedThumb.ytId) {
          thumbnail = await resolveYouTubeThumbnail(parsedThumb.ytId);
        } else if (parsedThumb.imgUrl) {
          thumbnail = parsedThumb.imgUrl;
        } else if (data.thumbnail.includes('odysee.com')) {
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
          const idMatch = ytMatch[1].match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
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
          const idMatch = ytMatch[1].match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
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
        (!thumbnail.includes('img.youtube.com') &&
          !/\.(jpg|jpeg|png|webp|gif|svg)/i.test(thumbnail) &&
          !thumbnail.startsWith('http'))
      ) {
        thumbnail = '';
      }

      const isValidVideoUrl = (url: string | null) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('odysee.com');
      };

      const title = data.title || file.replace(/\.[^/.]+$/, '');
      const { trackCount, previewTracks, tags, excerpt } = parseEpisodeBody(body, data, title);

      const postData = {
        id: data.id?.toString() || file.replace(/\.[^/.]+$/, ''),
        numericId: typeof data.id === 'number' ? data.id : parseInt(String(data.id || file).replace(/\D/g, '')) || 0,
        title,
        file,
        type: file.endsWith('.md') ? 'md' : 'html',
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

      index++;
      console.log(`Processed ${index}/${files.length}: ${postData.title} (${tags.length} tags)`);
      return postData;
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
      return null;
    }
  });

  const resolvedPosts: any[] = [];
  const CHUNK_SIZE = 8;
  for (let i = 0; i < postsPromises.length; i += CHUNK_SIZE) {
    const chunk = postsPromises.slice(i, i + CHUNK_SIZE).map((fn) => fn());
    const results = await Promise.all(chunk);
    resolvedPosts.push(...results);
  }

  const posts = resolvedPosts
    .filter((p): p is any => p !== null)
    .sort((a, b) => (b.numericId || 0) - (a.numericId || 0));

  fs.writeFileSync(path.resolve(__dirname, '../public/posts.json'), JSON.stringify(posts, null, 2));
  console.log('Successfully generated public/posts.json');

  // Generate static fallback XML Sitemap (server.ts dynamically serves live origin)
  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://vikingalgeria.com').replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];
  const sitemapUrls = [
    `  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...posts.map(
      (p) =>
        `  <url>\n    <loc>${siteUrl}/post/${encodeURIComponent(p.id)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.xml'), sitemapContent);
  console.log(`Successfully generated public/sitemap.xml with ${posts.length + 1} URLs`);

  // Generate robots.txt
  const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync(path.resolve(__dirname, '../public/robots.txt'), robotsContent);
  console.log('Successfully generated public/robots.txt');
}

generate().catch(console.error);
