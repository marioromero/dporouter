import { getTreatment, touchCompanyState } from "./scope";
import type {
  ActorRecord,
  AutomatedUseCoverage,
  AutomatedUseLegalPath,
  AutomatedUseRecord,
  AutomatedUseSafeguards,
  CessionAssessment,
  CompanyState,
  DataItemRecord,
  DataPurposeLink,
  ProcessorAssessment,
  RetentionRuleRecord,
  SafeguardCheck,
  SourceRecord,
  SubprocessorAssessment,
  ThirdPartyRelationshipRecord,
  ThirdPartyRelationshipType,
  TreatmentScopedState,
  TriStateSignal,
} from "./types";
import { newId } from "./types";
import {
  hasValidParent,
  indexRelationships,
  isInternationalDimension,
  isRelationshipType,
  isValidCessionAssessment,
  isValidProcessorAssessment,
  isValidSubprocessorAssessment,
  parentIssues,
  relationshipInvariantIssues,
} from "./thirdParty";

/**
 * CRUD de value objects locales D2/D4 dentro de un TreatmentContext.
 *
 * Funciones puras sobre CompanyState. Todas exigen treatment resuelto
 * por ancestry válida (`company → treatment`); ante treatment
 * inexistente o input inválido devuelven null sin mutar. Ninguna
 * genera facts, outcomes, progress ni toca D2.01 completion.
 * Hard-delete con purga técnica, sin historial.
 */

const ACTOR_KINDS = ["organization", "person"] as const;
const ACTOR_ROLES = ["responsible", "processor"] as const;
const SOURCE_KINDS = [
  "data_subject",
  "third_party_org",
  "public_source",
  "other",
] as const;
const USE_COVERAGES = ["covered", "not_covered", "unknown"] as const;
const USE_LEGAL_PATHS = [
  "contract_necessary",
  "explicit_consent",
  "legal_authorization",
  "none",
  "unknown",
  "not_applicable",
] as const;
const USE_CHECKS = ["yes", "no", "unknown"] as const;
/**
 * Señales estructurales tri-estado D5 (Punto 0, ADR-053). Vocabulario
 * cerrado compartido por DataItemRecord y SpecialRegimeProfile.
 */
const TRI_STATE_SIGNALS = ["yes", "no", "unknown"] as const;

export function isTriStateSignal(v: unknown): v is TriStateSignal {
  return (
    typeof v === "string" &&
    (TRI_STATE_SIGNALS as readonly string[]).includes(v)
  );
}
const SAFEGUARD_CHECK_FIELDS = [
  "informationTransparency",
  "explanation",
  "humanIntervention",
  "pointOfView",
  "review",
] as const;

/** Vocabularios cerrados canónicos (reutilizados por validación). */
export const LOCAL_VOCABS = {
  actorKinds: ACTOR_KINDS,
  actorRoles: ACTOR_ROLES,
  sourceKinds: SOURCE_KINDS,
  useCoverages: USE_COVERAGES,
  useLegalPaths: USE_LEGAL_PATHS,
  safeguardChecks: USE_CHECKS,
  triStateSignals: TRI_STATE_SIGNALS,
};

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

function withTreatment(
  company: CompanyState,
  treatmentId: string,
  fn: (t: TreatmentScopedState) => TreatmentScopedState | null,
): CompanyState | null {
  const t = getTreatment(company, treatmentId);
  if (!t) return null;
  const next = fn(t);
  if (!next) return null;
  return touchCompanyState({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [treatmentId]: next,
    },
  });
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

export interface ActorInput {
  kind: "organization" | "person";
  name: string;
  role?: "responsible" | "processor" | null;
  evidenceRef?: string;
}

export function addActor(
  company: CompanyState,
  treatmentId: string,
  input: ActorInput,
): { company: CompanyState; id: string } | null {
  if (!ACTOR_KINDS.includes(input.kind)) return null;
  if (!nonEmpty(input.name)) return null;
  if (
    input.role !== undefined &&
    input.role !== null &&
    !ACTOR_ROLES.includes(input.role)
  ) {
    return null;
  }
  const id = newId("actor");
  const record: ActorRecord = {
    id,
    kind: input.kind,
    name: input.name.trim(),
    ...(input.role ? { role: input.role } : {}),
    ...(nonEmpty(input.evidenceRef) ? { evidenceRef: input.evidenceRef } : {}),
  };
  const next = withTreatment(company, treatmentId, (t) => ({
    ...t,
    actors: { ...(t.actors ?? {}), [id]: record },
  }));
  return next ? { company: next, id } : null;
}

export function updateActor(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: {
    kind?: "organization" | "person";
    name?: string;
    role?: "responsible" | "processor" | null;
    evidenceRef?: string | null;
  },
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const current = t.actors?.[id];
    if (!current) return null;
    if (patch.kind !== undefined && !ACTOR_KINDS.includes(patch.kind)) {
      return null;
    }
    if (patch.name !== undefined && !nonEmpty(patch.name)) return null;
    if (
      patch.role !== undefined &&
      patch.role !== null &&
      !ACTOR_ROLES.includes(patch.role)
    ) {
      return null;
    }
    if (patch.evidenceRef !== undefined && patch.evidenceRef !== null && !nonEmpty(patch.evidenceRef)) {
      return null;
    }
    const record: ActorRecord = {
      ...current,
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.evidenceRef !== undefined && nonEmpty(patch.evidenceRef)
        ? { evidenceRef: patch.evidenceRef }
        : {}),
    };
    if (patch.role !== undefined) {
      if (patch.role === null) delete record.role;
      else record.role = patch.role;
    }
    if (patch.evidenceRef === null) delete record.evidenceRef;
    return {
      ...t,
      actors: { ...(t.actors ?? {}), [id]: record },
    };
  });
}

