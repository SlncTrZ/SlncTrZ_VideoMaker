@echo off
title SlncTrZ_VideoMaker
cd /d "%~dp0"

echo.
echo  /==============================================\
echo  [         S L N C   T R Z   V I D E O         ]
echo  [             Video Maker - Start              ]
echo  \==============================================/
echo.

:: Prerequisites
where python >nul 2>&1 || ( echo [FAIL] Python not found & pause & exit /b 1 )
where node >nul 2>&1   || ( echo [FAIL] Node.js not found & pause & exit /b 1 )
where yarn >nul 2>&1   || ( echo [FAIL] Yarn not found & pause & exit /b 1 )

:: Ports
set TOONFLOW_PORT=10588
set OMNIVOICE_PORT=8880

:: Kill old processes (ToonFlow + OmniVoice + ws-bridge)
echo [1/5] Cleaning ports %TOONFLOW_PORT%, %OMNIVOICE_PORT%, 1888, 1889...
for %%p in (%TOONFLOW_PORT% %OMNIVOICE_PORT% 1888 1889) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Start OmniVoice
echo [2/5] Starting OmniVoice (port %OMNIVOICE_PORT%)...
start "OmniVoice" cmd /c "title OmniVoice && set OMNIVOICE_PORT=%OMNIVOICE_PORT% && cd /d apps\omnivoice && mkdir logs 2>nul && python -m omnivoice_server.cli --port %OMNIVOICE_PORT% --host 127.0.0.1 --device auto --model k2-fsa/OmniVoice"

:: Start WS-Bridge (standalone, extension connects here)
echo [3/5] Starting WS-Bridge (ports 1888/1889)...
start "WSBridge" cmd /c "title WSBridge && cd /d apps\toonflow && node tools/ws-bridge/ws-bridge-server.mjs"

:: Start ToonFlow
echo [4/5] Starting ToonFlow (port %TOONFLOW_PORT%)...
start "ToonFlow" cmd /c "title ToonFlow && set PORT=%TOONFLOW_PORT% && cd /d apps\toonflow && yarn dev"

:: Health check
echo [5/5] Waiting for services...
echo.

echo Checking OmniVoice...
powershell -c "$t=(get-date); $ok=$false; while(((get-date)-$t).totalseconds -lt 120 -and !$ok){ try{ $r=curl.exe -s -f http://127.0.0.1:%OMNIVOICE_PORT%/health 2>$null; if($LASTEXITCODE -eq 0){ $ok=$true } }catch{} if(!$ok){ write-host '.' -nonewline; start-sleep 3 } }; if($ok){ write-host ''; write-host '[OK] OmniVoice ready' -f Green }else{ write-host ''; write-host '[WARN] OmniVoice timeout' -f Yellow }"

echo Checking ToonFlow...
powershell -c "$t=(get-date); $ok=$false; while(((get-date)-$t).totalseconds -lt 60 -and !$ok){ try{ $r=curl.exe -s -f http://127.0.0.1:%TOONFLOW_PORT%/ 2>$null; if($LASTEXITCODE -eq 0){ $ok=$true } }catch{} if(!$ok){ write-host '.' -nonewline; start-sleep 2 } }; if($ok){ write-host ''; write-host '[OK] ToonFlow ready' -f Green }else{ write-host ''; write-host '[WARN] ToonFlow timeout' -f Yellow }"

:: Dashboard
echo.
echo +----------------------------------------------------+
echo |  [1] ToonFlow  http://localhost:%TOONFLOW_PORT%             |
echo |  [2] WS-Bridge ws://localhost:1888                      |
echo |  [3] OmniVoice http://localhost:%OMNIVOICE_PORT%             |
echo |  [4] OmniDocs  http://localhost:%OMNIVOICE_PORT%/docs        |
echo +----------------------------------------------------+
echo |  Press Enter to stop all services                  |
echo +----------------------------------------------------+
echo.

pause >nul

:: Cleanup
echo.
echo Stopping services...
taskkill /fi "WindowTitle eq ToonFlow*" /f >nul 2>&1
taskkill /fi "WindowTitle eq OmniVoice*" /f >nul 2>&1
taskkill /fi "WindowTitle eq WSBridge*" /f >nul 2>&1
for %%p in (%TOONFLOW_PORT% %OMNIVOICE_PORT% 1888 1889) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo Done.
timeout /t 2 /nobreak >nul
