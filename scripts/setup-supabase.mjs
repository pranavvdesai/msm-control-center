/**
 * Full Supabase + Vercel setup for MSM Control Center
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
 */
import { execSync } from "child_process";
import { randomBytes } from "crypto";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DB_PASSWORD = process.env.DB_PASSWORD || "MsmControl2026!";
const PROJECT_NAME = "msm-control-center";
const REGION = "ap-south-1";

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  console.error("Get one at: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const api = async (path, options = {}) => {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("\n=== MSM Supabase Setup ===\n");

  const orgs = await api("/organizations");
  if (!orgs?.length) throw new Error("No Supabase organizations found");
  const orgId = orgs[0].id;
  console.log(`Org: ${orgs[0].name}`);

  let project;
  const existing = await api("/projects");
  project = existing.find((p) => p.name === PROJECT_NAME);

  if (!project) {
    console.log("Creating Supabase project...");
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        organization_id: orgId,
        name: PROJECT_NAME,
        db_pass: DB_PASSWORD,
        region: REGION,
        plan: "free",
      }),
    });
  } else {
    console.log("Project already exists, reusing...");
  }

  const ref = project.id || project.ref;
  console.log(`Project ref: ${ref}`);
  console.log("Waiting for project to be active...");

  for (let i = 0; i < 30; i++) {
    const status = await api(`/projects/${ref}`);
    if (status.status === "ACTIVE_HEALTHY") break;
    await sleep(10000);
  }

  const encoded = encodeURIComponent(DB_PASSWORD);
  const poolerUrl = `postgresql://postgres.${ref}:${encoded}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const directUrl = `postgresql://postgres.${ref}:${encoded}@aws-0-${REGION}.pooler.supabase.com:5432/postgres`;

  console.log("\nSetting Vercel env vars...");
  const jwt = randomBytes(32).toString("hex");
  const run = (cmd) => execSync(cmd, { stdio: "inherit", shell: true });

  const addEnv = (key, val) => {
    try {
      execSync(`echo ${val} | npx vercel env rm ${key} production -y`, { stdio: "pipe", shell: true });
    } catch {}
    execSync(`echo ${val} | npx vercel env add ${key} production`, { stdio: "inherit", shell: true });
  };

  addEnv("DATABASE_URL", poolerUrl);
  addEnv("DIRECT_URL", directUrl);
  addEnv("JWT_SECRET", jwt);
  addEnv("NEXT_PUBLIC_APP_URL", "https://msm-control-center.vercel.app");

  console.log("\nPushing database schema...");
  process.env.DATABASE_URL = directUrl;
  process.env.DIRECT_URL = directUrl;
  run("npx prisma db push");
  run("npm run db:seed");

  console.log("\nRedeploying Vercel...");
  run("npx vercel deploy --prod --yes");

  console.log("\n=== DONE ===");
  console.log("Live:     https://msm-control-center.vercel.app");
  console.log("Login:    raam@msm.cohort / msm2026");
  console.log("Supabase: https://supabase.com/dashboard/project/" + ref);
  console.log("DB Pass:  " + DB_PASSWORD);
}

main().catch((e) => {
  console.error("Setup failed:", e.message);
  process.exit(1);
});
