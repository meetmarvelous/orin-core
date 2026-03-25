import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.string().optional().default("development"),
  NETWORK: z.enum(["devnet", "mainnet"]).default("devnet"),
  RPC_ENDPOINT: z.string().min(1),
  PROGRAM_ID: z.string().min(1),
  GOOGLE_API_KEY: z.string().min(1),
  GOOGLE_MODEL: z.string().min(1).default("gemini-1.5-flash"),
  DEEPGRAM_API_KEY: z.string().min(1),
  DEEPGRAM_TTS_MODEL: z.string().min(1).default("aura-2-thalia-en"),
  MQTT_BROKER_URL: z.string().min(1),
  MQTT_TOPIC: z.string().min(1),
  ENCRYPTION_SECRET: z.string().min(16),
  REDIS_URL: z.string().min(1),
  STATE_PROVIDER: z.enum(["redis", "memory"]).default("redis"),
  API_HOST: z.string().min(1).default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  ALLOWED_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  API_KEY: z.string().min(1).default("replace_with_a_secure_api_key"),
});

type ParsedEnv = z.infer<typeof envSchema>;

let cachedEnv: ParsedEnv | null = null;

export function getEnv(): ParsedEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
