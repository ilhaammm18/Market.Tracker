import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Stock Intelligence & Real-Time Tracker",
  description:
    "Aplikasi pemantau saham bursa global terpadu (BEI Indonesia, Wall Street, KRX Korea, ASX Australia, ETF, dan Kripto) dengan analitik fundamental dan visualisasi real-time premium.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#040914] text-slate-100 antialiased selection:bg-[#F5B700] selection:text-navy-950">
        {children}
      </body>
    </html>
  );
}

