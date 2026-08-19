import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf ships a pdf.js build that must stay out of the bundler's hands.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
