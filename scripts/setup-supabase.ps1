# Supabase + Vercel full setup script
# Prerequisites: vercel login + supabase login (or pass tokens below)

param(
    [string]$SupabaseToken = "",
    [string]$DbPassword = "MsmControl2026!"
)

$ErrorActionPreference = "Stop"
$ProjectName = "msm-control-center"
$Region = "ap-south-1"

Write-Host "`n=== MSM Supabase + Vercel Setup ===" -ForegroundColor Cyan

if ($SupabaseToken) {
    npx supabase login --token $SupabaseToken
}

# Get org ID
Write-Host "`nFetching Supabase organizations..." -ForegroundColor Green
$orgsJson = npx supabase orgs list -o json 2>&1 | Out-String
$orgs = $orgsJson | ConvertFrom-Json
if (-not $orgs -or $orgs.Count -eq 0) {
    Write-Host "Not logged into Supabase. Run: npx supabase login" -ForegroundColor Red
    exit 1
}
$orgId = $orgs[0].id
Write-Host "Using org: $($orgs[0].name) ($orgId)"

# Create project
Write-Host "`nCreating Supabase project '$ProjectName' in Mumbai..." -ForegroundColor Green
npx supabase projects create $ProjectName --org-id $orgId --db-password $DbPassword --region $Region --yes

# Wait for project to be ready
Write-Host "Waiting for project to provision (60s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Get project ref
$projectsJson = npx supabase projects list -o json 2>&1 | Out-String
$projects = $projectsJson | ConvertFrom-Json
$project = $projects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1
$ref = $project.id
Write-Host "Project ref: $ref"

# Build connection strings
$encodedPass = [uri]::EscapeDataString($DbPassword)
$poolerUrl = "postgresql://postgres.${ref}:${encodedPass}@aws-0-${Region}.pooler.supabase.com:6543/postgres?pgbouncer=true"
$directUrl = "postgresql://postgres.${ref}:${encodedPass}@aws-0-${Region}.pooler.supabase.com:5432/postgres"

Write-Host "`nSetting Vercel environment variables..." -ForegroundColor Green
$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })

echo $poolerUrl | npx vercel env add DATABASE_URL production
echo $directUrl | npx vercel env add DIRECT_URL production
echo $jwt | npx vercel env add JWT_SECRET production
echo "https://msm-control-center.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production

# Init database
Write-Host "`nInitializing database schema..." -ForegroundColor Green
$env:DATABASE_URL = $directUrl
$env:DIRECT_URL = $directUrl
npx prisma db push
npm run db:seed

# Redeploy
Write-Host "`nRedeploying Vercel..." -ForegroundColor Green
npx vercel deploy --prod --yes

Write-Host "`n=== ALL DONE ===" -ForegroundColor Cyan
Write-Host "Live: https://msm-control-center.vercel.app"
Write-Host "Login: raam@msm.cohort / msm2026"
Write-Host "Supabase: https://supabase.com/dashboard/project/$ref"
Write-Host "DB Password: $DbPassword (save this!)"
