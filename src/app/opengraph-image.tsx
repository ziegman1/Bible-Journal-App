import { ImageResponse } from "next/og";
import {
  APP_LANDING_HERO_BLURB,
  APP_SHORT_NAME,
  APP_TAGLINE,
  BRAND_OG,
} from "@/lib/site-config";

export const runtime = "edge";

export const alt = `${APP_SHORT_NAME} · ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${BRAND_OG.background} 0%, #292524 100%)`,
          color: BRAND_OG.foreground,
          padding: 72,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 200,
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {APP_SHORT_NAME}
        </div>
        <div style={{ fontSize: 28, marginTop: 20, opacity: 0.95, fontWeight: 300 }}>
          {APP_TAGLINE}
        </div>
        <div style={{ fontSize: 22, marginTop: 28, opacity: 0.85, maxWidth: 920, lineHeight: 1.4 }}>
          {APP_LANDING_HERO_BLURB}
        </div>
      </div>
    ),
    { ...size }
  );
}
