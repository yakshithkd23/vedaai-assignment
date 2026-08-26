/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We only ever process files the user explicitly uploads in-memory,
  // so we raise the default body size limit for our API routes to
  // comfortably fit multi-page scanned answer sheets (base64-encoded).
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  webpack: (config) => {
    // pdfjs-dist optionally requires the Node "canvas" package for
    // server-side rendering, which we never use (we only render PDFs in the
    // browser via lib/pdfToImages.ts). Stub it out so webpack doesn't try to
    // bundle it.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
