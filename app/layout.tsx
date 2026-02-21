import type { Metadata } from "next";
import { Chakra_Petch, Manrope } from "next/font/google";
import "./globals.css";

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
  description: "Advanced Hypertrophy Tracking",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${chakra.variable} ${manrope.variable} font-body bg-background text-primary antialiased`}>
        <main className="min-h-screen pb-20 max-w-md mx-auto bg-surface shadow-2xl overflow-hidden border-x border-zinc-200">
          {children}
        </main>
      </body>
    </html>
  );
}
