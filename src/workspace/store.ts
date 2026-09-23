import type {
  ActivityWorkState,
  ActivityWorkStatus,
  CompanyState,
  FactRecord,
  FactResolution,
  LocalProfile,
  ProtocolReasoningRecord,
  PurposeScopedState,
  TreatmentScopedState,
  WorkspaceData,
} from "./types";
import { ACTIVITY_WORK_STATUSES, emptyWorkspace, nowIso } from "./types";

/**
 * Persistencia local Stage 1 (localStorage del navegador, sin backend).
 * Todo es JSON-serializable. La importación valida estrictamente antes de
 * aceptar datos externos; nada inválido entra en silencio.
 */

export const STORAGE_KEY = "dporouter.stage1.v1";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

function checkFactRecord(v: unknown): v is FactRecord {
  return (
    isRecord(v) &&
    typeof v.value === "string" &&
    typeof v.source === "string" &&
    isIsoDate(v.updatedAt)
  );
}

function checkFactResolution(v: unknown): v is FactResolution {
  if (
    !(
      isRecord(v) &&
      typeof v.factKey === "string" &&
      typeof v.value === "string" &&
      isIsoDate(v.resolvedAt) &&
      v.decidedBy === "professional" &&
      Array.isArray(v.alternatives) &&
      v.alternatives.every(checkFactRecord)
    )
  ) {
    return false;
  }
  // Dirección scopeada opcional (ausente = company heredado).
  if (v.scope !== undefined && v.scope !== "treatment" && v.scope !== "purpose") {
    return false;
  }
  if (v.scope !== undefined && typeof v.treatmentId !== "string") return false;
  if (v.scope === "purpose" && typeof v.purposeId !== "string") return false;
  return true;
}
function checkActivityState(v: unknown): v is ActivityWorkState {
  return (
    isRecord(v) &&
    typeof v.status === "string" &&
    (ACTIVITY_WORK_STATUSES as string[]).includes(v.status) &&
    isIsoDate(v.updatedAt)
  );
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function checkReasoningRecord(v: unknown): v is ProtocolReasoningRecord {
  return (
    isRecord(v) &&
    typeof v.protocolKey === "string" &&
    typeof v.activityKey === "string" &&
    typeof v.conclusion === "string" &&
    typeof v.legal_question === "string" &&
    isStringArray(v.facts_considered) &&
    isStringArray(v.legal_factors) &&
    isStringArray(v.evidence_refs) &&
    isStringArray(v.alternatives_considered) &&
    typeof v.rationale === "string" &&
    typeof v.decided_by === "string" &&
    typeof v.reviewed_by === "string" &&
    typeof v.decided_at === "string" &&
    Array.isArray(v.legal_basis) &&
    isIsoDate(v.updatedAt)
  );
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isSafeKey(key: string): boolean {
  return key !== "__proto__";
}

/** Conserva solo las entradas válidas de un mapa; el resto se descarta. */
function pruneMap<T>(
  value: unknown,
  check: (item: unknown) => item is T,
): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isRecord(value)) return out;
  for (const [key, item] of Object.entries(value)) {
    if (!isSafeKey(key)) continue;
    if (check(item)) out[key] = item;
  }
  return out;
}

/**
 * Migra una empresa almacenada a la forma vigente, entrada por entrada:
 * conserva todo lo válido (incluidos mapas ausentes en versiones viejas)
 * y descarta solo lo corrupto. Nunca revienta: ante identidad inválida
 * devuelve null y la empresa se excluye.
 */
