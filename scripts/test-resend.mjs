const key = process.env.RESEND_API_KEY;
const to = process.argv[2] || "ram.tapmimpl2025@learner.manipal.edu";

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "MSM Control Center <onboarding@resend.dev>",
    to,
    subject: "MSM Test",
    html: "<p>test</p>",
  }),
});

console.log("status:", res.status);
console.log(await res.text());
