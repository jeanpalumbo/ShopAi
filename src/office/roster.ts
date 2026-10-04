import type { AgentSeed } from "./world.js";

export type DataSource = "demo" | "live";

export interface OfficeSnapshot {
  source: DataSource;
  note: string;
  generatedAt: string;
  agents: AgentSeed[];
}

/**
 * No hay orquestador conectado todavia: este snapshot es una demo y se
 * etiqueta como tal para que la UI nunca lo presente como estado real.
 */
export function demoSnapshot(now: Date = new Date()): OfficeSnapshot {
  return {
    source: "demo",
    note: "DEMO: sin orquestador conectado. Estados de ejemplo, no reflejan agentes reales.",
    generatedAt: now.toISOString(),
    agents: [
      { id: "alex", name: "Alex Reyes", role: "Operations Lead", status: "idle", task: null },
      { id: "elena", name: "Elena Voss", role: "Senior Market Research Lead", status: "working", task: "verificar endpoint office" },
      { id: "marcus", name: "Marcus Chen", role: "Merchandising Analyst", status: "idle", task: null },
      { id: "priya", name: "Priya Nair", role: "Pricing Strategist", status: "idle", task: null },
      { id: "nadia", name: "Nadia Khan", role: "Customer Support Lead", status: "idle", task: null },
      { id: "sofia", name: "Sofia Ramos", role: "Content & Marketing", status: "idle", task: null },
      { id: "mateo", name: "Mateo Ferrer", role: "Inventory & Logistics", status: "idle", task: null },
      { id: "noor", name: "Noor Karim", role: "QA & Compliance", status: "idle", task: null },
    ],
  };
}
