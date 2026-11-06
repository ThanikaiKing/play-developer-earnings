import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthGate } from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Play Store Developer Earnings & Revenue Dashboard",
  description: "Financial analytics, tax reconciliation, and subscription revenue engine for Google Play Store console reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AuthGate>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
              <p>Google Play Developer Earnings Analytics • Package com.phoenixdev.tvkwarriors</p>
            </footer>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}

