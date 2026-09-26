import { createHash } from "node:crypto";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "executed";

export interface ApprovalRequest {
  id: string;
  action: string;
  resource: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  requestedBy: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export class ApprovalError extends Error {}

function hashPayload(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Approvals are scoped to one action with an exact parameter snapshot and a
 * deadline. Any change to the payload invalidates the approval; execution
 * must re-check status, expiry and payload hash right before running,
 * per the master plan's ApprovalQueue rules.
 */
export class ApprovalQueue {
  private readonly requests = new Map<string, ApprovalRequest>();
  private sequence = 0;

  request(input: {
    action: string;
    resource: string;
    payload: Record<string, unknown>;
    requestedBy: string;
    ttlMs: number;
    now?: Date;
  }): ApprovalRequest {
    const now = input.now ?? new Date();
    this.sequence += 1;
    const record: ApprovalRequest = {
      id: `apr_${this.sequence}`,
      action: input.action,
      resource: input.resource,
      payload: { ...input.payload },
      payloadHash: hashPayload(input.payload),
      requestedBy: input.requestedBy,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(),
    };
    this.requests.set(record.id, record);
    return { ...record };
  }

  decide(id: string, decision: "approved" | "rejected", decidedBy: string, now: Date = new Date()): ApprovalRequest {
    const record = this.mustGet(id);
    if (record.status !== "pending") {
      throw new ApprovalError(`La aprobacion '${id}' ya no esta pendiente (estado='${record.status}').`);
    }
    if (now.getTime() > new Date(record.expiresAt).getTime()) {
      record.status = "expired";
      throw new ApprovalError(`La aprobacion '${id}' expiro en ${record.expiresAt}.`);
    }
    record.status = decision;
    record.decidedBy = decidedBy;
    record.decidedAt = now.toISOString();
    return { ...record };
  }

  /**
   * Revalidates that an approval can still be used to execute the given
   * action/resource/payload right now. Never returns true just because the
   * status is "approved" - it recomputes the payload hash and checks
   * expiry at call time.
   */
  canExecute(id: string, check: { action: string; resource: string; payload: Record<string, unknown> }, now: Date = new Date()): { ok: true } | { ok: false; reason: string } {
    const record = this.requests.get(id);
    if (!record) return { ok: false, reason: `Aprobacion desconocida: '${id}'.` };
    if (record.status !== "approved") return { ok: false, reason: `Estado no ejecutable: '${record.status}'.` };
    if (now.getTime() > new Date(record.expiresAt).getTime()) return { ok: false, reason: "Aprobacion expirada." };
    if (record.action !== check.action || record.resource !== check.resource) {
      return { ok: false, reason: "Accion o recurso no coinciden con la aprobacion." };
    }
    if (record.payloadHash !== hashPayload(check.payload)) {
      return { ok: false, reason: "El payload cambio desde la aprobacion; invalida." };
    }
    return { ok: true };
  }

  markExecuted(id: string): void {
    const record = this.mustGet(id);
    if (record.status !== "approved") {
      throw new ApprovalError(`No se puede marcar ejecutada una aprobacion en estado '${record.status}'.`);
    }
    record.status = "executed";
  }

  get(id: string): ApprovalRequest | undefined {
    const record = this.requests.get(id);
    return record ? { ...record } : undefined;
  }

  private mustGet(id: string): ApprovalRequest {
    const record = this.requests.get(id);
    if (!record) throw new ApprovalError(`Aprobacion desconocida: '${id}'.`);
    return record;
  }
}
