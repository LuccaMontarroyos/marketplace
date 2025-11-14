import type { Metadata } from "next";
import "@/styles/globals.css";
import { Montserrat } from "next/font/google";
import { ClientProviders } from "./ClientProviders";
import StripeRedirectHandler from "@/context/StripeContext";

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
        <ClientProviders>
          <StripeRedirectHandler />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
