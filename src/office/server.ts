import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { demoSnapshot } from "./roster.js";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "../../public/office");

/** Resuelve una URL a un archivo dentro de `root`; null si intenta salirse. */
export function resolveStatic(root: string, urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  } catch {
    return null;
  }
  const rel = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const full = normalize(join(root, rel));
  return full === root || full.startsWith(root + sep) ? full : null;
}

export function createOfficeServer(root: string = publicDir, worldJsPath?: string): Server {
  const worldJs = worldJsPath ?? resolve(here, "world.js");
  return createServer(async (req, res) => {
    if (req.method !== "GET") {
      res.writeHead(405, { Allow: "GET" }).end();
      return;
    }
    const url = req.url ?? "/";
    if (url.startsWith("/api/office/agents")) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(demoSnapshot()));
      return;
    }
    const file = url.startsWith("/js/world.js") ? worldJs : resolveStatic(root, url);
    if (!file) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env["OFFICE_PORT"] ?? 4173);
  createOfficeServer().listen(port, "127.0.0.1", () => {
    console.log(`Oficina de agentes en http://127.0.0.1:${port}`);
  });
}
