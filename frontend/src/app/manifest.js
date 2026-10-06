export default function manifest() {
  return {
    name: "Smart Safar - Faisalabad Transit",
    short_name: "Smart Safar",
    description: "Smart Public Transit for Faisalabad",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#F5FAFE",
    theme_color: "#0F5797",
    categories: ["travel", "navigation"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
