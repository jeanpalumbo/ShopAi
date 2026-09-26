export interface PermissionRule {
  actor: string;
  action: string;
  resource: string;
}

export interface PermissionCheck {
  actor: string;
  action: string;
  resource: string;
}

export interface PermissionDecision {
  allowed: boolean;
  reason: string;
}

/**
 * Deny-by-default RBAC/ABAC. A capability with no explicit rule never
 * executes, per the master plan's "denegar por defecto" principle. Rules
 * are exact-match on actor+action+resource; wildcard "*" is supported per
 * field for coarser grants but must be added explicitly.
 */
export class PermissionManager {
  private readonly rules: PermissionRule[] = [];

  grant(rule: PermissionRule): void {
    this.rules.push({ ...rule });
  }

  authorize(check: PermissionCheck): PermissionDecision {
    const match = this.rules.find(
      (rule) =>
        (rule.actor === check.actor || rule.actor === "*") &&
        (rule.action === check.action || rule.action === "*") &&
        (rule.resource === check.resource || rule.resource === "*"),
    );

    if (!match) {
      return {
        allowed: false,
        reason: `Sin politica explicita para actor='${check.actor}' action='${check.action}' resource='${check.resource}'.`,
      };
    }

    return { allowed: true, reason: `Permitido por regla actor='${match.actor}' action='${match.action}' resource='${match.resource}'.` };
  }
}
