import type { ExecutionProtocol, FactMap } from "../../content/protocols/types";
import { getTreatment } from "./scope";
import {
  D5_CANDIDATE_KEYS,
  dataItemRef,
  deriveD5Candidates,
  extractDataItemRefs,
  linkedItems,
  readLawfulnessRoute,
  resolveItemSignal,
  resolveProfile,
  scanPurposeAnswer,
} from "./specialRegime";
import type {
  CompanyState,
  DataItemRecord,
  ExecutionContext,
  ProtocolReasoningRecord,
} from "./types";

/**
 * Guards de finalización y staleness D5.01–D5.03 (Punto 0 + batch de
 * protocolos, ADR-053).
 *
 * Opt-in por FORMA de protocolo, sin literales de identidad: aplica
 * al protocolo decision cuya firma estructural declara la
 * candidatura derivada de su régimen en `external_fact_keys`. El
 * wiring genérico (finalización en contexto, staleness en
 * getRecordedJudgment) los consulta por dispatch de datos, igual que
 * el guard D4.08, sin cambiar el finalizer ni las vistas.
 *
 * Nada aquí escribe facts, records ni efectos: compone y valida.
 * La escritura canónica sigue reservada a la finalización explícita
 * existente. Lenguaje humano, sin IDs técnicos en los mensajes.
 */

export type SpecialRegimeKind =
  | "sensitive"
  | "health"
  | "biometric"
  | "minors"
  | "research"
  | "titleIII";

export interface SpecialRegimeGuard {
  regime: SpecialRegimeKind;
  candidateKey: string;
  /**
   * Refs a componer antes de finalizar. D5.01/D5.02 devuelven el
   * conjunto requerido (ignoran la selección entrante); D5.03 filtra
   * la selección profesional a vinculados actuales.
   */
  composeRefs(
    company: CompanyState,
    ctx: ExecutionContext,
    requested: readonly string[],
  ): string[];
  /** Validez de una finalización antes de materializar. Vacío = puede finalizar. */
  validateFinalization(input: {
    company: CompanyState;
    ctx: ExecutionContext;
    protocol: ExecutionProtocol;
    conclusion: string;
    extras: readonly string[];
    facts: FactMap;
  }): string[];
  /**
   * Razones por las que un record dejó de representar el estado
   * actual (items, links, señales, perfil o candidatura). Vacío =
   * el record sigue representando el estado.
   */
  stalenessReasons(
    record: ProtocolReasoningRecord,
    company: CompanyState,
    ctx: ExecutionContext,
    protocol: ExecutionProtocol,
  ): string[];
}

function purposeItems(
  company: CompanyState,
  ctx: ExecutionContext,
): DataItemRecord[] {
  if (ctx.scope !== "purpose") return [];
  const t = getTreatment(company, ctx.treatmentId);
  if (!t) return [];
  return linkedItems(t, ctx.purposeId);
}

function candidateNow(
  company: CompanyState,
  ctx: ExecutionContext,
  key: string,
): string | undefined {
  if (ctx.scope !== "purpose") return undefined;
  const t = getTreatment(company, ctx.treatmentId);
  if (!t || !t.purposes[ctx.purposeId]) return undefined;
  return deriveD5Candidates(
    t,
    ctx.purposeId,
    readLawfulnessRoute(company, ctx.treatmentId, ctx.purposeId),
  )[key];
}

function itemLabel(item: DataItemRecord): string {
  return item.label.trim() === "" ? "dato sin etiqueta" : item.label;
}

/** ¿La conclusión mapea a un outcome definitivo (con efectos)? */
function isDefinitiveConclusion(
  protocol: ExecutionProtocol,
  conclusion: string,
): boolean {
  const outcome = protocol.outcomes.find((o) => o.outcome_key === conclusion);
  return !!outcome && (outcome.canonical_fact_effects ?? []).length > 0;
}

