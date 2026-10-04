# Matriz de estado y evidencia — AI Commerce OS

Etiquetas: **IMPLEMENTADO** (codigo + prueba reproducible), **PARCIAL**
(funciona pero incompleto — se describe el limite), **DISEÑADO**
(especificado, sin implementacion funcional), **BLOQUEADO** (depende de algo
externo ausente), **DESCONOCIDO** (no inspeccionado / sin evidencia).

Ultima actualizacion: 2026-09-26 (Milestone 0 + parte de Milestone 2).

## Linea base

Confirmado por inspeccion directa del repositorio al iniciar esta sesion: no
existia ningun commit ni archivo (`git log` sin historial, directorio de
trabajo vacio salvo `.git/`). El documento maestro pegado por Jean era, en
efecto, el unico artefacto existente. Todo lo listado abajo como IMPLEMENTADO
fue creado en esta sesion.

## Subsistemas

| Area | Estado | Evidencia / limite |
|---|---|---|
| Repositorio reproducible (Milestone 0) | **IMPLEMENTADO** | `package.json`, `tsconfig.json`, `npm install && npm run typecheck && npm test` corren limpio desde cero. |
| Config tipada y validada | **IMPLEMENTADO** | `src/config/index.ts` + `src/config/index.test.ts` (5 tests). Perfil por defecto `offline`; nunca expone valores crudos de secretos (probado explicitamente). |
| PermissionManager (deny-by-default) | **IMPLEMENTADO** | `src/control-plane/permissions.ts` + tests (3 tests). Sin regla explicita → denegado; probado que lectura no implica escritura. |
| BudgetGuard (reserva atomica) | **IMPLEMENTADO** | `src/control-plane/budget.ts` + tests (7 tests). Reserva/commit/release; previene doble gasto concurrente; buckets separados para inferencia vs. gasto comercial. |
| ApprovalQueue | **IMPLEMENTADO** | `src/control-plane/approvals.ts` + tests (5 tests). Ligada a hash exacto del payload; expiracion; no reejecutable tras `markExecuted`. |
| AuditLog (append-only) | **IMPLEMENTADO** | `src/control-plane/audit.ts` + tests (3 tests). Eventos inmutables (`Object.freeze`), filtrables por correlationId/resource/type. |
| AgentRegistry (allowlist) | **IMPLEMENTADO** | `src/agents/registry.ts` + tests (5 tests). Ningun agente se auto-registra; `canWrite` explicito por definicion. |
| ReadinessPreflight | **IMPLEMENTADO** | `src/control-plane/preflight.ts` + tests (5 tests). Estados READY/BLOCKED/DEGRADED con razones estructuradas segun perfil y configuracion real. |
| Oficina de agentes (UI pixel 2D estilo Pokémon) | **PARCIAL** | `src/office/` (`world.ts`, `roster.ts`, `server.ts` + tests) y `public/office/`. Mapa por tiles, movimiento en rejilla, pathfinding, jugador con WASD, dialogos. Servidor solo GET en 127.0.0.1 (`npm run office`). Limite: los datos de agentes son una **DEMO** etiquetada (`source: "demo"`); no hay orquestador conectado, el estado no es real. El canvas se verifico manualmente con captura de navegador, sin prueba automatizada. |
| Company Constitution como politica ejecutable | **DISEÑADO** | Descrita en el plan maestro; aun no hay modulo que cargue/versiones politicas desde configuracion. No confundir con este documento, que es narrativa. |
| Company Brain / memoria persistente | **DISEÑADO** | Sin esquema, sin persistencia, sin codigo. |
| AI CEO / orquestador (loop OBSERVE→...→LEARN) | **DISEÑADO** | Sin implementacion. Los primitivos de Control Plane de arriba son la base que el orquestador debera usar. |
| Model Router / proveedor de inferencia | **BLOQUEADO** | Sin credencial de modelo configurada en este entorno (`AICOS_MODEL_API_KEY` vacio por defecto). Falta: que Jean provea un proveedor y credencial autorizados, o confirme cual usar. |
| Adapter Shopify (lectura) | **BLOQUEADO** | Sin credencial de tienda (`SHOPIFY_SHOP_DOMAIN` / `SHOPIFY_ACCESS_TOKEN` vacios). Falta: acceso confirmado a una tienda (dev/sandbox o real) y scopes concretos. Disponibilidad de MCP de Shopify en este entorno: DESCONOCIDA hasta probarla con credencial real. |
| CEO Console (UI + backend HTTP) | **DISEÑADO** | Sin backend HTTP, sin UI. Depende de que exista el orquestador (bloqueado arriba, parte no-bloqueada aun no iniciada). |
| Scheduler / recuperacion tras reinicio | **DISEÑADO** | Sin implementacion. |
| Rollback / compensacion | **DISEÑADO** | Sin implementacion; ningun endpoint de escritura existe todavia que requiera rollback. |
| Agent Evolution Engine | **DISEÑADO** | Fase avanzada explicita en el plan; no iniciada. |
| Acceso movil / Dispatch | **DESCONOCIDO** | No verificado en este entorno; el plan mismo marca su disponibilidad como a comprobar. |
| MCP disponibles en este entorno | **PARCIAL** | Este entorno de ejecucion (Claude Code en contenedor cloud) expone un MCP `Shopify` y otros (`Adobe_for_creativity`, `Cloudflare_Developer_Platform`, `Jam`) a nivel de sesion de agente, distintos del stack de la aplicacion en `src/`. Su uso desde la aplicacion (no desde la sesion del agente) sigue sin implementar y sigue BLOQUEADO sin credenciales de tienda propias. |

## Pruebas ejecutadas como evidencia

```
npm run typecheck   → sin errores
npm test            → 11 archivos de prueba, 50 pruebas, todas en verde
```

Ninguna de estas pruebas realiza llamadas de red: son pruebas unitarias
deterministas sobre logica pura, consistente con el perfil `offline` por
defecto.

## Bloqueos concretos y que se necesita para desbloquear

1. **Modelo de inferencia real:** Jean debe indicar que proveedor autorizar
   (por ejemplo, API de Anthropic) y proveer la credencial fuera de este
   repositorio (variable de entorno local, nunca commiteada). Sin esto,
   Milestone 4 permanece bloqueado; el resto del MVP puede seguir avanzando.
2. **Tienda Shopify (dev/sandbox o real):** Jean debe confirmar si existe una
   tienda de desarrollo disponible y proveer un access token con scopes de
   solo lectura para iniciar (Milestone 5). Sin esto, el adapter de Shopify no
   puede probarse contra datos reales; solo puede avanzar con fixtures
   explicitamente rotulados como simulados.
3. **Decision de stack para persistencia (Company Brain):** este repo usa
   TypeScript/Node; falta decidir motor de base de datos local (SQLite es el
   default sugerido en `.env.example`, pendiente de confirmar).

## Siguiente paso

Continuar Milestone 2 (Control Plane): integrar los primitivos ya
implementados en un unico punto de autorizacion ("una sola puerta") que
combine permisos + presupuesto + aprobacion + auditoria por llamada externa
simulada, y agregar las pruebas negativas de la matriz allow/deny descritas en
el plan maestro. Luego iniciar Milestone 3 (Brain + ciclo del CEO) en modo
dry-run, sin esperar la credencial de modelo.
