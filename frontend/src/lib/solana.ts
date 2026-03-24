/**
 * Solana program interaction utilities
 * ---------------------------------------------------
 * Handles all direct interactions with the ORIN Anchor
 * smart contract on Solana Devnet.
 *
 * Uses the same IDL and instruction patterns as:
 *   - backend/src/simulate_frontend.ts
 *   - tests/orin_identity.ts
 */

import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
import { ORIN_PROGRAM_ID } from "./pda";

/** Solana Devnet RPC endpoint */
const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl("devnet");

/**
 * Creates a Solana Connection instance for Devnet.
 */
export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

/**
 * Loads an AnchorProvider from the given wallet adapter.
 * This is typically called with the connected wallet from
 * @solana/wallet-adapter-react's useAnchorWallet().
 */
export function getProvider(wallet: any): AnchorProvider {
  const connection = getConnection();
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

/**
 * Loads the ORIN Anchor program instance.
 * The IDL is imported statically from the build artifacts.
 *
 * @param provider - An AnchorProvider with a connected wallet
 * @param idl - The ORIN program IDL (loaded from target/idl/orin_identity.json)
 */
export function getProgram(provider: AnchorProvider, idl: Idl): Program {
  return new Program(idl, provider);
}

/**
 * Step C: Writes the preferences hash on-chain.
 * Calls the Anchor `updatePreferences` instruction with a 32-byte hash.
 *
 * This is the final step of the Hash-Lock workflow:
 *   Step A (API) → Step B (hash) → Step C (this function)
 *
 * @param program - The loaded ORIN Anchor program
 * @param guestPda - The guest's PDA (derived from their email)
 * @param ownerPubkey - The connected wallet's public key (must be the PDA owner)
 * @param preferencesHash - 32-byte SHA-256 hash as Uint8Array
 * @returns Transaction signature string
 */
export async function updatePreferencesOnChain(
  program: Program,
  guestPda: PublicKey,
  ownerPubkey: PublicKey,
  preferencesHash: Uint8Array
): Promise<string> {
  const tx = await (program.methods as any)
    .updatePreferences(Array.from(preferencesHash))
    .accounts({
      guestProfile: guestPda,
      owner: ownerPubkey,
    } as any)
    .rpc();

  return tx;
}

/**
 * Initializes a new guest identity PDA on-chain.
 * Typically called once during first-time onboarding.
 *
 * @param program - The loaded ORIN Anchor program
 * @param guestPda - The derived guest PDA
 * @param userPubkey - The wallet paying for account creation
 * @param emailHash - 32-byte SHA-256 hash of the guest's email
 * @param name - Guest's display name (max 100 chars)
 * @returns Transaction signature string
 */
export async function initializeGuestOnChain(
  program: Program,
  guestPda: PublicKey,
  userPubkey: PublicKey,
  emailHash: Uint8Array,
  name: string
): Promise<string> {
  const tx = await (program.methods as any)
    .initializeGuest(Array.from(emailHash), name)
    .accounts({
      guestProfile: guestPda,
      user: userPubkey,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

/**
 * Fetches the on-chain GuestIdentity account data.
 *
 * @param program - The loaded ORIN Anchor program
 * @param guestPda - The guest's PDA
 * @returns Decoded account data or null if account doesn't exist
 */
export async function fetchGuestProfile(
  program: Program,
  guestPda: PublicKey
): Promise<any | null> {
  try {
    const account = await (program.account as any).guestIdentity.fetch(
      guestPda
    );
    return account;
  } catch {
    return null;
  }
}