function checkCandidateAndScope(
  company: CompanyState,
  ctx: ExecutionContext,
  candidateKey: string,
): string[] {
  if (ctx.scope !== "purpose") {
    return ["Esta evaluación solo puede concluirse para una finalidad direccionada."];
  }
  if (candidateNow(company, ctx, candidateKey) !== "yes") {
    return [
      "La candidatura estructural actual no indica este régimen: revisa la clasificación antes de concluir.",
    ];
  }
  return [];
}

function checkDefinitive(
  protocol: ExecutionProtocol,
  conclusion: string,
): string[] {
  if (!isDefinitiveConclusion(protocol, conclusion)) {
    return ["La conclusión debe ser definitiva (soportada o no soportada): los estados de ruta no se adoptan como conclusión."];
  }
  return [];
}

/** Refs desconocidas = tokens que no resuelven a vinculados actuales. */
function unknownRefs(
  extras: readonly string[],
  items: DataItemRecord[],
): string[] {
  const linked = new Set(items.map((i) => i.id));
  return extractDataItemRefs([...extras]).filter((id) => !linked.has(id));
}

function requiredSensitive(items: DataItemRecord[]): DataItemRecord[] {
  return items.filter((i) => resolveItemSignal(i, "sensitive") === "yes");
}

function requiredHealth(items: DataItemRecord[]): DataItemRecord[] {
  return items.filter(
    (i) =>
      resolveItemSignal(i, "health") === "yes" ||
      resolveItemSignal(i, "biologicalProfile") === "yes",
  );
}

function checkRequiredRefs(
  items: DataItemRecord[],
  required: DataItemRecord[],
  extras: readonly string[],
): string[] {
  const issues: string[] = [];
  const unknown = unknownRefs(extras, items);
  if (unknown.length > 0) {
    issues.push(
      "El análisis refiere datos que ya no están vinculados a la finalidad: actualiza las referencias.",
    );
    return issues;
  }
  const considered = new Set(extractDataItemRefs([...extras]));
  for (const item of required) {
    if (!considered.has(item.id)) {
      issues.push(
        `El dato "${itemLabel(item)}" debe formar parte del juicio: todos los datos vinculados con la señal correspondiente deben estar referenciados.`,
      );
    }
  }
  return issues;
}

function staleForRefs(
  record: ProtocolReasoningRecord,
  items: DataItemRecord[],
  required: DataItemRecord[],
): string[] {
  const reasons: string[] = [];
  const unknown = unknownRefs(record.facts_considered, items);
  if (unknown.length > 0) {
    reasons.push("La conclusión refiere datos que ya no están vinculados a la finalidad.");
  }
  const considered = new Set(extractDataItemRefs(record.facts_considered));
  for (const item of required) {
    if (!considered.has(item.id)) {
      reasons.push(
        `El dato "${itemLabel(item)}" cambió o se vinculó después de la conclusión y no forma parte del juicio.`,
      );
    }
  }
  for (const id of considered) {
    if (!required.some((i) => i.id === id) && items.some((i) => i.id === id)) {
      reasons.push(
        "La clasificación de un dato considerado cambió desde la conclusión: revísala antes de continuar.",
      );
    }
  }
  return reasons;
}

const SENSITIVE_GUARD: SpecialRegimeGuard = {
  regime: "sensitive",
  candidateKey: D5_CANDIDATE_KEYS.sensitive,
  composeRefs(company, ctx) {
    return requiredSensitive(purposeItems(company, ctx)).map((i) =>
      dataItemRef(i.id),
    );
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras }) {
    const issues = checkCandidateAndScope(company, ctx, D5_CANDIDATE_KEYS.sensitive);
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    const pending = items.filter(
      (i) => resolveItemSignal(i, "sensitive") === "unknown",
    );
    if (pending.length > 0) {
      return [
        "Aún hay datos vinculados sin clasificar como sensibles o no: la conclusión definitiva requiere el universo vinculado completo.",
      ];
    }
    issues.push(...checkRequiredRefs(items, requiredSensitive(items), extras));
    issues.push(...checkDefinitive(protocol, conclusion));
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.sensitive) !== "yes") {
      return ["La candidatura estructural actual ya no indica este régimen."];
    }
    const items = purposeItems(company, ctx);
    const reasons = staleForRefs(record, items, requiredSensitive(items));
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

