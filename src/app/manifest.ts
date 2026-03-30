import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_SHORT_NAME, APP_TAGLINE, THEME_COLOR_LIGHT } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_SHORT_NAME} · ${APP_TAGLINE}`,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_LIGHT,
    orientation: "portrait-primary",
    lang: "en",
  };
}
