export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

export type NewsCategoryId =
  | "business_india"
  | "business_global"
  | "geopolitics"
  | "sports"
  | "pop_culture"
  | "tech";

export type NewsCategory = {
  id: NewsCategoryId;
  label: string;
  shortLabel: string;
  rssUrls: string[];
};

export type NewsCategoryFeed = {
  id: NewsCategoryId;
  label: string;
  shortLabel: string;
  items: NewsItem[];
  fetchedAt: string | null;
};
