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
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      `connect-src ${connectSources.join(" ")}`,
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
