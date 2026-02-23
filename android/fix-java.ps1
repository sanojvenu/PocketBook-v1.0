# Fix Java environment for current PowerShell session
# Run this once before using gradlew commands: .\fix-java.ps1

$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot'
$env:Path = ($env:Path -split ';' | Where-Object { $_ -notlike '*Android Studio\jbr*' }) -join ';'

Write-Host "✓ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "✓ Removed corrupted Android Studio JBR from PATH" -ForegroundColor Green
Write-Host ""
Write-Host "Java version:" -ForegroundColor Cyan
java -version
