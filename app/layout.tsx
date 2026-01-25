import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/contexts/auth-context";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Sistema de Gestión de Personas",
  description: "Sistema para gestión de personas",
  icons: {
    icon: "/logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
