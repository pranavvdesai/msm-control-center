import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GlobalBirthdaySplash } from "@/components/GlobalRamBirthdaySplash";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSM Control Center",
  description: "Private attendance intelligence for MSM cohort — Developed by Raam",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MSM Control Center",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body className="min-h-full overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
        <Script id="force-light-mode" strategy="beforeInteractive">
          {`
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            document.documentElement.style.colorScheme = 'light';
          `}
        </Script>
        {children}
        <GlobalBirthdaySplash />
      </body>
    </html>
  );
}