/** El rol muere con la entrada; sin refs externas que purgar, salvo relationships D6. */
export function deleteActor(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    if (!t.actors?.[id]) return null;
    // Punto 0 D6 (ADR-054): un actor referenciado por ≥1 relationship
    // no puede eliminarse en silencio (ni cascade ni strip). El
    // profesional debe eliminar/reasignar relationships primero.
    if ((t.thirdPartyRelationships ?? []).some((r) => r.actorId === id)) {
      return null;
    }
    const actors = { ...t.actors };
    delete actors[id];
    return { ...t, actors };
  });
}

// ---------------------------------------------------------------------------
// Data items
// ---------------------------------------------------------------------------

export interface DataItemInput {
  label: string;
  category?: string;
  sourceRefs?: string[];
  note?: string;
  /**
   * Características estructurales D5 (Punto 0). Cada una ausente =
   * `unknown`. Valor inválido rechaza la creación (null).
   */
  sensitive?: TriStateSignal;
  health?: TriStateSignal;
  biologicalProfile?: TriStateSignal;
  geolocation?: TriStateSignal;
}

export interface DataItemSignalPatch {
  sensitive?: TriStateSignal;
  health?: TriStateSignal;
  biologicalProfile?: TriStateSignal;
  geolocation?: TriStateSignal;
}

function cleanSourceRefs(
  t: TreatmentScopedState,
  refs: string[] | undefined,
): string[] | null {
  if (refs === undefined) return [];
  // Estricto como cleanDataRefs: no strings o duplicados rechazan.
  for (const r of refs) {
    if (typeof r !== "string") return null;
  }
  if (new Set(refs).size !== refs.length) return null;
  if (!refs.every((r) => t.sources?.[r] !== undefined)) return null;
  return [...refs];
}

export function addDataItem(
  company: CompanyState,
  treatmentId: string,
  input: DataItemInput,
): { company: CompanyState; id: string } | null {
  if (!nonEmpty(input.label)) return null;
  for (const s of [
    input.sensitive,
    input.health,
    input.biologicalProfile,
    input.geolocation,
  ]) {
    if (s !== undefined && !isTriStateSignal(s)) return null;
  }
  const id = newId("data");
  let out: { company: CompanyState; id: string } | null = null;
  const next = withTreatment(company, treatmentId, (t) => {
    const sourceRefs = cleanSourceRefs(t, input.sourceRefs);
    if (sourceRefs === null) return null;
    const record: DataItemRecord = {
      id,
      label: input.label.trim(),
      ...(nonEmpty(input.category) ? { category: input.category } : {}),
      sourceRefs,
      ...(nonEmpty(input.note) ? { note: input.note } : {}),
      // Estado inicial explícito: las cuatro señales quedan unknown.
      // Ausencia también equivale a unknown (legacy); sin inferencias.
      sensitive: input.sensitive ?? "unknown",
      health: input.health ?? "unknown",
      biologicalProfile: input.biologicalProfile ?? "unknown",
      geolocation: input.geolocation ?? "unknown",
    };
    return { ...t, dataItems: { ...(t.dataItems ?? {}), [id]: record } };
  });
  if (next) out = { company: next, id };
  return out;
}

export function updateDataItem(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: {
    label?: string;
    category?: string | null;
    sourceRefs?: string[];
    note?: string | null;
  } & DataItemSignalPatch,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const current = t.dataItems?.[id];
    if (!current) return null;
    if (patch.label !== undefined && !nonEmpty(patch.label)) return null;
    if (patch.note !== undefined && patch.note !== null && !nonEmpty(patch.note)) {
      return null;
    }
    // Señales estructurales: valor inválido rechaza; NUNCA se infiere
    // ni se propaga a otra señal. Editar una no toca las demás ni
    // escribe facts, reasoning ni effects.
    for (const s of [
      patch.sensitive,
      patch.health,
      patch.biologicalProfile,
      patch.geolocation,
    ]) {
      if (s !== undefined && !isTriStateSignal(s)) return null;
    }
    let sourceRefs = current.sourceRefs;
    if (patch.sourceRefs !== undefined) {
      const cleaned = cleanSourceRefs(t, patch.sourceRefs);
      if (cleaned === null) return null;
      sourceRefs = cleaned;
    }
    const record: DataItemRecord = {
      ...current,
      ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
      sourceRefs,
      ...(nonEmpty(patch.note) ? { note: patch.note } : {}),
      ...(patch.sensitive !== undefined ? { sensitive: patch.sensitive } : {}),
      ...(patch.health !== undefined ? { health: patch.health } : {}),
      ...(patch.biologicalProfile !== undefined
        ? { biologicalProfile: patch.biologicalProfile }
        : {}),
      ...(patch.geolocation !== undefined ? { geolocation: patch.geolocation } : {}),
    };
    if (patch.category !== undefined) {
      if (patch.category === null) delete record.category;
      else if (nonEmpty(patch.category)) record.category = patch.category;
      else return null;
    }
    if (patch.note === null) delete record.note;
    return { ...t, dataItems: { ...(t.dataItems ?? {}), [id]: record } };
  });
}

/**
 * Purga técnica: remueve links, strip del ID en reglas y en
 * relationships D6. Las reglas que queden vacías se conservan (el
 * profesional decide eliminarlas).
 */
