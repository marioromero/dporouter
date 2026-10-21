# Known Issues / Deuda técnica

Estado al preparar el handoff. No es una lista de deseos: son problemas
verificables en el repositorio.

## 1. E2E obsoleto desde el acceso asesor

**Severidad:** alta para confianza en la suite; no afecta la app en sí.

La suite `e2e/` (10 archivos, 143 tests) no se actualizó cuando se introdujo el
login de asesor y la empresa obligatoria (commit `2326287`).

Evidencia:

- `grep` sobre `e2e/` no encuentra referencias a login, usuario ni clave.
- Cinco helpers siguen usando etiquetas que ya no existen:
  `Nombre del perfil local` y `Crear perfil`.
- Decenas de tests navegan directo a `/actividad`, `/trabajo` o `/diagnostico`
  sin sesión ni empresa; `RequireCompany` los bloquea.
- Comprobado 2026-10-21: `e2e/workspace.spec.ts --project=desktop` falla
  11/11; el primer error es el timeout esperando `Nombre del perfil local`.

Consecuencia: `npm run test:e2e` no es un gate confiable y no debe usarse para
declarar una regresión funcional. El gate actual es:

```bash
npm test -- --run
npm run build
npm run content:check
```

Reproducir:

```bash
npx playwright install
npm run test:e2e
```

Trabajo pendiente (iteración separada, no mezclar con features):

1. Helper único de sesión: login `pablo` / `admin123` y creación/selección de
   empresa.
2. Reemplazar helpers locales duplicados en `batchd1`, `batchd2`, `conflictos`,
   `d103` y `workspace`.
3. Definir una fixture para tests que navegan sin pasar por `/empresa`.
4. Actualizar expectativas que dependían de perfiles libres.

## 2. Credenciales demo públicas

**Severidad:** asumida y documentada.

`src/data/advisors.ts` contiene `pablo`, `carlos`, `mario` con clave
`admin123`. El repositorio es público y esas credenciales están en el
historial.

No es una vulnerabilidad de producción porque no existe autenticación real ni
servidor: es una puerta local demostrativa. Reglas:

- no reutilizar esas claves en ningún entorno real;
- no presentar el login como seguridad;
- si se implementa auth real, reemplazar la nómina y actualizar este documento.

## 3. Base de despliegue del sitio vs aplicación

**Severidad:** media solo si se publica la app bajo `/roadmapdpo/`.

`site/llms.txt` y `site/sitemap.xml` referencian
`https://nexodpo.cl/roadmapdpo/`, pero `vite.config.ts` no define `base`, por lo
que el build genera rutas de assets bajo `/`.

Si la app se sirve en una subruta, hay que configurar `base` y el fallback de
router; si se sirve en la raíz, corregir la referencia del sitio. No se cambió
en este handoff porque afecta despliegue y no fue solicitado.

## 4. Cobertura incompleta de dominios

**Severidad:** funcional esperada, no error.

- D01–D06 importados: 61 actividades canónicas.
- D01–D05 con protocolos: 54.
- D06: 7 actividades canónicas, 0 protocolos.
- D07–D12: no importados. No inventarlos.
- Referencias canónicas pendientes: `risk.mpi_sync`, `mpi.diffusion`.

Detalle por dominio en `docs/IMPLEMENTATION_STATUS.md`.

## 5. Límites de Stage 1

**Severidad:** por diseño.

- Sin backend ni persistencia fuera del navegador.
- Sin autenticación real, cifrado ni multiusuario.
- Sin Stage 2: clientes reales, plazos, evidencia productiva, historial,
  documentos generados, auditoría.
- Sin IA.

No implementar estas capacidades como efecto lateral de otra tarea.

## 6. Documentación de dominio generada

`docs/domains/*.md` se genera desde `content/domains/*.ts`.

- Editarlo a mano es un error.
- `npm run content:check` falla si está desincronizado.
- Para cambiar contenido: autorización explícita, editar el `.ts` canónico,
  regenerar y validar.
