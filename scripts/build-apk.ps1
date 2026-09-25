$ErrorActionPreference = "Stop"
$root = "c:\Users\prana\OneDrive\Desktop\msm-control-center"
$buildDir = "$root\.android-build"
$sdkRoot = "$buildDir\android-sdk"
$jdkDir = "$buildDir\jdk-17.0.15+6"
$env:JAVA_HOME = $jdkDir
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$jdkDir\bin;$env:PATH"

$cmdTools = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $cmdTools)) {
  $extract = "$buildDir\cmdline-tools-extract"
  if (-not (Test-Path $extract)) {
    Expand-Archive -Path "$buildDir\cmdline-tools.zip" -DestinationPath $extract -Force
  }
  New-Item -ItemType Directory -Force -Path "$sdkRoot\cmdline-tools\latest" | Out-Null
  Copy-Item "$extract\cmdline-tools\*" "$sdkRoot\cmdline-tools\latest\" -Recurse -Force
}

$licDir = "$sdkRoot\licenses"
New-Item -ItemType Directory -Force -Path $licDir | Out-Null
Set-Content "$licDir\android-sdk-license" "24333f8a63b6825ea9c5514f83c2829b004d1fee`n" -NoNewline
Set-Content "$licDir\android-sdk-preview-license" "84831b9409646a918e30573bab4c9f91cc79b99d79db503b582cbfb737a1f437`n" -NoNewline

Write-Host "Installing SDK..."
& $cmdTools --sdk_root=$sdkRoot "platform-tools" "platforms;android-34" "build-tools;34.0.0"

$sdkPath = $sdkRoot -replace '\\', '\\'
"sdk.dir=$sdkPath" | Set-Content "$root\android\local.properties" -Encoding ASCII

Set-Location $root
npx cap sync android

Set-Location "$root\android"
Write-Host "Gradle build..."
.\gradlew.bat assembleDebug --no-daemon

$apkSrc = "$root\android\app\build\outputs\apk\debug\app-debug.apk"
$apkOut = "$root\MSM-Control-Center.apk"
Copy-Item $apkSrc $apkOut -Force
Write-Host "DONE $apkOut"
