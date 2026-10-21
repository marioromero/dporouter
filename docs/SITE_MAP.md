# Mapa del sitio — Etapa 1

Reemplaza al antiguo `mapa-del-sitio.txt` (obsoleto: describía Mapa y Dominios,
retirados por el UX Reset).

Aplicación React + `react-router-dom`. UI en español; claves semánticas estables
en inglés. Códigos visibles (`D1`, `D1.02`) son presentación, no identidad.

## 1. Navegación principal

Sidebar de escritorio; en tablet se abre como drawer.

```text
Empresa        /empresa        acceso asesor y empresas
Trabajo        /trabajo        ámbitos operativos D1-D12
Diagnóstico    /diagnostico    caracterización y hechos
Buscar         /buscar         actividades y conceptos
Glosario       /glosario       términos en lenguaje simple
Referencias    /referencias    origen y vigencia de requisitos
```

Modo visible en topbar:

- `TRABAJO` en `/trabajo` y `/actividad` (incluidas sus guías);
- `GUIADO` en `/diagnostico`.

## 2. Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Inicio | abierta |
| `/empresa` | Acceso asesor / empresas | abierta |
| `/trabajo` | Trabajo (resumen y lista) | asesor + empresa |
| `/trabajo/:domainKey` | Detalle de dominio | asesor + empresa |
| `/diagnostico` | Diagnóstico | asesor + empresa |
| `/actividad/:activityKey` | Ficha de actividad | asesor + empresa |
| `/actividad/:activityKey/guia` | Guía: nodo de entrada | asesor + empresa |
| `/actividad/:activityKey/guia/:nodeKey` | Guía: nodo directo | asesor + empresa |
| `/buscar` | Buscador | abierta |
| `/glosario` | Glosario | abierta |
| `/referencias` | Referencias | abierta |
| `*` | No encontrado | abierta |

Redirects que conservan deep links antiguos:

| Ruta antigua | Destino |
|---|---|
| `/mapa` | `/trabajo` |
| `/dominios` | `/trabajo` |
| `/dominios/:domainKey` | `/trabajo/:domainKey` |
| `/fuentes` | `/referencias` |

## 3. Puerta de acceso

`RequireCompany` protege Trabajo, Diagnóstico, Actividad y Guías.

- Sin asesor en sesión: “Se requiere sesión”, enlace a `/empresa`.
- Con asesor sin empresa: “Selecciona una empresa”.
- Las vistas de referencia no requieren sesión.

La sesión no es autenticación real: es una semilla local para ordenar el hilo
asesor → empresa. Ver `docs/DATA_CONTRACTS.md` §49 y ADR-055.

## 4. Contenido y estado

- Dominios y actividades: `content/domains/*.ts` (canónico).
- Guías: `content/protocols/*.ts` + `content/protocols/registry.ts`.
- Proyección humana: `docs/domains/*.md` (generada).
- Estado local: `localStorage`, clave `dporouter.stage1.v1`.
- Respaldo: exportar/importar JSON por empresa desde `/empresa`.

No hay backend, cuentas reales ni sincronización.

## 5. Sitio público

`site/` es el sitio marketing NexoDPO (nexodpo.cl). Es independiente de la
aplicación y no comparte build, router ni estado. No usar `site/` como
documentación del proyecto; para eso existen `HANDOFF.md` y `docs/`.
