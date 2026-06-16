import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSM Control Center",
  description: "Private attendance intelligence for MSM cohort — Developed by Raam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
