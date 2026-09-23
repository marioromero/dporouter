import type { ReasoningRecord } from "../types";

/**
 * Modelo del workspace local Stage 1.
 *
 * Capa local por empresa sobre definiciones canónicas universales. No es
 * autenticación real ni Stage 2: perfiles y empresas los crea el usuario,
 * nada es ficticio, y todo es JSON-serializable para futura migración.
 * `ActivityDefinition` y el motor guiado permanecen intactos; este modelo
 * solo registra trabajo (estados, respuestas, ubicación, razonamientos).
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
 * Registro de razonamiento profesional por protocolo y empresa.
 * Reutiliza íntegro el contrato canónico ReasoningRecord y añade solo
 * asociación (protocolo, actividad) y momento de registro. Todo es
 * JSON-serializable; la base jurídica se guarda como snapshot de la
 * actividad. No es historial Stage 2: una nueva adopción reemplaza.
 */
export interface ProtocolReasoningRecord extends ReasoningRecord {
  protocolKey: string;
  activityKey: string;
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
  /**
   * Dirección jurídica adjudicada. Ausente = company (registros
   * heredados). Una resolución solo rige en su dirección: nunca
   * resuelve silenciosamente el mismo factKey en otro scope.
   */
  scope?: ExecutionScope;
  treatmentId?: string;
  purposeId?: string;
}

/**
 * Execution scope cerrado Stage 1: el objeto jurídico principal que el
 * profesional analiza en una ejecución. Unión cerrada, sin strings
 * arbitrarios ni nesting genérico.
 */
export type ExecutionScope = "company" | "treatment" | "purpose";

/**
 * Objeto jurídico persistente: una operación de tratamiento concreta.
 * NO representa ejecución de trabajo: sin owner, deadlines, workflow,
 * historial, reaperturas, timeline ni auditoría longitudinal.
 */
export interface TreatmentContext {
  id: string;
  companyId: string;
  /** Identificador canónico D2.01 cuando corresponda asignarlo. */
  canonicalTreatmentId?: string;
  name: string;
  description?: string;
}

/**
 * Objeto jurídico hijo: una finalidad individual del tratamiento.
 * Sin workflow, progreso, owners, deadlines, timestamps de ejecución
 * ni historial.
 */
export interface TreatmentPurpose {
  id: string;
  treatmentId: string;
  description: string;
}

/** Estado scopeado de un tratamiento: contexto + protocol state propio. */
export interface TreatmentScopedState {
  context: TreatmentContext;
  protocolAnswers: Record<string, Record<string, FactRecord>>;
  reasoningRecords: Record<string, ProtocolReasoningRecord>;
  purposes: Record<string, PurposeScopedState>;
}

/** Estado scopeado de una finalidad: objeto + protocol state propio. */
export interface PurposeScopedState {
  purpose: TreatmentPurpose;
  protocolAnswers: Record<string, Record<string, FactRecord>>;
  reasoningRecords: Record<string, ProtocolReasoningRecord>;
}

/**
 * Contexto de ejecución válido. Unión discriminada: los contextos
 * incompletos (purpose sin treatment, treatment sin company) son
 * inexpresables. La pertenencia se verifica por recorrido estructural.
 */
export type ExecutionContext =
  | { scope: "company"; companyId: string }
  | { scope: "treatment"; companyId: string; treatmentId: string }
  | {
      scope: "purpose";
      companyId: string;
      treatmentId: string;
      purposeId: string;
    };

export interface CompanyState {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activityStates: Record<string, ActivityWorkState>;
  protocolAnswers: Record<string, Record<string, FactRecord>>;
  diagnosticFacts: Record<string, FactRecord>;
  factResolutions: Record<string, FactResolution>;
  reasoningRecords: Record<string, ProtocolReasoningRecord>;
  lastLocation?: string;
  /**
   * Subárbol jurídico Stage 1. Ausencia = válido (workspaces previos,
   * D1-only). Nunca se crean treatments automáticamente ni se mueven
   * facts company. La selección activa es navegación, no fact.
   */
  treatments?: Record<string, TreatmentScopedState>;
  activeTreatmentId?: string;
  activePurposeId?: string;
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
    reasoningRecords: {},
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
