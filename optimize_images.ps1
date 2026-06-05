# Load required assembly
Add-Type -AssemblyName System.Drawing

# Configuration
$maxDimension = 1920
$quality = 85
$targetDir = "assets/images"

# Get all jpg/jpeg files
$images = Get-ChildItem -Path $targetDir -Include *.jpg, *.jpeg, *.JPG, *.JPEG -Recurse

foreach ($img in $images) {
    if ($img.Length -gt 1000000) { # Only optimize if > 1MB
        Write-Host "Optimizing $($img.Name) ($([math]::Round($img.Length/1MB, 2)) MB)..."
        
        try {
            $image = [System.Drawing.Image]::FromFile($img.FullName)
            
            # Calculate new dimensions
            $newWidth = $image.Width
            $newHeight = $image.Height
            
            if ($image.Width -gt $maxDimension -or $image.Height -gt $maxDimension) {
                $ratio = $image.Width / $image.Height
                if ($ratio -gt 1) {
                    $newWidth = $maxDimension
                    $newHeight = [int]($maxDimension / $ratio)
                } else {
                    $newHeight = $maxDimension
                    $newWidth = [int]($maxDimension * $ratio)
                }
            }
            
            # Create new bitmap
            $newImage = new-object System.Drawing.Bitmap $newWidth, $newHeight
            $graphics = [System.Drawing.Graphics]::FromImage($newImage)
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            
            # Draw resized image
            $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
            
            # Encoder parameters for quality
            $encoder = [System.Drawing.Imaging.Encoder]::Quality
            $encoderParams = new-object System.Drawing.Imaging.EncoderParameters(1)
            $encoderParams.Param[0] = new-object System.Drawing.Imaging.EncoderParameter($encoder, $quality)
            $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
            
            # Save to temporary file
            $tempPath = $img.FullName + ".tmp.jpg"
            $newImage.Save($tempPath, $jpegCodec, $encoderParams)
            
            # Cleanup
            $image.Dispose()
            $newImage.Dispose()
            $graphics.Dispose()
            
            # Replace original
            Remove-Item $img.FullName
            Rename-Item $tempPath $img.Name
            
            Write-Host "Done."
        }
        catch {
            Write-Error "Failed to optimize $($img.Name): $_"
        }
    }
}
