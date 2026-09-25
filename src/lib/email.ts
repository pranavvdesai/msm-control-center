import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import {
  buildBirthdayPersonEmail,
  buildClassmateBirthdayEmail,
} from "@/lib/birthday-email-content";
import {
  MSM_EMAIL_ADDRESS,
  MSM_EMAIL_FROM,
  MSM_EMAIL_REPLY_TO,
  MSM_EMAIL_FOOTER,
} from "@/lib/email-config";
import { sendEmailBatch } from "@/lib/email-batch";

type BirthdayPerson = {
  name: string;
  rollNumber: string;
};

type BirthdayRecipient = {
  email: string;
  name: string;
  rollNumber: string;
};

type WelcomePerson = {
  name: string;
  rollNumber: string;
  collegeEmail: string;
};

type SendResult = { ok: boolean; error?: string };

let cachedTransporter: nodemailer.Transporter | null = null;

function getFromAddress() {
  return process.env.EMAIL_FROM || MSM_EMAIL_FROM;
}

function getReplyTo() {
  return process.env.EMAIL_REPLY_TO || MSM_EMAIL_REPLY_TO;
}

export function isEmailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getGmailTransporter() {
  const user = process.env.GMAIL_USER || MSM_EMAIL_ADDRESS;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

async function gmailSend(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions["attachments"]
): Promise<SendResult> {
  const transporter = getGmailTransporter();
  if (!transporter) {
    return { ok: false, error: "GMAIL_APP_PASSWORD not set" };
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      replyTo: getReplyTo(),
      subject,
      html,
      attachments,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail send failed";
    console.error("Gmail error:", message);
    return { ok: false, error: message };
  }
}

export async function sendEmailWithResult(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions["attachments"]
): Promise<SendResult> {
  if (!process.env.GMAIL_APP_PASSWORD) {
    return { ok: false, error: "GMAIL_APP_PASSWORD not set" };
  }
  return gmailSend(to, subject, html, attachments);
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions["attachments"]
) {
  const result = await sendEmailWithResult(to, subject, html, attachments);
  return result.ok;
}

function welcomeEmailAttachments(): nodemailer.SendMailOptions["attachments"] {
  const imagePath = path.join(process.cwd(), "public/images/ram-welcome.png");
  if (!fs.existsSync(imagePath)) return undefined;
  return [
    {
      filename: "ram-welcome.png",
      path: imagePath,
      cid: "ram-welcome",
    },
  ];
}

function buildWelcomeEmailHtml(
  person: WelcomePerson,
  firstName: string,
  appUrl: string,
  imageSrc: string
) {
  const whatsappUrl = `https://wa.me/918302854099?text=${encodeURIComponent(
    "Hello Ram, loved MSM Control Center! Sharing my feedback — "
  )}`;

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px; border-radius: 16px;">
      <div style="margin-bottom: 20px; padding: 14px 16px; background: #0a0a1a; border-radius: 12px; border: 1px solid #fbbf2433;">
        <p style="margin: 0; color: #fbbf24; font-size: 13px; line-height: 1.6;">
          Hey, thank you for signing up on <strong>MSM Control Center</strong>!
          This is an automated mail from Ram's personal AI assistant bot — please give it a read. 🤖
        </p>
      </div>
      <img
        src="${imageSrc}"
        alt="Ram — MSM Control Center"
        width="200"
        style="display: block; margin: 0 auto 20px; border-radius: 16px; border: 2px solid #22d3ee33;"
      />
      <p style="color: #22d3ee; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; text-align: center;">MSM Control Center</p>
      <h1 style="font-size: 28px; margin: 16px 0; text-align: center;">Namaste, ${firstName}! 🙏</h1>
      <p style="color: #d4d4d8; line-height: 1.7; font-size: 16px;">
        Hello from your MSM friend, <strong style="color: white;">Ram</strong> — builder of this control center.
      </p>
      <p style="color: #a1a1aa; line-height: 1.7;">
        Welcome to the <strong style="color: #22d3ee;">MSM Control Center</strong>.
        You're officially part of the cohort family. Roll <strong style="color: white;">${person.rollNumber}</strong>.
      </p>
      <div style="margin: 24px 0; padding: 16px; background: #0a0a1a; border-radius: 12px; border: 1px solid #22d3ee33;">
        <p style="margin: 0 0 8px; color: #22d3ee; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Inside the control center</p>
        <p style="margin: 0; color: #d4d4d8; line-height: 1.8; font-size: 14px;">
          ✓ Mark leaves on the calendar<br/>
          ✓ Track attendance risk meter<br/>
          ✓ See today's classes &amp; live cohort feed<br/>
          ✓ Birthday alerts via Cake Radar 🎂
        </p>
      </div>
      <a href="${appUrl}/dashboard" style="display: inline-block; margin: 8px 0 16px; padding: 12px 24px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
        Enter MSM Control Center →
      </a>
      <p style="color: #71717a; font-size: 14px;">
        Login anytime with your roll number and cohort password.
      </p>
      <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #ffffff15;">
        <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 12px;">
          Loved it? Share feedback directly with Ram on WhatsApp:
        </p>
        <a href="${whatsappUrl}" style="display: inline-block; padding: 12px 24px; background: #25D366; color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
          💬 WhatsApp Ram
        </a>
      </div>
      <p style="color: #52525b; font-size: 11px; margin-top: 32px;">
        MSM Control Center · TAPMI Manipal · Term 5
      </p>
      ${MSM_EMAIL_FOOTER}
    </div>
  `;
}

export async function sendWelcomeEmail(person: WelcomePerson, subjectPrefix = "") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const firstName = person.name.split(" ")[0];
  const subject = `${subjectPrefix}Namaste ${firstName}! Welcome to MSM Control Center 🙏`;
  const attachments = welcomeEmailAttachments();
  const imageSrc = attachments ? "cid:ram-welcome" : `${appUrl}/images/ram-welcome.png`;
  const html = buildWelcomeEmailHtml(person, firstName, appUrl, imageSrc);

  const sent = await sendEmail(person.collegeEmail, subject, html, attachments);
  return { sent: sent ? 1 : 0, skipped: !isEmailConfigured() };
}

export async function sendBirthdayEmails(
  birthdayPeople: BirthdayPerson[],
  recipients: BirthdayRecipient[],
  subjectPrefix = ""
) {
  if (!isEmailConfigured()) {
    console.log("No email provider configured — skipping birthday emails");
    return { sent: 0, skipped: true };
  }

  if (birthdayPeople.length === 0 || recipients.length === 0) {
    return { sent: 0, skipped: false };
  }

  const birthdayRolls = new Set(birthdayPeople.map((p) => p.rollNumber.toUpperCase()));

  let sent = 0;
  const payloads: Array<{ to: string; subject: string; html: string }> = [];

  for (const recipient of recipients) {
    const roll = recipient.rollNumber.toUpperCase();
    const isBirthdayPerson = birthdayRolls.has(roll);
    const birthdayPerson = birthdayPeople.find((p) => p.rollNumber.toUpperCase() === roll);

    const { subject, html } =
      isBirthdayPerson && birthdayPerson
        ? buildBirthdayPersonEmail(birthdayPerson, subjectPrefix)
        : buildClassmateBirthdayEmail(birthdayPeople, recipient, subjectPrefix);

    payloads.push({ to: recipient.email, subject, html });
  }

  const batch = await sendEmailBatch(payloads);
  sent = batch.sent;

  return { sent, skipped: false };
}
