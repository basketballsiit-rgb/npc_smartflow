$f = Get-ChildItem -Path "C:\Users\nipon" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Length -eq 2015091 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($f) {
    Copy-Item -LiteralPath $f.FullName -Destination "c:\xampp\htdocs\smartflow\raw_logo.png" -Force
    Write-Host "FOUND AND COPIED $($f.FullName)"
} else {
    Write-Host "NOT FOUND"
}
