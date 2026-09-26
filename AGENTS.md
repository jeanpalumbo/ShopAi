# AGENTS.md — Convenciones para agentes de codigo en este repositorio

Este archivo orienta a cualquier agente (humano o modelo) que trabaje en este
repo. No define agentes operativos de negocio (esos viven en `src/agents/`);
define como contribuir codigo aqui de forma consistente con el plan maestro.

## Reglas no negociables

1. **Evidencia antes que afirmaciones.** No marques nada como IMPLEMENTADO en
   `STATUS.md` sin una prueba reproducible (`npm test`) que lo demuestre.
2. **Denegar por defecto.** Cualquier capacidad nueva de escritura externa debe
   pasar por `PermissionManager`, `BudgetGuard` y, si es de alto impacto, por
   `ApprovalQueue`, antes de ejecutar. No añadas atajos que la salteen.
3. **Sin secretos en el repo ni en logs.** Nunca commitees `.env`, tokens ni
   claves. `src/config/index.ts` solo expone booleanos de "configurado", no
   valores crudos; mantiene ese contrato en cualquier extension.
4. **Sin simulaciones presentadas como reales.** Si una integracion (modelo,
   Shopify, MCP) no tiene credencial verificada, su estado es BLOQUEADO, no un
   mock disfrazado de dato real.
5. **Auditoria append-only.** No se borran ni sobrescriben eventos de
   `AuditLog`; las correcciones son eventos nuevos que referencian al anterior.
6. **Cada modulo nuevo trae su test.** Un archivo `foo.ts` sin `foo.test.ts`
   correspondiente no se considera terminado.

## Como correr la suite

```bash
npm install
npm run typecheck
npm test
```

## Orden de trabajo

Sigue el orden de milestones de `AI_COMMERCE_OS_MASTER_PLAN.md` (si esta
presente en el repo) o el registrado en `STATUS.md`. No saltes un milestone
sin cumplir su criterio de salida. Si una pieza depende de una credencial
externa ausente, implementa igual toda la parte independiente y documenta el
bloqueo exacto en `STATUS.md` (que dato falta, quien debe proveerlo).

## Estilo de codigo

- TypeScript estricto (`strict: true` en `tsconfig.json`); no introducir `any`
  sin justificacion explicita en un comentario.
- Sin comentarios que expliquen el "que" cuando el nombre ya lo dice; solo
  comentarios que expliquen un invariante o restriccion no obvia.
- Clases de error especificas por modulo (`ConfigError`, `BudgetError`, etc.),
  no `Error` genérico, para que las pruebas puedan distinguir el tipo de fallo.