export function deleteDataItem(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    if (!t.dataItems?.[id]) return null;
    const dataItems = { ...t.dataItems };
    delete dataItems[id];
    const dataPurposeLinks = (t.dataPurposeLinks ?? []).filter(
      (l) => l.dataId !== id,
    );
    const retentionRules: TreatmentScopedState["retentionRules"] = {};
    for (const [rk, r] of Object.entries(t.retentionRules ?? {})) {
      retentionRules[rk] = {
        ...r,
        dataItemIds: r.dataItemIds.filter((d) => d !== id),
      };
    }
    // Punto 0 D6: strip sin auto-delete de la relationship.
    // Ausencia legacy se preserva (no se materializa colección vacía).
    const stripped = { ...t, dataItems, dataPurposeLinks, retentionRules };
    if (t.thirdPartyRelationships !== undefined) {
      stripped.thirdPartyRelationships = t.thirdPartyRelationships.map((r) =>
        r.dataItemIds.includes(id)
          ? { ...r, dataItemIds: r.dataItemIds.filter((d) => d !== id) }
          : r,
      );
    }
    return stripped;
  });
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export interface SourceInput {
  kind: "data_subject" | "third_party_org" | "public_source" | "other";
  description: string;
  evidenceRef?: string;
}

export function addSource(
  company: CompanyState,
  treatmentId: string,
  input: SourceInput,
): { company: CompanyState; id: string } | null {
  if (!SOURCE_KINDS.includes(input.kind)) return null;
  if (!nonEmpty(input.description)) return null;
  const id = newId("src");
  const record: SourceRecord = {
    id,
    kind: input.kind,
    description: input.description.trim(),
    ...(nonEmpty(input.evidenceRef) ? { evidenceRef: input.evidenceRef } : {}),
  };
  const next = withTreatment(company, treatmentId, (t) => ({
    ...t,
    sources: { ...(t.sources ?? {}), [id]: record },
  }));
  return next ? { company: next, id } : null;
}

export function updateSource(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: {
    kind?: SourceRecord["kind"];
    description?: string;
    evidenceRef?: string | null;
  },
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const current = t.sources?.[id];
    if (!current) return null;
    if (patch.kind !== undefined && !SOURCE_KINDS.includes(patch.kind)) {
      return null;
    }
    if (patch.description !== undefined && !nonEmpty(patch.description)) {
      return null;
    }
    if (patch.evidenceRef !== undefined && patch.evidenceRef !== null && !nonEmpty(patch.evidenceRef)) {
      return null;
    }
    const record: SourceRecord = {
      ...current,
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description.trim() }
        : {}),
      ...(patch.evidenceRef !== undefined && nonEmpty(patch.evidenceRef)
        ? { evidenceRef: patch.evidenceRef }
        : {}),
    };
    if (patch.evidenceRef === null) delete record.evidenceRef;
    return { ...t, sources: { ...(t.sources ?? {}), [id]: record } };
  });
}

/** Strip de sourceRefs; los dataItems se conservan. */
export function deleteSource(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    if (!t.sources?.[id]) return null;
    const sources = { ...t.sources };
    delete sources[id];
    const dataItems: TreatmentScopedState["dataItems"] = {};
    for (const [dk, d] of Object.entries(t.dataItems ?? {})) {
      dataItems[dk] = { ...d, sourceRefs: d.sourceRefs.filter((s) => s !== id) };
    }
    return { ...t, sources, dataItems };
  });
}

// ---------------------------------------------------------------------------
// Retention rules
// ---------------------------------------------------------------------------

export interface RetentionRuleInput {
  dataItemIds: string[];
  criterion: string;
  legalBasisRef?: string;
  event?: string;
  owner: string;
  exceptions?: string;
}

function cleanDataRefs(
  t: TreatmentScopedState,
  refs: string[],
): string[] | null {
  const items = dedupe(refs).filter((r) => typeof r === "string");
  if (items.length !== refs.length) return null;
  if (!items.every((r) => t.dataItems?.[r] !== undefined)) return null;
  return items;
}

export function addRetentionRule(
  company: CompanyState,
  treatmentId: string,
  input: RetentionRuleInput,
): { company: CompanyState; id: string } | null {
  if (!nonEmpty(input.criterion) || !nonEmpty(input.owner)) return null;
  const id = newId("rule");
  let out: { company: CompanyState; id: string } | null = null;
  const next = withTreatment(company, treatmentId, (t) => {
    const dataItemIds = cleanDataRefs(t, input.dataItemIds);
    if (dataItemIds === null || dataItemIds.length === 0) return null;
    const record: RetentionRuleRecord = {
      id,
      dataItemIds,
      criterion: input.criterion.trim(),
      ...(nonEmpty(input.legalBasisRef)
        ? { legalBasisRef: input.legalBasisRef }
        : {}),
      ...(nonEmpty(input.event) ? { event: input.event } : {}),
      owner: input.owner.trim(),
      ...(nonEmpty(input.exceptions) ? { exceptions: input.exceptions } : {}),
    };
    return {
      ...t,
      retentionRules: { ...(t.retentionRules ?? {}), [id]: record },
    };
  });
  if (next) out = { company: next, id };
  return out;
}

