# 一键部署：本地构建 → 打包 → 上传 → 解压到服务器
# 用法：pwsh scripts/deploy.ps1
param(
  [string]$Server = 'root@114.55.128.202',
  [string]$RemoteDir = '/var/www/addressbook',
  [string]$Base = '/addressbook/'
)

$ErrorActionPreference = 'Stop'
$env:VITE_BASE = $Base

Write-Host "[1/4] 构建（base=$Base）"
npm run build
if ($LASTEXITCODE -ne 0) { throw '构建失败' }

Write-Host '[2/4] 打包'
$archive = Join-Path $PSScriptRoot '..\deploy-dist.tar.gz'
if (Test-Path $archive) { Remove-Item $archive }
tar -czf $archive -C dist .

Write-Host "[3/4] 上传到 $Server"
scp -q $archive "${Server}:/tmp/addressbook-dist.tar.gz"

Write-Host '[4/4] 解压并替换'
ssh $Server "rm -rf $RemoteDir && mkdir -p $RemoteDir && tar -xzf /tmp/addressbook-dist.tar.gz -C $RemoteDir && rm -f /tmp/addressbook-dist.tar.gz"

Remove-Item $archive
Remove-Item Env:\VITE_BASE
Write-Host "完成：http://114.55.128.202$Base"
