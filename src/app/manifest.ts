import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTION,
  APP_LOGO_PATH,
  APP_SHORT_NAME,
  APP_TAGLINE,
  THEME_COLOR_LIGHT,
} from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_SHORT_NAME} · ${APP_TAGLINE}`,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: THEME_COLOR_LIGHT,
    orientation: "portrait-primary",
    lang: "en",
    icons: [
      {
        src: APP_LOGO_PATH,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_LOGO_PATH,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
