import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  transpilePackages: ["three"],
};

export default nextConfig;
