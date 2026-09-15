/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:5000 ws://localhost:5000 https://*.tile.openstreetmap.org",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }],
    }];
  },
};

export default nextConfig;
