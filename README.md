# Chile Privacy Operations

Aplicación interna para operar trabajo profesional de protección de datos
personales en el sector privado chileno.

No es un sitio de marketing ni un portal legal genérico. El producto tiene dos
etapas:

1. **Stage 1**: manual operativo navegable, caracterización y guías de
   ejecución sobre definiciones canónicas (estado actual).
2. **Stage 2**: roadmap persistente por cliente con evidencia, documentos,
   historial y ejecución auditable (no implementado).

## Empezar

Requisitos: Node.js 20 o superior (probado con 24.8.0) y npm.

```bash
npm ci
npm run dev          # http://127.0.0.1:5173
```

Acceso local demostrativo: usuarios `pablo`, `carlos`, `mario`; clave
`admin123`. No es autenticación real ni Stage 2; las credenciales son públicas
y no deben reutilizarse.

Comandos de verificación:

```bash
npm test -- --run      # suite unitaria (gate confiable)
npm run build          # tsc --noEmit + vite build
npm run content:check  # docs de dominio sincronizados con content/domains
npx playwright install # una vez, para e2e
npm run test:e2e       # obsoleto desde el acceso asesor; ver docs/KNOWN_ISSUES.md
```

## Documentación

Lee en este orden:

1. `HANDOFF.md` — entrada corta: estado, límites, deuda y forma de trabajo.
2. `AGENTS.md` — gobernanza obligatoria y autoridad.
3. `docs/IMPLEMENTATION_STATUS.md` — estado real por dominio y readiness.
4. `docs/IMPLEMENTATION_PLAYBOOK.md` — procedimiento de cada iteración.

Documentos de referencia:

- `docs/PROJECT_CANON.md` — canon del producto.
- `docs/DATA_CONTRACTS.md` — contratos de datos y ejecución.
- `docs/DECISIONS.md` — decisiones aceptadas (ADR).
- `docs/PRODUCT_ARCHITECTURE.md` y `docs/PRODUCT_UX_CONTRACT.md`.
- `docs/USER_GUIDE.md` — uso nivel asesor.
- `docs/SITE_MAP.md` — rutas y puertas de acceso.
- `docs/KNOWN_ISSUES.md` — deuda técnica y fallos conocidos.

## Estructura

```text
content/domains/     definiciones canónicas D01-D06 (fuente de verdad)
content/protocols/   protocolos guiados registrados
docs/domains/        proyección generada (no editar a mano)
src/                 aplicación React (consume el canon, no lo copia)
tests/               suite unitaria
e2e/                 Playwright (obsoleto, ver KNOWN_ISSUES)
tools/               generador de documentación de dominio
site/                sitio público NexoDPO (independiente de la app)
```

## Regla de contenido

`content/domains/*.ts` es la fuente canónica. `docs/domains/*.md` se genera con
`npm run content:docs` y nunca se edita directamente. No se inventan
obligaciones legales ni se modifica contenido aprobado sin autorización
explícita.

Este repositorio no es autoridad para interpretar o actualizar la ley chilena.
