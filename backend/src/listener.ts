import { Connection, PublicKey } from '@solana/web3.js';
import * as admin from 'firebase-admin';
import { adjustRoomEnvironment } from './mqtt_mock';
import './firebase_config'; // Initialize Firebase Admin

// NOTE: Replace with your deployed Program ID or dynamic devnet string
const PROGRAM_ID = new PublicKey("FqtrHgdYTph1DSP9jDYD7xrKPrjSjCTtnw6fyKMmboYk");

// Change to your actual Solana RPC (Devnet/Mainnet/Local)
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'http://127.0.0.1:8899';
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

export function startSolanaListener() {
    console.log(`[ORIN-Backend] 🚀 Starting Solana listener on ${RPC_ENDPOINT}`);
    console.log(`[ORIN-Backend] 📡 Watching Program ID: ${PROGRAM_ID.toBase58()}\n`);

    // Listen to all account changes owned by our Anchor program
    connection.onProgramAccountChange(
        PROGRAM_ID,
        async (updatedAccountInfo, context) => {
            console.log("---------------------------------------------------------");
            console.log(`[ORIN-Backend] 🔔 On-chain Data Changed at slot ${context.slot}!`);
            
            const pubkey = updatedAccountInfo.accountId.toBase58();
            // In a production app, we decode the accountInfo.accountInfo.data buffer directly
            // using the Anchor IDL (program.coder.accounts.decode("GuestIdentity", data)).
            //
            // We'll mock the parsed data here to simulate finding the preferences JSON
            const mockParsedPreferences = {
                temp: 22.5,
                light_color: "#FF5733",
                brightness: 85
            };
            
            console.log(`[ORIN-Backend] 👤 Guest Account: ${pubkey}`);
            console.log(`[ORIN-Backend] ✨ Extracted Preferences:`, mockParsedPreferences);

            try {
                // 1. Sync to Firebase Real-time DB
                // This gives the frontend immediate confirmation of the user presence
                const dbRef = admin.database().ref(`/rooms/guest_${pubkey}`);
                await dbRef.update({
                    has_arrived: true,
                    preferences: mockParsedPreferences,
                    last_updated: Date.now()
                });
                console.log(`[Firebase Sync] ✅ Triggered Real-time DB update for Frontend.`);

                // 2. Bridge to Physical Layer (IoT / MQTT)
                adjustRoomEnvironment(pubkey, mockParsedPreferences);

            } catch (error) {
                console.error("[ORIN-Backend] ❌ Failed to sync/bridge data:", error);
            }
            console.log("---------------------------------------------------------");
        },
        'confirmed'
    );
}

// Start listener immediately when executed
if (require.main === module) {
    startSolanaListener();
}
