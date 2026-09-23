# Gera os icones PWA/favicon do PrescriMed em public/ (System.Drawing, sem dependencias).
# Fundo: theme_color do manifest (#0f6675). Glifo: cruz medica branca centrada
# dentro da zona segura maskable (~40% do lado).
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path (Split-Path -Parent $root) "public"

$bg = [System.Drawing.Color]::FromArgb(255, 0x0F, 0x66, 0x75)
$fg = [System.Drawing.Color]::White

function New-Icon {
  param([int]$Size, [string]$Path)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($bg)

  # Cruz: bracos de largura 24% do lado, total ~52% do lado (zona segura maskable)
  $arm = [Math]::Round($Size * 0.24)
  $half = [Math]::Round($Size * 0.13)
  $cx = $Size / 2; $cy = $Size / 2
  $brush = New-Object System.Drawing.SolidBrush($fg)
  # barra vertical
  $g.FillRectangle($brush, $cx - $half, $cy - ($arm / 2 + $half), $half * 2, $arm + $half * 2)
  # barra horizontal
  $g.FillRectangle($brush, $cx - ($arm / 2 + $half), $cy - $half, $arm + $half * 2, $half * 2)
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK $Path ($Size x $Size)"
}

New-Icon -Size 512 -Path (Join-Path $public "app-icon-512.png")
New-Icon -Size 192 -Path (Join-Path $public "app-icon-192.png")
New-Icon -Size 180 -Path (Join-Path $public "apple-touch-icon.png")
New-Icon -Size 64  -Path (Join-Path $public "favicon.png")
