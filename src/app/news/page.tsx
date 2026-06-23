"use client";

import { useEffect, useRef, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import type { NewsCategoryFeed } from "@/lib/news/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_ACCENTS: Record<string, string> = {
  business_india: "from-emerald-500 to-teal-600",
  business_global: "from-blue-500 to-indigo-600",
  geopolitics: "from-rose-500 to-orange-600",
  sports: "from-amber-500 to-orange-500",
  pop_culture: "from-fuchsia-500 to-pink-600",
  tech: "from-violet-500 to-purple-600",
};

export default function NewsPage() {
  const [userName, setUserName] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [categories, setCategories] = useState<NewsCategoryFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string>("business_india");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  async function loadNews(force = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(force ? "/api/news?refresh=1" : "/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load news");
      setDateLabel(data.dateLabel);
      setCategories(data.categories);
      if (data.categories?.length && !data.categories.find((c: NewsCategoryFeed) => c.id === activeId)) {
        setActiveId(data.categories[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load news");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));
    loadNews();
  }, []);

  function scrollToCategory(id: string) {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <NavShell userName={userName}>
      <div className="msm-page-header mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <h1 className="msm-page-title">News</h1>
              <p className="msm-page-subtitle">
                Top 10 from the last 24 hours · auto-refreshes every 2h · {dateLabel || "today IST"}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadNews(true)}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {!loading && categories.length > 0 && (
        <div className="sticky top-[7.5rem] z-20 -mx-1 mb-4 overflow-x-auto px-1 pb-1 md:top-[8.5rem]">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeId === cat.id
                    ? "bg-cyan-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {cat.shortLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="msm-card py-12 text-center text-sm text-slate-500">Loading today&apos;s headlines…</div>
      )}

      {error && (
        <div className="msm-card border-red-200 bg-red-50 py-8 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button onClick={() => loadNews(true)} className="mt-3 text-sm font-semibold text-red-700 underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {categories.map((cat) => (
            <section
              key={cat.id}
              id={`news-${cat.id}`}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="scroll-mt-36 msm-card overflow-hidden p-0"
            >
              <div
                className={`bg-gradient-to-r px-4 py-3 text-white ${CATEGORY_ACCENTS[cat.id] ?? "from-slate-600 to-slate-800"}`}
              >
                <h2 className="text-base font-bold">{cat.label}</h2>
                <p className="text-xs text-white/80">Top {cat.items.length || 10} · last 24 hours</p>
              </div>

              {cat.items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">Headlines unavailable right now. Try refreshing.</p>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {cat.items.map((item, i) => (
                    <li key={`${cat.id}-${i}`}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-slate-200">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug text-slate-900 group-hover:text-cyan-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.source}
                            {item.publishedAt && <> · {timeAgo(item.publishedAt)}</>}
                          </p>
                        </div>
                        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-cyan-600" />
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Headlines via Google News RSS · links open the original publisher
        </p>
      )}
    </NavShell>
  );
}
