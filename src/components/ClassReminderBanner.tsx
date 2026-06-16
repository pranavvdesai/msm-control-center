"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, Smartphone } from "lucide-react";
import { GlowButton } from "@/components/GlowButton";
import { CLASS_REMINDER_PUSH } from "@/lib/class-reminder";
import {
  ensureServiceWorker,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function ClassReminderBanner({
  unmarkedCount,
}: {
  unmarkedCount: number;
}) {
  const [enabled, setEnabled] = useState(false);
  const [hasPush, setHasPush] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const isIos = isIosDevice();

  useEffect(() => {
    fetch("/api/notifications/preferences", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.remindersEnabled && !!d.hasPushSubscription);
        setHasPush(!!d.hasPushSubscription);
        setVapidKey(d.vapidPublicKey || null);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));

    if (isPushSupported()) {
      ensureServiceWorker().catch(() => {});
    }
  }, []);

  async function toggleReminders() {
    setLoading(true);
    setMessage("");

    try {
      if (enabled) {
        await unsubscribeFromPush();
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          credentials: "include",
        });
        await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enabled: false }),
        });
        setEnabled(false);
        setHasPush(false);
        setMessage("Mobile notifications turned off.");
        setLoading(false);
        return;
      }

      if (!prefsLoaded) {
        setMessage("Loading notification settings… try again in a moment.");
        setLoading(false);
        return;
      }

      if (!vapidKey) {
        setMessage("Push notifications are not configured on the server yet.");
        setLoading(false);
        return;
      }

      if (!isPushSupported()) {
        setMessage(
          "Your browser does not support push. Use Chrome on Android or Safari on iPhone (from home screen app)."
        );
        setLoading(false);
        return;
      }

      const sub = await subscribeToPush(vapidKey);

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not save subscription on server.");
      }

      setEnabled(true);
      setHasPush(true);
      setMessage("Mobile notifications enabled! You'll get an evening nudge on this device.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not enable notifications. Try again or use Chrome on Android."
      );
    }
    setLoading(false);
  }

  async function sendTestReminder() {
    setLoading(true);
    setMessage("");

    try {
      if (!enabled || !hasPush) {
        setMessage("Enable mobile notifications first.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/notifications/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(CLASS_REMINDER_PUSH.title, {
          body: CLASS_REMINDER_PUSH.body,
          icon: "/icon.svg",
        });
      }

      setMessage(data.message || "Test notification sent!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not send test notification.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {unmarkedCount > 0 && (
        <Link
          href="/leave"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 transition hover:border-amber-500/50"
        >
          <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-100">
              Did you miss any class today?
            </p>
            <p className="mt-1 text-sm text-amber-200/80">
              {unmarkedCount} ended {unmarkedCount === 1 ? "class" : "classes"} not
              recorded yet — tap to mark leave now.
            </p>
          </div>
        </Link>
      )}

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            {enabled && hasPush ? (
              <Bell className="h-5 w-5 shrink-0 text-cyan-400" />
            ) : (
              <BellOff className="h-5 w-5 shrink-0 text-zinc-500" />
            )}
            <div>
              <p className="font-semibold text-white">Mobile notifications</p>
              <p className="mt-1 text-sm text-zinc-400">
                Evening phone alert: &quot;Did you miss any class? Record it now.&quot;
                Push only — no emails.
              </p>
              {enabled && hasPush && (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <Smartphone className="h-3 w-3" />
                  Connected on this device
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {enabled && hasPush && (
              <GlowButton
                type="button"
                className="px-4 py-2 text-sm"
                onClick={sendTestReminder}
                disabled={loading}
              >
                Send test now
              </GlowButton>
            )}
            <GlowButton
              type="button"
              className="px-4 py-2 text-sm"
              onClick={toggleReminders}
              disabled={loading || !prefsLoaded}
            >
              {loading
                ? "..."
                : enabled && hasPush
                  ? "Turn off"
                  : "Enable on this device"}
            </GlowButton>
          </div>
        </div>
        {message && <p className="mt-2 text-xs text-cyan-300">{message}</p>}
        {isIos && !enabled && (
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            iPhone: Safari → Share → <strong>Add to Home Screen</strong> → open the app
            from that icon → then enable notifications.
          </p>
        )}
        {!isIos && !enabled && (
          <p className="mt-2 text-[11px] text-zinc-500">
            Use Chrome. If enable fails, tap the lock icon → Site settings → allow Notifications.
          </p>
        )}
      </div>
    </div>
  );
}
