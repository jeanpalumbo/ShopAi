import { describe, expect, it } from "vitest";
import { ApprovalError, ApprovalQueue } from "./approvals.js";

describe("ApprovalQueue", () => {
  it("requires an approved decision before canExecute succeeds", () => {
    const queue = new ApprovalQueue();
    const req = queue.request({
      action: "product.updatePrice",
      resource: "product:1",
      payload: { price: 19.99 },
      requestedBy: "ceo",
      ttlMs: 60_000,
    });

    expect(queue.canExecute(req.id, { action: "product.updatePrice", resource: "product:1", payload: { price: 19.99 } })).toEqual({
      ok: false,
      reason: "Estado no ejecutable: 'pending'.",
    });

    queue.decide(req.id, "approved", "jean");
    expect(queue.canExecute(req.id, { action: "product.updatePrice", resource: "product:1", payload: { price: 19.99 } })).toEqual({ ok: true });
  });

  it("invalidates the approval if the payload changes even slightly", () => {
    const queue = new ApprovalQueue();
    const req = queue.request({
      action: "product.updatePrice",
      resource: "product:1",
      payload: { price: 19.99 },
      requestedBy: "ceo",
      ttlMs: 60_000,
    });
    queue.decide(req.id, "approved", "jean");

    const result = queue.canExecute(req.id, { action: "product.updatePrice", resource: "product:1", payload: { price: 20.0 } });
    expect(result).toEqual({ ok: false, reason: "El payload cambio desde la aprobacion; invalida." });
  });

  it("expires an approval past its deadline and refuses execution", () => {
    const queue = new ApprovalQueue();
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const req = queue.request({
      action: "order.refund",
      resource: "order:1",
      payload: { amount: 10 },
      requestedBy: "ceo",
      ttlMs: 1_000,
      now: createdAt,
    });
    queue.decide(req.id, "approved", "jean", createdAt);

    const later = new Date(createdAt.getTime() + 5_000);
    const result = queue.canExecute(req.id, { action: "order.refund", resource: "order:1", payload: { amount: 10 } }, later);
    expect(result).toEqual({ ok: false, reason: "Aprobacion expirada." });
  });

  it("cannot decide twice on the same request", () => {
    const queue = new ApprovalQueue();
    const req = queue.request({ action: "a", resource: "r", payload: {}, requestedBy: "ceo", ttlMs: 60_000 });
    queue.decide(req.id, "approved", "jean");
    expect(() => queue.decide(req.id, "rejected", "jean")).toThrow(ApprovalError);
  });

  it("marks an approval as executed and prevents reusing it afterwards", () => {
    const queue = new ApprovalQueue();
    const req = queue.request({ action: "a", resource: "r", payload: { x: 1 }, requestedBy: "ceo", ttlMs: 60_000 });
    queue.decide(req.id, "approved", "jean");
    queue.markExecuted(req.id);

    const result = queue.canExecute(req.id, { action: "a", resource: "r", payload: { x: 1 } });
    expect(result).toEqual({ ok: false, reason: "Estado no ejecutable: 'executed'." });
  });
});
