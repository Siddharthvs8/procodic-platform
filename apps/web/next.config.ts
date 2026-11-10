import type { NextConfig } from "next";
import { config } from "dotenv";

config({ path: process.env.ENV_FILE ?? "../../.env" });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [] },
};

export default nextConfig;
