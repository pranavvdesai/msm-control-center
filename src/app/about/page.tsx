"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { NavShell } from "@/components/NavShell";
import { CrContact } from "@/components/CrContact";
import { CR_FULL_NAME, CR_PHONE } from "@/lib/cohort";
import { ABOUT_GALLERY, ABOUT_GIRLIE_SQUAD, ABOUT_HIGHLIGHTS, type AboutPhoto } from "@/lib/about";
import { Heart, Sparkles, Trophy, Users } from "lucide-react";

function PhotoGallery({ photos }: { photos: AboutPhoto[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {photos.map((photo, i) => {
        const featured = photo.featured;
        return (
          <motion.figure
            key={photo.src}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
              featured ? "sm:col-span-2" : ""
            }`}
          >
            <div
              className={`relative w-full bg-slate-100 ${
                featured ? "aspect-[16/10] sm:aspect-[21/9]" : "aspect-[4/3]"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes={featured ? "100vw" : "(max-width: 640px) 100vw, 50vw"}
                priority={featured && i === 0}
              />
            </div>
            <figcaption className="px-3 py-2.5 text-xs text-slate-600 sm:text-sm">
              {photo.caption}
            </figcaption>
          </motion.figure>
        );
      })}
    </div>
  );
}

export default function AboutPage() {
  const [userName, setUserName] = useState("");
  const [crName, setCrName] = useState(CR_FULL_NAME);
  const [crPhone, setCrPhone] = useState(CR_PHONE);
  const [termInfo, setTermInfo] = useState("Term 5 · TAPMI Manipal");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || ""));

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.crName) setCrName(d.settings.crName);
        if (d.settings?.crPhone) setCrPhone(d.settings.crPhone);
        if (d.settings?.termInfo) setTermInfo(d.settings.termInfo);
      })
      .catch(() => {});
  }, []);

  return (
    <NavShell userName={userName}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 sm:rounded-3xl sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-700 sm:text-xs">
            About MSM
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl">
            The Kootlers
          </h1>
          <p className="mt-1 text-sm text-cyan-700">{termInfo}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            MSM — Marketing &amp; Sales Management at TAPMI — is a cohort of{" "}
            <strong className="text-slate-900">59</strong> wildly distinct personalities.
            Also known as <strong className="text-slate-900">Kootlers</strong>, we balance
            placement season chaos, questionable academic decisions, and genuine ambition.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            Commanded by our Class Representative,{" "}
            <strong className="text-slate-900">Bhavya</strong>, we&apos;ve stressed out more
            professors than any batch before us while still delivering some of the highest
            placement packages in the cohort. On court and in class — chaos, ambition, and
            team spirit. That&apos;s the Kootlers way.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {ABOUT_HIGHLIGHTS.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center shadow-sm"
              >
                <p className="text-lg font-bold text-slate-900">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
            <Users className="mb-2 h-5 w-5 text-cyan-700" />
            <p className="font-semibold text-slate-900">One cohort, one radar</p>
            <p className="mt-1 text-sm text-slate-600">
              MSM Control Center keeps attendance, leaves, and batch life in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <Trophy className="mb-2 h-5 w-5 text-amber-700" />
            <p className="font-semibold text-slate-900">Beyond the classroom</p>
            <p className="mt-1 text-sm text-slate-600">
              Cricket champions, court warriors, and placement fighters — we do it all.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:col-span-1">
            <Sparkles className="mb-2 h-5 w-5 text-violet-700" />
            <p className="font-semibold text-slate-900">CR on speed dial</p>
            <p className="mt-1 text-sm text-slate-600">
              Discrepancy or emergency? Bhavya has your back.
            </p>
            <CrContact crName={crName} crPhone={crPhone} />
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">
            Kootlers in action
          </h2>
          <PhotoGallery photos={ABOUT_GALLERY} />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Our girlie squad
            </h2>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            The women of MSM — on court, on campus, and absolutely unstoppable.
          </p>
          <PhotoGallery photos={ABOUT_GIRLIE_SQUAD} />
        </section>
      </motion.div>
    </NavShell>
  );
}
