import { describe, expect, it } from "vitest";
import { demoSnapshot } from "./roster.js";

describe("demoSnapshot", () => {
  it("se etiqueta como demo, con ids unicos y 8 agentes", () => {
    const s = demoSnapshot(new Date("2026-01-01T00:00:00Z"));
    expect(s.source).toBe("demo");
    expect(s.generatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(new Set(s.agents.map((a) => a.id)).size).toBe(8);
  });
});
