@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 部署 v1.0.0 到 114.55.128.202 ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
echo.
pause