const HEALTH_GUARD: SpecialRegimeGuard = {
  regime: "health",
  candidateKey: D5_CANDIDATE_KEYS.healthBiological,
  composeRefs(company, ctx) {
    return requiredHealth(purposeItems(company, ctx)).map((i) =>
      dataItemRef(i.id),
    );
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras, facts }) {
    const issues = checkCandidateAndScope(
      company,
      ctx,
      D5_CANDIDATE_KEYS.healthBiological,
    );
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    const pending = items.filter(
      (i) =>
        resolveItemSignal(i, "health") === "unknown" ||
        resolveItemSignal(i, "biologicalProfile") === "unknown",
    );
    if (pending.length > 0) {
      return [
        "Aún hay datos vinculados sin clasificar en salud y perfil biológico: la conclusión definitiva requiere el universo vinculado completo.",
      ];
    }
    issues.push(...checkRequiredRefs(items, requiredHealth(items), extras));
    issues.push(...checkDefinitive(protocol, conclusion));
    if (conclusion !== "conditions_supported") return issues;
    // Solo la conclusión favorable exige las cautelas propias.
    if (
      facts["health02.prohibition_state"] === "relevant_unenabled"
    ) {
      issues.push(
        "La prohibición especial aplica sin habilitación legal: la conclusión favorable queda bloqueada.",
      );
    }
    if (facts["health02.route_main"] === "consent_route") {
      if (facts["health02.consent_express"] !== "yes") {
        issues.push(
          "La vía por consentimiento exige consentimiento expreso verificado: no basta invocarlo.",
        );
      }
      if (facts["health02.sanitary_law"] !== "yes") {
        issues.push(
          "La vía por consentimiento exige ley especial sanitaria con finalidad prevista y correspondencia verificadas.",
        );
      }
      if ((facts["health02.sanitary_law_ref"] ?? "").trim() === "") {
        issues.push(
          "Identifica la ley especial sanitaria invocada antes de concluir por consentimiento.",
        );
      }
    }
    if (facts["health02.route_main"] === "research_route") {
      // unknown != false: sin saber si hay publicación no hay favorable.
      if (
        facts["health02.research_publishes"] !== "yes" &&
        facts["health02.research_publishes"] !== "no"
      ) {
        issues.push(
          "Determina si se publican resultados antes de concluir favorablemente por investigación.",
        );
      } else if (
        facts["health02.research_publishes"] === "yes" &&
        facts["health02.research_anonymized"] !== "yes"
      ) {
        issues.push(
          "Si se publican resultados, la anonimización previa debe estar verificada para concluir favorablemente.",
        );
      }
    }
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.healthBiological) !== "yes") {
      return ["La candidatura estructural actual ya no indica este régimen."];
    }
    const items = purposeItems(company, ctx);
    const reasons = staleForRefs(record, items, requiredHealth(items));
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

