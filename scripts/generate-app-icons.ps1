$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resRoot = Join-Path $root "android\app\src\main\res"

$bg = [System.Drawing.Color]::FromArgb(255, 3, 0, 20)
$text = [System.Drawing.Color]::FromArgb(255, 34, 211, 238)
$accent = [System.Drawing.Color]::FromArgb(255, 139, 92, 246)

function Draw-MsmIcon {
    param(
        [int]$Size,
        [bool]$ForegroundOnly = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    if (-not $ForegroundOnly) {
        $g.Clear($bg)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    if (-not $ForegroundOnly) {
        $ringWidth = [Math]::Max(2, [int]($Size * 0.012))
        $ringPen = [System.Drawing.Pen]::new($accent, $ringWidth)
        $ringPen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
        $margin = [int]($Size * 0.08)
        $g.DrawEllipse($ringPen, $margin, $margin, $Size - 2 * $margin, $Size - 2 * $margin)
        $ringPen.Dispose()
    }

    $fontSize = [Math]::Round($Size * 0.28)
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Object System.Drawing.SolidBrush $text
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringFormatAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringFormatAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
    if ($ForegroundOnly) {
        $rect = New-Object System.Drawing.RectangleF ([single]($Size * 0.12)), ([single]($Size * 0.12)), ([single]($Size * 0.76)), ([single]($Size * 0.76))
    }

    $g.DrawString("MSM", $font, $brush, $rect, $format)

    $font.Dispose()
    $brush.Dispose()
    $format.Dispose()
    $g.Dispose()
    return $bmp
}

function Save-ScaledIcon {
    param(
        [System.Drawing.Bitmap]$Source,
        [string]$Path,
        [int]$Size
    )

    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    $scaled = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($scaled)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($Source, 0, 0, $Size, $Size)
    $g.Dispose()
    $scaled.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $scaled.Dispose()
}

$master = Draw-MsmIcon -Size 512 -ForegroundOnly:$false
$masterFg = Draw-MsmIcon -Size 512 -ForegroundOnly:$true

$densityMap = @{
    "mipmap-mdpi"    = @{ launcher = 48; foreground = 108 }
    "mipmap-hdpi"    = @{ launcher = 72; foreground = 162 }
    "mipmap-xhdpi"   = @{ launcher = 96; foreground = 216 }
    "mipmap-xxhdpi"  = @{ launcher = 144; foreground = 324 }
    "mipmap-xxxhdpi" = @{ launcher = 192; foreground = 432 }
}

foreach ($folder in $densityMap.Keys) {
    $sizes = $densityMap[$folder]
    $launcherPath = Join-Path $resRoot "$folder\ic_launcher.png"
    $roundPath = Join-Path $resRoot "$folder\ic_launcher_round.png"
    $fgPath = Join-Path $resRoot "$folder\ic_launcher_foreground.png"

    Save-ScaledIcon -Source $master -Path $launcherPath -Size $sizes.launcher
    Save-ScaledIcon -Source $master -Path $roundPath -Size $sizes.launcher
    Save-ScaledIcon -Source $masterFg -Path $fgPath -Size $sizes.foreground
}

$master.Dispose()
$masterFg.Dispose()

Write-Host "Generated MSM launcher icons in $resRoot"
