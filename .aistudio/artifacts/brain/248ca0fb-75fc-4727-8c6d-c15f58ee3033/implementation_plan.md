# Viking Algeria — Swiss Brutalist Poster & Soundtrack Archive Overhaul

A complete visual and experiential redesign transforming Viking Algeria from a terminal-styled dark page into an avant-garde Swiss Brutalist poster archive featuring a dark-default / light-paper theme toggle, an audio-spectrum vinyl curtain preloader, and a high-density crate list with live hover artwork.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The visual direction, theme polarity, preloader, and archive layout below incorporate your confirmed choices. Implementation will begin as soon as you approve this plan.

- **Confirmed Visual Direction**: Swiss Brutalist Poster with a bold 12-column asymmetric architectural grid, crisp `1px` structural hairline rules, and zero-pill editorial restraint.
- **Confirmed Color Polarity**: Dark Studio default with an instant Light Paper Editorial mode toggle persisted across sessions.
- **Confirmed First Loading Screen**: Audio spectrum visualizer and spinning vinyl disc curtain reveal with a tabular `00%–100%` counter and `Skip` / `Esc` escape hatch.
- **Confirmed Archive Structure**: Compact high-density crate list displaying catalog index, title, featured anime/game credits, media source, and floating hover artwork preview.
- **Confirmed Asset & Reliability Choice**: Replace external placeholder URLs with bespoke locally generated poster artwork and styled fallback frames, alongside targeted bug and security fixes across routing, search state, and HTML sanitization.

---

### 1. Overview & Core Concept

