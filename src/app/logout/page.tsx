"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/login", { method: "DELETE" }).finally(() => {
      router.replace("/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      Signing you out...
    </div>
  );
}