export function updateRetentionRule(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: {
    dataItemIds?: string[];
    criterion?: string;
    legalBasisRef?: string | null;
    event?: string | null;
    owner?: string;
    exceptions?: string | null;
  },
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const current = t.retentionRules?.[id];
    if (!current) return null;
    if (patch.criterion !== undefined && !nonEmpty(patch.criterion)) return null;
    if (patch.owner !== undefined && !nonEmpty(patch.owner)) return null;
    for (const f of [patch.event, patch.legalBasisRef, patch.exceptions] as const) {
      if (f !== undefined && f !== null && !nonEmpty(f)) return null;
    }
    let dataItemIds = current.dataItemIds;
    if (patch.dataItemIds !== undefined) {
      const cleaned = cleanDataRefs(t, patch.dataItemIds);
      if (cleaned === null || cleaned.length === 0) return null;
      dataItemIds = cleaned;
    }
    const record: RetentionRuleRecord = {
      ...current,
      dataItemIds,
      ...(patch.criterion !== undefined
        ? { criterion: patch.criterion.trim() }
        : {}),
      ...(patch.owner !== undefined ? { owner: patch.owner.trim() } : {}),
      ...(patch.event !== undefined && nonEmpty(patch.event)
        ? { event: patch.event }
        : {}),
      ...(patch.legalBasisRef !== undefined && nonEmpty(patch.legalBasisRef)
        ? { legalBasisRef: patch.legalBasisRef }
        : {}),
      ...(patch.exceptions !== undefined && nonEmpty(patch.exceptions)
        ? { exceptions: patch.exceptions }
        : {}),
    };
    if (patch.event === null) delete record.event;
    if (patch.legalBasisRef === null) delete record.legalBasisRef;
    if (patch.exceptions === null) delete record.exceptions;
    return {
      ...t,
      retentionRules: { ...(t.retentionRules ?? {}), [id]: record },
    };
  });
}

export function deleteRetentionRule(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    if (!t.retentionRules?.[id]) return null;
    const retentionRules = { ...t.retentionRules };
    delete retentionRules[id];
    return { ...t, retentionRules };
  });
}

// ---------------------------------------------------------------------------
// Data ↔ purpose links
// ---------------------------------------------------------------------------

export function addDataPurposeLink(
  company: CompanyState,
  treatmentId: string,
  link: DataPurposeLink,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    if (t.dataItems?.[link.dataId] === undefined) return null;
    // Purpose siempre validado con parent treatment (sin lookup global).
    if (t.purposes[link.purposeId] === undefined) return null;
    const links = t.dataPurposeLinks ?? [];
    if (
      links.some((l) => l.dataId === link.dataId && l.purposeId === link.purposeId)
    ) {
      return null;
    }
    return {
      ...t,
      dataPurposeLinks: [...links, { dataId: link.dataId, purposeId: link.purposeId }],
    };
  });
}

export function removeDataPurposeLink(
  company: CompanyState,
  treatmentId: string,
  link: DataPurposeLink,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const links = t.dataPurposeLinks ?? [];
    if (
      !links.some((l) => l.dataId === link.dataId && l.purposeId === link.purposeId)
    ) {
      // Ausente: no-op puro sin ensuciar updatedAt.
      return null;
    }
    return {
      ...t,
      dataPurposeLinks: links.filter(
        (l) => !(l.dataId === link.dataId && l.purposeId === link.purposeId),
      ),
    };
  });
}

// ---------------------------------------------------------------------------
// Automated uses (D4.08/D4.09): colección local compartida del treatment
// ---------------------------------------------------------------------------

/**
 * Matriz coverage → legalPath permitidos. Única fuente de la
 * invariante, reutilizada por operaciones e import.
 */
const COVERAGE_PATHS: Record<
  AutomatedUseCoverage,
  readonly AutomatedUseLegalPath[]
> = {
  covered: [
    "contract_necessary",
    "explicit_consent",
    "legal_authorization",
    "none",
    "unknown",
  ],
  not_covered: ["not_applicable"],
  unknown: ["unknown"],
};

/** Invariante coverage/legalPath. */
export function isValidCoveragePath(
  coverage: AutomatedUseCoverage,
  path: AutomatedUseLegalPath,
): boolean {
  return COVERAGE_PATHS[coverage].includes(path);
}

function isCheck(v: unknown): v is SafeguardCheck {
  return (
    typeof v === "string" && (USE_CHECKS as readonly string[]).includes(v)
  );
}

function isOptionalText(v: unknown): boolean {
  return v === undefined || typeof v === "string";
}

