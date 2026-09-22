import type {
  ActivityWorkState,
  ActivityWorkStatus,
  CompanyState,
  FactRecord,
  FactResolution,
  WorkspaceData,
} from "./types";
import { ACTIVITY_WORK_STATUSES, emptyWorkspace } from "./types";

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
  return (
    isRecord(v) &&
    typeof v.factKey === "string" &&
    typeof v.value === "string" &&
    isIsoDate(v.resolvedAt) &&
    v.decidedBy === "professional" &&
    Array.isArray(v.alternatives) &&
    v.alternatives.every(checkFactRecord)
  );
}
function checkActivityState(v: unknown): v is ActivityWorkState {
  return (
    isRecord(v) &&
    typeof v.status === "string" &&
    (ACTIVITY_WORK_STATUSES as string[]).includes(v.status) &&
    isIsoDate(v.updatedAt)
  );
}

function checkStringMap(
  v: unknown,
  checkValue: (item: unknown) => boolean,
): v is Record<string, never> {
  return isRecord(v) && Object.values(v).every(checkValue);
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
  if (data.lastLocation !== undefined && typeof data.lastLocation !== "string") {
    return { ok: false, error: "lastLocation inválida." };
  }
  const value: CompanyState = {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    activityStates: (data.activityStates ?? {}) as CompanyState["activityStates"],
    protocolAnswers: (data.protocolAnswers ?? {}) as CompanyState["protocolAnswers"],
    diagnosticFacts: (data.diagnosticFacts ?? {}) as CompanyState["diagnosticFacts"],
    factResolutions: (data.factResolutions ?? {}) as CompanyState["factResolutions"],
    ...(typeof data.lastLocation === "string" ? { lastLocation: data.lastLocation } : {}),
  };
  return { ok: true, value };
}

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1) return emptyWorkspace();
    if (!Array.isArray(data.profiles) || !isRecord(data.companies)) {
      return emptyWorkspace();
    }
    return data as unknown as WorkspaceData;
  } catch {
    return emptyWorkspace();
  }
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
