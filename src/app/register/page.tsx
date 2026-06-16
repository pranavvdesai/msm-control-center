"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/GlowButton";
import { DeveloperBadge } from "@/components/DeveloperBadge";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    router.push(`/welcome?name=${encodeURIComponent(data.user.name)}`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#030014] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
      >
        <h1 className="text-3xl font-black text-white">Join MSM</h1>
        <p className="mt-2 text-sm text-zinc-400">Register with your cohort credentials.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="Full Name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <GlowButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating profile..." : "Join Control Center"}
          </GlowButton>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already registered?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
      <DeveloperBadge />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-zinc-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-cyan-500/50"
      />
    </label>
  );
}