function migrateCompany(raw: unknown): CompanyState | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.trim() === "") return null;
  if (typeof raw.name !== "string" || raw.name.trim() === "") return null;
  const at = nowIso();
  const protocolAnswers: CompanyState["protocolAnswers"] = {};
  if (isRecord(raw.protocolAnswers)) {
    for (const [pk, answers] of Object.entries(raw.protocolAnswers)) {
      if (!isSafeKey(pk) || !isRecord(answers)) continue;
      const facts = pruneMap(answers, checkFactRecord);
      protocolAnswers[pk] = facts;
    }
  }
  // Subárbol jurídico Stage 1: ausencia válida; selección activa solo
  // si resuelve (punteros obsoletos → undefined, navegación).
  const companyId = typeof raw.id === "string" ? raw.id : "";
  const treatments = migrateTreatments(raw.treatments, companyId);
  const rawActiveTreatment =
    typeof raw.activeTreatmentId === "string" ? raw.activeTreatmentId : undefined;
  const activeTreatmentId =
    rawActiveTreatment !== undefined && hasOwn(treatments, rawActiveTreatment)
      ? rawActiveTreatment
      : undefined;
  const activeTreatment = activeTreatmentId
    ? treatments[activeTreatmentId]
    : undefined;
  const rawActivePurpose =
    typeof raw.activePurposeId === "string" ? raw.activePurposeId : undefined;
  const activePurposeId =
    rawActivePurpose !== undefined &&
    activeTreatment !== undefined &&
    hasOwn(activeTreatment.purposes, rawActivePurpose)
      ? rawActivePurpose
      : undefined;
  return {
    id: raw.id,
    name: raw.name,
    createdAt: isIsoDate(raw.createdAt) ? raw.createdAt : at,
    updatedAt: isIsoDate(raw.updatedAt) ? raw.updatedAt : at,
    activityStates: pruneMap(raw.activityStates, checkActivityState),
    protocolAnswers,
    diagnosticFacts: pruneMap(raw.diagnosticFacts, checkFactRecord),
    factResolutions: pruneMap(raw.factResolutions, checkFactResolution),
    reasoningRecords: pruneMap(raw.reasoningRecords, checkReasoningRecord),
    ...(typeof raw.lastLocation === "string" ? { lastLocation: raw.lastLocation } : {}),
    ...(Object.keys(treatments).length > 0 ? { treatments } : {}),
    ...(activeTreatmentId !== undefined ? { activeTreatmentId } : {}),
    ...(activePurposeId !== undefined ? { activePurposeId } : {}),
  };
}

function checkStringMap(
  v: unknown,
  checkValue: (item: unknown) => boolean,
): v is Record<string, never> {
  return isRecord(v) && Object.values(v).every(checkValue);
}

function checkProtocolAnswerMaps(v: unknown): boolean {
  return (
    isRecord(v) &&
    Object.entries(v).every(
      ([pk, m]) =>
        isSafeKey(pk) && isRecord(m) && checkStringMap(m, checkFactRecord),
    )
  );
}

function checkPurposeState(v: unknown, treatmentId: string): boolean {
  if (!isRecord(v)) return false;
  const p = v.purpose;
  if (!isRecord(p)) return false;
  if (typeof p.id !== "string" || p.id.trim() === "") return false;
  if (p.treatmentId !== treatmentId) return false;
  if (typeof p.description !== "string") return false;
  if (!checkProtocolAnswerMaps(v.protocolAnswers)) return false;
  if (!isRecord(v.reasoningRecords)) return false;
  return Object.values(v.reasoningRecords).every(checkReasoningRecord);
}

function checkTreatmentState(v: unknown, companyId: string): boolean {
  if (!isRecord(v)) return false;
  const c = v.context;
  if (!isRecord(c)) return false;
  if (typeof c.id !== "string" || c.id.trim() === "") return false;
  const treatmentId: string = c.id;
  if (c.companyId !== companyId) return false;
  if (
    c.canonicalTreatmentId !== undefined &&
    typeof c.canonicalTreatmentId !== "string"
  ) {
    return false;
  }
  if (typeof c.name !== "string" || c.name.trim() === "") return false;
  if (c.description !== undefined && typeof c.description !== "string") {
    return false;
  }
  if (!checkProtocolAnswerMaps(v.protocolAnswers)) return false;
  if (!isRecord(v.reasoningRecords)) return false;
  if (!Object.values(v.reasoningRecords).every(checkReasoningRecord)) {
    return false;
  }
  if (!isRecord(v.purposes)) return false;
  return Object.entries(v.purposes).every(
    ([pk, p]) =>
      isSafeKey(pk) &&
      isRecord(p) &&
      isRecord(p.purpose) &&
      p.purpose.id === pk &&
      checkPurposeState(p, treatmentId),
  );
}

// Helpers del subárbol jurídico: reutilizan los guards compartidos del
// archivo (este commit incorpora el hardening de migración pendiente
// como dependencia estructural; ver mensaje de commit).

/**
 * Migra el subárbol jurídico, entrada por entrada: conserva
 * treatments/purposes válidos (normalizando ids a sus claves, como en
 * companies; podando observaciones corruptas, como en protocolAnswers)
 * y descarta lo corrupto. Sin treatments el resultado es ausencia
 * válida (D1-only).
 */
