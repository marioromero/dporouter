import type {
  ExecutionProtocol,
  FactMap,
  ProtocolOutcome,
} from "../../content/protocols/types";
import { isDerivedFactKey } from "../../content/protocols/types";
import { evaluateProtocol } from "../guidance/engine";
import { blockingConflicts, getFactStatus } from "./facts";
import type { CompanyState } from "./types";
import { nowIso } from "./types";

/**
 * Finalización explícita genérica para protocolos `procedure` y
 * `checklist` (Stage 1).
 *
 * Lógica pura y genérica: ningún literal de actividad, protocolo, nodo
 * o fact. Aplica únicamente `ProtocolOutcome.canonical_fact_effects`
 * como observaciones en el fact store existente (fuente = protocol_key),
 * en una sola transformación. Nunca se ejecuta por render, navegación
 * o evaluación: solo mediante acción explícita del profesional a través
 * de `finalizeProtocolOutcome` en el contexto.
 *
 * Diferencias con el juicio D1.03 (`reasoning.ts`): aquí no hay
 * conclusión profesional ni ReasoningRecord; la finalización registra
 * el estado derivado de verificaciones ya respondidas. Ambos caminos
 * son independientes y no se invocan entre sí.
 *
 * Reglas:
 * - modo fuera de procedure/checklist → error (el modo decision con
 *   juicio conserva su camino propio, p. ej. D1.03);
 * - outcome sin efectos canónicos → error (nada que materializar);
 * - la evaluación actual debe producir ese mismo outcome definitivo
 *   (un resultado incompleto o distinto nunca escribe estado);
 * - conflicto en un fact necesario o en un fact de efecto → error;
 * - idempotente: si la observación propia ya tiene el mismo valor, no
 *   se reescribe (sin duplicar ni mover timestamps);
 * - fallo de validación → nada escrito (sin marca de finalizado).
 */

const FINALIZABLE_MODES: Array<ExecutionProtocol["mode"]> = [
  "procedure",
  "checklist",
];

export function isFinalizableMode(
  protocol: ExecutionProtocol,
): boolean {
  return FINALIZABLE_MODES.includes(protocol.mode);
}

export function getFinalizableOutcome(
  protocol: ExecutionProtocol,
  outcomeKey: string,
): ProtocolOutcome | undefined {
  if (!isFinalizableMode(protocol)) return undefined;
  const outcome = protocol.outcomes.find((o) => o.outcome_key === outcomeKey);
  if (!outcome || (outcome.canonical_fact_effects ?? []).length === 0) {
    return undefined;
  }
  return outcome;
}

export interface ProcedureFinalizeInput {
  protocol: ExecutionProtocol;
  company: CompanyState | null;
  facts: FactMap;
  outcomeKey: string;
}

export type ProcedureFinalizeResult =
  | {
      ok: true;
      outcome: ProtocolOutcome;
      effects: Array<{ fact_key: string; value: string }>;
    }
  | { ok: false; errors: string[] };

/**
 * Validación previa a materializar. Todo en lenguaje humano, sin
 * claves técnicas: los detalles de diagnóstico quedan en código y
 * tests, nunca en UI normal.
 */
export function validateProcedureFinalization(
  input: ProcedureFinalizeInput,
): ProcedureFinalizeResult {
  const { protocol, company, facts, outcomeKey } = input;
  if (!company) {
    return { ok: false, errors: ["Requiere empresa activa."] };
  }
  if (!isFinalizableMode(protocol)) {
    return {
      ok: false,
      errors: ["Este tipo de guía usa su propio camino de cierre."],
    };
  }
  const outcome = protocol.outcomes.find((o) => o.outcome_key === outcomeKey);
  if (!outcome) {
    return { ok: false, errors: ["El resultado no pertenece a esta guía."] };
  }
  const effects = outcome.canonical_fact_effects ?? [];
  if (effects.length === 0) {
    return {
      ok: false,
      errors: ["Este resultado no registra estado canónico."],
    };
  }
  // Las proyecciones read-only nunca se materializan.
  if (effects.some((e) => isDerivedFactKey(e.fact_key))) {
    return {
      ok: false,
      errors: ["Este resultado no registra estado canónico."],
    };
  }
  // Un dato necesario en conflicto bloquea cualquier conclusión
  // definitiva (mismo criterio que el resto de las guías).
  if (blockingConflicts(protocol, company).length > 0) {
    return {
      ok: false,
      errors: ["Resuelve los datos en conflicto antes de registrar el estado."],
    };
  }
  for (const e of effects) {
    if (getFactStatus(company, e.fact_key).state === "conflict") {
      return {
        ok: false,
        errors: ["Resuelve los datos en conflicto antes de registrar el estado."],
      };
    }
  }
  // Solo el outcome definitivo que la evaluación actual produce puede
  // materializarse: incompleto o distinto no escribe estado.
  const evaluation = evaluateProtocol(protocol, facts);
  if (
    evaluation.status !== "outcome" ||
    evaluation.outcome_key !== outcome.outcome_key
  ) {
    return {
      ok: false,
      errors: ["La guía aún no alcanza este resultado definitivo."],
    };
  }
  return {
    ok: true,
    outcome,
    effects: effects.map((e) => ({ fact_key: e.fact_key, value: e.value })),
  };
}

export interface AppliedProcedureFinalization {
  company: CompanyState;
  /** Facts escritos en esta operación. */
  applied: string[];
  /** Facts ya registrados con el mismo valor (no reescritos). */
  skipped: string[];
}

/**
 * Aplica una finalización validada al estado de empresa en una sola
 * transformación pura. Idempotente: la observación propia con igual
 * valor se conserva intacta (mismo updatedAt).
 */
export function applyProcedureFinalization(
  company: CompanyState,
  protocol: ExecutionProtocol,
  effects: Array<{ fact_key: string; value: string }>,
): AppliedProcedureFinalization {
  const at = nowIso();
  const answers = { ...(company.protocolAnswers[protocol.protocol_key] ?? {}) };
  const applied: string[] = [];
  const skipped: string[] = [];
  for (const e of effects) {
    const current = answers[e.fact_key];
    if (current && current.value === e.value) {
      skipped.push(e.fact_key);
      continue;
    }
    answers[e.fact_key] = {
      value: e.value,
      source: protocol.protocol_key,
      updatedAt: at,
    };
    applied.push(e.fact_key);
  }
  return {
    company: {
      ...company,
      protocolAnswers: {
        ...company.protocolAnswers,
        [protocol.protocol_key]: answers,
      },
    },
    applied,
    skipped,
  };
}
