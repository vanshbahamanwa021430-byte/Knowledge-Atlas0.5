# iOS

The repo contains a Capacitor iOS project (`ios/`, bundle ID **com.knowledgeatlas.app**, PUBLIC edition). iOS apps
cannot be built on Linux, so `.github/workflows/ios.yml` (macos-latest) does it:
- always: an **unsigned Simulator build** (artifact `KnowledgeAtlas-ios-simulator.zip`);
- with secrets `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_BASE64`, `IOS_TEAM_ID`: a signed **.ipa**.

Regenerate locally on a Mac: `npm run ios:sync` (same app id `com.knowledgeatlas.app` and
web build as Android), then `npx cap open ios`.

## iOS behaviour
- No APK updater (updates come from the App Store). Notifications use `@capacitor/local-notifications`.
- Smarty Code, OCR and Pyodide run inside WKWebView.
- **Google sign-in is hidden on iOS for now.** It needs an iOS OAuth client (Cloud Console › Clients › iOS, bundle ID
  `com.knowledgeatlas.app`), its reversed client ID as a URL scheme in Info.plist, and a native sign-in plugin.

## Publishing
App Store / TestFlight distribution needs an **Apple Developer Program** membership (**US$99/year**), an App Store
Connect record, a distribution certificate and provisioning profile, privacy "nutrition labels" and the privacy policy URL.

## PWA on iPhone
The website is installable from Safari (Share › Add to Home Screen): `apple-touch-icon`, `apple-mobile-web-app-capable`,
`viewport-fit=cover` and safe-area insets are in place.
