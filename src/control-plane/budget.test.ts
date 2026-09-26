import { describe, expect, it } from "vitest";
import { BudgetError, BudgetGuard } from "./budget.js";

describe("BudgetGuard", () => {
  it("blocks a reservation that would exceed the configured limit", () => {
    const guard = new BudgetGuard();
    guard.setLimit("inference:daily", 10);
    guard.reserve("inference:daily", 7);
    expect(() => guard.reserve("inference:daily", 4)).toThrow(BudgetError);
  });

  it("prevents double-spend: two concurrent reservations cannot both fit if their sum exceeds the limit", () => {
    const guard = new BudgetGuard();
    guard.setLimit("ads:monthly", 100);
    const first = guard.reserve("ads:monthly", 60);
    expect(() => guard.reserve("ads:monthly", 60)).toThrow(BudgetError);
    guard.commit(first.id, 60);
    expect(guard.available("ads:monthly")).toBe(40);
  });

  it("releases a failed reservation without recording spend", () => {
    const guard = new BudgetGuard();
    guard.setLimit("inference:daily", 10);
    const reservation = guard.reserve("inference:daily", 5);
    guard.release(reservation.id);
    expect(guard.available("inference:daily")).toBe(10);
  });

  it("commits actual observed cost, which may differ from the reserved estimate", () => {
    const guard = new BudgetGuard();
    guard.setLimit("inference:daily", 10);
    const reservation = guard.reserve("inference:daily", 5);
    guard.commit(reservation.id, 3);
    expect(guard.available("inference:daily")).toBe(7);
  });

  it("keeps separate buckets for inference spend and commercial (store) spend", () => {
    const guard = new BudgetGuard();
    guard.setLimit("inference:daily", 10);
    guard.setLimit("ads:monthly", 500);
    guard.reserve("inference:daily", 10);
    expect(guard.available("ads:monthly")).toBe(500);
  });

  it("rejects operations against a bucket with no configured limit", () => {
    const guard = new BudgetGuard();
    expect(() => guard.reserve("unknown-bucket", 1)).toThrow(BudgetError);
  });

  it("cannot commit or release the same reservation twice", () => {
    const guard = new BudgetGuard();
    guard.setLimit("inference:daily", 10);
    const reservation = guard.reserve("inference:daily", 5);
    guard.commit(reservation.id, 5);
    expect(() => guard.commit(reservation.id, 5)).toThrow(BudgetError);
  });
});
