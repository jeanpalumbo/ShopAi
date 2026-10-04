import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { createOfficeServer, resolveStatic } from "./server.js";

describe("resolveStatic", () => {
  const root = resolve("/srv/office");
  it("mapea / a index.html", () => {
    expect(resolveStatic(root, "/")).toBe(resolve(root, "index.html"));
  });
  it("bloquea path traversal", () => {
    expect(resolveStatic(root, "/../secret")).toBeNull();
    expect(resolveStatic(root, "/%2e%2e/%2e%2e/etc/passwd")).toBeNull();
  });
});

describe("servidor", () => {
  let server: Server;
  let base: string;
  beforeAll(async () => {
    server = createOfficeServer();
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("expone el snapshot etiquetado como demo", async () => {
    const body = (await (await fetch(`${base}/api/office/agents`)).json()) as { source: string; agents: unknown[] };
    expect(body.source).toBe("demo");
    expect(body.agents).toHaveLength(8);
  });
  it("rechaza metodos de escritura", async () => {
    expect((await fetch(`${base}/api/office/agents`, { method: "POST" })).status).toBe(405);
  });
  it("sirve el index", async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Oficina de agentes");
  });
});