const BIOMETRIC_GUARD: SpecialRegimeGuard = {
  regime: "biometric",
  candidateKey: D5_CANDIDATE_KEYS.biometric,
  composeRefs(company, ctx, requested) {
    const linked = new Set(purposeItems(company, ctx).map((i) => i.id));
    const out: string[] = [];
    for (const id of extractDataItemRefs([...requested])) {
      if (linked.has(id) && !out.includes(dataItemRef(id))) {
        out.push(dataItemRef(id));
      }
    }
    return out;
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras, facts }) {
    const issues = checkCandidateAndScope(company, ctx, D5_CANDIDATE_KEYS.biometric);
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    if (items.length === 0) {
      return [
        "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
      ];
    }
    const unknown = unknownRefs(extras, items);
    if (unknown.length > 0) {
      issues.push(
        "El análisis refiere datos que ya no están vinculados a la finalidad: actualiza las referencias.",
      );
    } else if (extractDataItemRefs([...extras]).length === 0) {
      issues.push(
        "Referencia al menos un dato vinculado en el análisis: la selección del dato del proceso biométrico es profesional.",
      );
    }
    issues.push(...checkDefinitive(protocol, conclusion));
    if (conclusion !== "biometric_conditions_supported") return issues;
    // La información especial es independiente de la licitud base:
    // sin los cuatro elementos no hay favorable aunque exista vía.
    const missing: string[] = [];
    if (facts["bio03.system_identified"] !== "yes") missing.push("sistema biométrico");
    if (facts["bio03.specific_purpose"] !== "yes") missing.push("finalidad específica");
    if (facts["bio03.usage_period"] !== "yes") missing.push("período de utilización");
    if (facts["bio03.rights_info"] !== "yes") missing.push("ejercicio de derechos");
    if (missing.length > 0) {
      issues.push(
        `Falta verificar la información especial (${missing.join(", ")}): sin ella no puede concluirse favorablemente.`,
      );
    }
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.biometric) !== "yes") {
      return ["La finalidad ya no declara uso de identificación biométrica."];
    }
    const items = purposeItems(company, ctx);
    const reasons: string[] = [];
    const unknown = unknownRefs(record.facts_considered, items);
    if (unknown.length > 0) {
      reasons.push("El dato referenciado ya no está vinculado a la finalidad.");
    }
    if (extractDataItemRefs(record.facts_considered).length === 0) {
      reasons.push("La conclusión no referencia ningún dato vinculado actual.");
    }
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

/**
 * Dispatch estructural: protocolo decision cuya firma declara la
 * candidatura de su régimen. Ninguna identidad duplicada.
 */
export function getSpecialRegimeGuard(
  protocol: ExecutionProtocol,
): SpecialRegimeGuard | undefined {
  if (protocol.mode !== "decision") return undefined;
  const external = new Set(protocol.external_fact_keys ?? []);
  if (external.has(D5_CANDIDATE_KEYS.sensitive)) return SENSITIVE_GUARD;
  if (external.has(D5_CANDIDATE_KEYS.healthBiological)) return HEALTH_GUARD;
  if (external.has(D5_CANDIDATE_KEYS.biometric)) return BIOMETRIC_GUARD;
  if (external.has(D5_CANDIDATE_KEYS.minors)) return MINORS_GUARD;
  if (external.has(D5_CANDIDATE_KEYS.research)) return RESEARCH_GUARD;
  if (external.has(D5_CANDIDATE_KEYS.titleIII)) return TITLEIII_GUARD;
  return undefined;
}

/** ¿Protocolo con guarda de régimen especial? (dispatch para UI). */
export function isSpecialRegimeProtocol(protocol: ExecutionProtocol): boolean {
  return getSpecialRegimeGuard(protocol) !== undefined;
}

/**
 * ¿Guía de régimen especial a efectos de contexto estructural en UI?
 * Incluye el checklist D5.06 (sin guarda de juicio): el contexto de
 * datos vinculados, candidaturas y advertencias también le sirve.
 * Separado del dispatch de guards para no mezclar finalización con
 * visualización.
 */
export function isSpecialRegimeGuideProtocol(protocol: ExecutionProtocol): boolean {
  if (getSpecialRegimeGuard(protocol) !== undefined) return true;
  if (protocol.mode !== "checklist") return false;
  return (protocol.external_fact_keys ?? []).includes(D5_CANDIDATE_KEYS.geolocation);
}

/**
 * Snapshots de answers materiales no gateadas (`answer:<fact>=<value>`).
 * Permiten staleness cuando una respuesta relevante cambia después del
 * record, sin parsear rationale ni tocar el schema de ReasoningRecord
 * (precedente: refs `automated_use:<id>` en facts_considered).
 */
const SNAP_PREFIX = "answer:";

function parseSnapshotToken(entry: string): [string, string] | null {
  if (!entry.startsWith(SNAP_PREFIX)) return null;
  const rest = entry.slice(SNAP_PREFIX.length);
  const eq = rest.indexOf("=");
  if (eq <= 0) return null;
  const fact = rest.slice(0, eq).trim();
  if (fact === "") return null;
  return [fact, rest.slice(eq + 1)];
}

