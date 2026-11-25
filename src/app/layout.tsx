import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-next",
  display: "swap",
});

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
      <body className="antialiased bg-background text-on-surface selection:bg-primary/15 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
