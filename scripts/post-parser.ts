const CANONICAL_TAG_MAP: Record<string, string> = {
  'kaguya sama love is war': 'Kaguya-sama: Love Is War',
  'kaguya-sama love is war': 'Kaguya-sama: Love Is War',
  'kaguya-sama: love is war': 'Kaguya-sama: Love Is War',
  'sakurasou no pet na kanojo': 'Sakurasou no Pet na Kanojo',
  'ganchin impect': 'Genshin Impact',
  'ganchin impact': 'Genshin Impact',
  'genshin impact': 'Genshin Impact',
  'kimetsu no yaiba': 'Demon Slayer',
  'demon slayer': 'Demon Slayer',
  'attack on titans': 'Attack on Titan',
  'attack on titan': 'Attack on Titan',
  'shingeki no kyojin': 'Attack on Titan',
  'bocchi the rock': 'Bocchi the Rock!',
  'bocchi the rock!': 'Bocchi the Rock!',
  'chainsaw man': 'Chainsaw Man',
  'jujutsu kaisen': 'Jujutsu Kaisen',
  'sousou no frieren': 'Sousou no Frieren',
  'umamusume': 'Uma Musume',
  'uma musume': 'Uma Musume',
  'uma musume pretty derby': 'Uma Musume',
  'uma musume: pretty derby': 'Uma Musume',
  'uma musume: cinderella gray': 'Uma Musume: Cinderella Gray',
  'boku no hero academia': 'My Hero Academia',
  'my hero academia': 'My Hero Academia',
  'my dress up darling': 'My Dress-Up Darling',
  'my dress-up darling': 'My Dress-Up Darling',
  'kobayashi-san chi no maid dragon': 'Kobayashi-san Chi no Maid Dragon',
  're:zero': 'Re:Zero',
  're zero': 'Re:Zero',
  'rezero': 'Re:Zero',
  're:zero kara hajimeru isekai seikatsu': 'Re:Zero',
  'k-on': 'K-On!',
  'k-on!': 'K-On!',
  'girls und panzer': 'Girls und Panzer',
  'yofukashi no uta': 'Yofukashi no Uta',
  'call of the night': 'Yofukashi no Uta',
  'blue archive': 'Blue Archive',
  'yume nikki': 'Yume Nikki',
  'yume_nikki': 'Yume Nikki',
  'arknights': 'Arknights',
  'fire force': 'Fire Force',
  'konosuba': 'KonoSuba',
  'azur lane': 'Azur Lane',
  'monogatari': 'Monogatari',
  'monogatari series': 'Monogatari',
  'jojo': 'JoJo',
  "jojo's bizarre adventure": 'JoJo',
  'gta vace city': 'GTA Vice City',
  'gta vice city': 'GTA Vice City',
  'gta san and': 'GTA San Andreas',
  'gta san andreas': 'GTA San Andreas',
  'dr stone': 'Dr. Stone',
  'dr. stone': 'Dr. Stone',
  'zenless zone zero': 'Zenless Zone Zero',
  'wuthering waves': 'Wuthering Waves',
  'honkai: star rail': 'Honkai: Star Rail',
  'honkai star rail': 'Honkai: Star Rail',
  'cyberpunk edgerunners': 'Cyberpunk: Edgerunners',
  'cyberpunk 2077': 'Cyberpunk 2077',
  'lycoris recoil': 'Lycoris Recoil',
  'oshi no ko': 'Oshi no Ko',
  'dandadan': 'DanDaDan',
  'spy x family': 'SPY x FAMILY',
  'gachiakuta': 'Gachiakuta',
  'bungo stray dogs': 'Bungo Stray Dogs',
  'bungou stray dogs': 'Bungo Stray Dogs',
  'hell divers 2': 'Helldivers 2',
  'helldivers 2': 'Helldivers 2',
  'helldivers': 'Helldivers',
  'vinland saga': 'Vinland Saga',
  'nichijou': 'Nichijou',
  'fate/strange fake': 'Fate/strange Fake',
  'naruto': 'Naruto',
  'one piece': 'One Piece',
  'one punch man': 'One Punch Man',
  'evangelion': 'Evangelion',
  'neon genesis evangelion': 'Evangelion',
  'akira': 'AKIRA',
  'berserk': 'Berserk',
  'made in abyss': 'Made in Abyss',
  'vivy: fluorite eye\'s song': "Vivy: Fluorite Eye's Song",
  'pokemon': 'Pokémon',
  'pokémon': 'Pokémon',
  're:rero': 'Re:Zero',
  'detroit becom human': 'Detroit: Become Human',
  'detroit become human': 'Detroit: Become Human',
  'sword art online': 'Sword Art Online',
  'family guy': 'Family Guy',
  'toaru majutsu no index': 'Toaru Majutsu no Index',
  'the water magician': 'The Water Magician',
  'darling in the franxx': 'DARLING in the FRANXX',
  'hunter x hunter': 'Hunter x Hunter',
  'jojos bizarre adventure': 'JoJo',
  'daily lives of high school boys': 'Daily Lives of High School Boys',
  'dragon ball z': 'Dragon Ball Z',
  'dragon ball': 'Dragon Ball',
  'kung fu panda': 'Kung Fu Panda',
  'breaking bad': 'Breaking Bad',
};

