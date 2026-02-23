@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

where node >nul 2>&1
if errorlevel 1 goto :no_node

node "%ROOT%scripts\pcstart-runner.cjs"
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo 启动失败，请根据上方错误信息处理后重试。
pause
exit /b 1

:no_node
echo.
echo 未检测到 Node.js，请先安装 Node.js LTS 后再运行。
pause
exit /b 1