- **What It Does**: Serves as the official companion archive for the Viking Algeria YouTube and Odysee channel—indexing 100+ video episodes with instant-copy soundtrack tracklists, timestamps, anime/game source tags, embedded players, and an integrated floating soundtrack deck.
- **Target Audience / Persona**: Anime and gaming music fans looking up track names and timestamps from videos, as well as returning channel followers browsing the episode catalog on desktop or mobile.
- **Key Value**: Replaces slow visual scanning and generic hacker-terminal clutter with a museum-grade Swiss catalog where every episode, tracklist, and tag filter is accessible within a single glance and a single click.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **First-Visit Curtain Reveal**: On initial session arrival, visitors see a 1.1-second kinetic preloader featuring a geometric vinyl disc, rhythmic audio spectrum bars, and a `00%` to `100%` counter before two crisp curtains part to expose the archive. Returning navigations within the same session skip directly to the archive.
  2. **Asymmetric Poster Hero & Featured Spotlight**: At the top of the page, an asymmetric split grid pairs an oversized Swiss display headline and archive mission statement on the left with the latest featured episode spotlight (cover artwork, quick tags, direct open link) on the right, followed by a clean 3-column archive metric strip.
  3. **Utility Toolbar & High-Density Crate List**: Directly below the hero, a structural toolbar houses live search (`/` or `Ctrl/Cmd + K`), quick featured-tag filter buttons, the Dark/Light theme switch, and the Audio Deck trigger. Below it, episodes render as compact, hairline-ruled crate rows; hovering or keyboard-focusing any row reveals a floating vinyl-sleeve artwork preview and prefetches that episode's markdown content.
  4. **Editorial Episode Detail & One-Click Copy**: Opening an episode transitions to a structured monograph view featuring the embedded YouTube/Odysee video, clickable anime/game tags (linking back to filtered archive searches), hairline-ruled timestamp rows with one-click copy feedback, and keyboard-navigable Older/Newer episode cards.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Swiss Brutalist Poster & Editorial Music Monograph—strict hairline grids, oversized architectural headlines, asymmetric balance, and zero decorative pseudo-code clutter (removing `//` prefixes, fake terminal prompts, pulsing decorative dots, and thick left accent bars).
  - *Color Palette & Mood (60-30-10 Discipline)*:
    - **Dark Studio (Default)**:
      - `--background`: `#0A0A0C` (60% deep matte obsidian canvas)
      - `--surface`: `#121215` (30% elevated architectural panels & sticky bars)
      - `--foreground`: `#F3F2ED` (warm archival off-white ink)
      - `--muted`: `#9A9890` (high-contrast secondary metadata, $\ge 4.5:1$ contrast)
      - `--border`: `rgba(243, 242, 237, 0.14)` (`1px` hairline structural grid lines)
      - `--primary` / `--accent`: `#FF4D29` (10% International Signal Vermilion for active states, playheads, focus rings, and CTAs)
    - **Light Poster Paper (Toggle)**:
      - `--background`: `#F4F1EA` (60% warm Swiss archival paper)
      - `--surface`: `#EAE6DC` (30% structural panels)
      - `--foreground`: `#111111` (deep poster ink)
      - `--muted`: `#57554E` (WCAG AA compliant secondary ink)
      - `--border`: `rgba(17, 17, 17, 0.16)` (`1px` crisp ink hairlines)
      - `--primary` / `--accent`: `#D9381E` (10% Swiss vermilion ink accent)
  - *Typography & Hierarchy (2+1 Font Rule)*:
    - **Display / Poster Headlines**: `Archivo` (800/900 weight, tight tracking `-0.03em`, `text-wrap: balance` to prevent orphan headline words).
    - **Body & UI Prose**: `Plus Jakarta Sans` (400/500/600 weight, `15px–16px`, `1.6` line-height, `65ch–75ch` reading measure on episode notes).
    - **Catalog Indices & Timestamps**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` strictly for catalog numbers (`119`), timestamps (`0:27`), and preloader counters.
  - *Component Styling & Spatial Rules*:
    - **Top Bar Contract**: Clean single-row 3-zone header (`Viking Algeria` wordmark — concise single-line nav/filter links — primary `Search` action). Utility switches (Dark/Light toggle, Audio Deck) sit cleanly in the Hero/Archive utility bar rather than crowding the top bar.
    - **Zero-Pill Metadata Discipline**: Tags, episode IDs, and media sources render as unboxed typographic metadata separated by `·` or `/` hairlines rather than rounded pill capsules. Interactive tag filters use clean square-edged Swiss button tabs.
    - **Media & Artwork**: Bespoke poster/cover artwork generated locally for the hero/OG fallback, with styled typographic fallback frames so broken images never appear.

- **Interactive Feedback & Motion**:
  - All animations strictly target GPU compositor properties (`transform`, `opacity`) and honor `prefers-reduced-motion`.
  - Hovering crate rows triggers a $\le 180\text{ms}$ `cubic-bezier(0.16, 1, 0.3, 1)` floating sleeve preview on fine pointers and an inline expandable thumbnail strip on touch devices.
  - One-click tracklist copy provides immediate inline icon + text confirmation (`Copied`) without blocking text selection.
  - Floating bottom surfaces (Audio Deck + Copy Hint) are coordinated so they never overlap and stay within a compact mobile footprint.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: High-Density Crate List with Floating Hover Artwork (Plus Optional Grid Switch)**
  - *Chosen Approach*: Make the compact tabular crate list the primary archive view, paired with a cursor-tracked floating artwork preview on desktop and a crisp inline thumbnail/tap preview on mobile, with a compact view switcher in the utility bar for users who want to browse all covers at once.
  - *Why*: With 100+ episodes, a compact crate list lets visitors scan 12–15 episodes per screen instead of 6 bulky cards, while hover artwork preserves the visual richness of YouTube/Odysee thumbnails.
  - *Alternatives Considered*: A 3-column card grid only (too vertical for 100+ posts) or pure text rows without artwork (loses visual recognition).

- **Decision 2: Semantic CSS Variable Dual-Theme with Early Head Initialization**
  - *Chosen Approach*: Configure Tailwind v4 `@custom-variant dark` alongside semantic `:root` / `.dark` CSS custom properties and an inline `<head>` theme hydration script that reads `localStorage` before first paint.
  - *Why*: Eliminates flash of light theme on load, avoids fragile `!important` CSS overrides, and ensures every component—including the custom cursor, scrollbars, markdown prose, and audio deck—maintains $\ge 4.5:1$ WCAG AA contrast in both Dark Studio and Light Paper modes.
  - *Alternatives Considered*: Hardcoded dark classes with CSS filter inversions (breaks media colors and contrast).

- **Decision 3: Bespoke Local Poster Artwork Instead of External Placeholder Services**
  - *Chosen Approach*: Generate custom editorial poster and audio-archive artwork locally and update the server metadata, SEO hook, and image fallbacks to use it instead of `picsum.photos`.
  - *Why*: Eliminates external placeholder failures in sandboxed environments, ensures brand consistency across social share cards (`og:image` / `twitter:image`), and guarantees zero broken images.
  - *Alternatives Considered*: Keeping `picsum.photos` fallbacks (unreliable and visually off-brand).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Server & Build Pipeline (Express + Vite + Cache/Sitemap Generator)      │
│  • Serves /api/posts, static posts.json, sitemap.xml, robots.txt         │
│  • Injects per-post OpenGraph, Twitter & BlogPosting JSON-LD metadata    │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  App Shell & Global Providers                                            │
│  • Theme State (.dark / light on <html> + meta theme-color sync)         │
│  • Audio Spectrum & Vinyl Curtain Preloader (session-scoped, skippable)  │
│  • Architectural Hairline Grid Backdrop & Theme-Aware Pointer Cursor     │
│  • Global Audio Deck (offscreen player + coordinated bottom overlay)     │
└───────────────┬───────────────────────────────────┬──────────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────┐   ┌──────────────────────────────────────┐
│  Home Archive View (/)        │   │  Episode Detail View (/post/:id)     │
│  • 3-Zone Top Bar             │   │  • Reading Progress Bar              │
│  • Asymmetric Poster Hero     │   │  • Episode Header & Clickable Tags   │
│    + Featured Latest Episode  │   │  • YouTube / Odysee Video Stage      │
│  • Utility Bar (Search, Tags, │   │  • Sanitized HTML / Markdown Notes   │
│    Theme Toggle, View Mode)   │   │    with Hairline-Ruled Copy Rows     │
│  • Crate List + Hover Preview │   │  • Keyboard Prev/Next Episode Nav    │
│  • Tabular Pagination         │   │  • Coordinated Copy Hint             │
└───────────────────────────────┘   └──────────────────────────────────────┘
```

