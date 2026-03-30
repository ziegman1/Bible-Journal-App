import { ImageResponse } from "next/og";
import { APP_SHORT_NAME, BRAND_OG } from "@/lib/site-config";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_OG.background,
          color: BRAND_OG.foreground,
          fontSize: 15,
          fontWeight: 300,
          letterSpacing: "-0.02em",
        }}
      >
        {APP_SHORT_NAME.slice(0, 1)}
      </div>
    ),
    { ...size }
  );
}
