/**
 * PDA (Program Derived Address) derivation utilities
 * ---------------------------------------------------
 * Mirrors the seed logic defined in the Anchor smart contract:
 *   seeds = [b"guest", email_hash.as_ref()]
 *
 * Reference: programs/orin_identity/src/lib.rs (line 65)
 * Reference: docs/INTEGRATION_SPEC.md (Section 1)
 */

import { PublicKey } from "@solana/web3.js";
import { sha256 } from "js-sha256";

/** Deployed ORIN Program ID on Solana Devnet */
export const ORIN_PROGRAM_ID = new PublicKey(
  "FqtrHgdYTph1DSP9jDYD7xrKPrjSjCTtnw6fyKMmboYk"
);

/**
 * Derives the unique Guest Identity PDA from a raw email string.
 * The email is lowercased and trimmed before hashing, matching
 * the convention used in tests/orin_identity.ts and
 * backend/src/simulate_frontend.ts.
 *
 * @param email - Guest's raw email string
 * @returns Guest PDA PublicKey and the email hash buffer
 */
export function deriveGuestPda(email: string): {
  pda: PublicKey;
  emailHash: Uint8Array;
} {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHashArray = sha256.array(normalizedEmail);
  const emailHash = new Uint8Array(emailHashArray);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("guest"), Buffer.from(emailHash)],
    ORIN_PROGRAM_ID
  );

  return { pda, emailHash };
}
