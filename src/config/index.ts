import { z } from "zod";

export const PROFILES = ["offline", "sandbox", "live"] as const;
export type Profile = (typeof PROFILES)[number];

const envSchema = z.object({
  AICOS_PROFILE: z.enum(PROFILES).default("offline"),
  AICOS_MODEL_PROVIDER: z.string().optional().default(""),
  AICOS_MODEL_API_KEY: z.string().optional().default(""),
  SHOPIFY_SHOP_DOMAIN: z.string().optional().default(""),
  SHOPIFY_ACCESS_TOKEN: z.string().optional().default(""),
  SHOPIFY_API_VERSION: z.string().optional().default(""),
  AICOS_DATABASE_URL: z.string().optional().default("file:./data/aicos.sqlite"),
});

export interface AppConfig {
  profile: Profile;
  model: {
    providerConfigured: boolean;
    provider: string;
  };
  shopify: {
    configured: boolean;
    shopDomain: string;
  };
  databaseUrl: string;
}

export class ConfigError extends Error {}

/**
 * Loads and validates configuration from environment variables.
 * Never returns or logs raw secret values (API keys, tokens) - only
 * booleans indicating whether they are present, per the "no secrets in
 * logs" principle in the master plan.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(
      `Configuracion invalida: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  const data = parsed.data;

  return {
    profile: data.AICOS_PROFILE,
    model: {
      providerConfigured: data.AICOS_MODEL_API_KEY.length > 0 && data.AICOS_MODEL_PROVIDER.length > 0,
      provider: data.AICOS_MODEL_PROVIDER,
    },
    shopify: {
      configured: data.SHOPIFY_SHOP_DOMAIN.length > 0 && data.SHOPIFY_ACCESS_TOKEN.length > 0,
      shopDomain: data.SHOPIFY_SHOP_DOMAIN,
    },
    databaseUrl: data.AICOS_DATABASE_URL,
  };
}
