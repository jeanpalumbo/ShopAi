export interface AuditEvent {
  id: string;
  timestamp: string; // ISO-8601 UTC
  correlationId: string;
  actor: string;
  type: string;
  resource: string;
  result: "success" | "denied" | "error";
  evidenceRef?: string;
  details?: Record<string, unknown>;
}

export type AuditEventInput = Omit<AuditEvent, "id" | "timestamp">;

/**
 * Append-only audit trail. Events are never mutated or removed once
 * recorded - corrections must be recorded as new events referencing the
 * prior one, per the master plan's "no borrar/sobrescribir auditoria" rule.
 */
export class AuditLog {
  private readonly events: AuditEvent[] = [];
  private sequence = 0;

  record(input: AuditEventInput, now: () => Date = () => new Date()): AuditEvent {
    this.sequence += 1;
    const event: AuditEvent = {
      id: `evt_${this.sequence}`,
      timestamp: now().toISOString(),
      ...input,
    };
    this.events.push(event);
    return Object.freeze({ ...event });
  }

  list(filter?: { correlationId?: string; resource?: string; type?: string }): readonly AuditEvent[] {
    let result: AuditEvent[] = [...this.events];
    if (filter?.correlationId) {
      result = result.filter((e) => e.correlationId === filter.correlationId);
    }
    if (filter?.resource) {
      result = result.filter((e) => e.resource === filter.resource);
    }
    if (filter?.type) {
      result = result.filter((e) => e.type === filter.type);
    }
    return Object.freeze(result);
  }

  get size(): number {
    return this.events.length;
  }
}
