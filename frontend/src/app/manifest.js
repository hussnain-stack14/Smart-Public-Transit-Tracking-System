export default function manifest() {
  return {
    name: "Smart Safar — Smart Public Transit for Faisalabad",
    short_name: "Smart Safar",
    description: "Smart Public Transit for Faisalabad",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#f97316",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
