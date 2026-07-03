"use client";

import { Suspense } from "react";
import { RamBirthdaySplash } from "@/components/RamBirthdaySplash";

export function GlobalRamBirthdaySplash() {
  return (
    <Suspense fallback={null}>
      <RamBirthdaySplash />
    </Suspense>
  );
}
