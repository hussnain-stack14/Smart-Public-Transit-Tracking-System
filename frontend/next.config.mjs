/** @type {import('next').NextConfig} */

// Backend origins are read at build time so the CSP matches whichever
// API/Socket host this deployment is configured against.
function backendOrigins() {
  const configured = [process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_SOCKET_URL];
  const origins = new Set();
  for (const value of configured) {
    if (!value) continue;
    try {
      const { origin, protocol, host } = new URL(value);
      origins.add(origin);
      origins.add(`${protocol === "https:" ? "wss" : "ws"}://${host}`);
    } catch {
      // Ignore malformed values rather than failing the build.
    }
  }
  return [...origins];
}

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const connectSources = [
      "'self'",
      ...backendOrigins(),
      ...(isDevelopment ? ["http://localhost:5000", "ws://localhost:5000"] : []),
      "https://*.tile.openstreetmap.org",
    ];
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://accounts.google.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      `connect-src ${connectSources.join(" ")}`,
      "worker-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'self'",
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }],
    }, {
      source: "/service-worker.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    }];
  },
};

export default nextConfig;
