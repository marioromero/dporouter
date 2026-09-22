import type { ActivityDefinition } from "../src/types";
import type { CanonicalSource } from "../content/sources";

/**
 * Render determinista de proyecciones humanas de dominios canónicos.
 * Salida byte a byte estable: misma entrada, mismo documento.
 * Usado por `npm run content:docs` y por los tests de sincronización.
 */
export interface DomainDocInput {
  sourceFile: string;
  title: string;
  domainKey: string;
  humanCode: string;
  name: string;
  objective: string;
  description: string;
  review: string;
  normativeNote: string;
  activities: ActivityDefinition[];
  sources: CanonicalSource[];
  pendingRefs: string[];
  provenanceNotes?: Record<string, string>;
  freezeNote: string;
}

export function renderDomainDoc(input: DomainDocInput): string {
  const L: string[] = [];
  L.push(`<!-- GENERATED — do not edit directly. Canonical source: ${input.sourceFile}. Regenerate: npm run content:docs -->`);
  L.push(input.title);
  L.push("");
  L.push("Estado: CANÓNICO CONGELADO");
  L.push("Baseline: Functional v1.0");
  L.push(`Última revisión legal: ${input.review}`);
  L.push("");
  L.push("## Dominio");
  L.push("");
  L.push(`\`domain_key\`: \`${input.domainKey}\``);
  L.push(`\`human_code\`: \`${input.humanCode}\``);
  L.push(`\`name\`: ${input.name}`);
  L.push("");
  L.push("### Objetivo");
  L.push("");
  L.push(input.objective);
  L.push("");
  L.push("### Descripción");
  L.push("");
  L.push(input.description);
  L.push("");
  L.push("`related_domain_keys`: `[]`");
  L.push("");
  L.push("## Estado temporal de la normativa");
  L.push("");
  L.push(input.normativeNote);
  L.push("");
  L.push("## Fuentes canónicas");
  L.push("");
  for (const s of input.sources) {
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
  L.push(`## Actividades (${input.activities.length})`);
  L.push("");
  for (const a of input.activities) {
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
    const note = input.provenanceNotes?.[a.activity_key];
    if (note) {
      L.push("Nota de procedencia:");
      L.push("");
      L.push(note);
    }
    L.push("");
  }
  L.push("## Dependencias cross-domain pendientes de importar");
  L.push("");
  for (const k of input.pendingRefs)
    L.push(`* \`${k}\` — Referencia canónica pendiente de importar`);
  L.push("");
  L.push("## Nota de congelamiento");
  L.push("");
  L.push(input.freezeNote);
  L.push("");
  return L.join("\n");
}

const NORMATIVE_NOTE =
  "La Ley N° 21.719 está promulgada con entrada en vigencia diferida al 2026-12-01. El Decreto N° 662 está publicado (2026-09-09). Las actividades de este dominio conservan `regulatory_status = transitional` hasta una futura actualización controlada.";

/** Proyección D01 (firma estable para el test de sincronización). */
export function renderD01(
  activities: ActivityDefinition[],
  sources: CanonicalSource[],
  pendingRefs: string[],
): string {
  return renderDomainDoc({
    sourceFile: "content/domains/d01.ts",
    title: "# D01 — Gobernanza, accountability, DPO y MPI",
    domainKey: "d1",
    humanCode: "D1",
    name: "Gobernanza, accountability, DPO y MPI",
    objective:
      "Establecer y mantener el marco de gobernanza, prevención, DPO y Modelo de Prevención de Infracciones del responsable, asegurando que las decisiones, designaciones, facultades, recursos, estados y mecanismos de supervisión permanezcan formalizados, trazables y operativos.",
    description:
      "Este dominio gobierna la prevención general de infracciones, la evaluación y ciclo de vida del DPO, la decisión de adoptar un Modelo de Prevención de Infracciones, sus componentes organizativos y su eventual certificación. Coordina actividades especializadas de otros dominios sin duplicarlas.",
    review: "2026-09-21",
    normativeNote: NORMATIVE_NOTE,
    activities,
    sources,
    pendingRefs,
    freezeNote:
      "D1 está congelado salvo revisión controlada. No inventar, completar ni reinterpretar su contenido jurídico. La aplicación consume la representación estructurada; este documento es la especificación humana canónica.",
  });
}

/** Proyección D02. */
export function renderD02(
  activities: ActivityDefinition[],
  sources: CanonicalSource[],
  pendingRefs: string[],
  provenanceNotes: Record<string, string>,
): string {
  return renderDomainDoc({
    sourceFile: "content/domains/d02.ts",
    title: "# D02 — Inventario, licitud y ciclo de vida",
    domainKey: "d2",
    humanCode: "D2",
    name: "Inventario, licitud y ciclo de vida",
    objective:
      "Mantener trazabilidad de las operaciones de tratamiento y asegurar que sus roles, finalidades, fuentes, bases de licitud, datos tratados, plazos de conservación y condiciones de calidad permanezcan definidos, justificables y actualizados durante todo su ciclo de vida.",
    description:
      "Este dominio estructura el conocimiento básico de cada tratamiento y controla su legitimidad durante el tiempo. La licitud se determina por finalidad, no de manera global para toda una base de datos. El inventario interno utilizado por la agencia es un estándar metodológico de trazabilidad y no debe presentarse como un registro universal expresamente exigido por la ley.",
    review: "2026-09-21",
    normativeNote: NORMATIVE_NOTE,
    activities,
    sources,
    pendingRefs,
    provenanceNotes,
    freezeNote:
      "D2 está congelado salvo revisión controlada. No inventar, completar ni reinterpretar su contenido jurídico. La aplicación consume la representación estructurada; este documento es la especificación humana canónica.",
  });
}
