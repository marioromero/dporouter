import type { FactMap } from "../../content/protocols/types";
import { getPurpose, getTreatment } from "./scope";
import type {
  CompanyState,
  DataItemRecord,
  SpecialRegimeProfile,
  TreatmentScopedState,
  TriStateSignal,
} from "./types";

/**
 * Captura estructurada D5 Punto 0 (ADR-053): candidaturas derivadas,
 * validadores de coherencia y referencias de razonamiento.
 *
 * Reglas inviolables:
 * - todo es puro y read-only: misma entrada, misma salida; jamás
 *   muta, persiste, escribe facts/answers/reasoning/effects ni
 *   finaliza protocolos;
 * - estructura ≠ conclusión jurídica; candidate yes ≠ aplicabilidad
 *   probada; `unknown != false`;
 * - prohibida toda inferencia automática entre señales (health=yes
 *   NUNCA escribe sensitive=yes, etc.); los warnings solo advierten;
 * - un warning jamás modifica una candidatura;
 * - las candidaturas consideran exclusivamente DataItems vinculados
 *   a la purpose vía DataPurposeLink vigente;
 * - derived ausente = unknown para ruteo D5 (el engine derived
 *   global sigue siendo yes/no; aquí la ausencia es el tercer estado).
 */

// Claves de determinación de la ruta de licitud (las escribe el
// protocolo de licitud por finalidad; aquí solo se LEEN los valores
// almacenados, nunca se escriben ni se duplican definiciones).
// Se resuelven por fact key en todos los maps del address (mecanismo
// external_fact_keys): sin literales de activity key en `src` y sin
// importar definiciones canónicas (single source of truth).
const CONSENT_FACT = "lawful.consent_applies";
const SOURCE_FACT = "lawful.art13_source";

export const D5_CANDIDATE_KEYS = {
  sensitive: "derived.purpose.d5_sensitive_candidate",
  healthBiological: "derived.purpose.d5_health_biological_candidate",
  biometric: "derived.purpose.d5_biometric_candidate",
  minors: "derived.purpose.d5_minors_candidate",
  research: "derived.purpose.d5_research_candidate",
  geolocation: "derived.purpose.d5_geolocation_candidate",
  titleIII: "derived.purpose.d5_titleIII_candidate",
} as const;

export type D5CandidateKey =
  (typeof D5_CANDIDATE_KEYS)[keyof typeof D5_CANDIDATE_KEYS];

/** Señal efectiva: ausencia legacy equivale a `unknown`. */
export function resolveItemSignal(
  item: DataItemRecord | undefined,
  field: "sensitive" | "health" | "biologicalProfile" | "geolocation",
): TriStateSignal {
  return item?.[field] ?? "unknown";
}

/** Perfil efectivo: ausencia equivale a todo `unknown`. */
export function resolveProfile(
  profile: SpecialRegimeProfile | undefined,
): SpecialRegimeProfile {
  return (
    profile ?? {
      biometricIdentificationUse: "unknown",
      involvesMinors: "unknown",
      researchPublicInterestCandidate: "unknown",
    }
  );
}

/** DataItems actualmente vinculados a la purpose (source of context). */
export function linkedItems(
  t: TreatmentScopedState,
  purposeId: string,
): DataItemRecord[] {
  const ids = new Set(
    (t.dataPurposeLinks ?? [])
      .filter((l) => l.purposeId === purposeId)
      .map((l) => l.dataId),
  );
  const out: DataItemRecord[] = [];
  for (const id of ids) {
    const item = t.dataItems?.[id];
    if (item) out.push(item);
  }
  return out;
}

type Triad = "yes" | "no" | "unknown";

/**
 * Núcleo tri-estado compartido para candidaturas basadas en items:
 * - yes si ≥1 vinculado afirma;
 * - no solo si existe ≥1 vinculado y TODOS niegan explícitamente;
 * - unknown en otro caso (cero links, o algún unknown sin yes).
 * Sin inferencias: cada señal se evalúa solo sobre su propio campo.
 */
function itemTriad(
  items: DataItemRecord[],
  field: "sensitive" | "health" | "biologicalProfile" | "geolocation",
): Triad {
  if (items.length === 0) return "unknown";
  if (items.some((i) => resolveItemSignal(i, field) === "yes")) return "yes";
  if (items.every((i) => resolveItemSignal(i, field) === "no")) return "no";
  return "unknown";
}

/** Variante OR sobre dos campos (D5.02: health OR biologicalProfile). */
function itemTriadOr(
  items: DataItemRecord[],
  fields: ("health" | "biologicalProfile")[],
): Triad {
  if (items.length === 0) return "unknown";
  if (
    items.some((i) => fields.some((f) => resolveItemSignal(i, f) === "yes"))
  ) {
    return "yes";
  }
  if (
    items.every((i) => fields.every((f) => resolveItemSignal(i, f) === "no"))
  ) {
    return "no";
  }
  return "unknown";
}

function profileTriad(value: TriStateSignal): Triad {
  return value;
}