/** Safeguards válido: checks ternarios + canales escalares no vacíos. */
function checkSafeguardsInput(v: unknown): v is AutomatedUseSafeguards {
  if (v === undefined || v === null) return false;
  if (typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  for (const f of SAFEGUARD_CHECK_FIELDS) {
    if (s[f] !== undefined && !isCheck(s[f])) return false;
  }
  for (const f of ["interventionChannel", "reviewChannel"] as const) {
    if (s[f] !== undefined && !nonEmpty(s[f])) return false;
  }
  return true;
}

export interface AutomatedUseInput {
  name: string;
  description?: string;
  purposeId?: string;
  processDescription?: string;
  mechanismDescription?: string;
  decisionDescription?: string;
  profiling?: SafeguardCheck;
  evidenceRef?: string;
}

function cleanUsePurpose(
  t: TreatmentScopedState,
  purposeId: string | undefined,
): string | undefined | null {
  if (purposeId === undefined) return undefined;
  // Solo purposes del mismo treatment: sin lookup global, cross-parent
  // se rechaza por construcción.
  if (typeof purposeId !== "string" || t.purposes[purposeId] === undefined) {
    return null;
  }
  return purposeId;
}

export function addAutomatedUse(
  company: CompanyState,
  treatmentId: string,
  input: AutomatedUseInput,
): { company: CompanyState; id: string } | null {
  if (!nonEmpty(input.name)) return null;
  if (input.profiling !== undefined && !isCheck(input.profiling)) return null;
  for (const f of [
    input.description,
    input.processDescription,
    input.mechanismDescription,
    input.decisionDescription,
  ]) {
    if (!isOptionalText(f)) return null;
  }
  if (input.evidenceRef !== undefined && !nonEmpty(input.evidenceRef)) {
    return null;
  }
  const id = newId("autouse");
  let out: { company: CompanyState; id: string } | null = null;
  const next = withTreatment(company, treatmentId, (t) => {
    const purposeId = cleanUsePurpose(t, input.purposeId);
    if (purposeId === null) return null;
    const record: AutomatedUseRecord = {
      id,
      name: input.name.trim(),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(purposeId !== undefined ? { purposeId } : {}),
      ...(input.processDescription !== undefined
        ? { processDescription: input.processDescription }
        : {}),
      ...(input.mechanismDescription !== undefined
        ? { mechanismDescription: input.mechanismDescription }
        : {}),
      ...(input.decisionDescription !== undefined
        ? { decisionDescription: input.decisionDescription }
        : {}),
      profiling: input.profiling ?? "unknown",
      ...(nonEmpty(input.evidenceRef) ? { evidenceRef: input.evidenceRef } : {}),
      // Estado inicial: sin clasificación; safeguards ausente.
      article8bisCoverage: "unknown",
      legalPath: "unknown",
    };
    return { ...t, automatedUses: [...(t.automatedUses ?? []), record] };
  });
  if (next) out = { company: next, id };
  return out;
}

export interface AutomatedUsePatch {
  name?: string;
  description?: string | null;
  purposeId?: string | null;
  processDescription?: string | null;
  mechanismDescription?: string | null;
  decisionDescription?: string | null;
  profiling?: SafeguardCheck;
  evidenceRef?: string | null;
  article8bisCoverage?: AutomatedUseCoverage;
  legalPath?: AutomatedUseLegalPath;
  /** null retira safeguards; objeto las reemplaza íntegras. */
  safeguards?: AutomatedUseSafeguards | null;
}

function cleanSafeguardsPatch(
  v: AutomatedUseSafeguards | null,
): AutomatedUseSafeguards | null {
  if (v === null) return null;
  const out: AutomatedUseSafeguards = {};
  for (const f of SAFEGUARD_CHECK_FIELDS) {
    if (v[f] !== undefined) out[f] = v[f];
  }
  if (nonEmpty(v.interventionChannel)) {
    out.interventionChannel = v.interventionChannel;
  }
  if (nonEmpty(v.reviewChannel)) out.reviewChannel = v.reviewChannel;
  return out;
}

/**
 * Edición con invariantes en una única actualización consistente.
 * Cambiar cobertura normaliza vía y safeguards (sin arrastrar
 * determinaciones antiguas); safeguards solo vive en covered.
 * Nada genera facts ni efectos: la escritura canónica sigue
 * reservada a finalización explícita.
 */
export function updateAutomatedUse(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: AutomatedUsePatch,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const uses = t.automatedUses ?? [];
    const idx = uses.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    const current = uses[idx];
    if (patch.name !== undefined && !nonEmpty(patch.name)) return null;
    if (patch.profiling !== undefined && !isCheck(patch.profiling)) return null;
    for (const f of [
      patch.description,
      patch.processDescription,
      patch.mechanismDescription,
      patch.decisionDescription,
    ]) {
      if (f !== undefined && f !== null && !isOptionalText(f)) return null;
    }
    if (
      patch.evidenceRef !== undefined &&
      patch.evidenceRef !== null &&
      !nonEmpty(patch.evidenceRef)
    ) {
      return null;
    }
    if (
      patch.article8bisCoverage !== undefined &&
      !(USE_COVERAGES as readonly string[]).includes(patch.article8bisCoverage)
    ) {
      return null;
    }
    if (
      patch.legalPath !== undefined &&
      !(USE_LEGAL_PATHS as readonly string[]).includes(patch.legalPath)
    ) {
      return null;
    }
    if (
      patch.safeguards !== undefined &&
      patch.safeguards !== null &&
      !checkSafeguardsInput(patch.safeguards)
    ) {
      return null;
    }
    let purposeId = current.purposeId;
    if (patch.purposeId !== undefined) {
      if (patch.purposeId === null) {
        purposeId = undefined;
      } else {
        const cleaned = cleanUsePurpose(t, patch.purposeId);
        if (cleaned === null || cleaned === undefined) return null;
        purposeId = cleaned;
      }
    }
    // Cobertura y vía resultantes.
    let coverage = current.article8bisCoverage;
    let path = current.legalPath;
    const coverageChanged =
      patch.article8bisCoverage !== undefined &&
      patch.article8bisCoverage !== current.article8bisCoverage;
    if (coverageChanged) {
      coverage = patch.article8bisCoverage as AutomatedUseCoverage;
      if (coverage === "not_covered") {
        if (
          patch.legalPath !== undefined &&
          patch.legalPath !== "not_applicable"
        ) {
          return null;
        }
        path = "not_applicable";
      } else if (coverage === "unknown") {
        if (patch.legalPath !== undefined && patch.legalPath !== "unknown") {
          return null;
        }
        path = "unknown";
      } else {
        // covered: no arrastrar vía antigua; explícita validada o unknown.
        if (patch.legalPath !== undefined) {
          if (!isValidCoveragePath("covered", patch.legalPath)) return null;
          path = patch.legalPath;
        } else {
          path = "unknown";
        }
      }
    } else if (patch.legalPath !== undefined) {
      if (!isValidCoveragePath(coverage, patch.legalPath)) return null;
      path = patch.legalPath;
    }
    // Safeguards resultantes: solo en covered.
    let safeguards = current.safeguards;
    if (coverageChanged && coverage !== "covered") {
      if (patch.safeguards !== undefined && patch.safeguards !== null) {
        return null;
      }
      safeguards = undefined;
    } else if (patch.safeguards !== undefined) {
      if (coverage !== "covered") return null;
      safeguards =
        patch.safeguards === null
          ? undefined
          : (cleanSafeguardsPatch(patch.safeguards) ?? undefined);
    }
    if (!isValidCoveragePath(coverage, path)) return null;
    if (safeguards !== undefined && coverage !== "covered") return null;
    const record: AutomatedUseRecord = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.profiling !== undefined ? { profiling: patch.profiling } : {}),
      article8bisCoverage: coverage,
      legalPath: path,
      ...(safeguards !== undefined ? { safeguards } : {}),
    };
    if (purposeId === undefined) delete record.purposeId;
    else record.purposeId = purposeId;
    for (const [field, value] of [
      ["description", patch.description],
      ["processDescription", patch.processDescription],
      ["mechanismDescription", patch.mechanismDescription],
      ["decisionDescription", patch.decisionDescription],
    ] as const) {
      if (value === null) delete record[field];
      else if (value !== undefined) record[field] = value;
    }
    if (patch.evidenceRef === null) delete record.evidenceRef;
    else if (nonEmpty(patch.evidenceRef)) {
      record.evidenceRef = patch.evidenceRef as string;
    }
    if (safeguards === undefined) delete record.safeguards;
    const next = [...uses];
    next[idx] = record;
    return { ...t, automatedUses: next };
  });
}

