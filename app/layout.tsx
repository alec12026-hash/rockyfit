import type { Metadata } from "next";
import { Chakra_Petch, Manrope } from "next/font/google";
import "./globals.css";
import ServiceWorker from "./components/ServiceWorker";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./components/AuthProvider";

const chakra = Chakra_Petch({ 
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  variable: '--font-chakra'
});

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope'
});

export const metadata: Metadata = {
  title: "ROCKYFIT",
  description: "AI-Powered Fitness Coaching",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RockyFit",
    startupImage: [
      { url: "/icon-512.png", media: "(device-width: 768px)" }
    ]
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${chakra.variable} ${manrope.variable} font-body bg-background text-primary antialiased`}>
        <ServiceWorker />
        <AuthProvider>
          <main className="min-h-screen pb-20 max-w-md mx-auto bg-surface shadow-2xl overflow-hidden border-x border-zinc-200">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
