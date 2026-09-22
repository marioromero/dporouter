import type { ActivityDefinition } from "../src/types";
import type { CanonicalSource } from "../content/sources";

/**
 * Render determinista de la proyección humana de un dominio canónico.
 * Salida byte a byte estable: misma entrada, mismo documento.
 * Usado por `npm run content:docs` y por el test de sincronización.
 */
export function renderD01(
  activities: ActivityDefinition[],
  sources: CanonicalSource[],
  pendingCrossDomain: string[],
): string {
  const L: string[] = [];
  L.push("<!-- GENERATED — do not edit directly. Canonical source: content/domains/d01.ts. Regenerate: npm run content:docs -->");
  L.push("# D01 — Gobernanza, accountability, DPO y MPI");
  L.push("");
  L.push("Estado: CANÓNICO CONGELADO");
  L.push("Baseline: Functional v1.0");
  L.push("Última revisión legal: 2026-09-21");
  L.push("");
  L.push("## Dominio");
  L.push("");
  L.push("`domain_key`: `d1`");
  L.push("`human_code`: `D1`");
  L.push("`name`: Gobernanza, accountability, DPO y MPI");
  L.push("");
  L.push("### Objetivo");
  L.push("");
  L.push(
    "Establecer y mantener el marco de gobernanza, prevención, DPO y Modelo de Prevención de Infracciones del responsable, asegurando que las decisiones, designaciones, facultades, recursos, estados y mecanismos de supervisión permanezcan formalizados, trazables y operativos.",
  );
  L.push("");
  L.push("### Descripción");
  L.push("");
  L.push(
    "Este dominio gobierna la prevención general de infracciones, la evaluación y ciclo de vida del DPO, la decisión de adoptar un Modelo de Prevención de Infracciones, sus componentes organizativos y su eventual certificación. Coordina actividades especializadas de otros dominios sin duplicarlas.",
  );
  L.push("");
  L.push("`related_domain_keys`: `[]`");
  L.push("");
  L.push("## Estado temporal de la normativa");
  L.push("");
  L.push(
    "La Ley N° 21.719 está promulgada con entrada en vigencia diferida al 2026-12-01. El Decreto N° 662 está publicado (2026-09-09). Las actividades de este dominio conservan `regulatory_status = transitional` hasta una futura actualización controlada.",
  );
  L.push("");
  L.push("## Fuentes canónicas");
  L.push("");
  for (const s of sources) {
    L.push(`### ${s.source_id}`);
    L.push("");
    L.push(`Nombre: ${s.name}`);
    L.push(`Tipo: ${s.kind}`);
    L.push(`Estado: ${s.regulatory_status}`);
    if (s.published_at) L.push(`Publicación: ${s.published_at}`);
    L.push(`Última revisión: ${s.last_review}`);
    L.push(`Nota: ${s.note}`);
    L.push("Provisiones utilizadas:");
    for (const p of s.provisions_used) L.push(`* ${p}`);
    L.push("");
  }
  L.push("## Actividades (20)");
  L.push("");
  for (const a of activities) {
    L.push(`### ${a.human_code} — ${a.name}`);
    L.push("");
    L.push(`activity_key: \`${a.activity_key}\``);
    L.push(`human_code: \`${a.human_code}\``);
    L.push(`activity_type: \`${a.activity_type}\``);
    L.push(`evidence_basis: \`${a.evidence_basis}\``);
    L.push(`regulatory_status: \`${a.regulatory_status}\``);
    L.push(`last_legal_review: \`${a.last_legal_review}\``);
    L.push(`reasoning_record_required: \`${a.reasoning_record_required}\``);
    L.push(`applicable_role: \`${a.applicable_role.join(", ")}\``);
    L.push("");
    L.push(`Objetivo: ${a.objective}`);
    L.push("");
    L.push(`Pregunta gatillo: ${a.trigger_question}`);
    L.push("");
    L.push("Interlocutores:");
    for (const x of a.interlocutors) L.push(`* ${x}`);
    L.push("Métodos de levantamiento:");
    for (const x of a.data_collection_methods) L.push(`* ${x}`);
    L.push("Pasos operacionales:");
    a.steps_operational.forEach((x, i) => L.push(`${i + 1}. ${x}`));
    L.push("Evidencia requerida:");
    for (const x of a.evidence_required) L.push(`* ${x}`);
    L.push(`Entregable: ${a.deliverable}`);
    L.push(`Tiempo estimado: ${a.estimated_time}`);
    L.push(`Complejidad: ${a.complexity}`);
    L.push("Fundamento legal:");
    for (const b of a.legal_basis)
      L.push(`* ${b.source_id} — ${b.article_or_provision}`);
    L.push("Condiciones de aplicabilidad:");
    for (const x of a.conditions_applicability) L.push(`* \`${x}\``);
    L.push("Efectos de estado:");
    for (const x of a.state_effect) L.push(`* \`${x}\``);
    L.push("Efectos de relación:");
    if (a.relationship_effect.length === 0) L.push("* `[]`");
    for (const x of a.relationship_effect) L.push(`* \`${x}\``);
    L.push("Dependencias:");
    if (a.activity_dependencies.length === 0) L.push("* `[]`");
    for (const d of a.activity_dependencies) {
      L.push(
        `* target: \`${d.target_activity_key}\` · scope: \`${d.scope}\` · type: \`${d.type}\``,
      );
      L.push(`  condition: ${d.condition}`);
      L.push(`  rationale: ${d.rationale}`);
    }
    L.push("");
  }
  L.push("## Dependencias cross-domain pendientes de importar");
  L.push("");
  for (const k of pendingCrossDomain)
    L.push(`* \`${k}\` — Referencia canónica pendiente de importar`);
  L.push("");
  L.push("## Nota de congelamiento");
  L.push("");
  L.push(
    "D1 está congelado salvo revisión controlada. No inventar, completar ni reinterpretar su contenido jurídico. La aplicación consume la representación estructurada; este documento es la especificación humana canónica.",
  );
  L.push("");
  return L.join("\n");
}
