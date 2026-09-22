/**
 * Modelo del workspace local Stage 1.
 *
 * Capa local por empresa sobre definiciones canónicas universales. No es
 * autenticación real ni Stage 2: perfiles y empresas los crea el usuario,
 * nada es ficticio, y todo es JSON-serializable para futura migración.
 * `ActivityDefinition` y el motor guiado permanecen intactos; este modelo
 * solo registra trabajo (estados, respuestas, ubicación).
 */

export type ActivityWorkStatus =
  | "not_started"
  | "in_review"
  | "reviewed"
  | "not_applicable"
  | "blocked";

export const ACTIVITY_WORK_STATUS_LABELS: Record<ActivityWorkStatus, string> = {
  not_started: "No iniciado",
  in_review: "En revisión",
  reviewed: "Revisado",
  not_applicable: "No aplica",
  blocked: "Bloqueado",
};

export const ACTIVITY_WORK_STATUSES: ActivityWorkStatus[] = [
  "not_started",
  "in_review",
  "reviewed",
  "not_applicable",
  "blocked",
];

/**
 * Hecho persistido con origen explícito. El origen nunca se mezcla
 * silenciosamente: `diagnostico` o la `protocol_key` que lo registró.
 */
export interface FactRecord {
  value: string;
  source: string;
  updatedAt: string;
}

export interface ActivityWorkState {
  status: ActivityWorkStatus;
  updatedAt: string;
}

/**
 * Resolución explícita Stage 1 de un fact en conflicto.
 * Decisión humana registrada con lo mínimo auditable: fact, valor
 * elegido, cuándo, qué alternativas existían y elección explícita.
 * No es historial Stage 2. Las observaciones originales no se borran;
 * una nueva observación contradictoria posterior reabre el conflicto.
 */
export interface FactResolution {
  factKey: string;
  value: string;
  resolvedAt: string;
  decidedBy: "professional";
  alternatives: FactRecord[];
}

export interface CompanyState {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activityStates: Record<string, ActivityWorkState>;
  protocolAnswers: Record<string, Record<string, FactRecord>>;
  diagnosticFacts: Record<string, FactRecord>;
  factResolutions: Record<string, FactResolution>;
  lastLocation?: string;
}

export interface LocalProfile {
  id: string;
  name: string;
  createdAt: string;
  companyIds: string[];
  activeCompanyId?: string;
}

export interface WorkspaceData {
  version: 1;
  profiles: LocalProfile[];
  activeProfileId?: string;
  companies: Record<string, CompanyState>;
}

export function emptyWorkspace(): WorkspaceData {
  return { version: 1, profiles: [], companies: {} };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function newCompany(name: string): CompanyState {
  const at = nowIso();
  return {
    id: newId("emp"),
    name: name.trim(),
    createdAt: at,
    updatedAt: at,
    activityStates: {},
    protocolAnswers: {},
    diagnosticFacts: {},
    factResolutions: {},
  };
}

export function newProfile(name: string): LocalProfile {
  return {
    id: newId("perfil"),
    name: name.trim(),
    createdAt: nowIso(),
    companyIds: [],
  };
}
