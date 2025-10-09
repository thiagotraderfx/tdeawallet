// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });

export const metadata: Metadata = {
  title: "TdeA Wallet - Algorand",
  description: "Billetera Algorand profesional desarrollada en Next.js + TypeScript",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans bg-background text-foreground min-h-screen antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
