import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default nextConfig;
