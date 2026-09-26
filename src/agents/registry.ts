export interface AgentDefinition {
  id: string;
  version: string;
  owner: string;
  capabilities: readonly string[];
  allowedTools: readonly string[];
  canWrite: boolean;
}

export class AgentRegistryError extends Error {}

/**
 * Allowlist of registered agents. No agent can self-register: entries are
 * added explicitly by trusted setup code, and write capability defaults to
 * false unless declared, per the "ningun agente se auto-registra con
 * permisos de escritura" rule in the master plan.
 */
export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  register(definition: AgentDefinition): void {
    if (this.agents.has(definition.id)) {
      throw new AgentRegistryError(`El agente '${definition.id}' ya esta registrado; usa update() para versionarlo.`);
    }
    this.agents.set(definition.id, Object.freeze({ ...definition }));
  }

  update(definition: AgentDefinition): void {
    if (!this.agents.has(definition.id)) {
      throw new AgentRegistryError(`El agente '${definition.id}' no existe; registralo primero.`);
    }
    this.agents.set(definition.id, Object.freeze({ ...definition }));
  }

  get(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  isToolAllowed(agentId: string, tool: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    return agent.allowedTools.includes(tool);
  }

  list(): readonly AgentDefinition[] {
    return Object.freeze([...this.agents.values()]);
  }
}