/** Lectura direccionada por ancestry válida; cross-parent imposible. */
export function getAutomatedUse(
  company: CompanyState,
  treatmentId: string,
  id: string,
): AutomatedUseRecord | undefined {
  return getTreatment(company, treatmentId)?.automatedUses?.find(
    (u) => u.id === id,
  );
}

/**
 * Hard-delete: el uso muere con sus determinaciones y safeguards.
 * Sin tombstone, sin historial, sin cascada a otros treatments. Los
 * agregados canónicos ya materializados no se reescriben: una
 * evaluación finalizada deja de representar la colección hasta una
 * nueva revisión (responsabilidad del futuro protocolo, no escritura
 * automática).
 */
export function deleteAutomatedUse(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const uses = t.automatedUses ?? [];
    if (!uses.some((u) => u.id === id)) return null;
    return { ...t, automatedUses: uses.filter((u) => u.id !== id) };
  });
}

// ---------------------------------------------------------------------------
// Third-party relationships (D6.01–D6.07, Punto 0, ADR-054)
// ---------------------------------------------------------------------------

export interface ThirdPartyRelationshipInput {
  actorId: string;
  label: string;
  relationshipType?: ThirdPartyRelationshipType;
  purposeIds?: string[];
  dataItemIds?: string[];
  internationalDimension?: TriStateSignal;
  parentRelationshipId?: string;
  evidenceRef?: string;
  cessionAssessment?: CessionAssessment;
  processorAssessment?: ProcessorAssessment;
  subprocessorAssessment?: SubprocessorAssessment;
}

export interface ThirdPartyRelationshipPatch {
  actorId?: string;
  label?: string;
  relationshipType?: ThirdPartyRelationshipType;
  purposeIds?: string[];
  dataItemIds?: string[];
  internationalDimension?: TriStateSignal;
  /** null retira el parent. */
  parentRelationshipId?: string | null;
  /** null retira la referencia. */
  evidenceRef?: string | null;
  /** null retira el objeto; parcial fusiona sobre el vigente compatible. */
  cessionAssessment?: Partial<CessionAssessment> | null;
  processorAssessment?: Partial<ProcessorAssessment> | null;
  subprocessorAssessment?: Partial<SubprocessorAssessment> | null;
}

/** Refs multi-valued: strings únicos existentes en el conjunto válido. */
function cleanRelRefs(
  refs: string[] | undefined,
  valid: ReadonlySet<string>,
): string[] | null {
  if (refs === undefined) return [];
  if (!Array.isArray(refs)) return null;
  const seen = new Set<string>();
  for (const r of refs) {
    if (typeof r !== "string" || seen.has(r) || !valid.has(r)) return null;
    seen.add(r);
  }
  return [...seen];
}

/**
 * Valida un record candidato contra el treatment: actor/purposes/data
 * existentes mismo-treatment, enums, invariante tipo↔assessments↔parent
 * y padre válido (existente, tipo compatible, acíclico). `siblings` es
 * la colección con el candidato ya sustituido (para ciclos en update).
 */
function checkRelationshipCandidate(
  t: TreatmentScopedState,
  candidate: ThirdPartyRelationshipRecord,
  siblings: readonly ThirdPartyRelationshipRecord[],
): boolean {
  if (typeof candidate.id !== "string" || candidate.id.trim() === "") return false;
  if (!t.actors?.[candidate.actorId]) return false;
  if (!nonEmpty(candidate.label)) return false;
  if (!isRelationshipType(candidate.relationshipType)) return false;
  if (!isInternationalDimension(candidate.internationalDimension)) return false;
  const purposeIds = new Set(Object.keys(t.purposes ?? {}));
  const dataIds = new Set(Object.keys(t.dataItems ?? {}));
  if (!cleanRelRefs(candidate.purposeIds, purposeIds)) return false;
  // Duplicados en refs se rechazan (estricto, como cleanSourceRefs).
  if (
    !Array.isArray(candidate.purposeIds) ||
    new Set(candidate.purposeIds).size !== candidate.purposeIds.length
  ) {
    return false;
  }
  if (
    !Array.isArray(candidate.dataItemIds) ||
    new Set(candidate.dataItemIds).size !== candidate.dataItemIds.length ||
    !candidate.dataItemIds.every((d) => dataIds.has(d))
  ) {
    return false;
  }
  if (
    candidate.evidenceRef !== undefined &&
    typeof candidate.evidenceRef !== "string"
  ) {
    return false;
  }
  if (relationshipInvariantIssues(candidate).length > 0) return false;
  const byId = indexRelationships(siblings);
  if (parentIssues(candidate, byId).length > 0) return false;
  return true;
}