const INTRO_BUMPER_TAGS = new Set([
  'Kaguya-sama: Love Is War',
  'Sakurasou no Pet na Kanojo',
]);

const JUNK_TAG_EXACT = new Set([
  'from',
  'by',
  'list',
  'name',
  'names',
  'song',
  'songs',
  'intro',
  'outro',
  'credit',
  'credits',
  'creadit',
  'source',
  'sources',
  'link',
  'links',
  'trailer',
  'reference',
  'refrence',
  'avatar',
  'thumbnail',
  'unknown',
  'spoiler',
  'anime',
  'game',
  'games',
  'movie',
  'movies',
  'animation',
  'cartoon',
  'series',
  'show',
  'manga',
  'original',
  'character',
  'franchise',
  'artist',
  'mobile',
  'ova',
  'in the clip',
  'not an anime(not yet)',
  'anime/game list',
  'anime list',
  'game list',
  'movie list',
]);

export function stripInvisibleChars(input: string): string {
  return (input || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
}

function toDisplayCase(tag: string): string {
  const smallWords = new Set(['no', 'na', 'wa', 'wo', 'to', 'de', 'ni', 'ga', 'of', 'the', 'and', 'in', 'on', 'or', 'for', 'a', 'an', 'und', 'vs']);
  return tag
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return '';
      // Preserve intentional all-caps acronyms (AKIRA, GWS, GTA, etc.)
      if (/^[A-Z0-9]{2,6}$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (idx > 0 && smallWords.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

export function cleanAndNormalizeTag(raw: string): string | null {
  if (!raw) return null;
  let tag = stripInvisibleChars(raw)
    .replace(/[*_`~"]/g, '')
    .replace(/^[-:•/>\s]+/, '')
    .replace(/[:/\s-]+$/, '')
    .replace(/(?<![A-Z])\.+$/, '')
    .replace(/\s*\((?:game|anime|movie|mobile|series|ova)\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!tag) return null;

  // Reject URLs, social handles, timestamps, numeric-only labels (except known title "86")
  const lower = tag.toLowerCase();
  if (
    tag.length < 2 ||
    tag.length > 48 ||
    /https?:\/\/|bit\.ly|youtu\.be|odysee\.com|\.com\b|\.jp\b/i.test(tag) ||
    tag.startsWith('@') ||
    /^\d+:\d+/.test(tag) ||
    (/^\d+(?:-\d+)?$/.test(tag) && tag !== '86') ||
    /^\.+$/.test(tag) ||
    /^[?:!.,]+$/.test(tag) ||
    lower.startsWith('...') ||
    lower.startsWith('credit') ||
    lower.startsWith('creadit') ||
    lower.startsWith('avatar') ||
    lower.startsWith('link') ||
    lower.startsWith('source') ||
    lower.startsWith('channel') ||
    lower.startsWith('character from') ||
    lower.startsWith('not an anime') ||
    JUNK_TAG_EXACT.has(lower)
  ) {
    return null;
  }

  // Strip trailing leftover label markers like "From:" or "(From)"
  if (/^(?:from|by|artist|movie|game|anime|animation|trailer|refrence|reference|series|fan-art)\b[:\s]*$/i.test(tag)) {
    return null;
  }

  const canonical = CANONICAL_TAG_MAP[lower];
  if (canonical) return canonical;

  // Preserve mostly non-ASCII or mixed-case titles while tidying all-lowercase lines
  const formatted = tag === lower ? toDisplayCase(tag) : tag.charAt(0).toUpperCase() + tag.slice(1);
  return CANONICAL_TAG_MAP[formatted.toLowerCase()] || formatted;
}

export function extractTagsFromContent(content: string): string[] {
  if (!content) return [];
  const primaryTags = new Set<string>();
  const introTags = new Set<string>();

  const addTag = (raw: string) => {
    const cleaned = cleanAndNormalizeTag(raw);
    if (!cleaned) return;
    if (INTRO_BUMPER_TAGS.has(cleaned)) {
      introTags.add(cleaned);
    } else {
      primaryTags.add(cleaned);
    }
  };

  const normalizedContent = stripInvisibleChars(content);
  const lines = normalizedContent.split(/\r?\n/);

  // Pattern 1: Explicit labeled metadata lines (strictly requires ':' after the media label)
  const labelLineRegex =
    /^[*-]?\s*(?:From\s+)?(?:Anime|Game|Games|Animation|Animated\s+movie|Movie|Cartoon|Series|Show|Franchise|Manga|Character(?:\s+from)?|Original)(?:\s*\/\s*(?:Anime|Game|Source|Character(?:\s+from)?|Series))?(?:\s+from)?\s*:\s*(.+)$/i;

  // Pattern 2: List header lines (e.g., "Anime List:", "-Movie List:", "Anime names:", "Anime/Game List:")
  const listHeaderRegex =
    /^[*-]?\s*(?:Anime|Game|Games|Movie|Animation|Cartoon)(?:\s*\/\s*(?:Anime|Game|Movie))*\s+(?:List|Names)\s*:?\s*$/i;

  let inListBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      if (inListBlock) {
        // Allow a single blank line right after header ("Anime List:\n\n1 call of the night")
        const nextLine = (lines[i + 1] || '').trim();
        if (!/^(\d+(?:-\d+)?\s+|[*-]\s*)/.test(nextLine)) {
          inListBlock = false;
        }
      }
      continue;
    }

    // Stop list block when hitting next timestamp or divider
    if (/^\d{1,2}:\d{2}(?::\d{2})?\b/.test(rawLine) || /^-{3,}$/.test(rawLine)) {
      inListBlock = false;
    }

    // Check TSV table format (e.g., GWS17, GWS18: TIME \t MUSIC \t ANIME \t LINK)
    if (lines[i].includes('\t')) {
      const cols = lines[i].split('\t').map((c) => c.trim());
      if (cols.length >= 3 && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(cols[0]) && cols[2]) {
        addTag(cols[2]);
        continue;
      }
    }

    if (listHeaderRegex.test(rawLine)) {
      inListBlock = true;
      continue;
    }

    if (inListBlock) {
      // Handle bulleted ("- Chainsaw Man"), numbered ("1 call of the night", "11-12 oshi no ko"), or plain lines
      const cleanedItem = rawLine
        .replace(/^\d+(?:-\d+)?\s*[.)]?\s+/, '')
        .replace(/^[*-]\s*/, '')
        .trim();
      if (cleanedItem && !labelLineRegex.test(rawLine)) {
        addTag(cleanedItem);
        continue;
      }
    }

    const match = rawLine.match(labelLineRegex);
    if (match && match[1]) {
      // Some lines separate multiple entries with "/" like "*Uma Musume Pretty Derby* / *Uma Musume*"
      const valuePart = match[1].trim();
      if (!valuePart || /^list$/i.test(valuePart)) {
        inListBlock = true;
        continue;
      }
      if (valuePart.includes(' / ') && !/https?:\/\//i.test(valuePart)) {
        valuePart.split(' / ').forEach(addTag);
      } else {
        addTag(valuePart);
      }
    }
  }

  // Prioritize episode-unique media credits first, appending recurring intro/bumper anime at the end
  const ordered = [...primaryTags, ...introTags];
  return ordered.slice(0, 10);
}

export function decodeHtmlEntities(str: string): string {
  return (str || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ');
}

function truncateAtWordBoundary(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${cut.replace(/[,:;.\-–—]+$/, '').trim()}…`;
}

function cleanTrackSnippet(track: string): string {
  return track
    .replace(/\s*\([^)]{10,}\)/g, '')
    .replace(/\s*\[[^\]]{8,}\]/g, '')
    .replace(/\s*-by\s+/gi, ' - ')
    .replace(/\s*[-–—:]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fitWholeWords(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(maxLen * 0.5) ? sliced.slice(0, lastSpace) : sliced;
  return cut.replace(/[,:;.\-–—&]+$/, '').trim();
}

export function buildEpisodeSummary(params: {
  title: string;
  trackCount: number;
  previewTracks: string[];
  tags: string[];
}): string {
  const { title, trackCount, previewTracks, tags } = params;
  const maxLen = 156;

  const cleanTracks = previewTracks
    .map(cleanTrackSnippet)
    .filter((t) => t.length >= 3);

  const featuredTags = tags.filter((t) => !INTRO_BUMPER_TAGS.has(t));
  const displayTags = featuredTags.length > 0 ? featuredTags : tags;

  const base =
    trackCount > 0
      ? `${title} tracklist with ${trackCount} tracks`
      : `${title} soundtrack tracklist & timestamps`;

  // Pick whole tracks that fit comfortably alongside sources
  let trackClause = '';
  if (cleanTracks.length >= 2 && cleanTracks[0].length <= 36 && cleanTracks[1].length <= 36) {
    const candidate = `${base} featuring ${cleanTracks[0]} & ${cleanTracks[1]}.`;
    if (candidate.length <= 125) {
      trackClause = candidate;
    }
  }
  if (!trackClause && cleanTracks.length >= 1) {
    const pickedTrack =
      cleanTracks.find((t) => t.length <= 54) ||
      (cleanTracks[0].length <= 68 ? cleanTracks[0] : '');
    if (pickedTrack) {
      const candidate = `${base} featuring ${pickedTrack}.`;
      if (candidate.length <= 138) {
        trackClause = candidate;
      }
    }
  }
  if (!trackClause) {
    trackClause = `${base}.`;
  }

  // Append as many WHOLE source tags as fit under maxLen without ever slicing a title mid-word
  if (displayTags.length > 0) {
    let chosenTags: string[] = [];
    for (const tag of displayTags.slice(0, 4)) {
      const nextTags = [...chosenTags, tag];
      const withSources = `${trackClause} Sources: ${nextTags.join(', ')}.`;
      if (withSources.length <= maxLen) {
        chosenTags = nextTags;
      } else {
        break;
      }
    }
    if (chosenTags.length > 0) {
      return `${trackClause} Sources: ${chosenTags.join(', ')}.`;
    }
    const singleShort = `${base}. Sources: ${displayTags.slice(0, 3).join(', ')}.`;
    if (singleShort.length <= maxLen) {
      return singleShort;
    }
  }

  const fallbackWithBrand = `${trackClause} Full timestamps on Viking Algeria.`;
  if (fallbackWithBrand.length <= maxLen) {
    return fallbackWithBrand;
  }

  return trackClause.length <= maxLen ? trackClause : `${fitWholeWords(trackClause, maxLen - 1)}.`;
}

export function parseEpisodeBody(
  body: string,
  data: Record<string, any>,
  title: string
): {
  trackCount: number;
  previewTracks: string[];
  tags: string[];
  excerpt: string;
} {
  const cleanedBody = stripInvisibleChars(body || '');
  const rawLines = cleanedBody
    .replace(/<[^>]*>/g, '\n')
    .split(/\r?\n/)
    .map((line) => decodeHtmlEntities(line.replace(/[#*`_~]/g, '').trim()))
    .filter(Boolean);

  const timestampLines = rawLines.filter((line) => /^\d{1,2}:\d{2}(?::\d{2})?\b/.test(line));
  const trackCount = timestampLines.length;

  const previewTracks: string[] = [];
  for (const line of timestampLines) {
    // Handle TSV rows cleanly by isolating the music column
    let candidate = line;
    if (line.includes('\t')) {
      const cols = line.split('\t').map((c) => c.trim());
      candidate = cols[1] || '';
    } else {
      candidate = line.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*[-:]?\s*/, '');
    }

    const cleaned = candidate
      .replace(/^intro song\s*:\s*/i, '')
      .replace(/\s*-by\s+/gi, ' - ')
      .replace(/\s*[-–—:]+\s*$/, '')
      .trim();

    if (
      cleaned.length >= 4 &&
      cleaned.length <= 90 &&
      !/^\.+$/.test(cleaned) &&
      !/^https?:\/\//i.test(cleaned) &&
      !cleaned.toLowerCase().includes('never go away') &&
      !cleaned.toLowerCase().startsWith('outro song') &&
      !cleaned.toLowerCase().startsWith('anime') &&
      !cleaned.toLowerCase().startsWith('game') &&
      !previewTracks.includes(cleaned)
    ) {
      previewTracks.push(cleaned);
      if (previewTracks.length >= 3) break;
    }
  }

  const rawFrontmatterTags: string[] =
    data.tags && Array.isArray(data.tags) && data.tags.length > 0
      ? (data.tags
          .map((t: any) => cleanAndNormalizeTag(String(t)))
          .filter(Boolean) as string[])
      : [];

  const tags =
    rawFrontmatterTags.length > 0
      ? Array.from(new Set(rawFrontmatterTags)).slice(0, 10)
      : extractTagsFromContent(body);

  const excerpt =
    typeof data.excerpt === 'string' && data.excerpt.trim()
      ? truncateAtWordBoundary(data.excerpt.trim(), 160)
      : buildEpisodeSummary({ title, trackCount, previewTracks, tags });

  return {
    trackCount,
    previewTracks,
    tags,
    excerpt,
  };
}
