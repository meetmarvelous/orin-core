"use client";

import dynamic from "next/dynamic";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const RoomControl = dynamic(() => import("@/components/RoomControl"), {
  ssr: false,
});

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Nav ─────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-logo">ORIN<span>.</span></div>
        <WalletMultiButton />
      </nav>

      {/* ── Content ────────────────────────────── */}
      <div style={{ flex: 1, padding: "80px 60px", position: "relative" }}>
        <div className="page-glow" />
        <div style={{ position: "relative" }}>
          <RoomControl />
        </div>
      </div>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="orin-footer">
        <div className="nav-logo" style={{ fontSize: 18 }}>ORIN<span>.</span></div>
        <div className="footer-meta">Solana Devnet · Hash-Lock Privacy</div>
        <div className="footer-copy">© 2026 ORIN Labs</div>
      </footer>
    </main>
  );
}