function buildRelationshipRecord(
  id: string,
  input: {
    actorId: string;
    label: string;
    relationshipType: ThirdPartyRelationshipType;
    purposeIds: string[];
    dataItemIds: string[];
    internationalDimension: TriStateSignal;
    parentRelationshipId?: string;
    evidenceRef?: string;
    cessionAssessment?: CessionAssessment;
    processorAssessment?: ProcessorAssessment;
    subprocessorAssessment?: SubprocessorAssessment;
  },
): ThirdPartyRelationshipRecord {
  const record: ThirdPartyRelationshipRecord = {
    id,
    actorId: input.actorId,
    label: input.label.trim(),
    relationshipType: input.relationshipType,
    purposeIds: input.purposeIds,
    dataItemIds: input.dataItemIds,
    internationalDimension: input.internationalDimension,
    ...(input.parentRelationshipId !== undefined
      ? { parentRelationshipId: input.parentRelationshipId }
      : {}),
    ...(nonEmpty(input.evidenceRef) ? { evidenceRef: input.evidenceRef as string } : {}),
    ...(input.cessionAssessment !== undefined
      ? { cessionAssessment: input.cessionAssessment }
      : {}),
    ...(input.processorAssessment !== undefined
      ? { processorAssessment: input.processorAssessment }
      : {}),
    ...(input.subprocessorAssessment !== undefined
      ? { subprocessorAssessment: input.subprocessorAssessment }
      : {}),
  };
  return record;
}

export function addThirdPartyRelationship(
  company: CompanyState,
  treatmentId: string,
  input: ThirdPartyRelationshipInput,
): { company: CompanyState; id: string } | null {
  if (typeof input.actorId !== "string" || !nonEmpty(input.label)) return null;
  const type = input.relationshipType ?? "unknown";
  if (!isRelationshipType(type)) return null;
  const intl = input.internationalDimension ?? "unknown";
  if (!isInternationalDimension(intl)) return null;
  if (
    input.cessionAssessment !== undefined &&
    !isValidCessionAssessment(input.cessionAssessment)
  ) {
    return null;
  }
  if (
    input.processorAssessment !== undefined &&
    !isValidProcessorAssessment(input.processorAssessment)
  ) {
    return null;
  }
  if (
    input.subprocessorAssessment !== undefined &&
    !isValidSubprocessorAssessment(input.subprocessorAssessment)
  ) {
    return null;
  }
  if (input.evidenceRef !== undefined && !nonEmpty(input.evidenceRef)) return null;
  const id = newId("rel");
  let out: { company: CompanyState; id: string } | null = null;
  const next = withTreatment(company, treatmentId, (t) => {
    // Unicidad local defensiva (import la exige; newId la hace
    // prácticamente imposible, el contrato no la asume).
    if ((t.thirdPartyRelationships ?? []).some((x) => x.id === id)) return null;
    const purposeIds = cleanRelRefs(input.purposeIds, new Set(Object.keys(t.purposes ?? {})));
    if (purposeIds === null) return null;
    const dataIds = new Set(Object.keys(t.dataItems ?? {}));
    const dataItemIds = cleanRelRefs(input.dataItemIds, dataIds);
    if (dataItemIds === null) return null;
    const candidate = buildRelationshipRecord(id, {
      actorId: input.actorId,
      label: input.label,
      relationshipType: type,
      purposeIds,
      dataItemIds,
      internationalDimension: intl,
      ...(input.parentRelationshipId !== undefined
        ? { parentRelationshipId: input.parentRelationshipId }
        : {}),
      ...(input.evidenceRef !== undefined ? { evidenceRef: input.evidenceRef } : {}),
      ...(input.cessionAssessment !== undefined
        ? { cessionAssessment: input.cessionAssessment }
        : {}),
      ...(input.processorAssessment !== undefined
        ? { processorAssessment: input.processorAssessment }
        : {}),
      ...(input.subprocessorAssessment !== undefined
        ? { subprocessorAssessment: input.subprocessorAssessment }
        : {}),
    });
    const siblings = [...(t.thirdPartyRelationships ?? []), candidate];
    if (!checkRelationshipCandidate(t, candidate, siblings)) return null;
    return {
      ...t,
      thirdPartyRelationships: [...(t.thirdPartyRelationships ?? []), candidate],
    };
  });
  if (next) out = { company: next, id };
  return out;
}

