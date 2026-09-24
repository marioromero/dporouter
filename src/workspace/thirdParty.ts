import type {
  CessionAssessment,
  ProcessorAssessment,
  SubprocessorAssessment,
  ThirdPartyRelationshipRecord,
  ThirdPartyRelationshipType,
  TriStateSignal,
} from "./types";

/**
 * Capacidades puras sobre la colección local compartida
 * `thirdPartyRelationships[]` (D6 Punto 0, ADR-054).
 *
 * Sin IO, sin mutación, sin facts, sin effects: compone y valida.
 * Reutilizado por CRUD (`locals.ts`), derivados (`derived.ts`),
 * import (`store.ts`) y futuros guards de protocolo. La escritura
 * canónica D6 sigue reservada a finalización explícita de protocolos.
 */

export const RELATIONSHIP_TYPES: readonly ThirdPartyRelationshipType[] = [
  "unknown",
  "communication",
  "cession",
  "processor",
  "subprocessor",
];

export function isRelationshipType(v: unknown): v is ThirdPartyRelationshipType {
  return (
    typeof v === "string" &&
    (RELATIONSHIP_TYPES as readonly string[]).includes(v)
  );
}

const CESSION_LAWFULNESS = ["supported", "not_supported", "unknown"] as const;
const CESSION_INSTRUMENT = ["validated", "remediation_required", "unknown"] as const;
const PROCESSOR_CONTRACT = ["validated", "remediation_required", "unknown"] as const;
const PROCESSOR_INSTRUCTIONS = ["controlled", "remediation_required", "unknown"] as const;
const PROCESSOR_OPERATIONAL = ["controlled", "remediation_required", "unknown"] as const;
const SUBPROCESSOR_AUTHORIZATION = ["controlled", "remediation_required", "unknown"] as const;
const TRI_STATE: readonly string[] = ["yes", "no", "unknown"];

function isEnum(v: unknown, allowed: readonly string[]): boolean {
  return typeof v === "string" && allowed.includes(v);
}

export function isValidCessionAssessment(v: unknown): v is CessionAssessment {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    isEnum(r.lawfulness, CESSION_LAWFULNESS) &&
    isEnum(r.instrument, CESSION_INSTRUMENT)
  );
}

export function isValidProcessorAssessment(v: unknown): v is ProcessorAssessment {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    isEnum(r.contract, PROCESSOR_CONTRACT) &&
    isEnum(r.instructions, PROCESSOR_INSTRUCTIONS) &&
    isEnum(r.operational, PROCESSOR_OPERATIONAL)
  );
}

export function isValidSubprocessorAssessment(
  v: unknown,
): v is SubprocessorAssessment {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return isEnum(r.authorization, SUBPROCESSOR_AUTHORIZATION);
}

/**
 * Compatibilidad tipo ↔ assessments ↔ parent (invariante §13).
 * No verifica existencia de refs (eso lo hace el llamador con el
 * treatment); solo forma y compatibilidad.
 */
export function relationshipInvariantIssues(
  r: ThirdPartyRelationshipRecord,
): string[] {
  const issues: string[] = [];
  const hasParent =
    r.parentRelationshipId !== undefined && r.parentRelationshipId !== "";
  switch (r.relationshipType) {
    case "unknown":
      if (r.cessionAssessment !== undefined) issues.push("unknown con cessionAssessment");
      if (r.processorAssessment !== undefined) issues.push("unknown con processorAssessment");
      if (r.subprocessorAssessment !== undefined) {
        issues.push("unknown con subprocessorAssessment");
      }
      if (hasParent) issues.push("unknown con parentRelationshipId");
      break;
    case "communication":
      if (r.cessionAssessment !== undefined) {
        issues.push("communication con cessionAssessment");
      }
      if (r.processorAssessment !== undefined) {
        issues.push("communication con processorAssessment");
      }
      if (r.subprocessorAssessment !== undefined) {
        issues.push("communication con subprocessorAssessment");
      }
      if (hasParent) issues.push("communication con parentRelationshipId");
      break;
    case "cession":
      if (r.cessionAssessment !== undefined && !isValidCessionAssessment(r.cessionAssessment)) {
        issues.push("cessionAssessment inválida");
      }
      if (r.processorAssessment !== undefined) {
        issues.push("cession con processorAssessment");
      }
      if (r.subprocessorAssessment !== undefined) {
        issues.push("cession con subprocessorAssessment");
      }
      if (hasParent) issues.push("cession con parentRelationshipId");
      break;
    case "processor":
      if (r.processorAssessment !== undefined && !isValidProcessorAssessment(r.processorAssessment)) {
        issues.push("processorAssessment inválida");
      }
      if (r.cessionAssessment !== undefined) {
        issues.push("processor con cessionAssessment");
      }
      if (r.subprocessorAssessment !== undefined) {
        issues.push("processor con subprocessorAssessment");
      }
      if (hasParent) issues.push("processor con parentRelationshipId");
      break;
    case "subprocessor":
      if (
        r.subprocessorAssessment !== undefined &&
        !isValidSubprocessorAssessment(r.subprocessorAssessment)
      ) {
        issues.push("subprocessorAssessment inválida");
      }
      if (r.cessionAssessment !== undefined) {
        issues.push("subprocessor con cessionAssessment");
      }
      if (r.processorAssessment !== undefined) {
        issues.push("subprocessor con processorAssessment");
      }
      break;
  }
  return issues;
}

