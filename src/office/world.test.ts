import { describe, expect, it } from "vitest";
import {
  OFFICE_LAYOUT,
  OfficeMapError,
  OfficeWorld,
  OfficeWorldError,
  findPath,
  findSeats,
  isWalkable,
  parseLayout,
  type AgentSeed,
} from "./world.js";
import { demoSnapshot } from "./roster.js";

const map = parseLayout(OFFICE_LAYOUT);
const seeds = (): AgentSeed[] => demoSnapshot().agents.map((a) => ({ ...a }));
const run = (w: OfficeWorld, ms: number) => {
  for (let t = 0; t < ms; t += 20) w.update(20);
};

describe("mapa", () => {
  it("el layout oficial es rectangular y tiene 8 puestos", () => {
    expect(map.width).toBe(24);
    expect(findSeats(map)).toHaveLength(8);
  });
  it("rechaza filas de distinto ancho", () => {
    expect(() => parseLayout(["###", "##"])).toThrow(OfficeMapError);
  });
  it("paredes, escritorios y fuera de rango no se pisan", () => {
    expect(isWalkable(map, 0, 0)).toBe(false);
    expect(isWalkable(map, 3, 3)).toBe(false);
    expect(isWalkable(map, -1, 5)).toBe(false);
    expect(isWalkable(map, 3, 4)).toBe(true);
  });
});

describe("findPath", () => {
  it("encuentra ruta que rodea obstaculos y no incluye el origen", () => {
    const path = findPath(map, { x: 1, y: 2 }, { x: 3, y: 4 });
    expect(path.at(-1)).toEqual({ x: 3, y: 4 });
    expect(path[0]).not.toEqual({ x: 1, y: 2 });
    expect(path.every((p) => isWalkable(map, p.x, p.y))).toBe(true);
  });
  it("devuelve [] si el destino es pared o esta bloqueado", () => {
    expect(findPath(map, { x: 1, y: 2 }, { x: 0, y: 0 })).toEqual([]);
    expect(findPath(map, { x: 1, y: 2 }, { x: 5, y: 5 }, () => true)).toEqual([]);
  });
});

describe("OfficeWorld", () => {
  it("falla si hay mas agentes que puestos", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ ...seeds()[0]!, id: `a${i}` }));
    expect(() => new OfficeWorld(map, many)).toThrow(OfficeWorldError);
  });

  it("el agente working esta sentado mirando al escritorio", () => {
    const w = new OfficeWorld(map, seeds(), { rng: () => 0.5 });
    run(w, 3000);
    const elena = w.agents.find((a) => a.id === "elena")!;
    expect(w.isSeated(elena)).toBe(true);
    expect(elena.mover.dir).toBe("up");
  });

  it("un agente idle termina fuera de su puesto tras un rato y nunca pisa tiles bloqueados", () => {
    let n = 0;
    const w = new OfficeWorld(map, seeds(), { rng: () => ((n = (n + 0.37) % 1), n) });
    let moved = false;
    for (let t = 0; t < 30000; t += 20) {
      w.update(20);
      for (const a of w.agents) {
        expect(isWalkable(map, a.mover.x, a.mover.y)).toBe(true);
        if (a.id === "alex" && !w.isSeated(a)) moved = true;
      }
    }
    expect(moved).toBe(true);
  });

  it("dos actores nunca comparten tile", () => {
    let n = 0;
    const w = new OfficeWorld(map, seeds(), { rng: () => ((n = (n + 0.61) % 1), n) });
    for (let t = 0; t < 30000; t += 20) {
      w.update(20);
      const keys = w.agents.map((a) => `${a.mover.x},${a.mover.y}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("setStatus a working manda al agente a su puesto", () => {
    let n = 0;
    const w = new OfficeWorld(map, seeds(), { rng: () => ((n = (n + 0.29) % 1), n) });
    run(w, 8000);
    w.setStatus("alex", "working", "tarea");
    run(w, 15000);
    expect(w.isSeated(w.agents[0]!)).toBe(true);
    expect(() => w.setStatus("nadie", "idle", null)).toThrow(OfficeWorldError);
  });

  it("el jugador se mueve por suelo, choca con paredes y detecta agentes de frente", () => {
    const w = new OfficeWorld(map, seeds(), { rng: () => 0.5 });
    expect(w.movePlayer("left")).toBe(true);
    expect(w.movePlayer("left")).toBe(false); // todavia en transicion
    run(w, 400);
    w.player.x = 1;
    w.player.y = 2;
    expect(w.movePlayer("left")).toBe(false);
    expect(w.player.dir).toBe("left");
    // frente al agente sentado en (3,4) desde (3,5)
    w.player.x = 3;
    w.player.y = 5;
    w.player.dir = "up";
    expect(w.facingAgent()?.id).toBe("alex");
  });
});
