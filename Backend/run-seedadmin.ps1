# PowerShell script to run admin seeding
Write-Host "🌱 Running admin seed script..." -ForegroundColor Green
Write-Host ""

# Change to the Backend directory
Set-Location $PSScriptRoot

# Run the seedadmin.js file
try {
    node seedadmin.js
    Write-Host ""
    Write-Host "✅ Admin seeding completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Admin seeding failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
