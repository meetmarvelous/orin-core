/**
 * Solana Wallet Provider
 * ---------------------------------------------------
 * Wraps the application with the Solana wallet adapter
 * context providers. This enables wallet connection
 * throughout the app tree.
 */

"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: React.ReactNode;
}

export default function SolanaWalletProvider({ children }: Props) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl("devnet"),
    []
  );

  // Empty array = auto-detect installed wallets (Phantom, Solflare, etc.)
  // For embedded wallets (Privy/Dynamic), this would be swapped later.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
