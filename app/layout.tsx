import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Root Browser",
  description: "Browse and organize files in your AI_root directory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
