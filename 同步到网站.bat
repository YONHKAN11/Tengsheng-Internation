@echo off
title Tengsheng - Sync to website
cd /d "%~dp0cms"
set "PATH=%~dp0runtime\node;%PATH%"

echo.
echo  [1/2] Exporting content from the CMS...
echo        If this fails, close the admin window first.
echo.

call npm run export:static
if errorlevel 1 (
  echo.
  echo  Export failed. Close the admin window and try again.
  pause
  exit /b 1
)

cd /d "%~dp0site"
echo.
echo  [2/2] Building the static site...
echo.

python build.py
if errorlevel 1 (
  echo.
  echo  Build failed. Make sure Python is installed.
  pause
  exit /b 1
)

echo.
echo  Done. site\dist has been updated.
pause
