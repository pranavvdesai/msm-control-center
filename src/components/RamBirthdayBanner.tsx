"use client";

import { Cake, PartyPopper, Sparkles } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import {
  RAM_DISPLAY_NAME,
  RAM_FIRST_NAME,
  ramBirthdayWhatsAppUrl,
} from "@/lib/ram-birthday";

type RamBirthdayBannerProps = {
  isRam: boolean;
  onOpenSplash: () => void;
};

function BannerShell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 shadow-sm sm:mb-6 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function RamBirthdayBanner({ isRam, onOpenSplash }: RamBirthdayBannerProps) {
  if (isRam) {
    return (
      <BannerShell className="border-amber-300/40 bg-gradient-to-r from-amber-500/15 via-fuchsia-500/10 to-cyan-500/15">
        <Cake className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Happy Birthday {RAM_FIRST_NAME}!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">
            The whole MSM cohort is celebrating you today. Tap below for your birthday poem.
          </p>
          <GlowButton type="button" className="mt-3 px-4 py-2 text-sm" onClick={onOpenSplash}>
            🎂 Open your birthday surprise
          </GlowButton>
        </div>
      </BannerShell>
    );
  }

  return (
    <BannerShell className="border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10">
      <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-700">
          Birthday alert
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">
          Today is <strong>{RAM_DISPLAY_NAME}</strong>&apos;s birthday! Wish him now — he built this
          whole Control Center for us.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <a href={ramBirthdayWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            <GlowButton type="button" className="w-full px-4 py-2 text-sm sm:w-auto">
              💬 Wish Ram on WhatsApp
            </GlowButton>
          </a>
          <GlowButton
            type="button"
            variant="secondary"
            className="px-4 py-2 text-sm"
            onClick={onOpenSplash}
          >
            🎉 See celebration
          </GlowButton>
        </div>
      </div>
    </BannerShell>
  );
}
