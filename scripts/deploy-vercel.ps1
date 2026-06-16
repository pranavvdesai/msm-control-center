# MSM Control Center — Vercel Deploy Script
# Run in PowerShell from project root

Write-Host "`n=== MSM Control Center — Vercel Deploy ===" -ForegroundColor Cyan
Write-Host "Developed by Raam — Naam toh suna hoga !!`n" -ForegroundColor Yellow

# Step 1: Vercel login
Write-Host "[1/4] Logging into Vercel..." -ForegroundColor Green
npx vercel login
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 2: Database URL
Write-Host "`n[2/4] Database setup" -ForegroundColor Green
Write-Host "Create a FREE database at one of these (takes 2 min):"
Write-Host "  - Neon:     https://neon.tech  (recommended)"
Write-Host "  - Supabase: https://supabase.com"
Write-Host ""
$dbUrl = Read-Host "Paste your PostgreSQL DATABASE_URL"

# Step 3: Set env vars on Vercel
Write-Host "`n[3/4] Setting environment variables..." -ForegroundColor Green
$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

echo $dbUrl | npx vercel env add DATABASE_URL production
echo $jwt | npx vercel env add JWT_SECRET production
echo "https://msm-control-center.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production

# Step 4: Deploy
Write-Host "`n[4/4] Deploying to production..." -ForegroundColor Green
npx vercel deploy --prod --yes

Write-Host "`n=== Deploy complete! ===" -ForegroundColor Cyan
Write-Host "Next: Run database setup:" -ForegroundColor Yellow
Write-Host '  $env:DATABASE_URL="' + $dbUrl + '"'
Write-Host "  npx prisma db push"
Write-Host "  npm run db:seed"
Write-Host ""
Write-Host "Then login: raam@msm.cohort / msm2026" -ForegroundColor Green
Write-Host "Upload timetable: Upload TT tab -> TERM 4 MBA-MKT TT.xlsx`n"
