# AI Commerce OS

Sistema de operaciones de comercio electronico asistido por IA. Este repositorio
es la implementacion real del plan descrito en
`docs/AI_COMMERCE_OS_MASTER_PLAN.md` (documento maestro y unica fuente de
requisitos hasta que se acuerde otra).

**Estado actual:** Milestone 0 completado; Milestone 2 (Control Plane) en progreso
parcial. Ver `STATUS.md` para la matriz de evidencia completa por subsistema.

## Que es esto hoy

Un backend en TypeScript con los primitivos de gobernanza del Control Plane
(permisos deny-by-default, presupuesto atomico, cola de aprobaciones, registro
de agentes, auditoria append-only y preflight de estado) implementados y
probados con pruebas deterministas que no requieren red ni credenciales.

No hay todavia: Company Brain persistente, AI CEO/orquestador, adapter de
Shopify, CEO Console, ni conexion a un proveedor de modelo real. Esas piezas
estan DISEÑADAS en el plan maestro pero NO IMPLEMENTADAS aqui. No lo son hasta
que exista codigo inspeccionable y pruebas reproducibles que lo demuestren.

## Requisitos

- Node.js >= 20
- npm

## Instalacion y uso local

```bash
npm install
npm run typecheck   # compila sin emitir, valida tipos
npm test            # corre toda la suite de pruebas (vitest)
npm run build       # compila a dist/
```

No se necesita ninguna credencial para instalar, compilar ni correr la suite
de pruebas: todo el codigo actual es logica pura, sin llamadas de red.

## Configuracion

Copia `.env.example` a `.env` y ajusta valores localmente. `.env` nunca se
commitea (ver `.gitignore`). El perfil por defecto es `offline`: en ese modo
no se realiza ninguna llamada externa. Los perfiles `sandbox` y `live`
requieren credenciales de modelo y, en el caso de `live`, tambien de Shopify;
sin ellas, `computePreflight()` reporta el estado `BLOCKED` con la razon
exacta (ver `src/control-plane/preflight.ts`).

## Estructura

```
src/
  config/            Carga y validacion tipada de configuracion (perfiles, secretos ausentes)
  control-plane/      Permisos, presupuesto, aprobaciones, auditoria, preflight
  agents/             Registro de agentes (allowlist)
```

Cada modulo tiene su archivo `*.test.ts` junto al codigo que prueba.

## Como se verifica cada afirmacion

Este proyecto sigue las etiquetas de evidencia definidas en el plan maestro:
IMPLEMENTADO, PARCIAL, DISEÑADO, BLOQUEADO, DESCONOCIDO. Ver `STATUS.md` para
el detalle por subsistema, con el archivo/comando que demuestra cada estado.

## Kill switch

Aun no existe un proceso de larga duracion que detener (no hay servidor, CEO
Console ni scheduler implementados todavia), por lo que el kill switch descrito
en el plan maestro sigue DISEÑADO, no IMPLEMENTADO.
