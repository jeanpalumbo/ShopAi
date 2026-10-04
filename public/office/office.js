import { OFFICE_LAYOUT, TILE_SIZE as T, OfficeWorld, parseLayout, tileAt } from "/js/world.js";

const map = parseLayout(OFFICE_LAYOUT);
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = map.width * T;
canvas.height = map.height * T;
ctx.imageSmoothingEnabled = false;

const PALETTES = {
  alex: ["#3b2a1d", "#e8b890", "#3d6fb5"], elena: ["#a0432b", "#f1c9a5", "#f6a93a"],
  marcus: ["#1d1d1d", "#b9825a", "#5b8c5a"], priya: ["#141018", "#c58c64", "#a24f9a"],
  nadia: ["#5a3a22", "#e8b890", "#c0504d"], sofia: ["#d9a441", "#f5d2b3", "#4aa3a2"],
  mateo: ["#2a1b12", "#d9a679", "#8a6a3b"], noor: ["#0f0f14", "#a8744f", "#6f5fb3"],
  player: ["#c0282d", "#f1c9a5", "#2b2d4a"],
};

const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

function drawTile(ch, tx, ty) {
  const x = tx * T, y = ty * T;
  const checker = (tx + ty) % 2 === 0;
  if (ch === "#") { px(x, y, T, T, "#5b4a6e"); px(x, y + T - 3, T, 3, "#3f3150"); px(x, y, T, 2, "#7a6890"); return; }
  px(x, y, T, T, checker ? "#e8d3a8" : "#e0c99b");
  if (ch === "B") { px(x, y, T, T, "#6b4a2b"); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) px(x + 1 + c * 4, y + 2 + r * 4, 3, 3, ["#c0504d", "#3d6fb5", "#5b8c5a", "#f6b24a"][(r + c) % 4]); }
  else if (ch === "W") { px(x, y, T, T, "#5b4a6e"); px(x + 1, y + 2, T - 2, T - 5, "#a8d8f0"); px(x + 7, y + 2, 2, T - 5, "#5b4a6e"); px(x + 1, y + 3, T - 2, 2, "#d8f0fb"); }
  else if (ch === "d") { px(x, y + 3, T, T - 3, "#8a5a2b"); px(x, y + 3, T, 2, "#b07a43"); px(x, y + T - 2, T, 2, "#5e3b17"); }
  else if (ch === "P") { px(x + 4, y + 9, 8, 6, "#a0522d"); px(x + 3, y + 3, 10, 7, "#3f8f4a"); px(x + 5, y + 1, 6, 5, "#5fb869"); }
  else if (ch === "T") { px(x, y + 2, T, T - 3, "#a9784a"); px(x, y + 2, T, 2, "#c99562"); px(x, y + T - 2, T, 2, "#6e4a2a"); }
  else if (ch === "X") { px(x, y, T, T, "#6b4a2b"); px(x + 2, y, T - 4, T, "#b07a43"); }
  else if (ch === "s") { px(x + 3, y + 5, 10, 8, "#4a4c6a"); px(x + 3, y + 5, 10, 2, "#6a6c8a"); }
}

function drawMonitors(world) {
  // Pantalla sobre el escritorio que esta a la izquierda de cada silla (x..x+1, y-1)
  for (const a of world.agents) {
    const on = world.isSeated(a) && a.status === "working";
    const x = a.seat.x * T, y = (a.seat.y - 1) * T;
    px(x + 3, y + 1, 10, 8, "#222"); px(x + 4, y + 2, 8, 6, on ? "#7fe3ff" : "#3a4a55");
    if (on) px(x + 5, y + 4, 4 + (Math.floor(performance.now() / 300) % 3) * 2, 1, "#fff");
  }
}

