import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Zalando Audit — Manasa",
  description: "Refund reconciliation for Manasa's Zalando orders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        <footer className="max-w-7xl mx-auto px-6 py-8 text-xs muted">
          Data is local. No live Gmail calls at render time.
        </footer>
      </body>
    </html>
  );
}
