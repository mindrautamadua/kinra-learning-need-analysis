import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR memungkinkan build/uji terpisah tanpa mengganggu `next dev` yang sedang berjalan di .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
