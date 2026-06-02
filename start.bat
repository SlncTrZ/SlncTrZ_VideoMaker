@echo off
title SlncTrZ_VideoMaker
cd /d "%~dp0"

echo.
echo ========== SlncTrZ_VideoMaker - Starting All Services ==========
echo.

:: Prerequisites
where python >nul 2>&1 || ( echo [FAIL] Python not found in PATH & pause & exit /b 1 )
where node >nul 2>&1   || ( echo [FAIL] Node.js not found in PATH & pause & exit /b 1 )
where yarn >nul 2>&1   || ( echo [FAIL] Yarn not found in PATH & pause & exit /b 1 )

:: Ports
set TOONFLOW_PORT=10588
set OMNIVOICE_PORT=8880

:: Kill old processes
echo [1/4] Killing old processes on ports %TOONFLOW_PORT%, %OMNIVOICE_PORT%...
for %%p in (%TOONFLOW_PORT% %OMNIVOICE_PORT%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
timeout /t 2 /nobreak >nul

:: Start OmniVoice
echo [2/4] Starting OmniVoice on port %OMNIVOICE_PORT%...
start "OmniVoice" cmd /c "set OMNIVOICE_PORT=%OMNIVOICE_PORT% && cd /d apps\omnivoice && mkdir logs 2>nul && python -m omnivoice_server.cli --port %OMNIVOICE_PORT% --host 127.0.0.1 --device auto --model k2-fsa/OmniVoice"
timeout /t 5 /nobreak >nul

:: Start ToonFlow
echo [3/4] Starting ToonFlow (WS-Bridge embedded) on port %TOONFLOW_PORT%...
start "ToonFlow" cmd /c "set PORT=%TOONFLOW_PORT% && cd /d apps\toonflow && yarn dev"
timeout /t 3 /nobreak >nul

:: Dashboard
echo [4/4] Ready!
echo.
echo +----------------------------------------------------+
echo |  [1] ToonFlow  http://localhost:%TOONFLOW_PORT%             |
echo |  [2] WS-Bridge ws://localhost:%TOONFLOW_PORT%/api/bridge/ws |
echo |  [3] OmniVoice http://localhost:%OMNIVOICE_PORT%             |
echo |  [4] OmniDocs  http://localhost:%OMNIVOICE_PORT%/docs        |
echo +----------------------------------------------------+
echo |  Close this window = Stop ALL services             |
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
echo Done. Press Enter to exit.
pause >nul
