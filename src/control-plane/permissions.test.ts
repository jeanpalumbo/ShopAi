import { describe, expect, it } from "vitest";
import { PermissionManager } from "./permissions.js";

describe("PermissionManager", () => {
  it("denies by default when there is no matching rule", () => {
    const pm = new PermissionManager();
    const decision = pm.authorize({ actor: "shopify-reader", action: "product.update", resource: "product:1" });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/Sin politica explicita/);
  });

  it("allows only the exact granted actor/action/resource combination", () => {
    const pm = new PermissionManager();
    pm.grant({ actor: "shopify-reader", action: "product.read", resource: "product:*" });

    expect(pm.authorize({ actor: "shopify-reader", action: "product.read", resource: "product:*" }).allowed).toBe(true);
    expect(pm.authorize({ actor: "shopify-reader", action: "product.update", resource: "product:*" }).allowed).toBe(false);
    expect(pm.authorize({ actor: "other-agent", action: "product.read", resource: "product:*" }).allowed).toBe(false);
  });

  it("read permission never implies write permission for the same resource", () => {
    const pm = new PermissionManager();
    pm.grant({ actor: "catalog-agent", action: "product.read", resource: "product:1" });
    expect(pm.authorize({ actor: "catalog-agent", action: "product.update", resource: "product:1" }).allowed).toBe(false);
  });
});
