import type {
  ExecutionProtocol,
  FactMap,
  ProtocolOutcome,
} from "../../content/protocols/types";
import { findConclusionNode } from "../../content/protocols/registry";
import { blockingConflicts, protocolNeededFacts } from "./facts";
import {
  blockingScopedConflicts,
  getPurpose,
  getScopedReasoningRecord,
  getTreatment,
  referenceFactState,
  resolveExecutionContext,
  scalarDecisionSatisfied,
  setScopedJudgmentState,
  treatmentReferenceNode,
} from "./scope";
import type { ExecutionContext } from "./types";
import { describeFactKey } from "./factLabels";
import type { CompanyState, ProtocolReasoningRecord } from "./types";
import type { LegalBasis } from "../types";
import { isDerivedFactKey } from "../../content/protocols/types";
import { nowIso } from "./types";
import {
  currentAutomatedUses,
  getScopeFinalizeGuard,
} from "./automatedScope";
import { getSpecialRegimeGuard } from "./specialRegimeGuards";

/** Refs a usos automatizados: definidas en automatedScope, reexportadas.
 * Entradas exactas `automated_use:<id>` para `facts_considered[]`
 * (ver ADR-052): ID exacto, subordinadas al treatment del registro,
 * sin dynamic fact keys, sin usar `evidence_refs`, sin parsear
 * `rationale`. Las consume el guard D4.08 en finalización y
 * staleness (ver automatedScope). */
export {
  AUTOMATED_USE_REF_PREFIX,
  extractAutomatedUseRefs,
  findUnknownAutomatedUseRefs,
  formatAutomatedUseRef,
  isAutomatedUseConsidered,
} from "./automatedScope";

/**
 * Juicio profesional documentado (Stage 1).
 *
 * Lógica pura y genérica: ningún literal de actividad, protocolo, nodo o
 * fact. El motor determinístico no cambia; esta capa decide (a) si existe
 * base suficiente para concluir, (b) si hay una conclusión válida
 * registrada y (c) qué debe mostrar la UI en cada caso.
 */

export interface ReasoningDraft {
  conclusion: string;
  legal_question: string;
  evidence_refs: string[];
  rationale: string;
  decided_by: string;
  reviewed_by: string;
  decided_at: string;
  /**
   * Entradas adicionales para `facts_considered[]` compuestas por el
   * llamante (p. ej. referencias `automated_use:<id>` al finalizar
   * D4.08). Opcional y genérico: el finalizer solo exige strings no
   * vacíos; cada protocolo decide si lo usa.
   */
  extra_facts_considered?: string[];
}

/** Nodos de consideración: preguntas excepto el nodo conclusión. */
export function considerationNodes(
  protocol: ExecutionProtocol,
): { node_key: string; title: string; fact_key: string }[] {
  const conclusion = findConclusionNode(protocol);
  return protocol.nodes
    .filter(
      (n) =>
        n.node_type === "question" &&
        n.fact_key &&
        (!conclusion || n.node_key !== conclusion.node_key),
    )
    .map((n) => ({
      node_key: n.node_key,
      title: n.title,
      fact_key: n.fact_key as string,
    }));
}

/**
 * Base mínima para concluir: todos los decision facts están
 * satisfechos y no hay conflictos materiales. Un fact de decisión
 * normal exige "yes" explícito vigente; un fact de referencia a
 * tratamiento (nodo con `options_source`) exige determinación válida
 * según `referenceFactState`. No decide QUÉ concluir, solo SI se
 * puede concluir. Un "no" posterior invalida la base igual que un
 * unknown: la conclusión previa queda desactualizada.
 *
 * Con `ctx` company (o ausente con company nula, legado) usa el camino
 * histórico idéntico; con treatment/purpose usa resolución scopeada.
 */
