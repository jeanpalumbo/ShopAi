import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/index.js";
import { computePreflight } from "./preflight.js";

describe("computePreflight", () => {
  it("is READY in the offline profile with no external credentials", () => {
    const config = loadConfig({ AICOS_PROFILE: "offline" });
    expect(computePreflight(config)).toEqual({ state: "READY", reasons: [] });
  });

  it("is BLOCKED in sandbox/live without a configured model provider", () => {
    const config = loadConfig({ AICOS_PROFILE: "sandbox" });
    const report = computePreflight(config);
    expect(report.state).toBe("BLOCKED");
    expect(report.reasons[0]).toMatch(/Modelo/);
  });

  it("is DEGRADED in sandbox with a model configured but no Shopify store", () => {
    const config = loadConfig({ AICOS_PROFILE: "sandbox", AICOS_MODEL_PROVIDER: "anthropic", AICOS_MODEL_API_KEY: "sk-fake" });
    expect(computePreflight(config)).toEqual({
      state: "DEGRADED",
      reasons: ["Shopify: modo sandbox sin tienda configurada; solo funciones sin Shopify estaran disponibles."],
    });
  });

  it("is BLOCKED in live profile without Shopify credentials even if the model is configured", () => {
    const config = loadConfig({ AICOS_PROFILE: "live", AICOS_MODEL_PROVIDER: "anthropic", AICOS_MODEL_API_KEY: "sk-fake" });
    const report = computePreflight(config);
    expect(report.state).toBe("BLOCKED");
    expect(report.reasons[0]).toMatch(/Shopify/);
  });

  it("is READY in live profile once model and Shopify are both configured", () => {
    const config = loadConfig({
      AICOS_PROFILE: "live",
      AICOS_MODEL_PROVIDER: "anthropic",
      AICOS_MODEL_API_KEY: "sk-fake",
      SHOPIFY_SHOP_DOMAIN: "test.myshopify.com",
      SHOPIFY_ACCESS_TOKEN: "shpat-fake",
    });
    expect(computePreflight(config)).toEqual({ state: "READY", reasons: [] });
  });
});
