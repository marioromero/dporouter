import { ALL_ACTIVITIES, getCanonicalActivity, getDomainForActivity } from "../../../content/registry";
import { DOMAINS, getDomain } from "../../data/domains";
import type { OrientationEvaluation, OrientationIndicator, OrientationReason } from "./types";
import type { OrientationEvaluationInput } from "./types";
import {
  ORIENTATION_RULES,
  buildReason,
  matchesTriageRule,
  validateOrientationRuleCatalog,
  workspaceSourceOfRule,
} from "./rules";

function levelFor(reasons: readonly OrientationReason[]): OrientationIndicator["level"] {
  if (reasons.some((reason) => reason.level === "blue")) return "blue";
  if (reasons.some((reason) => reason.level === "amber")) return "amber";
  return "gray";
}

export function validateOrientationRuleTargets(): string[] {
  const issues: string[] = [...validateOrientationRuleCatalog()];
  for (const rule of ORIENTATION_RULES) {
    if (rule.target.kind === "activity" && !getCanonicalActivity(rule.target.activityKey)) {
      issues.push(`${rule.id}: actividad no definida (${rule.target.activityKey})`);
    }
    if (rule.target.kind === "domain" && !getDomain(rule.target.domainKey)) {
      issues.push(`${rule.id}: dominio no definido (${rule.target.domainKey})`);
    }
  }
  return issues;
}

export function evaluateOrientation(input: OrientationEvaluationInput): OrientationEvaluation {
  const targetIssues = validateOrientationRuleTargets();
  if (targetIssues.length > 0) {
    throw new Error(`Reglas de orientación con destinos inválidos: ${targetIssues.join("; ")}`);
  }

  const reasons: OrientationReason[] = [];
  for (const rule of ORIENTATION_RULES) {
    const workspaceKey = workspaceSourceOfRule(rule);
    if (workspaceKey) {
      for (const signal of input.workspaceSignals) {
        if (signal.key === workspaceKey) reasons.push(buildReason(rule, signal));
      }
    } else if (matchesTriageRule(rule, input.answers)) {
      reasons.push(buildReason(rule, undefined, input.answers));
    }
  }

  const activityReasons = new Map<string, OrientationReason[]>();
  const directDomainReasons = new Map<string, OrientationReason[]>();
  for (const reason of reasons) {
    if (reason.target.kind === "activity") {
      const resolvedDomain = getDomainForActivity(reason.target.activityKey);
      if (!resolvedDomain) {
        throw new Error(`No se puede ubicar ${reason.target.activityKey} en un dominio canónico.`);
      }
      const bucket = activityReasons.get(reason.target.activityKey) ?? [];
      bucket.push(reason);
      activityReasons.set(reason.target.activityKey, bucket);
    } else {
      const bucket = directDomainReasons.get(reason.target.domainKey) ?? [];
      bucket.push(reason);
      directDomainReasons.set(reason.target.domainKey, bucket);
    }
  }

  const activities: Record<string, OrientationIndicator> = {};
  for (const definition of ALL_ACTIVITIES) {
    const current = activityReasons.get(definition.activity_key) ?? [];
    activities[definition.activity_key] = { level: levelFor(current), reasons: current };
  }

  const domains: Record<string, OrientationIndicator> = {};
  for (const definition of DOMAINS) {
    const domainReasons = [...(directDomainReasons.get(definition.domain_key) ?? [])];
    for (const activityKey of definition.activity_keys) {
      domainReasons.push(...(activities[activityKey]?.reasons ?? []));
    }
    domains[definition.domain_key] = {
      level: levelFor(domainReasons),
      reasons: domainReasons,
      contentAvailable: definition.activity_keys.length > 0,
    };
  }
  return { activities, domains };
}
