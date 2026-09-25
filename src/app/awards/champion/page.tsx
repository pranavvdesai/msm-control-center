import { getWeeklyPlatformChampion } from "@/lib/analytics/weekly-champion";
import { getIstNowParts } from "@/lib/ops/ist-calendar";

export default async function ChampionAwardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const weekEnd = params.week || getIstNowParts().dateStr;
  const champion = await getWeeklyPlatformChampion(appUrl, weekEnd);

  if (!champion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030014] px-6 text-center text-zinc-300">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">MSM Control Center</p>
          <h1 className="mt-4 text-2xl font-bold text-white">No champion data yet</h1>
          <p className="mt-2 text-sm text-zinc-400">Platform activity for this week hasn&apos;t been tracked yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030014] px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#1a1208] to-[#030014] p-8 text-center shadow-2xl shadow-amber-900/20">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-400">MSM · TAPMI</p>
        <div className="mx-auto my-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-5xl shadow-lg shadow-amber-500/30">
          🏆
        </div>
        <h1 className="text-2xl font-black text-white">Platform Champion</h1>
        <p className="mt-2 text-sm text-amber-200/80">
          Week of {champion.weekStart} → {champion.weekEnd}
        </p>
        <p className="mt-8 text-3xl font-bold text-amber-300">{champion.name}</p>
        <p className="mt-1 text-sm text-zinc-400">{champion.rollNumber}</p>
        <p className="mt-6 text-sm leading-relaxed text-zinc-300">
          Awarded for the most platform activity this week — {champion.visits} tab visits across MSM Control Center.
        </p>
        <p className="mt-8 text-xs text-zinc-500">Issued by MSM Control Center · Ram&apos;s cohort bot</p>
      </div>
    </div>
  );
}
