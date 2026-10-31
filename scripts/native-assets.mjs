// Applies the Prvlar icon, launch screen and platform settings to the native projects
// that `npx cap add android|ios` generates. The GitHub workflows run this right after `cap add`.
// Usage: node scripts/native-assets.mjs android|ios
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const R = p => resolve(root, p);
const platform = process.argv[2];
// Light and dark (night) colours follow the phone's dark-mode setting, like the app's "Device" theme.
const C = {
  bg: '#F4F7FC', bgNight: '#0A1430',            // app background: window, status bar, launch screen
  nav: '#F6F9FE', navLegacy: '#0F1A3D',         // navigation bar (before Android 8.1 its buttons are always light, so it stays dark there)
  blue: '#2F6BFF', blueLight: '#9850FA', blueDeep: '#1FB9FF',
  splash: '#4A0E18', iconLight: '#7A1A26', iconDeep: '#3A0912'   // 0.9.8 Prvlar maroon (launch screen = intro colour, no white flash)
};
const xml = body => `<?xml version="1.0" encoding="utf-8"?>\n${body}\n`;
const put = (dir, file, body) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, file), xml(body)); };

function patch(file, fn) {
  const before = readFileSync(file, 'utf8'), after = fn(before);
  if (after === before) throw Error('Nothing changed in ' + file + ' (template changed?)');
  writeFileSync(file, after);
}

