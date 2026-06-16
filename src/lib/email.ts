import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

type BirthdayPerson = {
  name: string;
  rollNumber: string;
};

type WelcomePerson = {
  name: string;
  rollNumber: string;
  collegeEmail: string;
};

type SendResult = { ok: boolean; error?: string };

function getFromAddress() {
  return process.env.EMAIL_FROM || "Ram Pareek <raaaampareek@gmail.com>";
}

function getReplyTo() {
  return process.env.EMAIL_REPLY_TO || "raaaampareek@gmail.com";
}

export function isEmailConfigured() {
  return !!(
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    process.env.RESEND_API_KEY
  );
}

async function gmailSend(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions["attachments"]
): Promise<SendResult> {
  const user = process.env.GMAIL_USER || "raaaampareek@gmail.com";
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    return { ok: false, error: "GMAIL_APP_PASSWORD not set" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

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

async function resendSend(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to,
      subject,
      html,
      reply_to: getReplyTo(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", body);
    return { ok: false, error: body };
  }

  return { ok: true };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: nodemailer.SendMailOptions["attachments"]
) {
  if (process.env.GMAIL_APP_PASSWORD) {
    const gmail = await gmailSend(to, subject, html, attachments);
    if (gmail.ok) return true;
  }

  if (process.env.RESEND_API_KEY) {
    const resend = await resendSend(to, subject, html);
    return resend.ok;
  }

  console.log("No email provider configured — skipping send");
  return false;
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
        MSM Control Center · TAPMI Manipal · Term 4
      </p>
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
  recipientEmails: string[],
  subjectPrefix = ""
) {
  if (!isEmailConfigured()) {
    console.log("No email provider configured — skipping birthday emails");
    return { sent: 0, skipped: true };
  }

  if (birthdayPeople.length === 0 || recipientEmails.length === 0) {
    return { sent: 0, skipped: false };
  }

  const names = birthdayPeople.map((p) => p.name).join(", ");
  const rolls = birthdayPeople.map((p) => p.rollNumber).join(", ");
  const subject =
    subjectPrefix +
    (birthdayPeople.length === 1
      ? `🎂 Happy Birthday ${birthdayPeople[0].name}! — MSM Control Center`
      : `🎂 Birthday Alert! ${birthdayPeople.length} MSM friends celebrate today`);

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px; border-radius: 16px;">
      <p style="color: #22d3ee; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">MSM Control Center</p>
      <h1 style="font-size: 28px; margin: 16px 0;">🎉 Birthday Celebration!</h1>
      <p style="color: #a1a1aa; line-height: 1.6;">
        Today the MSM cohort celebrates <strong style="color: white;">${names}</strong>.
      </p>
      <p style="color: #71717a; font-size: 14px;">Roll: ${rolls}</p>
      <div style="margin: 24px 0; padding: 16px; background: #0a0a1a; border-radius: 12px; border: 1px solid #22d3ee33;">
        <p style="margin: 0; color: #fbbf24; font-style: italic;">
          "Ek saal aur badh gayi umar… attendance ab aur bhi important hai!"
        </p>
      </div>
      <p style="color: #a1a1aa; font-size: 14px;">
        Wish them in class, buy them chai, and remind them attendance still counts. 😄
      </p>
      <p style="color: #52525b; font-size: 11px; margin-top: 32px;">
        MSM Control Center · TAPMI Manipal
      </p>
    </div>
  `;

  let sent = 0;
  for (const to of recipientEmails) {
    if (await sendEmail(to, subject, html)) sent++;
  }

  return { sent, skipped: false };
}
