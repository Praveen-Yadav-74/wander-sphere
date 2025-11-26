# PowerShell script to update .env.example files with production URLs

Write-Host "Updating .env.example files with production URLs..." -ForegroundColor Green

# Update backend .env.example
$backendEnvPath = "backend\.env.example"
if (Test-Path $backendEnvPath) {
    Write-Host "Updating $backendEnvPath..." -ForegroundColor Yellow
    $content = Get-Content $backendEnvPath -Raw
    $content = $content -replace 'https://your-frontend-domain\.vercel\.app', 'https://wander-sphere-zpml.vercel.app'
    $content = $content -replace 'your-frontend-domain', 'wander-sphere-zpml.vercel.app'
    Set-Content -Path $backendEnvPath -Value $content -NoNewline
    Write-Host "✓ Updated $backendEnvPath" -ForegroundColor Green
} else {
    Write-Host "⚠ $backendEnvPath not found" -ForegroundColor Yellow
}

# Create/update frontend .env.example if it doesn't exist
$frontendEnvPath = ".env.example"
if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "Creating $frontendEnvPath..." -ForegroundColor Yellow
    $frontendContent = @"
# WanderSphere Environment Variables
# Copy this file to .env.local for local development
# DO NOT commit .env.local to Git (it's in .gitignore)

# ============================================
# API Configuration
# ============================================

# Production API URL (used when building for production)
# For local development, change to: http://localhost:5000
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com

# API Timeout (milliseconds)
VITE_API_TIMEOUT=15000

# Enable API Logging (true/false)
# Set to false in production, true for local development
VITE_ENABLE_API_LOGGING=false

# ============================================
# Supabase Configuration
# ============================================

# Your Supabase Project URL
# Get this from: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=your_supabase_project_url_here

# Your Supabase Anonymous Key (Public Key)
# Get this from: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
"@
    Set-Content -Path $frontendEnvPath -Value $frontendContent
    Write-Host "✓ Created $frontendEnvPath" -ForegroundColor Green
} else {
    Write-Host "✓ $frontendEnvPath already exists" -ForegroundColor Green
}

Write-Host "`nDone! All .env.example files updated." -ForegroundColor Green

