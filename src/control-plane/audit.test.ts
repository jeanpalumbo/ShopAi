import { describe, expect, it } from "vitest";
import { AuditLog } from "./audit.js";

describe("AuditLog", () => {
  it("assigns increasing ids and a UTC timestamp to each event", () => {
    const log = new AuditLog();
    const fixedNow = () => new Date("2026-01-01T00:00:00.000Z");

    const first = log.record(
      { correlationId: "corr-1", actor: "ceo", type: "decision", resource: "goal:1", result: "success" },
      fixedNow,
    );
    const second = log.record(
      { correlationId: "corr-1", actor: "ceo", type: "action", resource: "goal:1", result: "denied" },
      fixedNow,
    );

    expect(first.id).not.toBe(second.id);
    expect(first.timestamp).toBe("2026-01-01T00:00:00.000Z");
    expect(log.size).toBe(2);
  });

  it("is append-only: returned events are frozen and cannot be mutated in place", () => {
    const log = new AuditLog();
    const event = log.record({ correlationId: "c", actor: "a", type: "t", resource: "r", result: "success" });
    expect(() => {
      (event as { result: string }).result = "error";
    }).toThrow();
    expect(log.list()[0]?.result).toBe("success");
  });

  it("filters by correlationId, resource and type", () => {
    const log = new AuditLog();
    log.record({ correlationId: "c1", actor: "a", type: "decision", resource: "goal:1", result: "success" });
    log.record({ correlationId: "c2", actor: "a", type: "action", resource: "goal:2", result: "denied" });

    expect(log.list({ correlationId: "c1" })).toHaveLength(1);
    expect(log.list({ resource: "goal:2" })).toHaveLength(1);
    expect(log.list({ type: "action" })[0]?.resource).toBe("goal:2");
  });
});
