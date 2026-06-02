<#
.SYNOPSIS
    SlncTrZ_VideoMaker — Start All Services
.DESCRIPTION
    Khởi động ToonFlow (kèm WS-Bridge embedded) + OmniVoice TTS
    1 lệnh duy nhất, zero config.
.NOTES
    MeiLin | Wing: code_chronicles | Updated: 2026-06-02
#>

param(
    [switch]$NoOmnivoice,
    [switch]$NoToonflow,
    [switch]$BuildExtension
)

$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir ".env"

# ─── Load .env ───
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      SlncTrZ_VideoMaker — Starting All Services   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Simple .env parser
Get-Content $EnvFile -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)\s*$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
    }
}

$ToonflowPort = [Environment]::GetEnvironmentVariable("TOONFLOW_PORT") ?? "10588"
$OmnivoicePort = [Environment]::GetEnvironmentVariable("OMNIVOICE_PORT") ?? "8880"
$OmnivoiceDevice = [Environment]::GetEnvironmentVariable("OMNIVOICE_DEVICE") ?? "auto"
$OmnivoiceModel = [Environment]::GetEnvironmentVariable("OMNIVOICE_MODEL") ?? "k2-fsa/OmniVoice"

$Jobs = @()

function Write-Status($icon, $text, $color = "White") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $icon " -NoNewline -ForegroundColor DarkGray
    Write-Host $text -ForegroundColor $color
}

function Wait-ForPort($port, $timeoutSeconds = 60) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.ConnectAsync("127.0.0.1", $port).Wait(1000)
            if ($tcp.Connected) {
                $tcp.Close()
                return $true
            }
            $tcp.Dispose()
        } catch {}
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    return $false
}

function Stop-JobSafe($job) {
    if ($job -and $job.Id -and (Get-Job -Id $job.Id -ErrorAction SilentlyContinue)) {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    }
}

# ─── Kill port cũ ───
Write-Status "🔍" "Kiểm tra port conflict..." Yellow
@($ToonflowPort, $OmnivoicePort) | ForEach-Object {
    try {
        $process = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue |
                   Select-Object -First 1 -ExpandProperty OwningProcess
        if ($process) {
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
            Write-Status "💀" "Killed process on port $_" Red
        }
    } catch {}
}
Start-Sleep -Seconds 2

# ─── Start OmniVoice ───
if (-not $NoOmnivoice) {
    Write-Status "🚀" "Starting OmniVoice API on port $OmnivoicePort..." Yellow
    $omnivoiceDir = Join-Path $RootDir "apps\omnivoice"
    $logsDir = Join-Path $omnivoiceDir "logs"
    if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }

    $omnivoiceJob = Start-Job -Name "OmniVoice" -ScriptBlock {
        param($dir, $port, $device, $model)
        Set-Location $dir
        $env:OMNIVOICE_PORT = $port
        & python -m omnivoice_server.cli --port $port --host 127.0.0.1 --device $device --model $model 2>&1
    } -ArgumentList $omnivoiceDir, $OmnivoicePort, $OmnivoiceDevice, $OmnivoiceModel

    $Jobs += @{ Name="OmniVoice"; Port=$OmnivoicePort; Job=$omnivoiceJob }
}

# ─── Start ToonFlow (kèm WS-Bridge embedded) ───
if (-not $NoToonflow) {
    Write-Status "🚀" "Starting ToonFlow (WS-Bridge embedded) on port $ToonflowPort..." Yellow
    $toonflowDir = Join-Path $RootDir "apps\toonflow"
    $env:PORT = $ToonflowPort

    $toonflowJob = Start-Job -Name "ToonFlow" -ScriptBlock {
        param($dir, $port)
        Set-Location $dir
        $env:PORT = $port
        if (Test-Path "node_modules\.bin\nodemon.cmd") {
            $cmd = ".\node_modules\.bin\nodemon.cmd"
            $args = "--inspect --exec tsx src/app.ts"
        } else {
            $cmd = "yarn"
            $args = "dev"
        }
        if ($args) {
            & $cmd $args 2>&1
        } else {
            & $cmd 2>&1
        }
    } -ArgumentList $toonflowDir, $ToonflowPort

    $Jobs += @{ Name="ToonFlow"; Port=$ToonflowPort; Job=$toonflowJob }
}

