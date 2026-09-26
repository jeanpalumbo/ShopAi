import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "./index.js";

describe("loadConfig", () => {
  it("defaults to the offline profile when no env is set", () => {
    const config = loadConfig({});
    expect(config.profile).toBe("offline");
    expect(config.model.providerConfigured).toBe(false);
    expect(config.shopify.configured).toBe(false);
  });

  it("rejects an unknown profile instead of silently defaulting", () => {
    expect(() => loadConfig({ AICOS_PROFILE: "production" as never })).toThrow(ConfigError);
  });

  it("marks model as configured only when provider and key are both present", () => {
    const withOnlyKey = loadConfig({ AICOS_MODEL_API_KEY: "sk-fake" });
    expect(withOnlyKey.model.providerConfigured).toBe(false);

    const withBoth = loadConfig({ AICOS_MODEL_API_KEY: "sk-fake", AICOS_MODEL_PROVIDER: "anthropic" });
    expect(withBoth.model.providerConfigured).toBe(true);
  });

  it("marks shopify as configured only when domain and token are both present", () => {
    const config = loadConfig({ SHOPIFY_SHOP_DOMAIN: "test.myshopify.com" });
    expect(config.shopify.configured).toBe(false);
  });

  it("never leaks raw secret values on the returned object", () => {
    const config = loadConfig({ AICOS_MODEL_API_KEY: "sk-should-not-appear", SHOPIFY_ACCESS_TOKEN: "shpat-secret" });
    const serialized = JSON.stringify(config);
    expect(serialized).not.toContain("sk-should-not-appear");
    expect(serialized).not.toContain("shpat-secret");
  });
});