function pruneAnswerMaps(v: unknown): Record<string, Record<string, FactRecord>> {
  const out: Record<string, Record<string, FactRecord>> = {};
  if (!isRecord(v)) return out;
  for (const [pk, m] of Object.entries(v)) {
    if (!isSafeKey(pk) || !isRecord(m)) continue;
    out[pk] = pruneMap(m, checkFactRecord);
  }
  return out;
}

function migrateTreatments(
  raw: unknown,
  companyId: string,
): Record<string, TreatmentScopedState> {
  const out: Record<string, TreatmentScopedState> = {};
  if (!isRecord(raw)) return out;
  for (const [key, item] of Object.entries(raw)) {
    if (!isSafeKey(key) || !isRecord(item)) continue;
    const t = item as Record<string, unknown>;
    const ctx = isRecord(t.context) ? { ...t.context, id: key, companyId } : null;
    if (!ctx) continue;
    const purposes: Record<string, PurposeScopedState> = {};
    if (isRecord(t.purposes)) {
      for (const [pk, p] of Object.entries(t.purposes)) {
        if (!isSafeKey(pk) || !isRecord(p)) continue;
        const purp = isRecord(p.purpose)
          ? { ...p.purpose, id: pk, treatmentId: key }
          : null;
        if (!purp) continue;
        const candidate = {
          ...p,
          purpose: purp,
          protocolAnswers: pruneAnswerMaps(p.protocolAnswers),
          reasoningRecords: pruneMap(p.reasoningRecords, checkReasoningRecord),
        };
        if (!checkPurposeState(candidate, key)) continue;
        purposes[pk] = candidate as PurposeScopedState;
      }
    }
    const candidate = {
      ...t,
      context: ctx,
      protocolAnswers: pruneAnswerMaps(t.protocolAnswers),
      reasoningRecords: pruneMap(t.reasoningRecords, checkReasoningRecord),
      purposes,
    };
    if (!checkTreatmentState(candidate, companyId)) continue;
    out[key] = candidate as TreatmentScopedState;
  }
  return out;
}

export function validateCompanyState(
  data: unknown,
): { ok: true; value: CompanyState } | { ok: false; error: string } {
  if (!isRecord(data)) return { ok: false, error: "El respaldo no es un objeto JSON." };
  if (typeof data.id !== "string" || data.id.trim() === "") {
    return { ok: false, error: "Falta el identificador estable de la empresa (id)." };
  }
  if (typeof data.name !== "string" || data.name.trim() === "") {
    return { ok: false, error: "Falta el nombre de la empresa (name)." };
  }
  if (!isIsoDate(data.createdAt) || !isIsoDate(data.updatedAt)) {
    return { ok: false, error: "Fechas createdAt/updatedAt inválidas." };
  }
  if (!checkStringMap(data.activityStates ?? {}, checkActivityState)) {
    return { ok: false, error: "activityStates contiene estados inválidos." };
  }
  const pa = data.protocolAnswers ?? {};
  if (
    !isRecord(pa) ||
    !Object.values(pa).every((m) => checkStringMap(m, checkFactRecord))
  ) {
    return { ok: false, error: "protocolAnswers contiene respuestas inválidas." };
  }
  if (!checkStringMap(data.diagnosticFacts ?? {}, checkFactRecord)) {
    return { ok: false, error: "diagnosticFacts contiene hechos inválidos." };
  }
  if (!checkStringMap(data.factResolutions ?? {}, checkFactResolution)) {
    return { ok: false, error: "factResolutions contiene resoluciones inválidas." };
  }
  if (!checkStringMap(data.reasoningRecords ?? {}, checkReasoningRecord)) {
    return { ok: false, error: "reasoningRecords contiene registros inválidos." };
  }
  if (data.lastLocation !== undefined && typeof data.lastLocation !== "string") {
    return { ok: false, error: "lastLocation inválida." };
  }
  // Subárbol jurídico: rechaza objetos inválidos; normaliza punteros de
  // navegación obsoletos a undefined (no son hechos jurídicos).
  const treatments: Record<string, TreatmentScopedState> = {};
  if (data.treatments !== undefined) {
    if (!isRecord(data.treatments)) {
      return { ok: false, error: "treatments contiene tratamientos inválidos." };
    }
    for (const [key, item] of Object.entries(data.treatments)) {
      if (
        !isSafeKey(key) ||
        !isRecord(item) ||
        !isRecord(item.context) ||
        (item.context as Record<string, unknown>).id !== key ||
        (item.context as Record<string, unknown>).companyId !== data.id ||
        !checkTreatmentState(item, data.id as string)
      ) {
        return {
          ok: false,
          error: `treatments contiene un tratamiento inválido (${key}).`,
        };
      }
      treatments[key] = item as unknown as TreatmentScopedState;
    }
  }
  const storedTreatment =
    typeof data.activeTreatmentId === "string"
      ? treatments[data.activeTreatmentId]
      : undefined;
  const activeTreatmentId = storedTreatment ? (data.activeTreatmentId as string) : undefined;
  const activePurposeId =
    typeof data.activePurposeId === "string" &&
    storedTreatment !== undefined &&
    hasOwn(storedTreatment.purposes, data.activePurposeId)
      ? (data.activePurposeId as string)
      : undefined;
  const value: CompanyState = {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    activityStates: (data.activityStates ?? {}) as CompanyState["activityStates"],
    protocolAnswers: (data.protocolAnswers ?? {}) as CompanyState["protocolAnswers"],
    diagnosticFacts: (data.diagnosticFacts ?? {}) as CompanyState["diagnosticFacts"],
    factResolutions: (data.factResolutions ?? {}) as CompanyState["factResolutions"],
    reasoningRecords: (data.reasoningRecords ?? {}) as CompanyState["reasoningRecords"],
    ...(typeof data.lastLocation === "string" ? { lastLocation: data.lastLocation } : {}),
    ...(Object.keys(treatments).length > 0 ? { treatments } : {}),
    ...(activeTreatmentId !== undefined ? { activeTreatmentId } : {}),
    ...(activePurposeId !== undefined ? { activePurposeId } : {}),
  };
  return { ok: true, value };
}

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    return migrateWorkspaceData(JSON.parse(raw));
  } catch {
    return emptyWorkspace();
  }
}

