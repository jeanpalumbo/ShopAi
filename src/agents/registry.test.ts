import { describe, expect, it } from "vitest";
import { AgentRegistry, AgentRegistryError } from "./registry.js";

const baseAgent = {
  id: "shopify-reader",
  version: "0.1.0",
  owner: "jean",
  capabilities: ["read-products"],
  allowedTools: ["shopify.getProduct"],
  canWrite: false,
};

describe("AgentRegistry", () => {
  it("registers an agent and reports its allowed tools", () => {
    const registry = new AgentRegistry();
    registry.register(baseAgent);

    expect(registry.get("shopify-reader")).toEqual(baseAgent);
    expect(registry.isToolAllowed("shopify-reader", "shopify.getProduct")).toBe(true);
    expect(registry.isToolAllowed("shopify-reader", "shopify.updateProduct")).toBe(false);
  });

  it("denies tools for unknown agents by default", () => {
    const registry = new AgentRegistry();
    expect(registry.isToolAllowed("ghost-agent", "anything")).toBe(false);
  });

  it("refuses to re-register an existing agent id (no self-registration)", () => {
    const registry = new AgentRegistry();
    registry.register(baseAgent);
    expect(() => registry.register(baseAgent)).toThrow(AgentRegistryError);
  });

  it("requires an existing entry before update() can change permissions", () => {
    const registry = new AgentRegistry();
    expect(() => registry.update({ ...baseAgent, canWrite: true })).toThrow(AgentRegistryError);
  });

  it("keeps registered definitions immutable from the outside", () => {
    const registry = new AgentRegistry();
    registry.register(baseAgent);
    const fetched = registry.get("shopify-reader");
    expect(() => {
      (fetched as { canWrite: boolean }).canWrite = true;
    }).toThrow();
  });
});