export function snapshotAnswerToken(fact: string, value: string): string {
  return `answer:${fact}=${value}`;
}

export function extractAnswerSnapshots(entries: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of entries) {
    if (typeof e !== "string") continue;
    const parsed = parseSnapshotToken(e);
    if (parsed) out.set(parsed[0], parsed[1]);
  }
  return out;
}

function composeSnapshots(
  company: CompanyState,
  ctx: ExecutionContext,
  facts: readonly string[],
): string[] {
  if (ctx.scope !== "purpose") return [];
  const out: string[] = [];
  for (const f of facts) {
    const v = scanPurposeAnswer(company, ctx.treatmentId, ctx.purposeId, f);
    if (v !== undefined) out.push(snapshotAnswerToken(f, v));
  }
  return out;
}

function snapshotStaleness(
  record: ProtocolReasoningRecord,
  company: CompanyState,
  ctx: ExecutionContext,
  facts: readonly string[],
  humanLabel: string,
): string[] {
  if (ctx.scope !== "purpose") return [];
  const recorded = extractAnswerSnapshots(record.facts_considered);
  for (const f of facts) {
    const current = scanPurposeAnswer(company, ctx.treatmentId, ctx.purposeId, f);
    const old = recorded.get(f);
    if (current === undefined && old === undefined) continue;
    if (current !== old) {
      return [`${humanLabel} cambió después de la conclusión: revísala antes de continuar.`];
    }
  }
  return [];
}

const MINORS_POPULATION_FACTS = [
  "minors04.children_present",
  "minors04.adolescents_present",
  "minors04.adolescent_sensitive_u16",
] as const;

const TITLEIII_MATERIAL_FACTS = [
  "fin07.scope_assessed",
  "fin07.requirements_assessed",
  "fin07.decree_ref",
] as const;

const RESEARCH_MATERIAL_FACTS = [
  "res05.risk_assessed",
  "res05.mitigation_sufficient",
  "res05.publishes_results",
  "res05.publication_anonymized",
] as const;

const MINORS_GUARD: SpecialRegimeGuard = {
  regime: "minors",
  candidateKey: D5_CANDIDATE_KEYS.minors,
  composeRefs(company, ctx) {
    return [
      ...requiredSensitive(purposeItems(company, ctx)).map((i) =>
        dataItemRef(i.id),
      ),
      ...composeSnapshots(company, ctx, MINORS_POPULATION_FACTS),
    ];
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras, facts }) {
    void facts;
    if (ctx.scope !== "purpose") {
      return ["Esta evaluación solo puede concluirse para una finalidad direccionada."];
    }
    const issues = checkCandidateAndScope(company, ctx, D5_CANDIDATE_KEYS.minors);
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    if (items.length === 0) {
      return [
        "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
      ];
    }
    const pending = items.filter(
      (i) => resolveItemSignal(i, "sensitive") === "unknown",
    );
    if (pending.length > 0) {
      return [
        "Aún hay datos vinculados sin clasificar como sensibles o no: la subregla de sensibles de adolescentes no puede evaluarse con sensibilidad desconocida.",
      ];
    }
    issues.push(...checkRequiredRefs(items, requiredSensitive(items), extras));
    // Subregla sensibles <16: con sensitive=yes vinculado, la población
    // relevante debe estar determinada (sí o no); ausente o unknown la
    // bloquea. sensitive=yes nunca concluye nada sobre edad o población.
    if (requiredSensitive(items).length > 0) {
      const u16 = scanPurposeAnswer(
        company,
        ctx.treatmentId,
        ctx.purposeId,
        "minors04.adolescent_sensitive_u16",
      );
      if (u16 !== "yes" && u16 !== "no") {
        issues.push(
          "Determina si la finalidad involucra datos sensibles de adolescentes menores de dieciséis años antes de concluir.",
        );
      }
    }
    issues.push(...checkDefinitive(protocol, conclusion));
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.minors) !== "yes") {
      return ["La finalidad ya no declara involucrar niños, niñas o adolescentes."];
    }
    const items = purposeItems(company, ctx);
    const reasons = staleForRefs(record, items, requiredSensitive(items));
    reasons.push(
      ...snapshotStaleness(record, company, ctx, MINORS_POPULATION_FACTS, "El contexto de población"),
    );
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