export function gatePasses(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
  facts: FactMap,
  ctx?: ExecutionContext | null,
): boolean {
  for (const f of protocol.decision_fact_keys) {
    if (treatmentReferenceNode(protocol, f)) {
      if (referenceFactState(protocol, company, ctx ?? null, f, facts[f]) !== "satisfied") {
        return false;
      }
      continue;
    }
    const scalar = scalarDecisionSatisfied(protocol, f, facts[f]);
    if (scalar !== null) {
      if (!scalar) return false;
      continue;
    }
    if (facts[f] !== "yes") return false;
  }
  if (ctx && ctx.scope !== "company") {
    if (!company || !resolveExecutionContext(company, ctx)) return false;
    return (
      blockingScopedConflicts(protocolNeededFacts(protocol), company, ctx)
        .length === 0
    );
  }
  return blockingConflicts(protocol, company).length === 0;
}

/**
 * Validez mínima de un borrador contra los requisitos declarados por el
 * protocolo (`reasoning_requirements.required_fields`). Sin declaración,
 * solo se exige estructuralmente que la conclusión sea una alternativa
 * canónica. Devuelve issues en lenguaje humano (sin claves técnicas).
 * Vacío = válido.
 */
export function validateReasoningDraft(
  protocol: ExecutionProtocol,
  draft: ReasoningDraft,
): string[] {
  const issues: string[] = [];
  const outcomeKeys = protocol.outcomes.map((o) => o.outcome_key);
  if (!outcomeKeys.includes(draft.conclusion)) {
    issues.push("La conclusión debe ser una de las alternativas canónicas.");
  }
  const required = new Set(
    protocol.reasoning_requirements?.required_fields ?? [],
  );
  const need = (field: string): boolean => required.has(field);
  if (need("legal_question") && draft.legal_question.trim() === "") {
    issues.push("La pregunta jurídica no puede estar vacía.");
  }
  if (need("evidence_refs") && draft.evidence_refs.length === 0) {
    issues.push("Registra al menos una referencia de evidencia.");
  }
  if (need("rationale") && draft.rationale.trim() === "") {
    issues.push("El razonamiento no puede estar vacío.");
  }
  if (need("decided_by") && draft.decided_by.trim() === "") {
    issues.push("Indica quién adopta la conclusión.");
  }
  if (
    need("decided_at") &&
    (draft.decided_at.trim() === "" || Number.isNaN(Date.parse(draft.decided_at)))
  ) {
    issues.push("La fecha de decisión debe ser válida.");
  }
  return issues;
}

export interface ReasoningRecordInput {
  conclusion: string;
  legal_question: string;
  facts_considered: string[];
  legal_factors: string[];
  evidence_refs: string[];
  alternatives_considered: string[];
  rationale: string;
  decided_by: string;
  reviewed_by: string;
  decided_at: string;
  legal_basis: LegalBasis[];
}

/**
 * Validez completa de un registro persistido: campos del borrador más
 * los campos automáticos exigidos por la declaración
 * (facts_considered, legal_factors, alternatives_considered, legal_basis).
 */
export function validateReasoningRecord(
  protocol: ExecutionProtocol,
  record: ReasoningRecordInput,
): string[] {
  const issues = validateReasoningDraft(protocol, {
    conclusion: record.conclusion,
    legal_question: record.legal_question,
    evidence_refs: record.evidence_refs,
    rationale: record.rationale,
    decided_by: record.decided_by,
    reviewed_by: record.reviewed_by,
    decided_at: record.decided_at,
  });
  const required = new Set(
    protocol.reasoning_requirements?.required_fields ?? [],
  );
  if (required.has("facts_considered") && record.facts_considered.length === 0) {
    issues.push("El registro debe listar los hechos considerados.");
  }
  if (required.has("legal_factors") && record.legal_factors.length === 0) {
    issues.push("El registro debe listar los factores considerados.");
  }
  if (
    required.has("alternatives_considered") &&
    record.alternatives_considered.length === 0
  ) {
    issues.push("El registro debe listar las alternativas consideradas.");
  }
  if (required.has("legal_basis") && record.legal_basis.length === 0) {
    issues.push("El registro debe incluir el fundamento.");
  }
  return issues;
}

