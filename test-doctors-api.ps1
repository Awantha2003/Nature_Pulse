# PowerShell script to test the doctors API endpoint
Write-Host "Testing Doctors API Endpoint..." -ForegroundColor Green

try {
    # Test health endpoint first
    Write-Host "Testing health endpoint..." -ForegroundColor Yellow
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "Health check: $($healthResponse.StatusCode)" -ForegroundColor Green
    
    # Test doctors endpoint
    Write-Host "Testing doctors endpoint..." -ForegroundColor Yellow
    $doctorsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/users/doctors?verified=true&acceptingPatients=true" -Method GET
    Write-Host "Doctors endpoint: $($doctorsResponse.StatusCode)" -ForegroundColor Green
    
    # Parse and display response
    $doctorsData = $doctorsResponse.Content | ConvertFrom-Json
    Write-Host "Response status: $($doctorsData.status)" -ForegroundColor Cyan
    Write-Host "Number of doctors found: $($doctorsData.data.doctors.Count)" -ForegroundColor Cyan
    
    if ($doctorsData.data.doctors.Count -gt 0) {
        Write-Host "Doctors available:" -ForegroundColor Green
        foreach ($doctor in $doctorsData.data.doctors) {
            Write-Host "  - Dr. $($doctor.user.firstName) $($doctor.user.lastName) ($($doctor.specialization))" -ForegroundColor White
        }
    } else {
        Write-Host "No doctors found in the system." -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error testing API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the backend server is running on port 5000" -ForegroundColor Yellow
}
