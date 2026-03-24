/**
 * Save Preferences Orchestrator
 * ---------------------------------------------------
 * Implements the complete Frontend Hash-Lock Workflow:
 *
 *   Step A → Send raw command to Backend API
 *   Step B → Calculate SHA-256 hash locally in browser
 *   Step C → Write ONLY the hash to Solana on-chain
 *
 * This is the single function the UI calls when the guest
 * clicks "Save my setup" on the Room Control screen.
 */

import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { generateSha256Hash } from "./hash";
import { stageVoiceCommand, GuestContext } from "./api";
import { updatePreferencesOnChain } from "./solana";

export interface RoomPreferences {
  temp: number;
  lighting: "warm" | "cold" | "ambient";
  services: string[];
  raw_response: string;
}

export interface SavePreferencesResult {
  apiAccepted: boolean;
  hashHex: string;
  solanaTxSignature: string;
}

/**
 * Orchestrates the full Hash-Lock workflow.
 *
 * @param program     - Connected Anchor program instance
 * @param guestPda    - The guest's PDA (from deriveGuestPda)
 * @param ownerPubkey - The connected wallet's public key
 * @param userInput   - Natural language or descriptive text of what the guest wants
 * @param preferences - The structured room preferences payload
 * @param guestContext - Guest identity context for the AI agent
 *
 * @returns Object with API acceptance, hash hex, and Solana TX signature
 */
export async function savePreferences(
  program: Program,
  guestPda: PublicKey,
  ownerPubkey: PublicKey,
  userInput: string,
  preferences: RoomPreferences,
  guestContext: GuestContext
): Promise<SavePreferencesResult> {
  // ─── Step A: Stage command in backend (Redis) ───────────────
  const apiResponse = await stageVoiceCommand({
    guestPda: guestPda.toBase58(),
    userInput,
    guestContext,
  });

  // ─── Step B: Hash payload locally in browser ────────────────
  const hashBytes = await generateSha256Hash(preferences);
  const hashHex = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // ─── Step C: Write ONLY the hash to Solana ──────────────────
  const txSignature = await updatePreferencesOnChain(
    program,
    guestPda,
    ownerPubkey,
    hashBytes
  );

  return {
    apiAccepted: apiResponse.status === "accepted",
    hashHex,
    solanaTxSignature: txSignature,
  };
}
