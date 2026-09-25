# MSM Control Center — Android APK

Native Android wrapper with an **interactive landing screen**, then opens the live web app.

## What's inside
- **Landing page** (`mobile/www/`) — animated TAPMI MSM intro, feature chips, "Enter Control Center" button
- **Live app** — `https://msm-control-center.vercel.app` (login, dashboard, play, news, etc.)

## Prerequisites (one-time)
1. [Android Studio](https://developer.android.com/studio) with Android SDK
2. Set `ANDROID_HOME` (usually `C:\Users\<you>\AppData\Local\Android\Sdk`)
3. Java 17+ (bundled with Android Studio)

## Build debug APK
```bash
npm install
npx cap add android    # first time only
npm run apk:build
```

APK output:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Share with cohort
1. Copy `app-debug.apk` to phone (WhatsApp / Drive)
2. Install → allow "Install unknown apps" if prompted
3. Open app → landing → tap **Enter Control Center** → login as usual

## Release APK (optional, for Play Store)
```bash
cd android
gradlew.bat bundleRelease
```
Requires a signing keystore (not included).

## Sync after landing page changes
```bash
npm run cap:sync
npm run apk:debug
```
