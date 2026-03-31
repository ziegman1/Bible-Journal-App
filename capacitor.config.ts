import type { CapacitorConfig } from "@capacitor/cli";
import {
  DEFAULT_CAPACITOR_APP_ID,
  DEFAULT_CAPACITOR_APP_NAME,
  resolveCapacitorServerUrl,
} from "./capacitor.constants";

/**
 * Same resolution as {@link resolveCapacitorServerUrl} (env → VERCEL_URL → https://www.badwr.app).
 * `cleartext` is false for https://www.badwr.app; true only for http:// (e.g. local dev).
 */
const serverUrl = resolveCapacitorServerUrl();

/**
 * Next.js deploy: SSR/hybrid (`next build` + `next start` or Vercel). There is no `output: "export"`
 * and no `out/` directory from Next — do not point `webDir` at `out`.
 *
 * Strategy: **remote WebView** — load the deployed site via `server.url`. `www/` is a minimal
 * fallback so `npx cap sync` has valid local assets; production builds should always set a server URL.
 */
const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID?.trim() || DEFAULT_CAPACITOR_APP_ID,
  appName: process.env.CAPACITOR_APP_NAME?.trim() || DEFAULT_CAPACITOR_APP_NAME,
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#000000",
    },
  },
};

export default config;