export type RecordedJudgment =
  | { status: "none" }
  | { status: "valid"; record: ProtocolReasoningRecord; outcome: ProtocolOutcome }
  | { status: "stale"; record: ProtocolReasoningRecord; reasons: string[] }
  | { status: "invalid"; reasons: string[] };

/**
 * Conclusión registrada para un protocolo, revalidada en vivo: un cambio
 * en un fact material invalida la conclusión previa hasta reevaluarla.
 * Nunca se mantiene automáticamente una conclusión potencialmente obsoleta.
 */
export function getRecordedJudgment(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
  facts: FactMap,
  ctx?: ExecutionContext | null,
): RecordedJudgment {
  const record = getScopedReasoningRecord(
    company,
    ctx ?? (company ? { scope: "company", companyId: company.id } : null),
    protocol.protocol_key,
  );
  if (!record) return { status: "none" };
  const fieldIssues = validateReasoningRecord(protocol, record);
  if (fieldIssues.length > 0) {
    return { status: "invalid", reasons: fieldIssues };
  }
  const outcome = protocol.outcomes.find(
    (o) => o.outcome_key === record.conclusion,
  );
  if (!outcome) {
    return { status: "invalid", reasons: ["La conclusión no es válida."] };
  }
  if (!gatePasses(protocol, company, facts, ctx)) {
    const reasons: string[] = [];
    for (const f of protocol.decision_fact_keys) {
      if (treatmentReferenceNode(protocol, f)) {
        const state = referenceFactState(protocol, company, ctx ?? null, f, facts[f]);
        if (state === "missing") {
          reasons.push(`${describeFactKey(f)} quedó sin determinar.`);
        } else if (state === "invalid") {
          reasons.push(`${describeFactKey(f)} referencia un tratamiento inválido.`);
        }
        continue;
      }
      const scalar = scalarDecisionSatisfied(protocol, f, facts[f]);
      if (scalar !== null) {
        if (!scalar) {
          reasons.push(`${describeFactKey(f)} quedó sin registrar.`);
        }
        continue;
      }
      if (facts[f] === undefined) {
        reasons.push(`${describeFactKey(f)} quedó sin responder.`);
      } else if (facts[f] === "unknown") {
        reasons.push(`${describeFactKey(f)} quedó registrado como desconocido.`);
      } else if (facts[f] !== "yes") {
        reasons.push(`${describeFactKey(f)} ya no está considerado con respaldo.`);
      }
    }
    const blocked =
      ctx && ctx.scope !== "company"
        ? blockingScopedConflicts(protocolNeededFacts(protocol), company, ctx)
        : blockingConflicts(protocol, company);
    for (const f of blocked) {
      reasons.push(`${describeFactKey(f)} entró en conflicto.`);
    }
    return { status: "stale", record, reasons };
  }
  // Consistencia con colecciones locales (dispatch por datos, sin
  // literales): un record cuya cobertura de usos ya no coincide con
  // la colección actual queda desactualizado aunque el gate pase.
  const guard = getScopeFinalizeGuard(protocol);
  if (guard) {
    const effective =
      ctx ?? (company ? { scope: "company", companyId: company.id } : null);
    const stale = guard.stalenessReasons(
      record,
      currentAutomatedUses(company, effective),
    );
    if (stale.length > 0) return { status: "stale", record, reasons: stale };
  }
  // Consistencia D5 (dispatch por datos): un record cuya cobertura de
  // datos, links, señales, perfil o candidatura ya no coincide con el
  // estado actual queda desactualizado aunque el gate pase.
  const srGuard = getSpecialRegimeGuard(protocol);
  if (srGuard) {
    const effective =
      ctx ?? (company ? { scope: "company", companyId: company.id } : null);
    if (company && effective && effective.scope === "purpose") {
      const stale = srGuard.stalenessReasons(record, company, effective, protocol);
      if (stale.length > 0) return { status: "stale", record, reasons: stale };
    }
  }
  return { status: "valid", record, outcome };
}

