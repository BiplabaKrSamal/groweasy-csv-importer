/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // next start (used by the Dockerfile) can't run against an export build,
  // so this only kicks in for the dedicated static-hosting build command.
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export" } : {}),
};
module.exports = nextConfig;
