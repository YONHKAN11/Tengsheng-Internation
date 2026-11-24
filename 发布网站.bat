@echo off
title Tengsheng - Build publish package
cd /d "%~dp0site"
python build.py
if errorlevel 1 (
  echo.
  echo  Build failed. Make sure Python is installed.
  pause
  exit /b 1
)
cd /d "%~dp0"
python -c "import zipfile,pathlib; d=pathlib.Path('site/dist'); z=zipfile.ZipFile('发布包.zip','w',zipfile.ZIP_DEFLATED); [z.write(f, f.relative_to(d).as_posix()) for f in sorted(d.rglob('*')) if f.is_file()]; z.close()"
echo.
echo  Done. site\dist and 发布包.zip are updated.
echo  Upload 发布包.zip (or the site\dist folder) to Cloudflare Pages.
echo.
start "" "%~dp0site\dist"
pause
