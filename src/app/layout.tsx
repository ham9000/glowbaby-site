import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteConfig } from "@/content/site";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Glowbaby — Made to be seen. Built to be theirs.",
    template: "%s | Glowbaby",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Glowbaby — Made to be seen. Built to be theirs.",
    description: siteConfig.description,
    type: "website",
    siteName: siteConfig.name,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glowbaby — Made to be seen. Built to be theirs.",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7fb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={raleway.variable}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
