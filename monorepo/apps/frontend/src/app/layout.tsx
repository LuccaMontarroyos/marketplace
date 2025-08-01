import type { Metadata } from "next";
import "@/styles/globals.css";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "LB Marketplace",
  description: "Marketplace developed by Ccabarros",
};

export const font = Montserrat({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${font.className}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