- **Data Model & State**:
  - **Episode Metadata**: Consumes existing `PostMetadata` (`id`, `numericId`, `title`, `file`, `type`, `thumbnail`, `videoUrl`, `excerpt`, `tags`, `content`) from `/posts.json` with `/api/posts` fallback and hover-triggered content prefetching.
  - **Theme State**: Managed via a clean `useTheme` hook (`'dark' | 'light'`, defaulting to `'dark'`), persisted in `localStorage` under `viking_theme`, synchronized to `document.documentElement.classList` and `<meta name="theme-color">`.
  - **Search & Filter State**: Synchronized bi-directionally with URL `?q=...` query parameters so clearing the URL (including browser Back/Forward navigation) resets the filter cleanly, plus `currentPage` pagination state (`12` rows per page in Crate List mode for high-density browsing, `6` in Grid mode).

- **Interactive Component & State Mapping**:
  - **Preloader Curtain**: Reads/writes `sessionStorage` (`viking_preloader_seen`), animates GPU-only spectrum bars & vinyl rotation, supports `Skip` button and `Escape` key, and safely restores `document.body.style.overflow` on unmount.
  - **Crate List & Hover Artwork**: Tracks `hoveredPost` and pointer coordinates via motion values (`useMotionValue`/`useSpring`) so the floating vinyl sleeve follows smoothly without React re-renders on mouse move; falls back gracefully on touch devices and keyboard focus.
  - **Audio Deck & Copy Hint Coordination**: Broadcasts player open/close state via custom events/shared state so the efficiency copy hint hides or shifts cleanly when the Audio Deck opens, preventing overlapping fixed overlays.
  - **Targeted Bug & Security Fixes**:
    1. **URL Search Sync Bug**: Fix the URL parameter sync effect in the archive view so navigating back to `/` (when `?q` becomes `null`) clears `searchQuery` instead of keeping stale search text.
    2. **Initial Mount Scroll Bug**: Prevent `window.scrollTo` from firing on initial page mount when `currentPage === 1`.
    3. **Rapid Post Navigation Race**: Reset loading/content state and guard against stale async responses when switching rapidly between episodes via keyboard arrows (`ArrowLeft` / `ArrowRight`).
    4. **Preloader Overflow Safety**: Restore original `body` overflow instead of forcing `'auto'` on unmount.
    5. **XSS & Sanitization Hardening**: Maintain strict DOMParser tag/attribute stripping (`svg`, `math`, `template`, `srcdoc`, `formaction`, control-char protocol normalization) for HTML-based posts and validate external video URLs before embedding.
