import ruleCatalog from "./rules.json";
import { QUESTION_OPTION_MAP, TRIAGE_QUESTIONS } from "../catalog/questions";
import type { OrientationOrigin, OrientationReason, OrientationTarget, WorkspaceOrientationSignal } from "./types";

type RuleSource =
  | {
      kind: "triage";
      questionId: string;
      acceptedValues: readonly string[];
      originLabel: string;
    }
  | { kind: "workspace"; signalKey: string };

export interface OrientationRule {
  id: string;
  level: "amber" | "blue";
  source: RuleSource;
  target: OrientationTarget;
  message: string;
}

export const WORKSPACE_SIGNAL_KEYS = {
  mpiActive: "company.mpi_active",
  mpiBeingImplemented: "company.mpi_being_implemented",
  d3PolicyAssembled: "company.d3_policy_assembled",
  treatmentIdentified: "treatment.identified",
  treatmentActorsExist: "treatment.actors_exist",
  treatmentPurposesExist: "treatment.purposes_exist",
  treatmentSourcesExist: "treatment.sources_exist",
  treatmentLinkedDataExists: "treatment.linked_data_exists",
  treatmentRetentionRulesExist: "treatment.retention_rules_exist",
  d3ConsentRoute: "purpose.d3_consent_route",
  d3ConsentMechanismDesigned: "purpose.d3_consent_mechanism_designed",
  d4AutomatedUsesExist: "treatment.d4_automated_uses_exist",
  d4CoveredAutomatedUsesExist: "treatment.d4_covered_automated_uses_exist",
  d5SensitiveCandidate: "purpose.d5_sensitive_candidate",
  d5HealthBiologicalCandidate: "purpose.d5_health_biological_candidate",
  d5BiometricCandidate: "purpose.d5_biometric_candidate",
  d5MinorsCandidate: "purpose.d5_minors_candidate",
  d5ResearchCandidate: "purpose.d5_research_candidate",
  d5GeolocationCandidate: "purpose.d5_geolocation_candidate",
  d5TitleIIICandidate: "purpose.d5_titleIII_candidate",
  d6RelationshipExists: "treatment.d6_relationships_exist",
  d6CessionExists: "purpose.d6_cessions_exist",
  d6ProcessorExists: "treatment.d6_processors_exist",
  d6SubprocessorExists: "treatment.d6_subprocessors_exist",
} as const;

export const ORIENTATION_RULES = ruleCatalog as unknown as readonly OrientationRule[];

export function validateOrientationRuleCatalog(): string[] {
  const ids = new Set<string>();
  const workspaceKeys = new Set<string>(Object.values(WORKSPACE_SIGNAL_KEYS));
  const questionIds = new Set<string>(TRIAGE_QUESTIONS.map((question) => question.responseIds).flat());
  const issues: string[] = [];
  for (const rule of ORIENTATION_RULES) {
    if (ids.has(rule.id)) issues.push(`ID de regla duplicado: ${rule.id}`);
    ids.add(rule.id);
    if (rule.level !== "amber" && rule.level !== "blue") issues.push(`Nivel inválido: ${rule.id}`);
    if (!rule.message.trim()) issues.push(`Motivo vacío: ${rule.id}`);
    if (rule.source.kind === "triage" && rule.source.acceptedValues.length === 0) {
      issues.push(`Regla Triage sin valores aceptados: ${rule.id}`);
    }
    if (rule.source.kind === "triage") {
      if (!questionIds.has(rule.source.questionId)) {
        issues.push(`Pregunta Triage no definida: ${rule.id}`);
      }
      const options = QUESTION_OPTION_MAP[rule.source.questionId] ?? [];
      for (const value of rule.source.acceptedValues) {
        if (!options.some((option) => option.id === value)) {
          issues.push(`Opción Triage no definida (${value}): ${rule.id}`);
        }
      }
    } else if (!workspaceKeys.has(rule.source.signalKey)) {
      issues.push(`Señal de workspace no definida (${rule.source.signalKey}): ${rule.id}`);
    }
  }
  return issues;
}

export function matchesTriageRule(rule: OrientationRule, answers: Record<string, unknown>): boolean {
  if (rule.source.kind !== "triage") return false;
  const source = rule.source;
  const answer = answers[source.questionId];
  if (Array.isArray(answer)) {
    return answer.some((value) => typeof value === "string" && source.acceptedValues.includes(value));
  }
  return typeof answer === "string" && source.acceptedValues.includes(answer);
}

export function workspaceSourceOfRule(rule: OrientationRule): string | undefined {
  return rule.source.kind === "workspace" ? rule.source.signalKey : undefined;
}

export function buildReason(
  rule: OrientationRule,
  workspaceSignal?: WorkspaceOrientationSignal,
  answers?: Record<string, unknown>,
): OrientationReason {
  let origin: OrientationOrigin;
  if (rule.source.kind === "triage") {
    const source = rule.source;
    const answer = answers?.[source.questionId];
    const selected = Array.isArray(answer)
      ? answer.filter((value): value is string => typeof value === "string")
      : typeof answer === "string" ? [answer] : [];
    const selectedLabels = selected
      .filter((value) => source.acceptedValues.includes(value))
      .map((value) => QUESTION_OPTION_MAP[source.questionId]?.find((option) => option.id === value)?.label)
      .filter((value): value is string => value !== undefined);
    origin = {
      kind: "triage",
      label: selectedLabels.length > 0
        ? `${source.originLabel}: ${selectedLabels.join(", ")}`
        : source.originLabel,
    };
  } else {
    origin = {
      kind: "workspace",
      label: workspaceSignal?.label ?? "Antecedente del workspace",
      scope: workspaceSignal?.scope ?? "company",
      ...(workspaceSignal?.scopeLabel ? { scopeLabel: workspaceSignal.scopeLabel } : {}),
    };
  }
  return {
    id: rule.id,
    level: rule.level,
    target: rule.target,
    origin,
    message: rule.message,
  };
}
