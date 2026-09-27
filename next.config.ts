import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Carga de Excel (los PDF se suben directo del navegador a Supabase Storage)
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
