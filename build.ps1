# Build Script for QuickExplain Extension
# Packages the extension into a .zip file ready for Chrome Web Store

Write-Host "Building QuickExplain v1.0.0..." -ForegroundColor Cyan

# Define output file
$outputFile = "quick-explain-v1.0.0.zip"

# Remove old build if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
    Write-Host "Removed old build file" -ForegroundColor Yellow
}

# Files to include in the extension package
$filesToInclude = @(
    "manifest.json",
    "content.js",
    "styles.css",
    "background.js",
    "icons/"
)

# Create the zip archive
Write-Host "Packaging extension files..." -ForegroundColor Green

try {
    # Create a temporary directory for the build
    $tempDir = "temp_build"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    # Copy files to temp directory
    foreach ($file in $filesToInclude) {
        if (Test-Path $file) {
            if ($file.EndsWith("/")) {
                # It's a directory
                $dirName = $file.TrimEnd('/')
                if (Test-Path $dirName) {
                    Copy-Item -Recurse -Path $dirName -Destination $tempDir
                    Write-Host "  ✓ Copied $dirName" -ForegroundColor Gray
                }
            } else {
                # It's a file
                Copy-Item -Path $file -Destination $tempDir
                Write-Host "  ✓ Copied $file" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ⚠ Warning: $file not found, skipping" -ForegroundColor Yellow
        }
    }

    # Create the zip file
    Compress-Archive -Path "$tempDir\*" -DestinationPath $outputFile -Force

    # Clean up temp directory
    Remove-Item -Recurse -Force $tempDir

    Write-Host "`n✅ Build complete!" -ForegroundColor Green
    Write-Host "📦 Package: $outputFile" -ForegroundColor Cyan
    
    # Show file size
    $fileSize = (Get-Item $outputFile).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host "📊 Size: $fileSizeKB KB" -ForegroundColor Cyan

    Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the packaged extension in Chrome" -ForegroundColor White
    Write-Host "  2. Visit chrome://extensions/" -ForegroundColor White
    Write-Host "  3. Enable Developer Mode" -ForegroundColor White
    Write-Host "  4. Click 'Load unpacked' and select extracted folder" -ForegroundColor White
    Write-Host "  5. Once tested, upload $outputFile to Chrome Web Store" -ForegroundColor White

} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}