/**
 * Validez del padre dentro de la colección del mismo treatment:
 * ausente = draft válido; presente debe resolver a processor o
 * subprocessor distinto de sí mismo y sin ciclos.
 */
export function parentIssues(
  r: ThirdPartyRelationshipRecord,
  byId: ReadonlyMap<string, ThirdPartyRelationshipRecord>,
): string[] {
  const parentId = r.parentRelationshipId;
  if (parentId === undefined || parentId === "") return [];
  if (parentId === r.id) return ["self-parent"];
  const parent = byId.get(parentId);
  if (!parent) return ["dangling parent"];
  if (parent.relationshipType !== "processor" && parent.relationshipType !== "subprocessor") {
    return ["parent con tipo incompatible"];
  }
  // Ciclo: caminar desde el padre; si se vuelve a r.id hay ciclo.
  const seen = new Set<string>([r.id]);
  let current: ThirdPartyRelationshipRecord | undefined = parent;
  while (current?.parentRelationshipId) {
    const next = current.parentRelationshipId;
    if (seen.has(next)) return ["ciclo de delegación"];
    seen.add(next);
    current = byId.get(next);
    if (!current) break;
  }
  return [];
}

/** Mapa id → record de la colección (último gana; duplicados se validan aparte). */
export function indexRelationships(
  rels: readonly ThirdPartyRelationshipRecord[],
): Map<string, ThirdPartyRelationshipRecord> {
  const out = new Map<string, ThirdPartyRelationshipRecord>();
  for (const r of rels) out.set(r.id, r);
  return out;
}

/** ¿Padre válido (definido, existente, tipo compatible, acíclico)? */
export function hasValidParent(
  r: ThirdPartyRelationshipRecord,
  byId: ReadonlyMap<string, ThirdPartyRelationshipRecord>,
): boolean {
  return (
    r.parentRelationshipId !== undefined &&
    r.parentRelationshipId !== "" &&
    parentIssues(r, byId).length === 0
  );
}

// ---------------------------------------------------------------------------
// Agregados estructurales (lectura; usados por derived.ts)
// ---------------------------------------------------------------------------

export function processorsOf(
  rels: readonly ThirdPartyRelationshipRecord[],
): ThirdPartyRelationshipRecord[] {
  return rels.filter((r) => r.relationshipType === "processor");
}

export function subprocessorsOf(
  rels: readonly ThirdPartyRelationshipRecord[],
): ThirdPartyRelationshipRecord[] {
  return rels.filter((r) => r.relationshipType === "subprocessor");
}

export function cessionsForPurpose(
  rels: readonly ThirdPartyRelationshipRecord[],
  purposeId: string,
): ThirdPartyRelationshipRecord[] {
  return rels.filter(
    (r) => r.relationshipType === "cession" && r.purposeIds.includes(purposeId),
  );
}

export function isInternationalDimension(v: unknown): v is TriStateSignal {
  return typeof v === "string" && TRI_STATE.includes(v);
}

// ---------------------------------------------------------------------------
// Referencias de razonamiento `third_party_relationship:<id>`
// ---------------------------------------------------------------------------

export const RELATIONSHIP_REF_PREFIX = "third_party_relationship:";

const RELATIONSHIP_REF_ENTRY = /^third_party_relationship:([A-Za-z0-9_-]+)$/;

/** Token explícito para un ID local de relationship. */
export function formatRelationshipRef(id: string): string {
  return `${RELATIONSHIP_REF_PREFIX}${id}`;
}

/**
 * IDs referenciados como entradas exactas de `facts_considered[]`,
 * únicos y en orden de aparición. El texto libre (`rationale`,
 * `evidence_refs`) nunca se parsea.
 */
export function extractRelationshipRefs(entries: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (typeof e !== "string") continue;
    const m = RELATIONSHIP_REF_ENTRY.exec(e);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

/** Referencias que no existen en el conjunto válido direccionado. */
export function findUnknownRelationshipRefs(
  entries: readonly string[],
  knownIds: ReadonlySet<string> | readonly string[],
): string[] {
  const known = knownIds instanceof Set ? knownIds : new Set(knownIds);
  return extractRelationshipRefs(entries).filter((id) => !known.has(id));
}

/** Comprueba si una relationship concreta fue considerada. */
export function isRelationshipConsidered(
  entries: readonly string[],
  id: string,
): boolean {
  return extractRelationshipRefs(entries).includes(id);
}
