# MSM Control Center — Vercel + Supabase Deploy
# Run in PowerShell from project root

Write-Host "`n=== MSM Control Center — Vercel + Supabase ===" -ForegroundColor Cyan
Write-Host "Developed by Raam — Naam toh suna hoga !!`n" -ForegroundColor Yellow

# Step 1: Vercel login
Write-Host "[1/5] Logging into Vercel..." -ForegroundColor Green
npx vercel login
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 2: Supabase setup instructions
Write-Host "`n[2/5] Supabase database" -ForegroundColor Green
Write-Host "If you haven't created a Supabase project yet:"
Write-Host "  1. Go to https://supabase.com → New Project"
Write-Host "  2. Name: msm-control-center"
Write-Host "  3. Project Settings → Database → Connection string"
Write-Host "  4. Copy BOTH:"
Write-Host "     - Transaction pooler (port 6543) → DATABASE_URL"
Write-Host "     - Direct connection (port 5432)  → DIRECT_URL"
Write-Host ""

$poolerUrl = Read-Host "Paste Supabase DATABASE_URL (pooler, port 6543)"
$directUrl = Read-Host "Paste Supabase DIRECT_URL (direct, port 5432)"

# Step 3: Set env vars on Vercel
Write-Host "`n[3/5] Setting Vercel environment variables..." -ForegroundColor Green
$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

echo $poolerUrl | npx vercel env add DATABASE_URL production
echo $directUrl | npx vercel env add DIRECT_URL production
echo $jwt | npx vercel env add JWT_SECRET production

# Step 4: Deploy
Write-Host "`n[4/5] Deploying to Vercel..." -ForegroundColor Green
npx vercel deploy --prod --yes
$deployUrl = npx vercel ls 2>$null | Select-Object -First 1
echo "https://msm-control-center.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production 2>$null

# Step 5: Database init
Write-Host "`n[5/5] Initializing Supabase database..." -ForegroundColor Green
$env:DATABASE_URL = $directUrl
$env:DIRECT_URL = $directUrl
npx prisma db push
npm run db:seed

Write-Host "`n=== LIVE! ===" -ForegroundColor Cyan
Write-Host "Your stack: Vercel (hosting) + Supabase (database)" -ForegroundColor White
Write-Host ""
Write-Host "Login:  raam@msm.cohort / msm2026" -ForegroundColor Green
Write-Host "Upload: Upload TT tab → TERM 4 MBA-MKT TT.xlsx" -ForegroundColor Green
Write-Host ""
Write-Host "Check your Vercel URL: npx vercel ls`n" -ForegroundColor Yellow
