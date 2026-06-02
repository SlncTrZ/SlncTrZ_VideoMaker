@echo off
title SlncTrZ_VideoMaker
cd /d "%~dp0"

:: Switch to UTF-8 for Unicode box-drawing characters
chcp 65001 >nul

echo.
echo  ╔═══╗ ╦  ╦ ╔═╗ ╔═╗ ╔═══╗ ╦   ╦
echo  ╚══╗║ ╚╗╔╝ ║ ║ ║ ║ ╚══╗║ ╚╗ ╔╝
echo  ╔══╝║  ╚╝  ╚═╝ ╚═╝ ╔══╝║  ╚╗╔╝
echo  ╚═══╝       ╚═══╝  ╚═══╝   ╚╝
echo.
echo ====== Video Maker - Starting All Services ======
echo.

:: Prerequisites
where python >nul 2>&1 || ( echo [FAIL] Python not found in PATH & pause & exit /b 1 )
where node >nul 2>&1   || ( echo [FAIL] Node.js not found in PATH & pause & exit /b 1 )
where yarn >nul 2>&1   || ( echo [FAIL] Yarn not found in PATH & pause & exit /b 1 )

:: Ports
set TOONFLOW_PORT=10588
set OMNIVOICE_PORT=8880

:: Kill old processes
echo [1/4] Cleaning ports %TOONFLOW_PORT%, %OMNIVOICE_PORT%...
for %%p in (%TOONFLOW_PORT% %OMNIVOICE_PORT%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Start both services simultaneously
echo [2/4] Starting OmniVoice (port %OMNIVOICE_PORT%)...
start "OmniVoice" cmd /c "title OmniVoice && set OMNIVOICE_PORT=%OMNIVOICE_PORT% && cd /d apps\omnivoice && mkdir logs 2>nul && python -m omnivoice_server.cli --port %OMNIVOICE_PORT% --host 127.0.0.1 --device auto --model k2-fsa/OmniVoice"

echo [3/4] Starting ToonFlow (port %TOONFLOW_PORT%)...
start "ToonFlow" cmd /c "title ToonFlow && set PORT=%TOONFLOW_PORT% && cd /d apps\toonflow && yarn dev"

:: Health check — wait for both services
echo [4/4] Waiting for services (this may take a minute)...
echo.

:: Check OmniVoice (timeout 120s)
powershell -c ^
"$t=(get-date); $ok=$false; " ^
"while(((get-date)-$t).totalseconds -lt 120 -and !$ok){ " ^
"  try{ $r=curl.exe -s -f http://127.0.0.1:%OMNIVOICE_PORT%/health 2>$null; if($LASTEXITCODE -eq 0){ $ok=$true } }catch{} " ^
"  if(!$ok){ write-host '.' -nonewline; start-sleep 3 } " ^
"} " ^
"if($ok){ write-host ''; write-host '[OK] OmniVoice ready' -f green }else{ write-host ''; write-host '[WARN] OmniVoice timeout' -f yellow }"

:: Check ToonFlow (timeout 60s)
powershell -c ^
"$t=(get-date); $ok=$false; " ^
"while(((get-date)-$t).totalseconds -lt 60 -and !$ok){ " ^
"  try{ $r=curl.exe -s -f http://127.0.0.1:%TOONFLOW_PORT%/api/bridge/status 2>$null; if($LASTEXITCODE -eq 0){ $ok=$true } }catch{} " ^
"  if(!$ok){ write-host '.' -nonewline; start-sleep 2 } " ^
"} " ^
"if($ok){ write-host ''; write-host '[OK] ToonFlow ready' -f green }else{ write-host ''; write-host '[WARN] ToonFlow timeout' -f yellow }"

:: Dashboard
echo.
echo +----------------------------------------------------+
echo |  [1] ToonFlow  http://localhost:%TOONFLOW_PORT%             |
echo |  [2] WS-Bridge ws://localhost:%TOONFLOW_PORT%/api/bridge/ws |
echo |  [3] OmniVoice http://localhost:%OMNIVOICE_PORT%             |
echo |  [4] OmniDocs  http://localhost:%OMNIVOICE_PORT%/docs        |
echo +----------------------------------------------------+
echo |  Press Enter = Stop all services                   |
echo +----------------------------------------------------+
echo.

pause >nul

:: Cleanup
echo.
echo Stopping services...
taskkill /fi "WindowTitle eq ToonFlow*" /f >nul 2>&1
taskkill /fi "WindowTitle eq OmniVoice*" /f >nul 2>&1
for %%p in (%TOONFLOW_PORT% %OMNIVOICE_PORT%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo Done.
timeout /t 2 /nobreak >nul
