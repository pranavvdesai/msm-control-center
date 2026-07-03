"use client";

import { Cake, PartyPopper } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import { getSendWishButtonLabel } from "@/lib/birthday-celebration";

type BirthdayPerson = {
  id: string;
  name: string;
  firstName: string;
  rollNumber: string;
};

export function BirthdayDayBanner({
  isBirthdayPerson,
  birthdayPeople,
  pendingCount,
  onOpenSplash,
  onSendWishes,
  sending,
}: {
  isBirthdayPerson: boolean;
  birthdayPeople: BirthdayPerson[];
  pendingCount: number;
  onOpenSplash: () => void;
  onSendWishes: () => void;
  sending?: boolean;
}) {
  if (isBirthdayPerson) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/15 via-fuchsia-500/10 to-cyan-500/10 p-4 shadow-sm sm:mb-6 sm:p-5">
        <Cake className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
            Happy Birthday!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800 italic">
            The cohort is singing your name today — open your surprise, or watch wishes drift in above.
          </p>
          <GlowButton type="button" className="mt-3 px-4 py-2 text-sm" onClick={onOpenSplash}>
            🎂 Open birthday surprise
          </GlowButton>
        </div>
      </div>
    );
  }

  const single = birthdayPeople.length === 1;
  const label = single
    ? `${birthdayPeople[0]?.firstName}'s birthday today`
    : `${birthdayPeople.length} MSM birthdays today`;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10 p-4 shadow-sm sm:mb-6 sm:p-5">
      <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-700">
          Birthday alert
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800 italic">
          <strong>{label}</strong>
          {single
            ? " — lend them a verse of warmth before the day slips away."
            : " — scatter a little birthday poetry their way."}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <GlowButton
            type="button"
            className="px-4 py-2 text-sm"
            onClick={onSendWishes}
            disabled={sending || pendingCount === 0}
          >
            {getSendWishButtonLabel(birthdayPeople, pendingCount, sending)}
          </GlowButton>
          <GlowButton type="button" variant="secondary" className="px-4 py-2 text-sm" onClick={onOpenSplash}>
            See celebration
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
