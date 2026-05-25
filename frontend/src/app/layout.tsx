import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import "./globals.css";
import PrivyClientProvider from "@/providers/PrivyClientProvider";
import SolanaWalletProvider from "@/providers/SolanaWalletProvider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "ORIN · AI Agent That Books & Personalises Your Hotel Stay",
  description: "ORIN is the intelligent AI agent that books premium stays and seamlessly syncs your vibe, music, and room settings.",
  icons: {
    icon: "/orin-logo.svg",
    apple: "/orin-logo.svg",
  },
  openGraph: {
    title: "ORIN AI Agent That Books & Personalises Your Hotel Stay",
    description: "ORIN is the intelligent AI agent that books premium stays and seamlessly syncs your vibe, music, and room settings.",
    url: "https://orinhq.xyz",
    siteName: "ORIN",
    images: [
      {
        url: "/images/orin_opengl.png",
        width: 1200,
        height: 630,
        alt: "ORIN AI Agent That Books & Personalises Your Hotel Stay",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORIN AI Agent That Books & Personalises Your Hotel Stay",
    description: "ORIN is the intelligent AI agent that books premium stays and seamlessly syncs your vibe, music, and room settings.",
    images: ["/images/orin_opengl.png"],
    creator: "@orinhq",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${nunito.variable} antialiased`}>
        <PrivyClientProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </PrivyClientProvider>
      </body>
    </html>
  );
}