function emit(out: FactMap, key: string, triad: Triad): void {
  // Solo yes/no se materializan; unknown = ausencia del derived fact.
  if (triad === "yes") out[key] = "yes";
  else if (triad === "no") out[key] = "no";
}

const OTHER_ART13_ROUTES = [
  "legal_obligation",
  "contract_precontractual",
  "legitimate_interest",
  "rights_defense",
];

/**
 * Puente D5.07: consume exclusivamente truth D2 existente (answers
 * purpose-scoped del protocolo D2.05), read-only.
 * - yes: ruta art. 13(a) afirmada (source = financial_titleIII con
 *   consentimiento descartado, espejo de la regla canon `basis-financial`);
 * - no: ruta afirmativamente determinada como otra (consentimiento
 *   afirmado, u otra fuente art. 13 con consentimiento descartado);
 * - unknown: restante (ausente, sin identificar, sin información).
 * Sin este bridge la candidatura permanece unknown
 * (`D5_TITLEIII_CANDIDATE_BRIDGE_LIMITATION` no aplica: el bridge
 * existe sobre answers del protocolo D2.05 ya ejecutado).
 */
function titleIIITriad(
  consent: string | undefined,
  source: string | undefined,
): Triad {
  if (consent === "consent_no" && source === "financial_titleIII") return "yes";
  if (consent === "consent_yes") return "no";
  if (
    consent === "consent_no" &&
    source !== undefined &&
    OTHER_ART13_ROUTES.includes(source)
  ) {
    return "no";
  }
  return "unknown";
}

/**
 * Candidaturas D5 purpose-scoped (Punto 0 §§10–18). Puras, no
 * persistidas, keys estáticas. `t` y `purposeId` deben pertenecer al
 * mismo treatment (el llamante resuelve ancestry; IDs siempre
 * subordinados al treatment padre).
 */
export function deriveD5Candidates(
  t: TreatmentScopedState,
  purposeId: string,
  lawfulness?: { consent?: string; source?: string },
): FactMap {
  const out: FactMap = {};
  const items = linkedItems(t, purposeId);
  const purpose = t.purposes[purposeId];
  const profile = resolveProfile(purpose?.specialRegimeProfile);

  // D5.01: solo campo sensitive; sin inferencias desde health,
  // biologicalProfile, perfil biométrico ni minors. Un warning de
  // coherencia jamás modifica esta candidatura.
  emit(out, D5_CANDIDATE_KEYS.sensitive, itemTriad(items, "sensitive"));
  // D5.02: health OR biologicalProfile; sin inferir desde sensitive.
  emit(
    out,
    D5_CANDIDATE_KEYS.healthBiological,
    itemTriadOr(items, ["health", "biologicalProfile"]),
  );
  // D5.03: solo profile; independiente de flags de items.
  emit(
    out,
    D5_CANDIDATE_KEYS.biometric,
    profileTriad(profile.biometricIdentificationUse),
  );
  // D5.04: solo profile; sin derivar desde contenido de items.
  emit(out, D5_CANDIDATE_KEYS.minors, profileTriad(profile.involvesMinors));
  // D5.05: solo profile; yes = "requiere revisar D5.05", nunca
  // "cumple art. 16 quinquies".
  emit(
    out,
    D5_CANDIDATE_KEYS.research,
    profileTriad(profile.researchPublicInterestCandidate),
  );
  // D5.06: solo campo geolocation de items vinculados. Sin señal
  // adicional para cesión a terceros (checks del futuro protocolo).
  emit(out, D5_CANDIDATE_KEYS.geolocation, itemTriad(items, "geolocation"));
  // D5.07: solo bridge D2; sin flag financiero propio.
  if (lawfulness) {
    emit(
      out,
      D5_CANDIDATE_KEYS.titleIII,
      titleIIITriad(lawfulness.consent, lawfulness.source),
    );
  }
  return out;
}

/**
 * Lee un answer almacenado en la purpose direccionada, escaneando
 * los maps del address por fact key: si varias fuentes discrepan,
 * el valor queda indeterminado (unknown) en lugar de elegir en
 * silencio. Solo lectura.
 */
export function scanPurposeAnswer(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
  factKey: string,
): string | undefined {
  const maps =
    getPurpose(company, treatmentId, purposeId)?.protocolAnswers ?? {};
  const values = new Set<string>();
  for (const m of Object.values(maps)) {
    const v = m[factKey]?.value;
    if (v !== undefined) values.add(v);
  }
  return values.size === 1 ? [...values][0] : undefined;
}

/**
 * Lee la ruta de licitud almacenada en la purpose direccionada
 * (answers propias; ausente = sin truth).
 * Solo lectura para el bridge D5.07.
 */
export function readLawfulnessRoute(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
): { consent?: string; source?: string } {
  return {
    consent: scanPurposeAnswer(company, treatmentId, purposeId, CONSENT_FACT),
    source: scanPurposeAnswer(company, treatmentId, purposeId, SOURCE_FACT),
  };
}

