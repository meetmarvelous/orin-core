import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono } from "next/font/google";
import "./globals.css";
import SolanaWalletProvider from "@/providers/SolanaWalletProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "ORIN — Every space knows your song",
  description:
    "ORIN is the ambient AI layer for physical spaces. One voice agent. One portable identity. Every space responds to you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmMono.variable}`}
    >
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
