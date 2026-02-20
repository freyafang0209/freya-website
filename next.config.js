const { execSync } = require("child_process");

// Generate static sitemap during build (env vars available here)
if (process.env.NOTION_API_KEY && process.env.NODE_ENV === "production") {
  try {
    execSync("node scripts/generate-sitemap.mjs", {
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    console.warn("Sitemap generation failed, continuing build.");
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;