export type GuideResolution =
  | { kind: "conflict"; facts: string[] }
  | {
      kind: "recorded";
      record: ProtocolReasoningRecord;
      outcome: ProtocolOutcome;
    }
  | { kind: "continue"; nodeKey: string }
  | { kind: "evaluation" };

/**
 * Punto único de decisión para la ruta de resultado de una guía con
 * juicio profesional. Orden: conflicto → conclusión válida → continuar
 * hacia el nodo conclusión (base suficiente, nada registrado) →
 * evaluación determinística del motor.
 */
export function resolveGuideResult(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
  facts: FactMap,
  ctx?: ExecutionContext | null,
): GuideResolution {
  const effective =
    ctx ?? (company ? { scope: "company", companyId: company.id } : null);
  const blocks =
    effective && effective.scope !== "company"
      ? blockingScopedConflicts(protocolNeededFacts(protocol), company, effective)
      : blockingConflicts(protocol, company);
  if (blocks.length > 0) {
    return { kind: "conflict", facts: blocks };
  }
  const recorded = getRecordedJudgment(protocol, company, facts, effective);
  if (recorded.status === "valid") {
    return { kind: "recorded", record: recorded.record, outcome: recorded.outcome };
  }
  const conclusion = findConclusionNode(protocol);
  if (conclusion && gatePasses(protocol, company, facts, effective)) {
    return { kind: "continue", nodeKey: conclusion.node_key };
  }
  return { kind: "evaluation" };
}

export interface FinalizeInput {
  protocol: ExecutionProtocol;
  company: CompanyState | null;
  facts: FactMap;
  draft: ReasoningDraft;
  legalBasis: LegalBasis[];
  /** Execution context explícito: determina answers, facts, record y effects. */
  ctx: ExecutionContext;
}

export type FinalizeResult =
  | {
      ok: true;
      record: ProtocolReasoningRecord;
      effects: Array<{ fact_key: string; value: string }>;
    }
  | { ok: false; errors: string[] };

/**
 * Finalización atómica del juicio profesional. Verifica en orden:
 * empresa activa, base suficiente (gate), borrador válido según los
 * requisitos declarados, y coherencia conclusión ↔ outcome definitivo
 * (el outcome aporta sus canonical_fact_effects). Devuelve el registro
 * y los efectos a materializar juntos; nunca uno sin el otro.
 *
 * Si un efecto encuentra otra fuente con valor contradictorio, no se
 * rechaza ni se impone precedencia: la observación se registra con la
 * identidad del protocolo y el modelo de fact_conflict ya congelado
 * decide el estado resultante.
 */
