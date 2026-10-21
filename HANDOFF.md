# Handoff — entrada rápida

Este archivo orienta. No reemplaza la gobernanza: si hay conflicto, manda
`AGENTS.md` y luego los documentos canónicos en el orden que fija ese archivo.

## 1. Qué es este producto

Aplicación interna para profesionales que prestan asesoría de protección de
datos personales en Chile, sector privado.

- **No** es un sitio de marketing ni un portal legal genérico.
- **No** interpreta ni actualiza la ley por su cuenta.
- **Stage 1 (actual)**: manual operativo navegable, caracterización y guías de
  ejecución construidas sobre definiciones canónicas.
- **Stage 2 (futura)**: roadmap persistente por cliente con evidencia,
  documentos, historial y ejecución auditable. No está implementado.

La UI está en español. Las claves técnicas y semánticas están en inglés y son
estables.

## 2. Estado verificado

- Dominios importados: D01-D06 (`content/domains/d01.ts` … `d06.ts`).
- D07-D12: **no importados**. No inventarlos.
- Actividades canónicas: **61**.
- Protocolos guiados: **54**.
- D1 (20), D2 (12), D3 (6), D4 (9) y D5 (7) cerrados: 54/54 execution-ready y
  product-ready.
- D6 (7): canon importado, **0 protocolos**; captura local Punto 0 existe.
- Referencias canónicas pendientes: `risk.mpi_sync`, `mpi.diffusion`.
- No hay backend, autenticación real, Stage 2, IA ni persistencia fuera del
  navegador.

Detalle completo y por dominio: `docs/IMPLEMENTATION_STATUS.md`.

## 3. Arranque

```bash
npm ci
npm run dev
```

- App: `http://127.0.0.1:5173`
- Login local demo: `pablo` / `admin123` (también `carlos`, `mario`).
- El repo es público. Esas credenciales son semillas demo, no seguridad; no
  reutilizarlas.

Verificación:

```bash
npm test -- --run
npm run build
npm run content:check
```

`npm run test:e2e` existe pero está obsoleto desde el cambio de acceso asesor.
No lo uses como gate ni lo interpretes como regresión funcional. Detalle en
`docs/KNOWN_ISSUES.md`.

## 4. Cómo cargar contexto (protocolo para opencode)

1. Lee este archivo completo.
2. Lee `AGENTS.md` (se carga solo, pero confirma sus reglas).
3. Lee `docs/IMPLEMENTATION_STATUS.md`.
4. Lee `docs/IMPLEMENTATION_PLAYBOOK.md`.
5. Carga solo el documento canónico que la tarea exija. No precargues D01-D12
   juntos; no cargues todo `docs/` “por si acaso”.
6. Activa la skill que corresponda:
   - `domain-implementation` — implementar un dominio aprobado;
   - `guided-protocol` — nodos, facts, outcomes y guards;
   - `integrity-check` — integridad referencial y regresiones;
   - `ui-quality` — revisión visual Stage 1.
7. Para cambios sustantivos, usa el subagente read-only `reviewer`.

Las skills viven en `.opencode/skills/` y el reviewer en
`.opencode/agents/reviewer.md`; ambos están versionados.

## 5. Dónde está la verdad

```text
content/domains/*.ts   definición canónica (fuente de verdad)
content/protocols/*.ts protocolos guiados + registry
docs/domains/*.md      proyección GENERADA (no editar a mano)
src/                   aplicación; consume el canon, no lo duplica
docs/*.md              gobernanza, contratos, arquitectura, estado
site/                  sitio público NexoDPO; independiente de la app
```

Regenerar documentación de dominio:

```bash
npm run content:docs
npm run content:check   # falla si docs/domains no coincide con el canon
```

## 6. Reglas duras

- No inventar derecho chileno ni obligaciones nuevas.
- No modificar contenido legal aprobado sin autorización explícita.
- No editar `docs/domains/*.md` a mano.
- No modificar `AGENTS.md`, `docs/PROJECT_CANON.md`, `docs/DATA_CONTRACTS.md`,
  `docs/DECISIONS.md`, `docs/PRODUCT_ARCHITECTURE.md` ni
  `docs/UX_PRINCIPLES.md` sin instrucción de gobernanza.
- `unknown != false`; lo no respondido nunca se convierte en negativo.
- Aplicabilidad (`conditions_applicability`) no es dependencia
  (`activity_dependencies`).
- Definición de actividad no es instancia de cliente (Stage 1 vs Stage 2).
- No añadir dependencias, MCP, servicios externos ni funcionalidad falsa.
- No commitear salvo pedido explícito; no reescribir historial.

## 7. Deuda conocida

Ver `docs/KNOWN_ISSUES.md`. Resumen:

- e2e obsoleto tras el acceso asesor (helpers y rutas sin sesión).
- Credenciales demo públicas (asumido, documentado).
- `site/llms.txt` apunta a `/roadmapdpo/`, pero Vite compila con base `/`.
- D6 sin protocolos; D7-D12 ausentes; 2 refs canónicas pendientes.
- Sin backend/auth/Stage 2.

## 8. Cómo se trabaja

Sigue `docs/IMPLEMENTATION_PLAYBOOK.md`:

estado → alcance → skills → implementar → verificar → reviewer → corregir
BLOCKER/MAJOR → doc sync gate → commit solo si se pidió → parar.

Una iteración = un alcance acotado. Al cerrar informa archivos, decisiones,
verificación, deuda y termina con una de estas frases:

```text
documentation sync: not required
documentation sync: completed
documentation sync: pending authorization
```

## 9. Próximo paso candidato

No iniciar sin instrucción. Candidatos ya identificados:

1. Realineación de e2e con el acceso asesor (helper único login + empresa).
2. D6 guided retrofit (D6.01-D6.07).
3. Importación de D07-D12 cuando el contenido aprobado esté disponible.

## 10. Primera tarea del nuevo contexto

```text
Onboarding. No implementes nada todavía.

Lee: HANDOFF.md, AGENTS.md, docs/IMPLEMENTATION_STATUS.md y
docs/IMPLEMENTATION_PLAYBOOK.md.

Responde en <=10 líneas:
1. qué es el producto y qué NO es;
2. estado real (dominios, actividades, protocolos, pendientes);
3. comandos de verificación;
4. qué está roto o desincronizado hoy;
5. próxima iteración acotada que propondrías.

No edites archivos ni inventes contenido legal. Espera aprobación.
```