/** Candidaturas D5 para una purpose existente (null si contexto inválido). */
export function deriveD5CandidatesForPurpose(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
): FactMap | null {
  const t = getTreatment(company, treatmentId);
  if (!t || !t.purposes[purposeId]) return null;
  return deriveD5Candidates(
    t,
    purposeId,
    readLawfulnessRoute(company, treatmentId, purposeId),
  );
}

// ---------------------------------------------------------------------------
// Validadores de coherencia estructural (Punto 0 §§6–7, 26–27)
// ---------------------------------------------------------------------------

export interface SpecialRegimeIssue {
  code:
    | "health_sensitive_mismatch"
    | "biological_sensitive_mismatch"
    | "biometric_context_mismatch";
  treatmentId: string;
  purposeId?: string;
  dataItemId?: string;
  reason: string;
}

/**
 * Detecta combinaciones incompatibles/sospechosas. Puro y no
 * mutante: retorna issues; NO cambia datos, facts, candidaturas ni
 * concluye jurídicamente. No persiste (derivado en runtime).
 */
export function validateSpecialRegimeCoherence(
  company: CompanyState,
  treatmentId: string,
  purposeId?: string,
): SpecialRegimeIssue[] {
  const t = getTreatment(company, treatmentId);
  if (!t) return [];
  const purposes =
    purposeId !== undefined
      ? t.purposes[purposeId]
        ? [purposeId]
        : []
      : Object.keys(t.purposes);
  const out: SpecialRegimeIssue[] = [];
  for (const pid of purposes) {
    for (const item of linkedItems(t, pid)) {
      // health=yes + sensitive=no: inconsistencia estructural para
      // revisión. NO se corrige (podría ser declaración legítima en
      // revisión o error a corregir manualmente).
      if (
        resolveItemSignal(item, "health") === "yes" &&
        resolveItemSignal(item, "sensitive") === "no"
      ) {
        out.push({
          code: "health_sensitive_mismatch",
          treatmentId,
          purposeId: pid,
          dataItemId: item.id,
          reason:
            "El dato está clasificado como relativo a salud pero no como sensible; revisar la clasificación estructural.",
        });
      }
      if (
        resolveItemSignal(item, "biologicalProfile") === "yes" &&
        resolveItemSignal(item, "sensitive") === "no"
      ) {
        out.push({
          code: "biological_sensitive_mismatch",
          treatmentId,
          purposeId: pid,
          dataItemId: item.id,
          reason:
            "El dato está clasificado como perfil biológico pero no como sensible; revisar la clasificación estructural.",
        });
      }
    }
    // Uso biométrico afirmado con items vinculados cuya clasificación
    // estructural explícita es toda no-sensible: contexto digno de
    // revisión. Solo con información suficiente (≥1 item vinculado y
    // todos con sensitive=no explícito); ante unknowns NO hay warning
    // de contradicción. No define "compatible" con inferencias nuevas:
    // usa únicamente la señal estructural aprobada `sensitive`.
    const items = linkedItems(t, pid);
    const profile = resolveProfile(t.purposes[pid]?.specialRegimeProfile);
    if (
      profile.biometricIdentificationUse === "yes" &&
      items.length > 0 &&
      items.every((i) => resolveItemSignal(i, "sensitive") === "no")
    ) {
      out.push({
        code: "biometric_context_mismatch",
        treatmentId,
        purposeId: pid,
        reason:
          "La finalidad declara uso de identificación biométrica pero ningún dato vinculado presenta clasificación sensible; revisar el contexto estructural.",
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Referencias de razonamiento `data_item:<id>` (Punto 0 §20)
// ---------------------------------------------------------------------------

const DATA_ITEM_REF_RE = /^data_item:(.+)$/;

/** Token exacto para referenciar un DataItem en `facts_considered[]`. */
export function dataItemRef(id: string): string {
  return `data_item:${id}`;
}

/**
 * Extrae IDs desde valores que son EXACTAMENTE el token
 * `data_item:<id>` (id no vacío). Solo pensado para listas tipo
 * `facts_considered[]`; jamás parsea `rationale` ni `evidence_refs`
 * (el llamante decide qué lista pasa).
 */
export function extractDataItemRefs(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const m = DATA_ITEM_REF_RE.exec(v);
    if (m && m[1].trim() !== "") out.push(m[1]);
  }
  return out;
}

/** ¿La lista contiene exactamente el token para este ID? */
export function hasDataItemRef(values: string[], id: string): boolean {
  return values.includes(dataItemRef(id));
}

/**
 * Refs cuyo ID no existe en el treatment indicado (posible stale tras
 * delete; el llamante decide). IDs subordinados al treatment padre:
 * el mismo ID local en otro treatment no colisiona porque la
 * pertenencia se verifica contra ese treatment.
 */
export function findUnknownDataItemRefs(
  values: string[],
  t: TreatmentScopedState,
): string[] {
  return extractDataItemRefs(values).filter(
    (id) => t.dataItems?.[id] === undefined,
  );
}