function drawChar(p, dir, frame, moving, pal, tx, ty, seated) {
  const [hair, skin, shirt] = pal;
  const x = Math.round(tx * T), y = Math.round(ty * T) - 3;
  const bob = moving && frame ? 1 : 0;
  px(x + 3, y + 14, 10, 3, "rgba(0,0,0,.25)");
  const legA = moving ? (frame ? 1 : -1) : 0;
  if (!seated) { px(x + 5, y + 12 + (legA > 0 ? 1 : 0), 2, 3, "#2b2d4a"); px(x + 9, y + 12 + (legA < 0 ? 1 : 0), 2, 3, "#2b2d4a"); }
  px(x + 4, y + 7 - bob, 8, 6, shirt);
  px(x + 3, y + 8 - bob, 1, 4, shirt); px(x + 12, y + 8 - bob, 1, 4, shirt);
  px(x + 4, y + 2 - bob, 8, 6, skin);
  if (dir === "down") { px(x + 4, y + 1 - bob, 8, 3, hair); px(x + 6, y + 5 - bob, 1, 2, "#111"); px(x + 9, y + 5 - bob, 1, 2, "#111"); }
  else if (dir === "up") { px(x + 4, y + 1 - bob, 8, 6, hair); }
  else { px(x + 4, y + 1 - bob, 8, 3, hair); px(dir === "left" ? x + 4 : x + 11, y + 3 - bob, 1, 4, hair); px(dir === "left" ? x + 5 : x + 10, y + 5 - bob, 1, 2, "#111"); }
  if (p === "player") { px(x + 3, y + 1 - bob, 10, 2, "#c0282d"); px(dir === "up" ? x + 4 : x + 3, y + 0 - bob, 8, 2, "#c0282d"); px(x + 6, y + 0 - bob, 4, 1, "#fff"); }
}

function drawBubble(tx, ty, t) {
  const x = Math.round(tx * T) + 10, y = Math.round(ty * T) - 8;
  px(x, y, 5, 4, "#fff"); px(x - 1, y + 1, 7, 2, "#fff");
  for (let i = 0; i < 3; i++) px(x + i * 2 - 0, y + 1 + (Math.floor(t / 250) % 3 === i ? 0 : 1), 1, 1, "#2b2d4a");
}

let current = null; // OfficeWorld real, se crea al recibir datos
let selectedId = null;
let dialog = null; // {name, text, shown}

function render(t) {
  const w = current;
  if (!w) { requestAnimationFrame(render); return; }
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) drawTile(tileAt(map, x, y), x, y);
  drawMonitors(w);
  const actors = [...w.agents.map((a) => ({ a, m: a.mover, pal: PALETTES[a.id] ?? PALETTES.player })), { a: null, m: w.player, pal: PALETTES.player }];
  actors.sort((l, r) => w.renderPos(l.m).y - w.renderPos(r.m).y);
  for (const { a, m, pal } of actors) {
    const pos = w.renderPos(m);
    const seated = a ? w.isSeated(a) : false;
    drawChar(a ? a.id : "player", m.dir, m.walkFrame, !!m.from, pal, pos.x, pos.y, seated);
    if (a && a.status === "working" && seated) drawBubble(pos.x, pos.y, t);
    if (a && a.id === selectedId) { ctx.strokeStyle = "#f6b24a"; ctx.lineWidth = 1; ctx.strokeRect(Math.round(pos.x * T) + 2.5, Math.round(pos.y * T) - 4.5, 11, 18); }
  }
  drawDialog(t);
  requestAnimationFrame(render);
}

function drawDialog() {
  if (!dialog) return;
  const h = 44, y = canvas.height - h - 6;
  px(6, y, canvas.width - 12, h, "#2b2d4a"); px(8, y + 2, canvas.width - 16, h - 4, "#fff");
  ctx.fillStyle = "#2b2d4a"; ctx.font = "bold 8px monospace"; ctx.fillText(dialog.name.toUpperCase(), 14, y + 12);
  ctx.font = "7px monospace";
  const shown = dialog.text.slice(0, Math.floor(dialog.shown));
  wrap(shown, 52).forEach((line, i) => ctx.fillText(line, 14, y + 23 + i * 9));
  if (dialog.shown >= dialog.text.length && Math.floor(performance.now() / 400) % 2) ctx.fillText("▼", canvas.width - 20, y + h - 6);
}
function wrap(text, n) {
  const lines = []; let cur = "";
  for (const word of text.split(" ")) { if ((cur + " " + word).trim().length > n) { lines.push(cur); cur = word; } else cur = (cur + " " + word).trim(); }
  if (cur) lines.push(cur);
  return lines;
}