# ─── Build Chrome Extension ───
if ($BuildExtension) {
    Write-Status "🏗️" "Building Chrome Extension..." Yellow
    $extDir = Join-Path $RootDir "extensions\chrome-vmk\SlncTrZ_Everything-GenAI"
    $buildJob = Start-Job -Name "BuildExt" -ScriptBlock {
        param($dir)
        Set-Location $dir
        & node build.mjs --production 2>&1
    } -ArgumentList $extDir
    $buildResult = $buildJob | Wait-Job | Receive-Job
    Write-Status $buildResult
}

# ─── Health Check Loop ───
Write-Host ""
Write-Status "⏳" "Đợi services khởi động..." Cyan
$allUp = $true
foreach ($svc in $Jobs) {
    $up = Wait-ForPort $svc.Port -timeoutSeconds 60
    if ($up) {
        $url = if ($svc.Name -eq "ToonFlow") { "http://localhost:$($svc.Port)" } else { "http://localhost:$($svc.Port)/health" }
        Write-Status "✅" "$($svc.Name) UP → $url" Green
    } else {
        Write-Status "❌" "$($svc.Name) FAILED (port $($svc.Port))" Red
        $allUp = $false
    }
}

# ─── Summary Dashboard ───
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  DASHBOARD                     ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Cyan
if (-not $NoToonflow) {
    Write-Host "║  🎬 ToonFlow     → http://localhost:$ToonflowPort   ║" -ForegroundColor Green
    Write-Host "║  🌉 WS-Bridge    → ws://localhost:$ToonflowPort/api/bridge/ws ║" -ForegroundColor Green
}
if (-not $NoOmnivoice) {
    Write-Host "║  🎤 OmniVoice    → http://localhost:$OmnivoicePort     ║" -ForegroundColor Green
    Write-Host "║  📋 API Docs     → http://localhost:$OmnivoicePort/docs      ║" -ForegroundColor Green
}
Write-Host "╠══════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  [Q] Quit all services                        ║" -ForegroundColor Yellow
Write-Host "║  [R] Restart all                              ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Interactive loop ───
try {
    do {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true).Key
            if ($key -eq 'Q') { break }
            if ($key -eq 'R') {
                Write-Status "🔄" "Restarting all services..." Yellow
                # TODO: restart logic
            }
        }
        # Print latest log lines
        foreach ($svc in $Jobs) {
            $output = Receive-Job $svc.Job -ErrorAction SilentlyContinue
            if ($output) {
                $output -split "`n" | Select-Object -Last 1 | Where-Object { $_ } | ForEach-Object {
                    Write-Host "  [$($svc.Name)] $_" -ForegroundColor DarkGray
                }
            }
        }
        Start-Sleep -Seconds 3
    } while ($true)
}
finally {
    # ─── Cleanup ───
    Write-Host ""
    Write-Status "🛑" "Shutting down all services..." Yellow
    foreach ($svc in $Jobs) {
        Stop-JobSafe $svc.Job
        Write-Status "✅" "$($svc.Name) stopped" DarkGray
    }
    # Kill orphan processes on our ports
    @($ToonflowPort, $OmnivoicePort) | ForEach-Object {
        try {
            $process = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue |
                       Select-Object -First 1 -ExpandProperty OwningProcess
            if ($process) { Stop-Process -Id $process -Force -ErrorAction SilentlyContinue }
        } catch {}
    }
    Write-Status "👋" "All services stopped. Goodbye!" Cyan
}
