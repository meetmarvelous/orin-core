/**
 * Room Control Component — ORIN Brand Template
 * Pure CSS classes matching docs/index_template.html
 */

"use client";

import React, { useState, useCallback } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { deriveGuestPda } from "@/lib/pda";
import { getConnection } from "@/lib/solana";
import {
  savePreferences,
  RoomPreferences,
  SavePreferencesResult,
} from "@/lib/savePreferences";
import type { GuestContext } from "@/lib/api";
import idl from "@idl/orin_identity.json";

type LightingMode = "warm" | "cold" | "ambient";
type RoomMode = "relax" | "focus" | "sleep";

const MODE_PRESETS: Record<RoomMode, { temp: number; brightness: number; lighting: LightingMode; color: string; label: string; desc: string }> = {
  relax: { temp: 23, brightness: 40, lighting: "warm", color: "#FF8C42", label: "Relax", desc: "Warm · 23°C · 40%" },
  focus: { temp: 21, brightness: 85, lighting: "cold", color: "#1E90FF", label: "Focus", desc: "Cool · 21°C · 85%" },
  sleep: { temp: 19, brightness: 10, lighting: "ambient", color: "#4B0082", label: "Sleep", desc: "Ambient · 19°C · 10%" },
};

export default function RoomControl() {
  const { publicKey, connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [activeMode, setActiveMode] = useState<RoomMode | null>(null);
  const [temperature, setTemperature] = useState(22);
  const [brightness, setBrightness] = useState(60);
  const [lightColor, setLightColor] = useState("#C9A84C");
  const [lightingType, setLightingType] = useState<LightingMode>("warm");
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SavePreferencesResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");

  const applyMode = useCallback((mode: RoomMode) => {
    const p = MODE_PRESETS[mode];
    setActiveMode(mode);
    setTemperature(p.temp);
    setBrightness(p.brightness);
    setLightColor(p.color);
    setLightingType(p.lighting);
  }, []);

  const handleSave = useCallback(async () => {
    if (!anchorWallet || !publicKey || !guestEmail) {
      setSaveError("Connect wallet and enter guest email to save.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveResult(null);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
      const program = new Program(idl as Idl, provider);
      const { pda } = deriveGuestPda(guestEmail);
      const preferences: RoomPreferences = {
        temp: temperature,
        lighting: lightingType,
        services: [],
        raw_response: `Room set to ${temperature}°C with ${lightingType} lighting at ${brightness}% brightness.`,
      };

      const guestContext: GuestContext = { name: guestEmail.split("@")[0], loyaltyPoints: 0, history: [] };

      // FIX: Previously, we sent a generic command (`Set room to ${activeMode} mode`) to the backend.
      // This caused the AI to hallucinate random values (e.g., guessing 23°C instead of 21°C),
      // which resulted in the backend's AI Hash never matching the frontend's local Hash-Lock.
      // By passing `preferences.raw_response` as the exact instruction, we force the AI to output
      // the exact JSON properties that the frontend used for the local hash.
      // Delete the following line:
      //const result = await savePreferences(program, pda, publicKey, `Set room to ${activeMode || "custom"} mode`, preferences, guestContext);
      const exactCommand = preferences.raw_response; 
      const result = await savePreferences(program, pda, publicKey, exactCommand, preferences, guestContext);

      setSaveResult(result);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  }, [anchorWallet, publicKey, guestEmail, temperature, brightness, lightColor, lightingType, activeMode]);

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>

      {/* ── Title ──────────────────────── */}
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="section-label" style={{ justifyContent: "center", marginBottom: 24 }}>
          Room Control
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 300, letterSpacing: -2, lineHeight: 1.1, color: "var(--white)", marginBottom: 12 }}>
          Your <em style={{ fontStyle: "italic", color: "var(--gold)" }}>ambient</em> space.
        </h1>
        <p style={{ fontSize: 18, fontWeight: 300, fontStyle: "italic", color: "var(--text-dim)" }}>
          Adjust your environment preferences
        </p>
      </div>

      {/* ── Guest Identity ─────────────── */}
      <div className="orin-card fade-up fade-up-d1">
        <div className="section-label" style={{ marginBottom: 16 }}>Guest Identity</div>
        <input
          id="guest-email"
          type="email"
          className="orin-input"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="your.email@orin.network"
        />
      </div>

      {/* ── Quick Modes ────────────────── */}
      <div className="orin-card fade-up fade-up-d2">
        <div className="section-label" style={{ marginBottom: 20 }}>Quick Modes</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(Object.keys(MODE_PRESETS) as RoomMode[]).map((mode) => {
            const p = MODE_PRESETS[mode];
            return (
              <button
                key={mode}
                id={`mode-${mode}`}
                onClick={() => applyMode(mode)}
                className={`chip ${activeMode === mode ? "chip-active" : ""}`}
                style={{ flex: 1, minWidth: 100 }}
              >
                {p.label}
                <span className="chip-desc">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Manual Controls ────────────── */}
      <div className="orin-card fade-up fade-up-d3">
        <div className="section-label" style={{ marginBottom: 28 }}>Manual Controls</div>

        {/* Temperature */}
        <div style={{ marginBottom: 28 }}>
          <div className="control-row">
            <span className="control-label">Temperature</span>
            <span className="control-value">{temperature}°C</span>
          </div>
          <input id="temp-slider" type="range" min={16} max={30} step={0.5} value={temperature}
            onChange={(e) => { setTemperature(parseFloat(e.target.value)); setActiveMode(null); }} />
        </div>

        {/* Brightness */}
        <div style={{ marginBottom: 28 }}>
          <div className="control-row">
            <span className="control-label">Brightness</span>
            <span className="control-value">{brightness}%</span>
          </div>
          <input id="brightness-slider" type="range" min={0} max={100} step={1} value={brightness}
            onChange={(e) => { setBrightness(parseInt(e.target.value)); setActiveMode(null); }} />
        </div>

        {/* Light Color */}
        <div style={{ marginBottom: 28 }}>
          <div className="control-row">
            <span className="control-label">Light Color</span>
            <span className="control-label">{lightColor}</span>
          </div>
          <input id="color-picker" type="color" className="color-picker" value={lightColor}
            onChange={(e) => { setLightColor(e.target.value); setActiveMode(null); }} />
        </div>

        {/* Lighting Mode */}
        <div>
          <div className="control-label" style={{ marginBottom: 10 }}>Lighting Mode</div>
          <div style={{ display: "flex", gap: 10 }}>
            {(["warm", "cold", "ambient"] as LightingMode[]).map((mode) => (
              <button key={mode} id={`lighting-${mode}`}
                onClick={() => { setLightingType(mode); setActiveMode(null); }}
                className={`chip ${lightingType === mode ? "chip-active" : ""}`}
                style={{ flex: 1 }}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Save Button ────────────────── */}
      <div className="fade-up fade-up-d4" style={{ marginTop: 32, marginBottom: 24 }}>
        <button
          id="save-setup-btn"
          onClick={handleSave}
          disabled={isSaving || !connected || !guestEmail}
          className={`btn-primary ${(isSaving || !connected || !guestEmail) ? "btn-disabled" : ""}`}
        >
          {isSaving ? "Saving to blockchain..." : !connected ? "Connect wallet to save" : !guestEmail ? "Enter guest email to save" : "Save my setup →"}
        </button>
      </div>

      {/* ── Status Feedback ────────────── */}
      {saveResult && (
        <div className="status-success fade-up">
          <div>
            <span className="status-dot" />
            <span className="status-label">Preferences saved</span>
          </div>
          <div className="status-detail">
            <div>Step A · {saveResult.apiAccepted ? "API Accepted ✓" : "API Rejected ✗"}</div>
            <div>Step B · Hash: {saveResult.hashHex.slice(0, 20)}...</div>
            <div>Step C · TX: {saveResult.solanaTxSignature.slice(0, 20)}...</div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="status-error fade-up">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--danger)", letterSpacing: 1 }}>
            {saveError}
          </span>
        </div>
      )}

      {!connected && (
        <p className="hint-text">Connect your Solana wallet to enable room sync</p>
      )}
    </div>
  );
}
