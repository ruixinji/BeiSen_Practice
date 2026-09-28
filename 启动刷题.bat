@echo off
title BeiSen Practice - local server
cd /d "%~dp0"

REM node lives outside this folder; resolve it relatively so no hard-coded
REM non-ASCII path is needed inside this script.
set "NODEDIR=%~dp0..\..\..\.workbuddy\binaries\node\versions\22.22.2-3"

if not exist "%NODEDIR%\npm.cmd" (
  echo.
  echo [ERROR] Node.js / npm not found at:
  echo    %NODEDIR%
  echo.
  echo Open this file in Notepad and point NODEDIR to your own Node.js folder.
  echo.
  pause
  exit /b 1
)
set "PATH=%NODEDIR%;%PATH%"

netstat -ano | findstr ":5173 " | findstr LISTENING >nul
if not errorlevel 1 (
  echo Server already running - opening the browser.
  start "" http://127.0.0.1:5173/
  timeout /t 3 >nul
  exit /b 0
)

echo ============================================================
echo   BeiSen practice platform
echo   http://127.0.0.1:5173/
echo.
echo   The browser opens in about 5 seconds.
echo   KEEP THIS WINDOW OPEN while practicing.
echo   Press Ctrl+C here to stop the server.
echo ============================================================
echo.

start "" /min cmd /c "timeout /t 5 >nul && start http://127.0.0.1:5173/"

call "%NODEDIR%\npm.cmd" run dev -- --base=/ --port 5173 --strictPort --host 127.0.0.1

echo.
echo Server stopped.
pause
