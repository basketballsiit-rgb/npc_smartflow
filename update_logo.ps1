$file = Get-ChildItem -Path "C:\Users\nipon\AppData\Local\Temp" -Filter "*1784345037675*.png" | Select-Object -First 1
if ($file) {
    Copy-Item -Path $file.FullName -Destination "c:\xampp\htdocs\smartflow\public\images\logo.png" -Force
    Copy-Item -Path $file.FullName -Destination "c:\xampp\htdocs\smartflow\public\logo.png" -Force
    Write-Host "COPIED $($file.FullName) ($($file.Length) bytes) TO ALL LOCATIONS"
} else {
    Write-Host "FILE_NOT_FOUND"
}
