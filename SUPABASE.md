# Supabase + Vercel Setup (5 minutes)

**Stack:** Vercel hosts the app · Supabase stores all data

---

## Step 1 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **Start your project**
2. **New project**
   - Name: `msm-control-center`
   - Database password: save this somewhere safe
   - Region: **South Asia (Mumbai)** — closest to TAPMI
3. Wait ~2 minutes for project to provision

---

## Step 2 — Copy connection strings

In Supabase dashboard:

**Project Settings → Database → Connection string → URI**

Copy **two** URLs:

| Variable | Which one | Port |
|----------|-----------|------|
| `DATABASE_URL` | **Transaction pooler** (Session mode off) | 6543 |
| `DIRECT_URL` | **Direct connection** | 5432 |

Replace `[YOUR-PASSWORD]` with your database password in both URLs.

---

## Step 3 — Log in to Vercel (your laptop)

```powershell
cd "c:\Users\prana\OneDrive\Desktop\msm-control-center"
npx vercel login
```

Choose **Continue with GitHub**.

---

## Step 4 — Deploy everything

```powershell
.\scripts\deploy-vercel.ps1
```

Paste your Supabase URLs when prompted. The script will:
- Set env vars on Vercel
- Deploy the app
- Create tables in Supabase
- Seed demo users

---

## Step 5 — Go live

```powershell
npx vercel ls
```

Open your URL → Login: `raam@msm.cohort` / `msm2026`

Upload timetable: **Upload TT** → `TERM 4 MBA-MKT TT.xlsx`

---

## Manual env vars (Vercel Dashboard alternative)

Vercel → Your Project → **Settings → Environment Variables**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Supabase pooler URL (6543) |
| `DIRECT_URL` | Supabase direct URL (5432) |
| `JWT_SECRET` | Any long random string |
| `NEXT_PUBLIC_APP_URL` | Your `https://xxx.vercel.app` URL |

Then redeploy: `npx vercel deploy --prod --yes`

---

## View your data in Supabase

Supabase → **Table Editor** — you'll see:
- `User` — all registered students
- `Subject` — MSM courses with credits
- `Leave` — every absence marked
- `TimetableEntry` — uploaded schedule
- `ActivityEvent` — social feed messages

---

## Local dev still uses SQLite

Your laptop `.env` keeps `DATABASE_URL="file:./dev.db"` for fast local testing.
Production on Vercel uses Supabase automatically.
