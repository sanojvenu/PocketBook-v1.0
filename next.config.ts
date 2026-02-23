import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // @ts-ignore - Next.js 16 Turbopack compatibility
  turbopack: {},
};

export default withPWA(nextConfig);
