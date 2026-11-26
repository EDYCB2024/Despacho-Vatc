import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-next",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#065f46",
};

export const metadata: Metadata = {
  title: "Despacho VATC CRM | Logística ZOOM, Recepción y Parque POS",
  description:
    "Plataforma CRM en Neon PostgreSQL para Despacho de SIMCARD, Kits, Equipos Nuevos, Recepción en Despacho y Base Maestro POS (BDDIC25).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased bg-background text-on-surface selection:bg-primary/15 selection:text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