const RESEARCH_GUARD: SpecialRegimeGuard = {
  regime: "research",
  candidateKey: D5_CANDIDATE_KEYS.research,
  composeRefs(company, ctx) {
    return [
      ...requiredSensitive(purposeItems(company, ctx)).map((i) =>
        dataItemRef(i.id),
      ),
      ...composeSnapshots(company, ctx, RESEARCH_MATERIAL_FACTS),
    ];
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras, facts }) {
    const issues = checkCandidateAndScope(company, ctx, D5_CANDIDATE_KEYS.research);
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    if (items.length === 0) {
      return [
        "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
      ];
    }
    const pending = items.filter(
      (i) => resolveItemSignal(i, "sensitive") === "unknown",
    );
    if (pending.length > 0) {
      return [
        "Aún hay datos vinculados sin clasificar como sensibles o no: la obligación de riesgos y mitigación depende de si intervienen sensibles.",
      ];
    }
    issues.push(...checkRequiredRefs(items, requiredSensitive(items), extras));
    issues.push(...checkDefinitive(protocol, conclusion));
    if (conclusion !== "special_regime_supported") return issues;
    // Rama de riesgo: solo cuando intervienen sensibles.
    if (requiredSensitive(items).length > 0) {
      if (facts["res05.risk_assessed"] !== "yes") {
        issues.push(
          "Con datos sensibles vinculados, los riesgos posibles deben estar evaluados para concluir favorablemente.",
        );
      }
      if (facts["res05.mitigation_sufficient"] !== "yes") {
        issues.push(
          "Con datos sensibles vinculados, las medidas de reducción o mitigación deben estar verificadas para concluir favorablemente.",
        );
      }
    }
    // Publicación: unknown bloquea solo el favorable.
    if (facts["res05.publishes_results"] === "yes" && facts["res05.publication_anonymized"] !== "yes") {
      issues.push(
        "Si se publican resultados, la anonimización previa debe estar verificada para concluir favorablemente.",
      );
    } else if (
      facts["res05.publishes_results"] !== "yes" &&
      facts["res05.publishes_results"] !== "no"
    ) {
      issues.push(
        "Determina si se publican o difunden resultados antes de concluir favorablemente.",
      );
    }
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.research) !== "yes") {
      return ["La finalidad ya no declara contexto de investigación de interés público."];
    }
    const items = purposeItems(company, ctx);
    const reasons = staleForRefs(record, items, requiredSensitive(items));
    reasons.push(
      ...snapshotStaleness(record, company, ctx, RESEARCH_MATERIAL_FACTS, "La evaluación de riesgos o publicaciones"),
    );
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

