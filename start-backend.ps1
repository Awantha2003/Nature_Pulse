# PowerShell script to start the backend server
Write-Host "Starting Healthcare Platform Backend Server..." -ForegroundColor Green

# Change to backend directory
Set-Location -Path "Backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "Starting server on port 5000..." -ForegroundColor Cyan
node server.js
