/**
 * Contratos internos de Stage 1.
 *
 * Representan los contratos semánticos de `docs/DATA_CONTRACTS.md`
 * con sintaxis TypeScript. Ningún campo canónico se elimina aunque
 * todavía no se muestre en pantalla.
 *
 * Separaciones estructurales obligatorias:
 * - `ActivityDefinition` (universal) vs futura `ClientActivityInstance`
 *   (Stage 2, NO definida aquí).
 * - `conditions_applicability` separado de `activity_dependencies`.
 * - `unknown` nunca se coacciona a `false`.
 */

export type ActivityType = "assessment" | "implementation" | "monitoring";

export type EvidenceBasis = "legal_requirement" | "agency_standard";

export type RegulatoryStatus =
  | "current"
  | "transitional"
  | "pending_agency_guidance"
  | "pending_agency_instrument"
  | "pending_regulation"
  | "superseded";

export type DependencyScope = "same_domain" | "cross_domain";

export type DependencyType =
  | "execution_prerequisite"
  | "completion_dependency"
  | "input_dependency";

/** Respuesta de caracterización. `unknown` es un estado explícito. */
export type CharacterizationAnswer = "yes" | "no" | "unknown" | "not_applicable";

/**
 * Devuelve true solo ante un "no" explícito.
 * `unknown` y `not_applicable` nunca se tratan como negativos.
 */
export function isExplicitNegative(answer: CharacterizationAnswer | undefined): boolean {
  return answer === "no";
}

/** `true` solo cuando hay hechos que resuelven aplicabilidad en sentido afirmativo. */
export function isExplicitAffirmative(answer: CharacterizationAnswer | undefined): boolean {
  return answer === "yes";
}

export interface DomainDefinition {
  domain_key: string;
  human_code: string;
  name: string;
  objective: string;
  description: string;
  activity_keys: string[];
  related_domain_keys: string[];
}

export interface ActivityDependency {
  target_activity_key: string;
  scope: DependencyScope;
  type: DependencyType;
  condition: string;
  rationale: string;
}

export interface LegalBasis {
  source_id: string;
  source_name: string;
  article_or_provision: string;
  reference_text: string;
  source_url: string;
  basis_type: string;
  regulatory_status: RegulatoryStatus;
  last_verified_at: string;
}

export interface ReasoningRecord {
  conclusion: string;
  legal_question: string;
  facts_considered: string[];
  legal_factors: string[];
  evidence_refs: string[];
  alternatives_considered: string[];
  rationale: string;
  decided_by: string;
  reviewed_by: string;
  decided_at: string;
  legal_basis: LegalBasis[];
}

export interface ActivityDefinition {
  activity_key: string;
  human_code: string;
  name: string;
  objective: string;
  trigger_question: string;
  interlocutors: string[];
  data_collection_methods: string[];
  steps_operational: string[];
  evidence_required: string[];
  evidence_basis: EvidenceBasis;
  deliverable: string;
  estimated_time: string;
  complexity: string;
  legal_basis: LegalBasis[];
  applicable_role: string[];
  /** Hechos del caso que determinan aplicabilidad. NO son dependencias. */
  conditions_applicability: string[];
  reasoning_record_required: boolean;
  state_effect: string[];
  relationship_effect: string[];
  regulatory_status: RegulatoryStatus;
  last_legal_review: string;
  activity_type: ActivityType;
  /** Relaciones actividad → actividad. NO son condiciones de aplicabilidad. */
  activity_dependencies: ActivityDependency[];
}

export interface DiagnosticAttribute {
  key: string;
  label: string;
  question: string;
  answer_type: string;
  options: string[];
  source_type: string;
  legal_basis: LegalBasis[];
  derived_flags: string[];
  dependencies: string[];
  evidence_hint: string;
  last_legal_review: string;
  regulatory_status: RegulatoryStatus;
}

/**
 * Nota de frontera Stage 1 / Stage 2 (ADR-002, ADR-030):
 * `ClientActivityInstance` se introducirá en Stage 2 como historial
 * contextual que referencia `activity_key`. No se define aquí para
 * no anticipar comportamiento de Stage 2.
 */
export type CanonicalActivityKey = string;
