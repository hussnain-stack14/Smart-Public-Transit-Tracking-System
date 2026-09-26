import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppExperience } from "../components/navigation/AppExperience";
import { PwaSupport } from "../components/pwa/PwaSupport";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  applicationName: "Smart Safar",
  title: "Smart Safar Faisalabad",
  description: "Smart Public Transit for Faisalabad",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Smart Safar" },
};

export const viewport = { themeColor: "#f97316", colorScheme: "light", viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AppExperience>{children}</AppExperience><PwaSupport /></body>
    </html>
  );
}
