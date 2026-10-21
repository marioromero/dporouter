# Guía de uso — Etapa 1

Esta guía explica cómo usar la aplicación como asesor. No describe
arquitectura ni contratos internos; para eso ver `HANDOFF.md` y `docs/`.

## 1. Alcance

La aplicación es un asistente operativo local para revisar actividades de
protección de datos por empresa.

- Todo el trabajo vive en el navegador (`localStorage`), en este equipo.
- No hay servidor, autenticación real ni sincronización entre equipos.
- No es Stage 2: no administra clientes reales, plazos, evidencia productiva
  ni historial auditable.
- El estado “Revisado” significa avance de revisión, nunca “cumple”.

## 2. Acceso

La aplicación usa una nómina fija de asesores para ordenar el hilo de trabajo.

| Usuario | Clave | Nombre |
|---|---|---|
| `pablo` | `admin123` | Pablo |
| `carlos` | `admin123` | Carlos |
| `mario` | `admin123` | Mario |

Advertencia: es un acceso local demostrativo. Las credenciales son públicas y
no protegen información. No usar datos personales reales de clientes.

Pasos:

1. Abrir **Empresa**.
2. Ingresar usuario y contraseña.
3. La sesión queda activa en este navegador hasta “Cerrar sesión”.

Sin sesión, las vistas de trabajo quedan bloqueadas; Inicio, Buscar, Glosario
y Referencias siguen abiertas.

## 3. Empresa

Cada empresa pertenece al asesor que la crea.

- **Crear empresa**: escribir el nombre y usar “Crear empresa”.
- **Seleccionar empresa**: desplegable “Empresa activa”.
- **Agregar otra empresa**: campo “Asociar otra empresa” y “Agregar empresa”.
- **Continuar donde quedaste**: enlace al último lugar visitado.
- **Siguiente revisión sugerida**: actividad pendiente con información real.
- **Cerrar sesión**: botón al pie del panel.

## 4. Trabajo

**Trabajo** es la entrada principal a los doce ámbitos operativos.

- **Resumen**: tabla con dominio, estado, revisadas y siguiente actividad.
- **Lista**: dominios con avance y acceso directo.

Al abrir un dominio se listan sus actividades. Cada actividad muestra:

- código y nombre;
- estado para la empresa activa;
- acción principal (abrir la guía, si existe);
- objetivo y pregunta de partida;
- cuándo aplica;
- resultado actual, evidencia y entrega;
- trazabilidad jurídica y estado regulatorio.

Estados de trabajo:

| Estado | Significado |
|---|---|
| No iniciado | sin trabajo registrado |
| En revisión | trabajo en curso |
| Revisado | revisión terminada (no es cumplimiento) |
| No aplica | descartada para esta empresa |
| Bloqueado | no se puede avanzar sin algo externo |

Los estados describen avance, no un veredicto jurídico.

## 5. Guías de ejecución

Cada actividad puede tener una guía operativa. La guía:

- presenta nodos con preguntas o verificaciones;
- conserva respuestas por empresa, tratamiento o finalidad según el caso;
- permite volver a nodos anteriores;
- muestra el resultado y el siguiente paso;
- puede exigir un juicio profesional explícito antes de concluir.

Reglas útiles:

- Una respuesta desconocida no se convierte en “no”.
- Un hecho en conflicto bloquea conclusiones definitivas hasta resolverlo.
- Una guía incompleta no permite marcar “Revisado”; se puede marcar
  “Bloqueado”.
- El enlace a cada actividad y nodo es directo y estable.

## 6. Diagnóstico

**Diagnóstico** reúne hechos de caracterización reutilizables por las guías.

- Muestra áreas conceptuales y hechos conocidos de la empresa.
- Permite registrar el estado del MPI cuando la opción está disponible.
- Las respuestas de las guías también alimentan esta lista.
- Las preguntas canónicas de caracterización aún no están importadas; la vista
  no las inventa.

Un hecho indica su origen. Si dos orígenes discrepan, se muestra “En conflicto”
y se requiere una decisión explícita.

## 7. Buscar, Glosario y Referencias

- **Buscar**: localiza actividades y conceptos por nombre o código.
- **Glosario**: términos jurídicos y técnicos en lenguaje simple, con ejemplo.
- **Referencias**: explica cómo se distingue el origen de cada requisito
  (norma, criterio metodológico, regulación pendiente).

Estas vistas son de consulta y no requieren empresa activa.

## 8. Respaldo: exportar e importar

En **Empresa**, con una empresa activa:

- **Exportar respaldo JSON**: descarga el estado completo de esa empresa.
- **Importar respaldo JSON**: valida el archivo y lo carga.

Reglas:

- El archivo se valida de forma estricta; si algo no calza, se rechaza entero.
- Si la empresa ya existe, se pide confirmar reemplazo.
- Al importar, la empresa queda asociada al asesor que importa.
- El respaldo es por empresa, no del workspace completo.

Exportar con frecuencia: limpiar los datos del navegador borra el trabajo local.

## 9. Límites conocidos

- Sin autenticación ni cifrado reales.
- Sin backend ni trabajo multiusuario.
- Sin Stage 2 (clientes, plazos, evidencia, historial).
- D6 tiene contenido canónico pero aún sin guías.
- D7-D12 no están importados.
- Los datos viven solo en este navegador; no usar información personal real.

Para deuda técnica y fallos conocidos: `docs/KNOWN_ISSUES.md`.
