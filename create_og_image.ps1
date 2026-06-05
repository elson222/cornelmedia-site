Add-Type -AssemblyName System.Drawing

$logoPath = "assets/images/logo.png"
$outputPath = "assets/images/og-preview.png"
$width = 1200
$height = 630

$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Black)

if (Test-Path $logoPath) {
    $logo = [System.Drawing.Image]::FromFile($logoPath)
    
    # Calculate centered position
    # Keep aspect ratio, max height 400, max width 1000
    $ratio = $logo.Width / $logo.Height
    
    $targetHeight = 400
    $targetWidth = $targetHeight * $ratio
    
    if ($targetWidth -gt 1000) {
        $targetWidth = 1000
        $targetHeight = $targetWidth / $ratio
    }
    
    $x = ($width - $targetWidth) / 2
    $y = ($height - $targetHeight) / 2
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($logo, [int]$x, [int]$y, [int]$targetWidth, [int]$targetHeight)
    $logo.Dispose()
    Write-Host "Created og-preview.png with logo."
}
else {
    Write-Host "Logo not found at $logoPath"
}

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