/**
 * Migra datos persistidos por versiones anteriores, entrada por entrada:
 * conserva cada empresa y cada dato válido (rellenando los mapas que la
 * versión vieja no conocía) y descarta solo lo corrupto: empresas sin
 * identidad, entradas inválidas y referencias huérfanas. Sin esto, una
 * empresa guardada antes de existir un campo (p. ej. factResolutions)
 * rompe lecturas directas.
 */
export function migrateWorkspaceData(data: unknown): WorkspaceData {
  if (!isRecord(data) || data.version !== 1) return emptyWorkspace();
  if (!Array.isArray(data.profiles) || !isRecord(data.companies)) {
    return emptyWorkspace();
  }
  const companies: Record<string, CompanyState> = {};
  for (const [key, raw] of Object.entries(data.companies)) {
    if (!isSafeKey(key)) continue;
    const migrated = migrateCompany(raw);
    // La clave almacenada manda (es la que referencian los perfiles);
    // el id interno se normaliza a ella para no bifurcar identidades.
    if (migrated) companies[key] = { ...migrated, id: key };
  }
  const seenProfiles = new Set<string>();
  const profiles: LocalProfile[] = [];
  for (const p of data.profiles) {
    if (!isRecord(p) || typeof p.id !== "string" || p.id.trim() === "") continue;
    if (seenProfiles.has(p.id)) continue;
    seenProfiles.add(p.id);
    const companyIds = Array.isArray(p.companyIds)
      ? p.companyIds.filter(
          (id): id is string =>
            typeof id === "string" && hasOwn(companies, id),
        )
      : [];
    const activeCompanyId =
      typeof p.activeCompanyId === "string" &&
      companyIds.includes(p.activeCompanyId)
        ? p.activeCompanyId
        : undefined;
    profiles.push({
      id: p.id,
      name: typeof p.name === "string" ? p.name : "",
      createdAt: typeof p.createdAt === "string" ? p.createdAt : "",
      companyIds,
      ...(activeCompanyId !== undefined ? { activeCompanyId } : {}),
    });
  }
  const activeProfileId =
    typeof data.activeProfileId === "string" &&
    profiles.some((p) => p.id === data.activeProfileId)
      ? (data.activeProfileId as string)
      : undefined;
  return {
    version: 1,
    profiles,
    ...(activeProfileId !== undefined ? { activeProfileId } : {}),
    companies,
  };
}

export function saveWorkspace(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Almacenamiento no disponible: la sesión continúa en memoria.
  }
}

export function statusOf(
  company: CompanyState,
  activityKey: string,
): ActivityWorkStatus {
  return company.activityStates[activityKey]?.status ?? "not_started";
}
