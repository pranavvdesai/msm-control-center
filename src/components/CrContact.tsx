import { Phone, MessageCircle } from "lucide-react";
import { CR_FULL_NAME, CR_PHONE } from "@/lib/cohort";

export function CrContact({
  crName = CR_FULL_NAME,
  crPhone = CR_PHONE,
}: {
  crName?: string;
  crPhone?: string;
}) {
  const digits = crPhone.replace(/\D/g, "");
  const tel = `tel:+91${digits}`;
  const whatsapp = `https://wa.me/91${digits}?text=${encodeURIComponent(
    `Hi ${crName}! Need help with MSM Control Center — `
  )}`;

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="text-xs text-zinc-500">
        Discrepancy or emergency? Contact CR
      </span>
      <div className="flex flex-wrap gap-2">
      <a
        href={tel}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
      >
        <Phone className="h-3 w-3" />
        Call
      </a>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-green-500/25 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-300"
      >
        <MessageCircle className="h-3 w-3" />
        WhatsApp
      </a>
      </div>
    </div>
  );
}
