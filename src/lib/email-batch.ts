import { sendEmailWithResult } from "@/lib/email";

/** Gmail SMTP — one message at a time with pacing + retries. */
const DELAY_BETWEEN_MS = 900;
const PAUSE_EVERY_N = 10;
const PAUSE_MS = 3000;
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Sends one email per recipient — never parallel. Retries transient Gmail failures. */
export async function sendEmailBatch(
  recipients: Array<{ to: string; subject: string; html: string }>
): Promise<{ sent: number; failed: number; failedTo: string[] }> {
  let sent = 0;
  let failed = 0;
  const failedTo: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const { to, subject, html } = recipients[i];
    let ok = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await sendEmailWithResult(to, subject, html);
      if (result.ok) {
        ok = true;
        break;
      }
      console.error(`Email to ${to} attempt ${attempt}/${MAX_ATTEMPTS}: ${result.error}`);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(DELAY_BETWEEN_MS * attempt);
      }
    }

    if (ok) sent++;
    else {
      failed++;
      failedTo.push(to);
    }

    if (i < recipients.length - 1) {
      await sleep(DELAY_BETWEEN_MS);
      if ((i + 1) % PAUSE_EVERY_N === 0) {
        await sleep(PAUSE_MS);
      }
    }
  }

  return { sent, failed, failedTo };
}
