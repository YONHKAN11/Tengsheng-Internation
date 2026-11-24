@echo off
chcp 65001 >nul
start "" "%~dp0site\dist\index.html"
