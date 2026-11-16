@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 通讯录 - 开发服务器

if not exist node_modules (
  echo [1/2] 首次运行，正在安装依赖，请稍等 1-3 分钟...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo.
echo  [2/2] 启动开发服务器...
echo  地址: http://localhost:5173
echo  关闭本窗口即停止服务。
echo.

start "" http://localhost:5173
call npm run dev
pause
