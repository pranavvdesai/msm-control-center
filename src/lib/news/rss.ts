import { NEWS_MAX_AGE_MS, NEWS_TOP_N } from "./categories";
import type { NewsItem } from "./types";

const FETCH_HEADERS = {
  "User-Agent": "MSM-Control-Center/1.0 (news digest; +https://msm-control-center.vercel.app)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

function decodeHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function extractTag(block: string, tag: string): string {
  const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"));
  if (cdata?.[1]) return decodeHtml(cdata[1]);

  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return plain?.[1] ? decodeHtml(plain[1]) : "";
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .slice(0, 60);
}

function parseSource(block: string, title: string): string {
  const fromTag = extractTag(block, "source");
  if (fromTag) return fromTag;

  const dashSplit = title.lastIndexOf(" - ");
  if (dashSplit > 20) return title.slice(dashSplit + 3).trim();
  return "Google News";
}

function parsePubDate(pubDate: string): Date | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isRecentEnough(publishedAt: string, now = Date.now()): boolean {
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= NEWS_MAX_AGE_MS;
}

export function parseRssItems(xml: string, parseLimit: number): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let scanned = 0;

  while ((match = itemRegex.exec(xml)) !== null && scanned < parseLimit) {
    scanned += 1;
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDateRaw = extractTag(block, "pubDate");

    if (!title || !link) continue;

    const parsed = parsePubDate(pubDateRaw);
    if (!parsed) continue;

    const publishedAt = parsed.toISOString();
    if (!isRecentEnough(publishedAt)) continue;

    items.push({
      title,
      link,
      source: parseSource(block, title),
      publishedAt,
    });
  }

  return items;
}

export function mergeAndRankNewsItems(batches: NewsItem[][], limit = NEWS_TOP_N): NewsItem[] {
  const seen = new Set<string>();
  const merged: NewsItem[] = [];

  for (const batch of batches) {
    for (const item of batch) {
      const key = normalizeTitle(item.title);
      if (seen.has(key)) continue;
      if (!isRecentEnough(item.publishedAt)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return merged.slice(0, limit);
}

export async function fetchRssTopStories(rssUrl: string, limit: number): Promise<NewsItem[]> {
  const res = await fetch(rssUrl, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed (${res.status})`);
  }

  const xml = await res.text();
  const items = parseRssItems(xml, 60);
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return items.slice(0, limit);
}

export async function fetchMergedRssTopStories(rssUrls: string[], limit: number): Promise<NewsItem[]> {
  const batches = await Promise.all(
    rssUrls.map(async (url) => {
      try {
        return await fetchRssTopStories(url, limit + 8);
      } catch {
        return [];
      }
    })
  );

  return mergeAndRankNewsItems(batches, limit);
}
