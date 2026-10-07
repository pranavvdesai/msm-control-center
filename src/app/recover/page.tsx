"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavShell } from "@/components/NavShell";
import { formatClassTimeRange, formatDate, toIstDateKey } from "@/lib/utils";
import { type LeaveType, leaveTypeBadgeClass, leaveTypeLabel } from "@/lib/leaves";
import type { Term4RecoveredLeave } from "@/lib/term4-archive";

type CachedLeave = {
  id: string;
  date: string;
  type: LeaveType;
  reason: string | null;
  subject: { name: string };
  timetableEntry: { startTime: string; endTime: string } | null;
};

type Status = "scanning" | "unsupported" | "done";

function term4DateKeys() {
  const keys: string[] = [];
  for (let t = Date.UTC(2026, 5, 15); t <= Date.UTC(2026, 8, 25); t += 86_400_000) {
    keys.push(new Date(t).toISOString().slice(0, 10));
  }
  return keys;
}

/** Reads only the browser HTTP cache; never touches the network, so cached copies can't be overwritten. */
async function readCache(url: string): Promise<Response | null> {
  try {
    return await fetch(url, { cache: "only-if-cached", mode: "same-origin" });
  } catch {
    return null;
  }
}

async function browserReadsCacheOnly() {
  const probe = await readCache(`/api/leaves?date=1970-01-01&probe=${Date.now()}`);
  return probe === null || !probe.ok;
}

function toRecovered(leave: CachedLeave): Term4RecoveredLeave {
  return {
    id: leave.id,
    classDate: toIstDateKey(leave.date),
    subjectName: leave.subject.name,
    type: leave.type,
    reason: leave.reason,
    startTime: leave.timetableEntry?.startTime ?? null,
    endTime: leave.timetableEntry?.endTime ?? null,
  };
}

export default function RecoverPage() {
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<Status>("scanning");
  const [cachedDays, setCachedDays] = useState(0);
  const [found, setFound] = useState<Term4RecoveredLeave[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));

    (async () => {
      if (!(await browserReadsCacheOnly())) {
        setStatus("unsupported");
        return;
      }

      const leaves = new Map<string, Term4RecoveredLeave>();
      let days = 0;
      const urls = ["/api/leaves", ...term4DateKeys().map((d) => `/api/leaves?date=${d}`)];

      await Promise.all(
        urls.map(async (url) => {
          const res = await readCache(url);
          if (!res?.ok) return;
          const data = (await res.json().catch(() => null)) as { leaves?: CachedLeave[] } | null;
          if (!data?.leaves) return;
          if (url.includes("?date=")) days++;
          for (const leave of data.leaves) {
            const recovered = toRecovered(leave);
            if (recovered.classDate < "2026-09-26") leaves.set(recovered.id, recovered);
          }
        })
      );

      const list = [...leaves.values()].sort((a, b) => b.classDate.localeCompare(a.classDate));
      setCachedDays(days);
      setFound(list);
      setStatus("done");

      if (list.length > 0) {
        const res = await fetch("/api/leaves/term4", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaves: list }),
        });
        setSaveMessage(
          res.ok
            ? "Saved to your History tab — they'll stay there even if this device's cache is cleared."
            : "Found them, but saving to your History tab failed. Keep this page open and try again."
        );
      }
    })();
  }, []);

  return (
    <NavShell userName={userName}>
      <div className="msm-page-header">
        <h1 className="msm-page-title">Recover Term 4 leaves</h1>
        <p className="msm-page-subtitle">
          Looks for Term 4 leave details (class date, reason) that this browser saved while you used
          the Leave tab. Open this on the phone or browser you used to mark leaves.
        </p>
      </div>

      {status === "scanning" && (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
          Checking this device&apos;s cache…
        </p>
      )}

      {status === "unsupported" && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          This browser can&apos;t read its cache safely, so nothing was checked. Try Chrome or the MSM
          app on the device you marked leaves from.
        </p>
      )}

      {status === "done" && found.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
          No Term 4 leave details are cached on this device ({cachedDays} cached day
          {cachedDays === 1 ? "" : "s"} checked). Try the other phone or browser you used.
        </p>
      )}

      {status === "done" && found.length > 0 && (
        <>
          <p className="mb-3 text-sm text-slate-700">
            Found {found.length} Term 4 leave{found.length === 1 ? "" : "s"} across {cachedDays} cached
            day{cachedDays === 1 ? "" : "s"}.
          </p>
          {saveMessage && (
            <p className="mb-4 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-cyan-800">{saveMessage}</p>
          )}
          <div className="space-y-3">
            {found.map((leave) => (
              <div key={leave.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{leave.subjectName}</p>
                    <p className="text-sm text-slate-500">{formatDate(leave.classDate)}</p>
                    {leave.startTime && leave.endTime && (
                      <p className="text-xs text-slate-500">
                        {formatClassTimeRange(leave.startTime, leave.endTime)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${leaveTypeBadgeClass(leave.type)}`}
                  >
                    {leaveTypeLabel(leave.type)}
                  </span>
                </div>
                {leave.reason && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    Reason: {leave.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Link href="/history" className="mt-6 inline-block text-sm font-medium text-cyan-700">
        ← Back to History
      </Link>
    </NavShell>
  );
}