export function finalizeJudgment(input: FinalizeInput): FinalizeResult {
  const { protocol, company, facts, draft, legalBasis, ctx } = input;
  if (!company) {
    return { ok: false, errors: ["Requiere empresa activa."] };
  }
  // Ancestry primero: un contexto cruzado nunca finaliza.
  if (!resolveExecutionContext(company, ctx)) {
    return { ok: false, errors: ["Contexto de ejecución inválido."] };
  }
  if (!gatePasses(protocol, company, facts, ctx)) {
    return {
      ok: false,
      errors: ["Sin base suficiente para concluir: revisa los antecedentes pendientes."],
    };
  }
  const issues = validateReasoningDraft(protocol, draft);
  if (issues.length > 0) {
    return { ok: false, errors: issues };
  }
  const outcome = protocol.outcomes.find(
    (o) => o.outcome_key === draft.conclusion,
  );
  if (!outcome) {
    return { ok: false, errors: ["La conclusión no es una alternativa canónica."] };
  }
  const extras = draft.extra_facts_considered ?? [];
  for (const e of extras) {
    if (typeof e !== "string" || e.trim() === "") {
      return { ok: false, errors: ["Las referencias adicionales no son válidas."] };
    }
  }
  const at = nowIso();
  const record: ProtocolReasoningRecord = {
    protocolKey: protocol.protocol_key,
    activityKey: protocol.activity_key,
    conclusion: draft.conclusion,
    legal_question: draft.legal_question,
    facts_considered: [...protocol.decision_fact_keys, ...extras],
    legal_factors: considerationNodes(protocol).map((c) => c.title),
    evidence_refs: draft.evidence_refs,
    alternatives_considered: protocol.outcomes
      .map((o) => o.outcome_key)
      .filter((k) => k !== draft.conclusion),
    rationale: draft.rationale,
    decided_by: draft.decided_by,
    reviewed_by: draft.reviewed_by,
    decided_at: draft.decided_at,
    legal_basis: legalBasis.map((b) => ({ ...b })),
    updatedAt: at,
  };
  const recordIssues = validateReasoningRecord(protocol, record);
  if (recordIssues.length > 0) {
    return { ok: false, errors: recordIssues };
  }
  const effects: Array<{ fact_key: string; value: string }> = (
    outcome.canonical_fact_effects ?? []
  ).map((e) => ({
    fact_key: e.fact_key,
    value: e.value,
  }));
  // Las proyecciones read-only nunca se materializan, tampoco por juicio.
  if (effects.some((e) => isDerivedFactKey(e.fact_key))) {
    return { ok: false, errors: ["La conclusión no registra estado canónico."] };
  }
  return {
    ok: true,
    record,
    effects,
  };
}

/**
 * Aplica una finalización al estado de empresa en el scope indicado:
 * registro + efectos canónicos same-scope en una sola transformación
 * pura. Company delega al camino histórico idéntico.
 */
export function applyScopedFinalization(
  company: CompanyState,
  protocol: ExecutionProtocol,
  ctx: ExecutionContext,
  record: ProtocolReasoningRecord,
  effects: Array<{ fact_key: string; value: string }>,
): CompanyState | null {
  if (ctx.scope === "company") {
    return applyFinalization(company, protocol, record, effects);
  }
  if (!resolveExecutionContext(company, ctx)) return null;
  const at = nowIso();
  let current: CompanyState["protocolAnswers"][string] = {};
  if (ctx.scope === "treatment") {
    current =
      getTreatment(company, ctx.treatmentId)?.protocolAnswers[
        protocol.protocol_key
      ] ?? {};
  } else {
    current =
      getPurpose(company, ctx.treatmentId, ctx.purposeId)?.protocolAnswers[
        protocol.protocol_key
      ] ?? {};
  }
  const answers = { ...current };
  for (const e of effects) {
    answers[e.fact_key] = {
      value: e.value,
      source: protocol.protocol_key,
      updatedAt: at,
    };
  }
  return setScopedJudgmentState(company, ctx, protocol.protocol_key, answers, {
    ...record,
    updatedAt: at,
  });
}
export function applyFinalization(
  company: CompanyState,
  protocol: ExecutionProtocol,
  record: ProtocolReasoningRecord,
  effects: Array<{ fact_key: string; value: string }>,
): CompanyState {
  const at = nowIso();
  const answers = { ...(company.protocolAnswers[protocol.protocol_key] ?? {}) };
  for (const e of effects) {
    answers[e.fact_key] = {
      value: e.value,
      source: protocol.protocol_key,
      updatedAt: at,
    };
  }
  return {
    ...company,
    protocolAnswers: {
      ...company.protocolAnswers,
      [protocol.protocol_key]: answers,
    },
    reasoningRecords: {
      ...company.reasoningRecords,
      [protocol.protocol_key]: { ...record, updatedAt: at },
    },
  };
}
