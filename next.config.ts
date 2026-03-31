import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets you confirm which Vercel deployment you’re on (compare www.badwr.app vs *.vercel.app)
  env: {
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID:
      process.env.VERCEL_DEPLOYMENT_ID ?? "",
  },
};

export default nextConfig;
