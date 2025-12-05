
Add-Type -AssemblyName System.Drawing

$source = "assets/images/IMG_4333.heic"
$dest = "assets/images/IMG_4333.jpg"

try {
    Write-Host "Attempting to load $source..."
    $img = [System.Drawing.Image]::FromFile($source)
    Write-Host "Image loaded. format: $($img.RawFormat)"
    $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    Write-Host "Converted to $dest"
    $img.Dispose()
} catch {
    Write-Error "Conversion failed: $_"
}
