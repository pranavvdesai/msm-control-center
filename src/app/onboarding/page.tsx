"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/GlowButton";
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
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 appearance-none cursor-pointer";

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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-violet-200 bg-white p-8 shadow-lg"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
            <Cake className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Complete Your Profile</h1>
            <p className="text-sm text-slate-500">One-time setup for MSM family features</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
              <Mail className="h-3.5 w-3.5" /> TAPMI College Email
            </span>
            <input
              type="email"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              placeholder="you@learner.manipal.edu"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
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
                <option value="" className="bg-white">
                  Day
                </option>
                {days.map((d) => (
                  <option key={d} value={d} className="bg-white">
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
                <option value="" className="bg-white">
                  Month
                </option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-white">
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
                <option value="" className="bg-white">
                  Year
                </option>
                {years.map((y) => (
                  <option key={y} value={y} className="bg-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <p className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-900">
            Please add your <strong>true college email</strong> and <strong>real birthday</strong>.
            We&apos;ll send you exclusive MSM birthday mailers and attendance alerts to this inbox.
          </p>

          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            On your birthday, the whole MSM cohort gets a fun birthday mailer. Everyone celebrates together!
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <GlowButton type="submit" className="w-full py-3" disabled={loading}>
            {loading ? "Saving..." : "Enter Control Center →"}
          </GlowButton>
        </form>
      </motion.div>
    </div>
  );
}
