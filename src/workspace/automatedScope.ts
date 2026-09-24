import type {
  AutomatedUseRecord,
  CompanyState,
  ExecutionContext,
  ProtocolReasoningRecord,
} from "./types";
import type { ExecutionProtocol } from "../../content/protocols/types";
import { getTreatment } from "./scope";

/**
 * Consistencia D4.08/D4.09 sobre la colección local compartida
 * `automatedUses[]` (ADR-052).
 *
 * Capa pura sin literales de UI. Reúne tres capacidades que los
 * contratos genéricos no pueden expresar con facts estáticos:
 *
 * - recomputo mecánico del outcome D4.08 esperado desde los usos
 *   actuales (`expectedScopeOutcome`);
 * - referencias explícitas `automated_use:<id>` a los usos
 *   considerados (`format/extract/findUnknown/isConsidered`);
 * - un guard opt-in por `activity_key` (`getScopeFinalizeGuard`)
 *   que el wiring genérico de finalización y staleness consulta por
 *   dispatch de datos (sin literales en capas genéricas, sin
 *   cambiar el finalizer, sin tocar ProtocolView).
 *
 * Nada aquí escribe facts, records ni efectos: compone y valida.
 * La escritura canónica sigue reservada a la finalización
 * explícita existente.
 */

export const AUTOMATED_USE_REF_PREFIX = "automated_use:";

const AUTOMATED_USE_REF_ENTRY = /^automated_use:([A-Za-z0-9_-]+)$/;

/** Token explícito para un ID local de uso automatizado. */
export function formatAutomatedUseRef(id: string): string {
  return `${AUTOMATED_USE_REF_PREFIX}${id}`;
}

/**
 * IDs referenciados como entradas exactas de `facts_considered[]`,
 * únicos y en orden de aparición. El texto libre (incluido
 * `rationale`) nunca se parsea: un token dentro de una frase no es
 * una referencia.
 */
