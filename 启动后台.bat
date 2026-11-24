@echo off
title Tengsheng CMS - Admin
cd /d "%~dp0cms"

set "RUNTIME=%~dp0runtime\node"

if exist "%RUNTIME%\node.exe" (
  set "PATH=%RUNTIME%;%PATH%"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    echo.
    echo  Node.js runtime not found.
    echo  Extract the complete project ^(runtime folder is required^),
    echo  or install Node.js 22.23.5+ from https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
  )
)

for /f "tokens=*" %%v in ('node -v') do set NODEVER=%%v
echo  Using Node %NODEVER%

if not exist node_modules (
  echo.
  echo  First run: installing admin dependencies, please wait...
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo  Dependency installation failed. Check your network and try again.
    pause
    exit /b 1
  )
)

echo.
echo  Admin URL: http://localhost:3000/admin
echo  Email:     admin@tengsheng.local
echo  Password:  Tengsheng-Admin-2026
echo.
echo  Keep this window open. Closing it stops the admin server.
echo.

start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000/admin"
call npm run dev

echo.
echo  Server stopped. Press any key to close.
pause >nul
