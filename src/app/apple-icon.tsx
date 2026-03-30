import { ImageResponse } from "next/og";
import { APP_SHORT_NAME, BRAND_OG } from "@/lib/site-config";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_OG.background,
          color: BRAND_OG.foreground,
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 200,
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.02em",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {APP_SHORT_NAME}
        </div>
      </div>
    ),
    { ...size }
  );
}