export function extractAutomatedUseRefs(entries: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (typeof e !== "string") continue;
    const m = AUTOMATED_USE_REF_ENTRY.exec(e);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

/**
 * Referencias a usos que no existen en el conjunto válido del
 * treatment direccionado. Vacío = todas resuelven.
 */
export function findUnknownAutomatedUseRefs(
  entries: readonly string[],
  knownIds: ReadonlySet<string> | readonly string[],
): string[] {
  const known = knownIds instanceof Set ? knownIds : new Set(knownIds);
  return extractAutomatedUseRefs(entries).filter((id) => !known.has(id));
}

/** Comprueba si un uso concreto fue considerado en el análisis. */
export function isAutomatedUseConsidered(
  entries: readonly string[],
  id: string,
): boolean {
  return extractAutomatedUseRefs(entries).includes(id);
}

export type ScopeOutcomeKey =
  | "no_covered_use"
  | "covered_uses_with_legal_path"
  | "covered_use_without_legal_path"
  | "assessment_incomplete";

/**
 * Outcome D4.08 esperado desde el estado local actual. Mecánico:
 * sin inventario revisado, con cobertura pendiente o con vías
 * pendientes no hay conclusión definitiva. Derivar qué outcome
 * corresponde NO equivale a adoptar la conclusión profesional: el
 * ReasoningRecord y la finalización explícita siguen obligatorios.
 */
export function expectedScopeOutcome(
  uses: readonly AutomatedUseRecord[],
  inventoryReviewed: boolean,
): ScopeOutcomeKey {
  if (!inventoryReviewed) return "assessment_incomplete";
  if (uses.some((u) => u.article8bisCoverage === "unknown")) {
    return "assessment_incomplete";
  }
  const covered = uses.filter((u) => u.article8bisCoverage === "covered");
  if (covered.length === 0) return "no_covered_use";
  if (covered.some((u) => u.legalPath === "unknown")) {
    return "assessment_incomplete";
  }
  if (covered.some((u) => u.legalPath === "none")) {
    return "covered_use_without_legal_path";
  }
  return "covered_uses_with_legal_path";
}

/** Usos actuales del treatment direccionado (vacío si no resuelve). */
export function currentAutomatedUses(
  company: CompanyState | null,
  ctx: ExecutionContext | null,
): AutomatedUseRecord[] {
  if (!company || !ctx || ctx.scope !== "treatment") return [];
  return getTreatment(company, ctx.treatmentId)?.automatedUses ?? [];
}

export interface ScopeFinalizeGuard {
  /** Refs exactas de los usos actuales (todos y solo ellos). */
  composeRefs(uses: readonly AutomatedUseRecord[]): string[];
  /** Lee la confirmación estática de inventario desde facts de sesión. */
  isInventoryReviewed(facts: Record<string, string>): boolean;
  /**
   * Validez de una finalización D4.08 antes de materializar.
   * Lenguaje humano, sin IDs técnicos. Vacío = puede finalizar.
   */
  validateFinalization(input: {
    uses: readonly AutomatedUseRecord[];
    inventoryReviewed: boolean;
    conclusion: string;
    extras: readonly string[];
  }): string[];
  /**
   * Razones por las que un record dejó de representar la colección
   * actual (agregado/eliminado/cambio de cobertura o vía).
   * Vacío = el record sigue representando el estado.
   */
  stalenessReasons(
    record: ProtocolReasoningRecord,
    uses: readonly AutomatedUseRecord[],
  ): string[];
}

function useName(uses: readonly AutomatedUseRecord[], id: string): string {
  return uses.find((u) => u.id === id)?.name ?? "uso sin nombre";
}

const SCOPE_ASSESS_GUARD: ScopeFinalizeGuard = {
  composeRefs(uses) {
    return uses.map((u) => formatAutomatedUseRef(u.id));
  },
  isInventoryReviewed(facts) {
    return facts["automated_scope.inventory_reviewed"] === "yes";
  },
  validateFinalization({ uses, inventoryReviewed, conclusion, extras }) {
    const issues: string[] = [];
    if (!inventoryReviewed) {
      issues.push(
        "Revisa el inventario de usos automatizados del tratamiento antes de concluir.",
      );
      return issues;
    }
    const expected = expectedScopeOutcome(uses, true);
    if (expected === "assessment_incomplete") {
      issues.push(
        "Aún hay usos o vías legales pendientes de evaluar: la conclusión definitiva requiere el estado completo.",
      );
      return issues;
    }
    if (conclusion !== expected) {
      issues.push(
        "La conclusión elegida no coincide con el estado actual de los usos: revisa la evaluación antes de adoptar.",
      );
    }
    const currentIds = uses.map((u) => u.id);
    const missing = currentIds.filter(
      (id) => !extractAutomatedUseRefs(extras).includes(id),
    );
    for (const id of missing) {
      issues.push(
        `El uso "${useName(uses, id)}" no está referenciado en el análisis: todos los usos actuales deben formar parte del juicio.`,
      );
    }
    const unknown = findUnknownAutomatedUseRefs(extras, currentIds);
    if (unknown.length > 0) {
      issues.push(
        "El análisis refiere usos que ya no existen en el tratamiento: actualiza las referencias.",
      );
    }
    return issues;
  },
  stalenessReasons(record, uses) {
    const reasons: string[] = [];
    const refs = extractAutomatedUseRefs(record.facts_considered);
    const currentIds = new Set(uses.map((u) => u.id));
    const unknown = refs.filter((id) => !currentIds.has(id));
    if (unknown.length > 0) {
      reasons.push(
        "La conclusión refiere usos que ya no existen en el tratamiento.",
      );
    }
    const added = uses.filter((u) => !refs.includes(u.id));
    for (const u of added) {
      reasons.push(
        `El uso "${u.name}" se agregó después de la conclusión y no forma parte del juicio.`,
      );
    }
    if (reasons.length > 0) return reasons;
    // Mismo conjunto, posible cambio de determinaciones: el outcome
    // esperado debe seguir coincidiendo con la conclusión adoptada.
    if (expectedScopeOutcome(uses, true) !== record.conclusion) {
      reasons.push(
        "Las determinaciones de los usos cambiaron y la conclusión registrada ya no refleja el estado actual.",
      );
    }
    return reasons;
  },
};

/**
 * Guard opt-in por FORMA de protocolo, sin literales de identidad.
 * Aplica al protocolo decision que compuerta estructuralmente sobre
 * la cobertura de usos (firma derived declarada en sus
 * `external_fact_keys`): hoy, la evaluación de alcance D4.08. Los
 * protocolos checklist/procedure sobre la misma colección (D4.09)
 * finalizan por la vía genérica y nunca reciben este guard.
 * Ausente = comportamiento genérico idéntico al histórico. El
 * dispatch es estructural: ninguna capa contiene identidad de
 * actividad duplicada.
 */
export function getScopeFinalizeGuard(
  protocol: ExecutionProtocol,
): ScopeFinalizeGuard | undefined {
  if (protocol.mode !== "decision") return undefined;
  if (
    !(protocol.external_fact_keys ?? []).includes(
      "derived.treatment.automated_uses_coverage_complete",
    )
  ) {
    return undefined;
  }
  return SCOPE_ASSESS_GUARD;
}
