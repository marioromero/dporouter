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
  /** Colecciones locales D2. Ausentes = válidas (workspaces previos). */
  actors?: Record<string, ActorRecord>;
  dataItems?: Record<string, DataItemRecord>;
  sources?: Record<string, SourceRecord>;
  retentionRules?: Record<string, RetentionRuleRecord>;
  dataPurposeLinks?: DataPurposeLink[];
  /**
   * Usos automatizados locales D4.08/D4.09. Colección compartida por
   * ambas actividades dentro del mismo treatment. Ausente equivale
   * estructuralmente a vacía (workspaces previos). Ver ADR-052.
   */
  automatedUses?: AutomatedUseRecord[];
}

/** Estado scopeado de una finalidad: objeto + protocol state propio. */
export interface PurposeScopedState {
  purpose: TreatmentPurpose;
  protocolAnswers: Record<string, Record<string, FactRecord>>;
  reasoningRecords: Record<string, ProtocolReasoningRecord>;
  /**
   * Perfil contextual de regímenes especiales (Punto 0 D5, ADR-053).
   * Objeto local purpose-owned, NO entidad: sin IDs, sin colección,
   * sin lifecycle. Ausente = válido (workspaces legacy) y equivale a
   * todo `unknown`. Nunca guarda datos personales reales.
   */
  specialRegimeProfile?: SpecialRegimeProfile;
}

/**
 * Señal estructural tri-estado (Punto 0 D5, ADR-053).
 * Declaración del profesional sobre la naturaleza del dato o el
 * contexto de la finalidad. Nunca es conclusión jurídica; `unknown`
 * (o ausencia) jamás equivale a `no`.
 */
export type TriStateSignal = "yes" | "no" | "unknown";

/**
 * Contexto purpose-owned de regímenes especiales (Punto 0 D5).
 * Tres señales contextuales, siempre las tres juntas cuando el
 * objeto existe. Ver ADR-053 para semántica de cada campo.
 */
export interface SpecialRegimeProfile {
  biometricIdentificationUse: TriStateSignal;
  involvesMinors: TriStateSignal;
  researchPublicInterestCandidate: TriStateSignal;
}

/**
 * Value objects locales de un treatment. Viven solo dentro de su
 * TreatmentContext, con identidad local para edición y referencia
 * interna. Sin execution scope, workflow, reasoning, progreso,
 * lifecycle ni alcance global: NO son entidades jurídicas nuevas.
 */

/** Actor interviniente en el tratamiento (rol por actor×treatment). */
export interface ActorRecord {
  id: string;
  kind: "organization" | "person";
  name: string;
  /** Ausente = interviniente sin rol de tratamiento determinado. */
  role?: "responsible" | "processor";
  evidenceRef?: string;
}

/** Unidad local direccionable de datos dentro del tratamiento. */
export interface DataItemRecord {
  id: string;
  label: string;
  /** Atributo de agrupación, NO entidad. */
  category?: string;
  sourceRefs: string[];
  note?: string;
  /**
   * Características estructurales intrínsecas (Punto 0 D5, ADR-053).
   * Declaraciones sobre la naturaleza del dato para efectos de
   * análisis, NO conclusiones jurídicas y NO candidaturas D5.
   * Ausente = `unknown` (workspaces legacy). Ninguna señal se
   * infiere automáticamente desde otra: editar una jamás escribe
   * otra ni ningún canonical fact.
   */
  sensitive?: TriStateSignal;
  health?: TriStateSignal;
  biologicalProfile?: TriStateSignal;
  geolocation?: TriStateSignal;
}

/** Origen local de datos. Vocabulario cerrado canónico D2.04. */
export interface SourceRecord {
  id: string;
  kind: "data_subject" | "third_party_org" | "public_source" | "other";
  description: string;
  evidenceRef?: string;
}

/** Regla local de conservación sobre conjuntos de datos. */
export interface RetentionRuleRecord {
  id: string;
  dataItemIds: string[];
  /** Período o criterio textual. Nunca interpretar como fecha. */
  criterion: string;
  legalBasisRef?: string;
  event?: string;
  owner: string;
  exceptions?: string;
}

/** Relación dato↔finalidad. Owner: treatment. Sin entidad Matrix. */
export interface DataPurposeLink {
  dataId: string;
  purposeId: string;
}

/** Verificación objetiva ternaria de una salvaguarda local. */
export type SafeguardCheck = "yes" | "no" | "unknown";

/** Determinación profesional local de cobertura art. 8 bis. */
export type AutomatedUseCoverage = "covered" | "not_covered" | "unknown";

/** Vía legal determinada para un uso cubierto. */
export type AutomatedUseLegalPath =
  | "contract_necessary"
  | "explicit_consent"
  | "legal_authorization"
  | "none"
  | "unknown"
  | "not_applicable";

/** Verificaciones objetivas de salvaguardas D4.09 por uso cubierto. */
export interface AutomatedUseSafeguards {
  informationTransparency?: SafeguardCheck;
  explanation?: SafeguardCheck;
  humanIntervention?: SafeguardCheck;
  pointOfView?: SafeguardCheck;
  review?: SafeguardCheck;
  /** Canal/procedimiento de intervención. Escalar mínimo, sin workflow. */
  interventionChannel?: string;
  /** Canal/proceso de revisión. Escalar mínimo, sin workflow. */
  reviewChannel?: string;
}

/**
 * Uso automatizado local de un treatment (D4.08/D4.09). Value object
 * treatment-owned con identidad local para edición y referencia
 * interna. Sin execution scope, workflow, reasoning, progreso,
 * lifecycle, owner, deadline, historial ni alcance global: NO es una
 * entidad jurídica nueva. Ver ADR-052.
 *
 * Las determinaciones (`article8bisCoverage`, `legalPath`) son
 * profesionales, locales y subordinadas: no son canonical facts
 * independientes y editarlas no materializa efectos jurídicos. La
 * justificación conjunta vive en el único ReasoningRecord
 * treatment-scoped de D4.08; los agregados canónicos viven en facts
 * treatment-level materializados solo por finalización explícita.
 */
export interface AutomatedUseRecord {
  id: string;
  name: string;
  description?: string;
  /** Purpose del mismo treatment. Cross-parent se rechaza. */
  purposeId?: string;
  processDescription?: string;
  mechanismDescription?: string;
  decisionDescription?: string;
  profiling: SafeguardCheck;
  /** Referencia documental del uso, no evidencia de un titular. */
  evidenceRef?: string;
  article8bisCoverage: AutomatedUseCoverage;
  legalPath: AutomatedUseLegalPath;
  /** Solo corresponde cuando coverage = covered. */
  safeguards?: AutomatedUseSafeguards;
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
