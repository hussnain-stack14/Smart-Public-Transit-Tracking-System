import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppExperience } from "../components/navigation/AppExperience";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Safar Faisalabad",
  description: "Live public transit information for Faisalabad.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AppExperience>{children}</AppExperience></body>
    </html>
  );
}
