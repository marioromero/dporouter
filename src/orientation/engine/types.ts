import type { TriageAnswers } from "../state/types";

export type OrientationLevel = "amber" | "blue" | "gray";
export type OrientationScope = "company" | "treatment" | "purpose";

export type OrientationTarget =
  | { kind: "domain"; domainKey: string }
  | { kind: "activity"; activityKey: string };

export type OrientationOrigin =
  | { kind: "triage"; label: string }
  | { kind: "workspace"; label: string; scope: OrientationScope; scopeLabel?: string };

export interface OrientationReason {
  id: string;
  level: Exclude<OrientationLevel, "gray">;
  target: OrientationTarget;
  origin: OrientationOrigin;
  message: string;
}

export interface OrientationIndicator {
  level: OrientationLevel;
  reasons: OrientationReason[];
  contentAvailable?: boolean;
}

export interface WorkspaceOrientationSignal {
  key: string;
  label: string;
  scope: OrientationScope;
  scopeLabel?: string;
}

export interface OrientationEvaluationInput {
  answers: TriageAnswers;
  workspaceSignals: readonly WorkspaceOrientationSignal[];
}

export interface OrientationEvaluation {
  activities: Record<string, OrientationIndicator>;
  domains: Record<string, OrientationIndicator>;
}
