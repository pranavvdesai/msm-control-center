export function getAttemptActiveMs(
  elapsedMs: number,
  timerStartedAt: Date | string | null | undefined,
  now = Date.now()
): number {
  if (!timerStartedAt) return elapsedMs;
  const started = new Date(timerStartedAt).getTime();
  return elapsedMs + Math.max(0, now - started);
}

export function isTimerRunning(timerStartedAt: Date | string | null | undefined) {
  return timerStartedAt != null;
}