const TITLEIII_GUARD: SpecialRegimeGuard = {
  regime: "titleIII",
  candidateKey: D5_CANDIDATE_KEYS.titleIII,
  composeRefs(company, ctx) {
    const items = purposeItems(company, ctx);
    return [
      ...items.map((i) => dataItemRef(i.id)),
      ...composeSnapshots(company, ctx, TITLEIII_MATERIAL_FACTS),
    ];
  },
  validateFinalization({ company, ctx, protocol, conclusion, extras, facts }) {
    if (ctx.scope !== "purpose") {
      return ["Esta evaluación solo puede concluirse para una finalidad direccionada."];
    }
    const issues = checkCandidateAndScope(company, ctx, D5_CANDIDATE_KEYS.titleIII);
    if (issues.length > 0) return issues;
    const items = purposeItems(company, ctx);
    if (items.length === 0) {
      return [
        "Sin datos vinculados no hay ámbito material que evaluar: vincula al menos un dato a la finalidad.",
      ];
    }
    // D5.07 justifica cobertura del conjunto actual: TODOS los
    // vinculados referenciados (sin registros de operación aparte).
    const unknown = unknownRefs(extras, items);
    if (unknown.length > 0) {
      issues.push(
        "El análisis refiere datos que ya no están vinculados a la finalidad: actualiza las referencias.",
      );
      return issues;
    }
    const considered = new Set(extractDataItemRefs([...extras]));
    for (const item of items) {
      if (!considered.has(item.id)) {
        issues.push(
          `El dato "${itemLabel(item)}" debe formar parte del juicio: el análisis de ámbito cubre todo lo vinculado.`,
        );
      }
    }
    if (issues.length > 0) return issues;
    // Compatibilidad conclusión ↔ ámbito/requisitos materiales.
    const scope = scanPurposeAnswer(company, ctx.treatmentId, ctx.purposeId, "fin07.scope_assessed");
    const req = scanPurposeAnswer(company, ctx.treatmentId, ctx.purposeId, "fin07.requirements_assessed");
    const mismatch =
      (conclusion === "titleIII_out_of_scope" && scope !== "out_of_scope") ||
      (conclusion === "titleIII_in_scope_requirements_satisfied" &&
        (scope !== "in_scope" || req !== "satisfied")) ||
      (conclusion === "titleIII_in_scope_remediation_required" &&
        (scope !== "in_scope" || req !== "remediation_required"));
    if (mismatch) {
      issues.push(
        "La conclusión no coincide con el ámbito y los requisitos determinados: revísalos antes de adoptar.",
      );
    }
    // Nota: un requirements_assessed residual junto a scope=out_of_scope
    // no se bloquea: los flujos no lineales pueden determinarlo antes
    // que el ámbito y no existe des-respuesta individual; la
    // combinación imposible de EFFECTS ya es inexpresable porque cada
    // outcome porta effects fijos (out_of_scope nunca escribe
    // requirements_status).
    // Vía por decreto invocada exige norma identificable (solo favorable).
    if (
      (conclusion === "titleIII_in_scope_requirements_satisfied" ||
        conclusion === "titleIII_in_scope_remediation_required") &&
      facts["fin07.decree_conditions"] === "yes" &&
      (facts["fin07.decree_ref"] ?? "").trim() === ""
    ) {
      issues.push(
        "Identifica el decreto o norma invocada antes de concluir con la vía por decreto.",
      );
    }
    issues.push(...checkDefinitive(protocol, conclusion));
    return issues;
  },
  stalenessReasons(record, company, ctx, protocol) {
    if (ctx.scope !== "purpose") return [];
    if (candidateNow(company, ctx, D5_CANDIDATE_KEYS.titleIII) !== "yes") {
      return ["La ruta art. 13(a) ya no está afirmada para esta finalidad."];
    }
    const items = purposeItems(company, ctx);
    const reasons: string[] = [];
    const unknown = unknownRefs(record.facts_considered, items);
    if (unknown.length > 0) {
      reasons.push("La conclusión refiere datos que ya no están vinculados a la finalidad.");
    }
    const considered = new Set(extractDataItemRefs(record.facts_considered));
    for (const item of items) {
      if (!considered.has(item.id)) {
        reasons.push(
          `El dato "${itemLabel(item)}" se vinculó después de la conclusión y no forma parte del juicio.`,
        );
      }
    }
    reasons.push(
      ...snapshotStaleness(record, company, ctx, TITLEIII_MATERIAL_FACTS, "El ámbito o los requisitos"),
    );
    if (!isDefinitiveConclusion(protocol, record.conclusion)) {
      reasons.push("La conclusión registrada no es definitiva.");
    }
    return reasons;
  },
};

/** Perfil efectivo de la purpose direccionada (ausente = todo unknown). */
export function addressedProfile(
  company: CompanyState,
  ctx: ExecutionContext,
) {
  if (ctx.scope !== "purpose") return resolveProfile(undefined);
  const t = getTreatment(company, ctx.treatmentId);
  return resolveProfile(t?.purposes[ctx.purposeId]?.specialRegimeProfile);
}
