# Deploy MSM Control Center

**Developed by Raam — Naam toh suna hoga !!**

Production stack: **GitHub** → **Vercel** → **Supabase PostgreSQL**

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. **New Project** → Name: `msm-control-center`
3. Save your database password
4. Go to **Project Settings → Database**
5. Copy these connection strings:
   - **Connection pooling** (port 6543) → `DATABASE_URL`
   - **Direct connection** (port 5432) → `DIRECT_URL`

---

## Step 2: Push to GitHub

```bash
cd msm-control-center
gh auth login
git add .
git commit -m "MSM Control Center — production ready"
gh repo create msm-control-center --public --source=. --push
```

Or create repo manually at github.com/new and:

```bash
git remote add origin https://github.com/pranavvdesai/msm-control-center.git
git push -u origin master
```

---

## Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooler URL (port 6543) |
| `DIRECT_URL` | Supabase direct URL (port 5432) |
| `JWT_SECRET` | Random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |

3. Deploy

---

## Step 4: Initialize Database

After first deploy, run locally with production env:

```bash
# Set DATABASE_URL and DIRECT_URL to Supabase in .env
npx prisma db push
npm run db:seed
```

Or use Vercel CLI:

```bash
npx vercel env pull .env.production
npx prisma db push
npm run db:seed
```

---

## Step 5: Upload Timetable

1. Visit your live URL → Login as admin
2. **Email:** `raam@msm.cohort` **Password:** `msm2026`
3. Go to **Upload TT** → Select `TERM 4 MBA-MKT TT.xlsx`
4. Click **Upload Timetable**

---

## Local Development

```bash
npm install
# Uses SQLite locally (.env with DATABASE_URL="file:./dev.db")
npm run db:setup:local
npm run dev
```

Open http://localhost:3000

---

## Custom Domain (Optional)

Vercel → Project → Settings → Domains → Add `msm.yourdomain.com`

Update `NEXT_PUBLIC_APP_URL` to match.
