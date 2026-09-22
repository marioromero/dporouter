import type { ActivityDefinition } from "../types";
import type { CompanyState } from "./types";
import { statusOf } from "./store";
import { listProtocols } from "../../content/protocols/registry";
import { evaluateCondition, evaluateProtocol } from "../guidance/engine";
import type { FactCondition, FactMap } from "../../content/protocols/types";
import { blockingConflicts } from "./facts";

/**
 * Lógica pura de progreso y sugerencia (sin React).
 * Usa información real disponible: estados de trabajo, resultados de
 * protocolos evaluados con los hechos de la empresa, y orden canónico.
 * Nada jurídico se afirma: es priorización operativa.
 */

export interface DomainWorkSummary {
  domainKey: string;
  total: number;
  reviewed: number;
  inReview: number;
  blocked: number;
  /** Revisado operativo: todo lo importado está reviewed/not_applicable, nada bloqueado. */
  isReviewed: boolean;
  nextPendingKey: string | null;
}

export function summarizeDomain(
  domainKey: string,
  activities: ActivityDefinition[],
  company: CompanyState | null,
): DomainWorkSummary {
  let reviewed = 0;
  let inReview = 0;
  let blocked = 0;
  let nextPendingKey: string | null = null;
  for (const a of activities) {
    const s = company ? statusOf(company, a.activity_key) : "not_started";
    if (s === "reviewed" || s === "not_applicable") reviewed += 1;
    if (s === "in_review") inReview += 1;
    if (s === "blocked") blocked += 1;
    if (nextPendingKey === null && s !== "reviewed" && s !== "not_applicable" && s !== "blocked") {
      nextPendingKey = a.activity_key;
    }
  }
  return {
    domainKey,
    total: activities.length,
    reviewed,
    inReview,
    blocked,
    isReviewed:
      activities.length > 0 && reviewed === activities.length && blocked === 0,
    nextPendingKey,
  };
}

import { mergedFactRecords } from "./facts";

/** Hechos conocidos de la empresa: diagnóstico + respuestas de guías. */
export function companyFacts(company: CompanyState | null): FactMap {
  if (!company) return {};
  const out: FactMap = {};
  for (const [k, r] of Object.entries(mergedFactRecords(company))) {
    out[k] = r.value;
  }
  return out;
}

export interface SuggestedReview {
  activityKey: string;
  nodeKey?: string;
  /** Origen real de la sugerencia (metodológico, no imperativo). */
  reason: string;
}

/**
 * Prioridad: 1) actividad in_review; 2) next action explícito de un
 * protocolo con resultado completo; 3) siguiente pendiente del dominio
 * actual; 4) primera pendiente del próximo dominio con contenido.
 */
export function suggestNextReview(
  orderedActivities: ActivityDefinition[],
  domainOf: (activityKey: string) => string | undefined,
  importedDomainKeys: string[],
  company: CompanyState | null,
  currentActivityKey?: string,
): SuggestedReview | null {
  if (!company) return null;
  const inReview = orderedActivities.find(
    (a) => statusOf(company, a.activity_key) === "in_review",
  );
  if (inReview) {
    return {
      activityKey: inReview.activity_key,
      reason: "Tienes esta actividad en revisión.",
    };
  }
  const facts = companyFacts(company);
  for (const p of listProtocols()) {
    // Un conflicto en un fact necesario invalida la conclusión: equivale
    // a información pendiente para sugerencias (nunca se usa el outcome).
    if (blockingConflicts(p, company).length > 0) continue;
    const evaluation = evaluateProtocol(p, facts);
    if (evaluation.status !== "outcome") continue;
    for (const action of evaluation.outcome.next_actions) {
      if (action.kind !== "activity" || !action.activity_key) continue;
      if (
        action.show_when &&
        !shouldShowAction(action.show_when, facts)
      ) {
        continue;
      }
      const target = orderedActivities.find(
        (a) => a.activity_key === action.activity_key,
      );
      if (!target) continue;
      const st = statusOf(company, target.activity_key);
      if (st === "reviewed" || st === "not_applicable") continue;
      return {
        activityKey: target.activity_key,
        reason: `Siguiente paso del resultado “${evaluation.outcome.label}”.`,
      };
    }
  }
  const pendingIn = (keys: string[]) =>
    orderedActivities.find(
      (a) =>
        keys.includes(a.activity_key) &&
        statusOf(company, a.activity_key) !== "reviewed" &&
        statusOf(company, a.activity_key) !== "not_applicable" &&
        statusOf(company, a.activity_key) !== "blocked",
    );
  if (currentActivityKey) {
    const currentDomain = domainOf(currentActivityKey);
    if (currentDomain) {
      const next = pendingIn(
        orderedActivities
          .filter((a) => domainOf(a.activity_key) === currentDomain)
          .map((a) => a.activity_key),
      );
      if (next) {
        return {
          activityKey: next.activity_key,
          reason: "Siguiente pendiente dentro del dominio actual.",
        };
      }
    }
  }
  for (const dk of importedDomainKeys) {
    const next = pendingIn(
      orderedActivities
        .filter((a) => domainOf(a.activity_key) === dk)
        .map((a) => a.activity_key),
    );
    if (next) {
      return {
        activityKey: next.activity_key,
        reason: "Primera pendiente del próximo dominio con contenido.",
      };
    }
  }
  return null;
}

function shouldShowAction(condition: FactCondition, facts: FactMap): boolean {
  return evaluateCondition(condition, facts);
}
