param(
    [int]$GradioPort = 8881,
    [int]$ApiPort = 8880,
    [string]$Model = "k2-fsa/OmniVoice"
)

Write-Host "=== OmniVoice Server Starter ===" -ForegroundColor Cyan

# Kill old processes
Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort $GradioPort -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3

# Start REST API (omnivoice-server)
Write-Host "Starting REST API on port $ApiPort ..." -ForegroundColor Yellow
$apiJob = Start-Process -NoNewWindow -FilePath "python" `
    -ArgumentList "-m omnivoice_server.cli --port $ApiPort --host 127.0.0.1 --device auto --model $Model" `
    -RedirectStandardOutput "$PSScriptRoot\logs\api_$ApiPort.log" `
    -RedirectStandardError "$PSScriptRoot\logs\api_$ApiPort.err.log" `
    -PassThru

Start-Sleep -Seconds 2

# Start Gradio UI (omnivoice-demo)
Write-Host "Starting Gradio UI on port $GradioPort ..." -ForegroundColor Yellow
$demoJob = Start-Process -NoNewWindow -FilePath "python" `
    -ArgumentList "-m omnivoice.cli.demo --model $Model --port $GradioPort --device auto" `
    -RedirectStandardOutput "$PSScriptRoot\logs\demo_$GradioPort.log" `
    -RedirectStandardError "$PSScriptRoot\logs\demo_$GradioPort.err.log" `
    -PassThru

Write-Host ""
Write-Host "REST API  → http://127.0.0.1:$ApiPort   (docs at /docs)" -ForegroundColor Green
Write-Host "Gradio UI → http://127.0.0.1:$GradioPort" -ForegroundColor Green
Write-Host "Logs: $PSScriptRoot\logs\" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup on exit
Write-Host "Stopping services..." -ForegroundColor Yellow
Stop-Process -Id $apiJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $demoJob.Id -Force -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green
