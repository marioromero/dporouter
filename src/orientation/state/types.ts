export const ORIENTATION_STORAGE_KEY = "dporouter.orientation.v1";
export const ORIENTATION_SCHEMA_VERSION = 1 as const;
export const TRIAGE_QUESTIONNAIRE_VERSION = "1";

export type TriageAnswers = Record<string, unknown>;

export interface TriageEntry {
  questionnaireVersion: string;
  updatedAt: string;
  responses: TriageAnswers;
}

export interface TriageDocument {
  schemaVersion: typeof ORIENTATION_SCHEMA_VERSION;
  entries: Record<string, TriageEntry>;
  [key: string]: unknown;
}

export interface TriageScope {
  advisorId: string;
  companyId: string;
}

export function triageScopeKey(scope: TriageScope): string {
  return `${encodeURIComponent(scope.advisorId)}::${encodeURIComponent(scope.companyId)}`;
}
