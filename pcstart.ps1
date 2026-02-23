$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "未检测到 Node.js，请先安装 Node.js LTS 后再运行。"
    exit 1
}

& node "$root\scripts\pcstart-runner.cjs"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "启动失败，请根据上方错误信息处理后重试。"
    exit $LASTEXITCODE
}