if (platform === 'android') {
  const res = R('android/app/src/main/res');
  if (!existsSync(res)) throw Error('Run `npx cap add android` first.');

  // Launcher icons (legacy square + round, and the adaptive-icon foreground) and launch-screen logo for every density.
  // Check they are all in the repository first, so a missing upload gives a clear message instead of a Gradle error.
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  const needed = densities.flatMap(d => [`mipmap-${d}/ic_launcher.png`, `mipmap-${d}/ic_launcher_round.png`, `mipmap-${d}/ic_launcher_foreground.png`, `drawable-${d}/splash_logo.png`]);
  const missing = needed.filter(f => !existsSync(R(`resources/android/${f}`)));
  if (missing.length) throw Error(`These icon files are missing from the repository (upload them from the project zip):\n  resources/android/${missing.join('\n  resources/android/')}`);
  // Copy only images and XML. Android rejects any other file in res/ (for example a placeholder file
  // created while making folders in GitHub's web editor), so anything else is skipped with a warning.
  for (const dir of readdirSync(R('resources/android'))) {
    for (const f of readdirSync(R(`resources/android/${dir}`))) {
      if (!/\.(png|xml)$/i.test(f)) { console.warn(`Skipped resources/android/${dir}/${f}: not a .png or .xml file (you can delete it from the repository).`); continue; }
      mkdirSync(join(res, dir), { recursive: true });
      copyFileSync(R(`resources/android/${dir}/${f}`), join(res, dir, f));
    }
  }
  // Small white status-bar icon for reminders (@capacitor/local-notifications, "smallIcon" in capacitor.config.json): an open book.
  put(join(res, 'drawable'), 'ic_stat_atlas.xml', `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="2" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="M12,7v14M3,18a1,1 0,0 1,-1 -1V4a1,1 0,0 1,1 -1h5a4,4 0,0 1,4 4a4,4 0,0 1,4 -4h5a1,1 0,0 1,1 1v13a1,1 0,0 1,-1 1h-6a3,3 0,0 0,-3 3a3,3 0,0 0,-3 -3z"/>
</vector>`);
  put(join(res, 'values'), 'ic_launcher_background.xml', `<resources>\n    <color name="ic_launcher_background">${C.splash}</color>\n</resources>`);
  // Adaptive icon (Android 8+): the white glyph on the brand's blue gradient; Android 13+ themed icons use the glyph alone.
  put(join(res, 'drawable'), 'atlas_icon_bg.xml', `<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:type="linear" android:angle="315" android:startColor="${C.iconLight}" android:endColor="${C.iconDeep}"/>
</shape>`);
  const adaptive = `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/atlas_icon_bg"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  put(join(res, 'mipmap-anydpi-v26'), 'ic_launcher.xml', adaptive);
  put(join(res, 'mipmap-anydpi-v26'), 'ic_launcher_round.xml', adaptive);

  // Launch screen: centred logo on the app background, drawn as a layer list so it never stretches
  // on tall or wide screens (the template's full-screen splash.png bitmaps do).
  for (const dir of readdirSync(res)) if (dir.startsWith('drawable') && existsSync(join(res, dir, 'splash.png'))) unlinkSync(join(res, dir, 'splash.png'));
  writeFileSync(join(res, 'drawable/splash.xml'), `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/atlas_splash"/>
    <item><bitmap android:gravity="center" android:src="@drawable/splash_logo"/></item>
</layer-list>
`);
  put(join(res, 'values'), 'atlas_colors.xml', `<resources>
    <color name="atlas_bg">${C.bg}</color>
    <color name="atlas_splash">${C.splash}</color>
    <color name="atlas_nav">${C.navLegacy}</color>
    <bool name="atlas_light_bars">true</bool>
</resources>`);
  put(join(res, 'values-v27'), 'atlas_colors.xml', `<resources>
    <color name="atlas_nav">${C.nav}</color>
</resources>`);
  put(join(res, 'values-night'), 'atlas_colors.xml', `<resources>
    <color name="atlas_bg">${C.bgNight}</color>
    <color name="atlas_nav">${C.bgNight}</color>
    <bool name="atlas_light_bars">false</bool>
</resources>`);
  patch(join(res, 'values/styles.xml'), s => s
    // Android 12+ system splash: app background behind the app icon.
    .replace(/(<style name="AppTheme\.NoActionBarLaunch" parent="Theme\.SplashScreen">)/,
      '$1\n        <item name="windowSplashScreenBackground">@color/atlas_splash</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>')
    // Status and navigation bars in the app's background colour (light or dark with the phone), with matching icons.
    .replace(/(<style name="AppTheme\.NoActionBar" parent="Theme\.AppCompat\.DayNight\.NoActionBar">)/,
      '$1\n        <item name="colorPrimaryDark">@color/atlas_bg</item>\n        <item name="android:statusBarColor">@color/atlas_bg</item>\n        <item name="android:windowLightStatusBar">@bool/atlas_light_bars</item>\n        <item name="android:navigationBarColor">@color/atlas_nav</item>\n        <item name="android:windowLightNavigationBar">@bool/atlas_light_bars</item>\n        <item name="android:windowBackground">@color/atlas_bg</item>'));
  // In-app updates: allow handing a downloaded APK to the system installer (Android asks the user once).
  const manifest = R('android/app/src/main/AndroidManifest.xml');
  if (!readFileSync(manifest, 'utf8').includes('REQUEST_INSTALL_PACKAGES')) patch(manifest, s => s.replace(/(<uses-permission android:name="android.permission.INTERNET" \/>)/,
    '$1\n    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />'));
  // Network policy (see resources/network_security_config.xml): lets the app reach an AI server on the local network.
  copyFileSync(R('resources/network_security_config.xml'), R('android/app/src/main/res/xml/network_security_config.xml'));
  if (!readFileSync(manifest, 'utf8').includes('networkSecurityConfig')) patch(manifest, s => s.replace('<application', '<application\n        android:networkSecurityConfig="@xml/network_security_config"'));
  // App version shown in Android's app info, from package.json (0.7.0 -> versionName 0.7.0, versionCode 700).
  const ver = JSON.parse(readFileSync(R('package.json'), 'utf8')).version, [maj, min, pat] = ver.split('.').map(n => parseInt(n, 10) || 0);
  const gradle = R('android/app/build.gradle');
  // versionCode must grow with every release so Android installs the update over the old app (data kept).
  if (!/^\d+\.\d+\.\d+/.test(ver) || min > 99 || pat > 99) throw Error(`package.json version ${ver} must be MAJOR.MINOR.PATCH with MINOR and PATCH under 100`);
  writeFileSync(gradle, readFileSync(gradle, 'utf8').replace(/versionCode \d+/, `versionCode ${maj * 10000 + min * 100 + pat}`).replace(/versionName "[^"]*"/, `versionName "${ver}"`));
  // One app: com.knowledgeatlas.app (owner-only content comes from the encrypted owner pack, not from a flavor).
  let g = readFileSync(gradle, 'utf8');
  g = g.replace(/\n    \/\/ Two editions from one codebase[^\n]*\n    flavorDimensions "edition"\n    productFlavors \{[\s\S]*?\n    \}\n(?=    buildTypes)/, '\n');
  g = g.replace(/namespace "[^"]*"/, 'namespace "com.knowledgeatlas.app"').replace(/applicationId "[^"]*"/, 'applicationId "com.knowledgeatlas.app"');
  // 100000+ keeps the code above any earlier public test build (100905), so it installs over it.
  g = g.replace(/versionCode \d+/, m => `versionCode ${100000 + (+m.split(' ')[1] % 100000)}`);
  if (!g.includes('play-services-auth')) g = g.replace(/(    implementation project\(':capacitor-android'\)\n)/, `$1    // Google Authorization API for the optional Drive (appDataFolder) sync sign-in.\n    implementation "com.google.android.gms:play-services-auth:21.3.0"\n`);
  writeFileSync(gradle, g);
  // Display name (0.9.8: Prvlar) from capacitor.config.json; the package id stays com.knowledgeatlas.app.
  const strings = R('android/app/src/main/res/values/strings.xml');
  if (existsSync(strings)) { const appName = JSON.parse(readFileSync(R('capacitor.config.json'), 'utf8')).appName;
    writeFileSync(strings, readFileSync(strings, 'utf8').replace(/(<string name="(?:app_name|title_activity_main)">)[^<]*(<\/string>)/g, `$1${appName}$2`)); }
  // On-time reminders (0.9.4): exact alarms on Android 12/12L and 13+.
  if (!readFileSync(manifest, 'utf8').includes('USE_EXACT_ALARM')) patch(manifest, s => s.replace('<uses-permission', '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />\n    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />\n    <uses-permission'));
  if (!readFileSync(manifest, 'utf8').includes('WAKE_LOCK')) patch(manifest, s => s.replace('<uses-permission', '<uses-permission android:name="android.permission.WAKE_LOCK" />\n    <uses-permission'));
  const javaDir = R('android/app/src/main/java/com/knowledgeatlas/app');
  mkdirSync(javaDir, { recursive: true });
  rmSync(R('android/app/src/main/java/app'), { recursive: true, force: true });
  for (const f of readdirSync(R('resources/android/java'))) copyFileSync(R('resources/android/java/' + f), join(javaDir, f));
  console.log('Android icon, launch screen and colours applied.');
} else if (platform === 'ios') {
  const app = R('ios/App/App');
  if (!existsSync(app)) throw Error('Run `npx cap add ios` first.');
  copyFileSync(R('resources/ios/AppIcon-1024.png'), join(app, 'Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'));
  for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
    copyFileSync(R('resources/ios/splash-2732.png'), join(app, 'Assets.xcassets/Splash.imageset', f));
  patch(join(app, 'Info.plist'), s => s.replace(/<\/dict>\s*<\/plist>\s*$/, `	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
		<key>NSAllowsLocalNetworking</key>
		<true/>
	</dict>
	<key>NSLocalNetworkUsageDescription</key>
	<string>Prvlar connects to an AI server on your Wi-Fi (for example one running on your PC) only when you choose one in Settings.</string>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>
</dict>
</plist>
`));
  console.log('iOS icon, launch screen and network settings applied.');
} else {
  console.error('Usage: node scripts/native-assets.mjs android|ios');
  process.exit(1);
}
