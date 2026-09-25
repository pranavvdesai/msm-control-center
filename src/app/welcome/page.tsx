"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WelcomeSplash } from "@/components/WelcomeSplash";

function WelcomeContent() {
  const params = useSearchParams();
  const name = params.get("name") || "there";
  return <WelcomeSplash name={name} />;
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <WelcomeContent />
    </Suspense>
  );
}