function agentLine(a) {
  if (a.status === "working") return `Estoy trabajando en: ${a.task ?? "(sin detalle)"}.`;
  if (a.status === "blocked") return `Estoy bloqueado${a.task ? ": " + a.task : ""}.`;
  return "Ahora mismo estoy libre. ¿Necesitas algo?";
}
function talk(a) {
  selectedId = a.id;
  dialog = { name: `${a.name} · ${a.role}`, text: agentLine(a), shown: 0 };
  showPanel(a); markRoster();
}
function showPanel(a) {
  document.getElementById("p-name").textContent = a.name;
  document.getElementById("p-role").textContent = a.role;
  const label = { working: "Trabajando", idle: "Libre", blocked: "Bloqueado" }[a.status];
  document.getElementById("p-state").innerHTML = `<div><span class="dot ${a.status}"></span><b>Estado:</b> ${label}</div><div><b>Tarea actual:</b> ${a.task ? esc(a.task) : "—"}</div>`;
}
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function markRoster() { document.querySelectorAll("#roster button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === selectedId))); }

const keys = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
const held = [];
addEventListener("keydown", (e) => {
  if (e.key in keys) { e.preventDefault(); if (!held.includes(keys[e.key])) held.push(keys[e.key]); }
  if (["z", "Z", "Enter", " "].includes(e.key)) { e.preventDefault(); interact(); }
});
addEventListener("keyup", (e) => { const i = held.indexOf(keys[e.key]); if (i >= 0) held.splice(i, 1); });
function interact() {
  if (dialog && dialog.shown < dialog.text.length) { dialog.shown = dialog.text.length; return; }
  if (dialog) { dialog = null; return; }
  const a = current?.facingAgent(); if (a) talk(a);
}
document.getElementById("act").addEventListener("click", interact);
document.querySelectorAll("#pad [data-dir]").forEach((b) => {
  const d = b.dataset.dir;
  b.addEventListener("pointerdown", () => held.push(d));
  const up = () => { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); };
  b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up);
});
canvas.addEventListener("click", (e) => {
  if (!current) return;
  const r = canvas.getBoundingClientRect();
  const tx = Math.floor(((e.clientX - r.left) / r.width) * map.width), ty = Math.floor(((e.clientY - r.top) / r.height) * map.height);
  const a = current.agentAt(tx, ty) ?? current.agentAt(tx, ty + 1);
  if (a) talk(a);
});

let last = performance.now();
setInterval(() => {
  const now = performance.now(), dt = Math.min(now - last, 100); last = now;
  if (!current) return;
  if (!dialog && held.length) current.movePlayer(held[held.length - 1]);
  current.update(dt);
  if (dialog) dialog.shown += dt / 25;
}, 16);

function buildRoster(agents) {
  const ul = document.getElementById("roster"); ul.innerHTML = "";
  for (const a of agents) {
    const li = document.createElement("li"); const b = document.createElement("button");
    b.dataset.id = a.id; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="dot ${a.status}"></span>${esc(a.name)} — ${esc(a.role)}`;
    b.addEventListener("click", () => { selectedId = a.id; showPanel(a); markRoster(); });
    li.append(b); ul.append(li);
  }
}

async function sync() {
  try {
    const res = await fetch("/api/office/agents", { cache: "no-store" });
    const snap = await res.json();
    const demo = document.getElementById("demo");
    demo.hidden = snap.source !== "demo"; demo.textContent = snap.note;
    if (!current) { current = new OfficeWorld(map, snap.agents); buildRoster(snap.agents); }
    else for (const s of snap.agents) { const a = current.agents.find((x) => x.id === s.id); if (a && (a.status !== s.status || a.task !== s.task)) current.setStatus(s.id, s.status, s.task); }
    const working = snap.agents.filter((a) => a.status === "working").length;
    document.getElementById("summary").textContent = `${snap.agents.length} agentes · ${working} trabajando`;
  } catch {
    document.getElementById("summary").textContent = "sin conexión con la API";
  }
}
sync(); setInterval(sync, 5000);
requestAnimationFrame(render);
