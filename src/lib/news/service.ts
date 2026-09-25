import { prisma } from "@/lib/db";
import { getIstDateString } from "@/lib/play/ist-date";
import { NEWS_CACHE_TTL_MS, NEWS_CATEGORIES, NEWS_TOP_N } from "./categories";
import { ensureNewsSchema } from "./ensure-schema";
import { fetchMergedRssTopStories, mergeAndRankNewsItems } from "./rss";
import type { NewsCategoryFeed, NewsItem } from "./types";

function filterRecentItems(items: NewsItem[]): NewsItem[] {
  return mergeAndRankNewsItems([items], NEWS_TOP_N);
}

function cacheIsStale(fetchedAt: Date) {
  return Date.now() - fetchedAt.getTime() > NEWS_CACHE_TTL_MS;
}

async function fetchCategoryItems(rssUrls: string[]): Promise<NewsItem[]> {
  return fetchMergedRssTopStories(rssUrls, NEWS_TOP_N);
}

async function ensureCategoryCache(
  newsDate: string,
  categoryId: string,
  rssUrls: string[],
  force = false
) {
  const existing = await prisma.newsDailyCache.findUnique({
    where: { newsDate_category: { newsDate, category: categoryId } },
  });

  if (existing && !force && !cacheIsStale(existing.fetchedAt)) {
    const cached = filterRecentItems(JSON.parse(existing.items) as NewsItem[]);
    if (cached.length > 0) {
      return { ...existing, items: JSON.stringify(cached) };
    }
  }

  const items = await fetchCategoryItems(rssUrls);

  if (items.length === 0) {
    return existing ?? null;
  }

  if (existing) {
    return prisma.newsDailyCache.update({
      where: { id: existing.id },
      data: { items: JSON.stringify(items), fetchedAt: new Date() },
    });
  }

  try {
    return await prisma.newsDailyCache.create({
      data: {
        newsDate,
        category: categoryId,
        items: JSON.stringify(items),
      },
    });
  } catch {
    return prisma.newsDailyCache.findUnique({
      where: { newsDate_category: { newsDate, category: categoryId } },
    });
  }
}

export async function ensureDailyNews(
  newsDate = getIstDateString(),
  options?: { force?: boolean }
): Promise<NewsCategoryFeed[]> {
  await ensureNewsSchema();

  const force = options?.force ?? false;

  const rows = await Promise.all(
    NEWS_CATEGORIES.map(async (cat) => {
      const row = await ensureCategoryCache(newsDate, cat.id, cat.rssUrls, force);
      return { cat, row };
    })
  );

  return rows.map(({ cat, row }) => ({
    id: cat.id,
    label: cat.label,
    shortLabel: cat.shortLabel,
    items: row ? filterRecentItems(JSON.parse(row.items) as NewsItem[]) : [],
    fetchedAt: row?.fetchedAt.toISOString() ?? null,
  }));
}
