import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grass - Walking Recommendations for Londoners",
  description: "Find the perfect walk for today based on live weather, travel time, and your preferences. Curated walks around London.",
  keywords: ["walking", "London", "hiking", "outdoors", "day trips", "weather"],
  authors: [{ name: "Grass" }],
  openGraph: {
    title: "Grass - What walk can you do today?",
    description: "Weather-aware walking recommendations for Londoners",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1f1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
