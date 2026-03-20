# Bible Journal — Mobile App (iOS & Android)

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app as native iOS and Android apps. The mobile app loads the live site at **https://www.logosflow.app** in a native WebView.

## Prerequisites

- **Node.js 18+**
- **Xcode** (macOS only) — for iOS builds
- **Android Studio** — for Android builds
- **Apple Developer account** — for App Store submission
- **Google Play Developer account** — for Play Store submission

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Sync native projects

```bash
npm run cap:sync
```

### 3. Open in IDE and run

**iOS (macOS only):**
```bash
npm run mobile:ios
```
Then in Xcode: select a simulator or device, click Run (▶).

**Android:**
```bash
npm run mobile:android
```
Then in Android Studio: select an emulator or device, click Run (▶).

## Project Structure

```
├── ios/                 # Xcode project (iOS)
├── android/             # Android Studio project
├── out/                 # Minimal web assets (Capacitor webDir)
├── capacitor.config.ts  # Capacitor configuration
└── MOBILE_APP.md        # This file
```

## Configuration

The app loads from `https://www.logosflow.app` (see `capacitor.config.ts` → `server.url`). No build of the Next.js app is required for the mobile wrapper — it uses the live web app.

### App identifiers

- **App ID:** `app.logosflow.biblejournal`
- **App name:** Bible Journal

To change these, edit `capacitor.config.ts` and run `npm run cap:sync`.

## App Store / Play Store Submission

### iOS (App Store)

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Select your development team under **Signing & Capabilities**.
3. Update the app icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset`.
4. Create an app record in [App Store Connect](https://appstoreconnect.apple.com).
5. Archive and upload via Xcode: **Product → Archive** → **Distribute App**.

### Android (Play Store)

1. Open the `android` folder in Android Studio.
2. Update the app icon in `android/app/src/main/res/`.
3. Create an app in [Google Play Console](https://play.google.com/console).
4. Build a release: **Build → Generate Signed Bundle / APK**.
5. Upload the AAB to Play Console.

## Development Tips

### Live reload (optional)

To point the app at your local dev server:

1. Find your local IP: `ipconfig getifaddr en0` (macOS).
2. In `capacitor.config.ts`, add:
   ```ts
   server: {
     url: 'http://YOUR_IP:3000',
     cleartext: true,
   },
   ```
3. Run `npm run dev` and `npm run cap:sync`.
4. Rebuild in Xcode/Android Studio.

### Plugins included

- **@capacitor/app** — App lifecycle, back button
- **@capacitor/keyboard** — Keyboard behavior
- **@capacitor/splash-screen** — Splash screen
- **@capacitor/status-bar** — Status bar styling

## Offline / Static Export (Future)

The current setup loads the app from the web. For offline support or to reduce App Store review risk, you could:

1. Configure Next.js for static export (`output: 'export'`).
2. Convert server actions to client-side API calls.
3. Build static assets and use them as the Capacitor `webDir` instead of `server.url`.

See the [Capacitor + Next.js guide](https://capgo.app/blog/nextjs-mobile-app-capacitor-from-scratch/) for a static export setup.
