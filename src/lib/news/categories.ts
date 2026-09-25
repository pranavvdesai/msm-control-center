import type { NewsCategory } from "./types";

/** Google News `when:1d` keeps results to roughly the last 24 hours. */
const RECENT = "when:1d";

export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    id: "business_india",
    label: "Business · India",
    shortLabel: "Biz India",
    rssUrls: [
      `https://news.google.com/rss/search?q=India+business+markets+economy+${RECENT}&hl=en-IN&gl=IN&ceid=IN:en`,
    ],
  },
  {
    id: "business_global",
    label: "Business · Global",
    shortLabel: "Biz Global",
    rssUrls: [
      `https://news.google.com/rss/search?q=global+business+finance+markets+${RECENT}&hl=en-US&gl=US&ceid=US:en`,
    ],
  },
  {
    id: "geopolitics",
    label: "Geopolitics",
    shortLabel: "Geopolitics",
    rssUrls: [
      `https://news.google.com/rss/search?q=geopolitics+world+affairs+${RECENT}&hl=en-US&gl=US&ceid=US:en`,
    ],
  },
  {
    id: "sports",
    label: "Sports · India & Global",
    shortLabel: "Sports",
    rssUrls: [
      `https://news.google.com/rss/search?q=India+cricket+sports+${RECENT}&hl=en-IN&gl=IN&ceid=IN:en`,
      `https://news.google.com/rss/search?q=world+sports+football+tennis+${RECENT}&hl=en-US&gl=US&ceid=US:en`,
    ],
  },
  {
    id: "pop_culture",
    label: "Pop Culture · India & Global",
    shortLabel: "Pop",
    rssUrls: [
      `https://news.google.com/rss/search?q=Bollywood+Indian+entertainment+celebrity+${RECENT}&hl=en-IN&gl=IN&ceid=IN:en`,
      `https://news.google.com/rss/search?q=Hollywood+movies+music+celebrity+${RECENT}&hl=en-US&gl=US&ceid=US:en`,
    ],
  },
  {
    id: "tech",
    label: "Tech",
    shortLabel: "Tech",
    rssUrls: [
      `https://news.google.com/rss/search?q=technology+AI+startups+${RECENT}&hl=en-IN&gl=IN&ceid=IN:en`,
      `https://news.google.com/rss/search?q=technology+AI+${RECENT}&hl=en-US&gl=US&ceid=US:en`,
    ],
  },
];

export const NEWS_CATEGORY_MAP = Object.fromEntries(
  NEWS_CATEGORIES.map((c) => [c.id, c])
) as Record<string, NewsCategory>;

export const NEWS_TOP_N = 10;

/** Drop headlines older than this (ms). Kept tight so lists stay fresh. */
export const NEWS_MAX_AGE_MS = 36 * 60 * 60 * 1000;

/** Re-fetch RSS if cache is older than this (ms). */
export const NEWS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
