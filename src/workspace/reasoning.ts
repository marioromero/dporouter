import type {
  ExecutionProtocol,
  FactMap,
  ProtocolOutcome,
} from "../../content/protocols/types";
import { findConclusionNode } from "../../content/protocols/registry";
import { blockingConflicts } from "./facts";
import { describeFactKey } from "./factLabels";
import type { CompanyState, ProtocolReasoningRecord } from "./types";

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
 * explícitamente en "yes" y no hay conflictos materiales. No decide QUÉ
 * concluir, solo SI se puede concluir. Un "no" posterior invalida la
 * base igual que un unknown: la conclusión previa queda desactualizada.
 */
export function gatePasses(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
  facts: FactMap,
): boolean {
  if (!protocol.decision_fact_keys.every((f) => facts[f] === "yes")) {
    return false;
  }
  return blockingConflicts(protocol, company).length === 0;
}

/**
 * Validez mínima de un borrador/registro contra el contrato canónico.
 * Devuelve issues en lenguaje humano (sin claves técnicas). Vacío = válido.
 * El mínimo exigido lo autoriza la iteración vigente; el contrato no
 * define campos obligatorios y no se inventa semántica en silencio.
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
  if (draft.legal_question.trim() === "") {
    issues.push("La pregunta jurídica no puede estar vacía.");
  }
  if (draft.evidence_refs.length === 0) {
    issues.push("Registra al menos una referencia de evidencia.");
  }
  if (draft.rationale.trim() === "") {
    issues.push("El razonamiento no puede estar vacío.");
  }
  if (draft.decided_by.trim() === "") {
    issues.push("Indica quién adopta la conclusión.");
  }
  if (Number.isNaN(Date.parse(draft.decided_at))) {
    issues.push("La fecha de decisión debe ser válida.");
  }
  return issues;
}

export type RecordedJudgment =
  | { status: "none" }
  | { status: "valid"; record: ProtocolReasoningRecord; outcome: ProtocolOutcome }
  | { status: "stale"; record: ProtocolReasoningRecord; reasons: string[] }
  | { status: "invalid"; reasons: string[] };

/**
 * Guardia de persistencia: un registro solo puede guardarse si su
 * protocolo existe y sus campos son válidos. La validez viva
 * (gate/conflictos) se reevalúa al leer, nunca al escribir.
 */
export function canPersistRecord(
  protocol: ExecutionProtocol | undefined,
  entry: {
    conclusion: string;
    legal_question: string;
    evidence_refs: string[];
    rationale: string;
    decided_by: string;
    reviewed_by: string;
    decided_at: string;
  },
): boolean {
  if (!protocol) return false;
  return (
    validateReasoningDraft(protocol, entry).length === 0
  );
}

/**
 * Conclusión registrada para un protocolo, revalidada en vivo: un cambio
 * en un fact material invalida la conclusión previa hasta reevaluarla.
 * Nunca se mantiene automáticamente una conclusión potencialmente obsoleta.
 */
export function getRecordedJudgment(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
  facts: FactMap,
): RecordedJudgment {
  const record = company?.reasoningRecords[protocol.protocol_key];
  if (!record) return { status: "none" };
  const fieldIssues = validateReasoningDraft(protocol, {
    conclusion: record.conclusion,
    legal_question: record.legal_question,
    evidence_refs: record.evidence_refs,
    rationale: record.rationale,
    decided_by: record.decided_by,
    reviewed_by: record.reviewed_by,
    decided_at: record.decided_at,
  });
  if (fieldIssues.length > 0) {
    return { status: "invalid", reasons: fieldIssues };
  }
  const outcome = protocol.outcomes.find(
    (o) => o.outcome_key === record.conclusion,
  );
  if (!outcome) {
    return { status: "invalid", reasons: ["La conclusión no es válida."] };
  }
  if (!gatePasses(protocol, company, facts)) {
    const reasons: string[] = [];
    for (const f of protocol.decision_fact_keys) {
      if (facts[f] === undefined) {
        reasons.push(`${describeFactKey(f)} quedó sin responder.`);
      } else if (facts[f] === "unknown") {
        reasons.push(`${describeFactKey(f)} quedó registrado como desconocido.`);
      } else if (facts[f] !== "yes") {
        reasons.push(`${describeFactKey(f)} ya no está considerado con respaldo.`);
      }
    }
    const blocked = blockingConflicts(protocol, company);
    for (const f of blocked) {
      reasons.push(`${describeFactKey(f)} entró en conflicto.`);
    }
    return { status: "stale", record, reasons };
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
): GuideResolution {
  const blocks = blockingConflicts(protocol, company);
  if (blocks.length > 0) {
    return { kind: "conflict", facts: blocks };
  }
  const recorded = getRecordedJudgment(protocol, company, facts);
  if (recorded.status === "valid") {
    return { kind: "recorded", record: recorded.record, outcome: recorded.outcome };
  }
  const conclusion = findConclusionNode(protocol);
  if (conclusion && gatePasses(protocol, company, facts)) {
    return { kind: "continue", nodeKey: conclusion.node_key };
  }
  return { kind: "evaluation" };
}
