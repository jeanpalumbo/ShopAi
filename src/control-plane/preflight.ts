import type { AppConfig } from "../config/index.js";

export type ReadinessState = "READY" | "BLOCKED" | "DEGRADED" | "REQUIRES_APPROVAL";

export interface ReadinessReport {
  state: ReadinessState;
  reasons: string[];
}

/**
 * Computes structured readiness from actual configuration state. Never
 * reports READY just because the process started - the offline profile is
 * READY for chat/objectives but any write-capable profile without a
 * configured model or store is BLOCKED with a concrete reason.
 */
export function computePreflight(config: AppConfig): ReadinessReport {
  const reasons: string[] = [];

  if (config.profile !== "offline" && !config.model.providerConfigured) {
    reasons.push("Modelo: falta proveedor/credencial configurada (AICOS_MODEL_PROVIDER / AICOS_MODEL_API_KEY).");
  }

  if (config.profile === "live" && !config.shopify.configured) {
    reasons.push("Shopify: falta dominio de tienda o token de acceso (SHOPIFY_SHOP_DOMAIN / SHOPIFY_ACCESS_TOKEN).");
  }

  if (reasons.length > 0) {
    return { state: "BLOCKED", reasons };
  }

  if (config.profile === "sandbox" && !config.shopify.configured) {
    return { state: "DEGRADED", reasons: ["Shopify: modo sandbox sin tienda configurada; solo funciones sin Shopify estaran disponibles."] };
  }

  return { state: "READY", reasons: [] };
}
