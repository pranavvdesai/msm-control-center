"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/GlowButton";
import { DeveloperBadge } from "@/components/DeveloperBadge";
import { Cake, Mail } from "lucide-react";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const selectClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-white outline-none focus:border-violet-500/50 appearance-none cursor-pointer";

export default function OnboardingPage() {
  const router = useRouter();
  const [collegeEmail, setCollegeEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 35 }, (_, i) => String(current - 18 - i));
  }, []);

  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [month, year]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")),
    [daysInMonth]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!day || !month || !year) {
      setError("Please select your full birthday");
      return;
    }

    const birthday = `${year}-${month}-${day}`;
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
      setError("Invalid date — please check day, month, and year");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collegeEmail, birthday }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save profile");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#030014] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-violet-500/20 bg-white/[0.03] p-8 backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20">
            <Cake className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Complete Your Profile</h1>
            <p className="text-sm text-zinc-500">One-time setup for MSM family features</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs text-zinc-400">
              <Mail className="h-3.5 w-3.5" /> TAPMI College Email
            </span>
            <input
              type="email"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              placeholder="you@learner.manipal.edu"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-500/50"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-2 text-xs text-zinc-400">
              <Cake className="h-3.5 w-3.5" /> Birthday
            </legend>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
                className={selectClass}
                aria-label="Birth day"
              >
                <option value="" className="bg-zinc-900">
                  Day
                </option>
                {days.map((d) => (
                  <option key={d} value={d} className="bg-zinc-900">
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  if (day && Number(day) > daysInMonth) setDay("");
                }}
                required
                className={selectClass}
                aria-label="Birth month"
              >
                <option value="" className="bg-zinc-900">
                  Month
                </option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-zinc-900">
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className={selectClass}
                aria-label="Birth year"
              >
                <option value="" className="bg-zinc-900">
                  Year
                </option>
                {years.map((y) => (
                  <option key={y} value={y} className="bg-zinc-900">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
            On your birthday, the whole MSM cohort gets a fun birthday mailer. Everyone celebrates together!
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <GlowButton type="submit" className="w-full py-3" disabled={loading}>
            {loading ? "Saving..." : "Enter Control Center →"}
          </GlowButton>
        </form>
      </motion.div>
      <DeveloperBadge />
    </div>
  );
}
