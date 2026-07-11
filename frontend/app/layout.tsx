import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowEasy CRM Lead Importer",
  description: "AI-powered CSV importer that maps any lead export into GrowEasy CRM format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void bg-scan">{children}</body>
    </html>
  );
}