export function updateThirdPartyRelationship(
  company: CompanyState,
  treatmentId: string,
  id: string,
  patch: ThirdPartyRelationshipPatch,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const rels = t.thirdPartyRelationships ?? [];
    const idx = rels.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const current = rels[idx];
    if (patch.actorId !== undefined && !t.actors?.[patch.actorId]) return null;
    if (patch.label !== undefined && !nonEmpty(patch.label)) return null;
    if (patch.relationshipType !== undefined && !isRelationshipType(patch.relationshipType)) {
      return null;
    }
    if (
      patch.internationalDimension !== undefined &&
      !isInternationalDimension(patch.internationalDimension)
    ) {
      return null;
    }
    if (
      patch.evidenceRef !== undefined &&
      patch.evidenceRef !== null &&
      !nonEmpty(patch.evidenceRef)
    ) {
      return null;
    }
    let purposeIds = current.purposeIds;
    if (patch.purposeIds !== undefined) {
      const cleaned = cleanRelRefs(patch.purposeIds, new Set(Object.keys(t.purposes ?? {})));
      if (cleaned === null) return null;
      purposeIds = cleaned;
    }
    let dataItemIds = current.dataItemIds;
    if (patch.dataItemIds !== undefined) {
      const cleaned = cleanRelRefs(patch.dataItemIds, new Set(Object.keys(t.dataItems ?? {})));
      if (cleaned === null) return null;
      dataItemIds = cleaned;
    }
    const newType = patch.relationshipType ?? current.relationshipType;
    const typeChanged =
      patch.relationshipType !== undefined &&
      patch.relationshipType !== current.relationshipType;
    // Cambio de tipo: normalización estructural atómica. Se retiran
    // assessments y parent incompatibles; no se convierten resultados
    // entre tipos (sin inferencia jurídica).
    let cession = typeChanged ? undefined : current.cessionAssessment;
    let processor = typeChanged ? undefined : current.processorAssessment;
    let subprocessor = typeChanged ? undefined : current.subprocessorAssessment;
    let parent = typeChanged ? undefined : current.parentRelationshipId;
    if (patch.parentRelationshipId !== undefined) {
      parent = patch.parentRelationshipId === null ? undefined : patch.parentRelationshipId;
    }
    if (patch.cessionAssessment !== undefined) {
      if (patch.cessionAssessment === null) cession = undefined;
      else {
        const merged = { ...(cession ?? { lawfulness: "unknown", instrument: "unknown" }), ...patch.cessionAssessment };
        if (!isValidCessionAssessment(merged)) return null;
        cession = merged;
      }
    }
    if (patch.processorAssessment !== undefined) {
      if (patch.processorAssessment === null) processor = undefined;
      else {
        const merged = {
          ...(processor ?? { contract: "unknown", instructions: "unknown", operational: "unknown" }),
          ...patch.processorAssessment,
        };
        if (!isValidProcessorAssessment(merged)) return null;
        processor = merged;
      }
    }
    if (patch.subprocessorAssessment !== undefined) {
      if (patch.subprocessorAssessment === null) subprocessor = undefined;
      else {
        const merged = { ...(subprocessor ?? { authorization: "unknown" }), ...patch.subprocessorAssessment };
        if (!isValidSubprocessorAssessment(merged)) return null;
        subprocessor = merged;
      }
    }
    const candidate: ThirdPartyRelationshipRecord = {
      ...current,
      ...(patch.actorId !== undefined ? { actorId: patch.actorId } : {}),
      ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
      relationshipType: newType,
      purposeIds,
      dataItemIds,
      ...(patch.internationalDimension !== undefined
        ? { internationalDimension: patch.internationalDimension }
        : {}),
      ...(cession !== undefined ? { cessionAssessment: cession } : {}),
      ...(processor !== undefined ? { processorAssessment: processor } : {}),
      ...(subprocessor !== undefined ? { subprocessorAssessment: subprocessor } : {}),
    };
    // Limpieza explícita de opcionales retirados por normalización.
    if (cession === undefined) delete candidate.cessionAssessment;
    if (processor === undefined) delete candidate.processorAssessment;
    if (subprocessor === undefined) delete candidate.subprocessorAssessment;
    if (parent === undefined) delete candidate.parentRelationshipId;
    else candidate.parentRelationshipId = parent;
    if (patch.evidenceRef !== undefined) {
      if (patch.evidenceRef === null) delete candidate.evidenceRef;
      else candidate.evidenceRef = patch.evidenceRef;
    }
    const siblings = rels.map((r, i) => (i === idx ? candidate : r));
    if (!checkRelationshipCandidate(t, candidate, siblings)) return null;
    // Revalidación de hijos: si el candidato cambió de tipo o fue
    // eliminado como padre posible, cualquier relación que lo
    // referencie quedaría estructuralmente inválida (y el import
    // rechazaría el treatment completo). Se rechaza el update.
    const newById = indexRelationships(siblings);
    for (const sib of siblings) {
      if (
        sib.parentRelationshipId !== undefined &&
        parentIssues(sib, newById).length > 0
      ) {
        return null;
      }
    }
    return { ...t, thirdPartyRelationships: siblings };
  });
}

/** Lectura direccionada por ancestry válida; cross-treatment imposible. */
export function getThirdPartyRelationship(
  company: CompanyState,
  treatmentId: string,
  id: string,
): ThirdPartyRelationshipRecord | undefined {
  return getTreatment(company, treatmentId)?.thirdPartyRelationships?.find(
    (r) => r.id === id,
  );
}

/** Lista de relationships del treatment (vacía si ausente/legacy). */
export function listThirdPartyRelationships(
  company: CompanyState,
  treatmentId: string,
): ThirdPartyRelationshipRecord[] {
  return getTreatment(company, treatmentId)?.thirdPartyRelationships ?? [];
}

/**
 * Hard-delete sin hijos. Con hijos (`parentRelationshipId = id`):
 * reject — sin cascada. Reasignar/eliminar hijos primero.
 * Sin tombstone, sin historial.
 */
export function deleteThirdPartyRelationship(
  company: CompanyState,
  treatmentId: string,
  id: string,
): CompanyState | null {
  return withTreatment(company, treatmentId, (t) => {
    const rels = t.thirdPartyRelationships ?? [];
    if (!rels.some((r) => r.id === id)) return null;
    if (rels.some((r) => r.parentRelationshipId === id)) return null;
    return { ...t, thirdPartyRelationships: rels.filter((r) => r.id !== id) };
  });
}

/** ¿Tiene este relationship un padre válido en su treatment? */
export function thirdPartyRelationshipHasParent(
  company: CompanyState,
  treatmentId: string,
  id: string,
): boolean {
  const t = getTreatment(company, treatmentId);
  const r = t?.thirdPartyRelationships?.find((x) => x.id === id);
  if (!t || !r) return false;
  return hasValidParent(r, indexRelationships(t.thirdPartyRelationships ?? []));
}
