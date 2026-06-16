"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { GlowButton } from "@/components/GlowButton";
import { Mail, Cake, CalendarDays, Clock, Loader2, Bell } from "lucide-react";

type EmailType = "welcome" | "birthday" | "weekly" | "alert";

export default function AdminPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [canAdmin, setCanAdmin] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user?.canAdmin && d.user?.rollNumber?.toUpperCase() !== "25M136") {
          router.replace("/dashboard");
          return;
        }
        setUserName(d.user.name || "");
        setCanAdmin(true);
        setCanUpload(!!d.user.canUpload);
      });
  }, [router]);

  async function sendTestEmail(type: EmailType) {
    setLoading(type);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Failed to send test email");
      return;
    }
    setMessage(data.message || "Test email sent!");
  }

  async function fixTimetableTimes() {
    setLoading("timetable");
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/normalize-timetable", { method: "POST" });
    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Failed to fix timetable times");
      return;
    }
    setMessage(`Timetable fixed: ${data.updated} of ${data.total} entries updated with AM/PM.`);
  }

  if (!canAdmin) {
    return (
      <NavShell>
        <div className="flex h-64 items-center justify-center text-zinc-500">Loading...</div>
      </NavShell>
    );
  }

  const emailTests: Array<{
    type: EmailType;
    title: string;
    description: string;
    icon: typeof Mail;
  }> = [
    {
      type: "welcome",
      title: "Test login / welcome mail",
      description: "Sample welcome email with Ram's photo and WhatsApp link — sent to your college email now.",
      icon: Mail,
    },
    {
      type: "birthday",
      title: "Test birthday mail",
      description: "Sample birthday alert email — sent to your college email immediately.",
      icon: Cake,
    },
    {
      type: "weekly",
      title: "Test weekly leave report",
      description: "Sample Saturday weekly leave summary — sent to your college email now.",
      icon: CalendarDays,
    },
    {
      type: "alert",
      title: "Test 1-leave-left alert",
      description: "Sample attendance warning when only 1 regular leave remains in a subject.",
      icon: Bell,
    },
  ];

  return (
    <NavShell userName={userName} canAdmin canUpload={canUpload} isAdmin>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin</h1>
        <p className="text-zinc-400">Ram-only tools — test emails and maintain the timetable.</p>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Email testing</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Each button sends a sample to your profile email right away. Subjects are prefixed with [TEST].
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {emailTests.map(({ type, title, description, icon: Icon }) => (
            <div
              key={type}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Icon className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1 mb-4 flex-1 text-sm text-zinc-500">{description}</p>
              <GlowButton
                className="w-full"
                disabled={loading !== null}
                onClick={() => sendTestEmail(type)}
              >
                {loading === type ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send test now"
                )}
              </GlowButton>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="h-5 w-5 text-violet-400" />
              Fix timetable order
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Re-normalize all class times with AM/PM so the earliest class of the day appears first everywhere.
            </p>
          </div>
          <GlowButton
            variant="secondary"
            disabled={loading !== null}
            onClick={fixTimetableTimes}
          >
            {loading === "timetable" ? "Fixing..." : "Fix all timetable times"}
          </GlowButton>
        </div>
      </section>
    </NavShell>
  );
}
