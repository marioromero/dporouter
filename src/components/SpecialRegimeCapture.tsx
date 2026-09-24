import { useWorkspace } from "../workspace/context";
import { getTreatment } from "../workspace/scope";
import {
  deriveD5CandidatesForPurpose,
  D5_CANDIDATE_KEYS,
  linkedItems,
  resolveItemSignal,
  resolveProfile,
  validateSpecialRegimeCoherence,
} from "../workspace/specialRegime";
import type { CompanyState, ExecutionContext, TriStateSignal } from "../workspace/types";

/**
 * Captura estructural D5 (Punto 0, ADR-053): controles profesionales
 * para clasificar datos y contexto de finalidad. Lenguaje humano
 * (Sí / No / Por determinar); jamás expone claves técnicas, facts ni
 * enums. Editar aquí solo cambia captura y candidaturas derivadas:
 * nunca escribe conclusiones, facts canónicos ni estados de trabajo.
 */

type TriState = TriStateSignal;

const OPTIONS: { value: TriState; label: string }[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Por determinar" },
];

function TriStateButtons({
  value,
  onChange,
  groupLabel,
}: {
  value: TriState;
  onChange: (v: TriState) => void;
  groupLabel: string;
}) {
  return (
    <div role="group" aria-label={groupLabel}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "btn small" : "btn ghost small"}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const ITEM_SIGNALS: {
  field: "sensitive" | "health" | "biologicalProfile" | "geolocation";
  label: string;
  help: string;
}[] = [
  {
    field: "sensitive",
    label: "Dato sensible",
    help: "Clasificación estructural para análisis, no conclusión jurídica.",
  },
  {
    field: "health",
    label: "Dato de salud",
    help: "Dato relativo a la salud, para efectos de análisis.",
  },
  {
    field: "biologicalProfile",
    label: "Perfil biológico",
    help: "Dato relativo al perfil biológico humano, para análisis.",
  },
  {
    field: "geolocation",
    label: "Geolocalización",
    help: "Dato de geolocalización del tratamiento.",
  },
];

/** Clasificación estructural de un dato (sin datos reales). */
export function DataItemSignalsEditor({
  treatmentId,
  dataItemId,
}: {
  treatmentId: string;
  dataItemId: string;
}) {
  const { company, updateDataItem } = useWorkspace();
  const item = company?.treatments?.[treatmentId]?.dataItems?.[dataItemId];
  if (!company || !item) return null;
  return (
    <div aria-label={`Clasificación estructural de ${item.label}`}>
      {ITEM_SIGNALS.map((s) => (
        <div key={s.field} className="field">
          <span id={`sen-${dataItemId}-${s.field}`}>{s.label}</span>
          <TriStateButtons
            value={resolveItemSignal(item, s.field)}
            onChange={(v) => updateDataItem(treatmentId, dataItemId, { [s.field]: v })}
            groupLabel={`${s.label} de ${item.label}`}
          />
          <p className="result-count">{s.help}</p>
        </div>
      ))}
    </div>
  );
}

const PROFILE_FIELDS: {
  field: "biometricIdentificationUse" | "involvesMinors" | "researchPublicInterestCandidate";
  label: string;
  help: string;
}[] = [
  {
    field: "biometricIdentificationUse",
    label: "Uso biométrico para identificación única",
    help: "La finalidad utiliza tratamiento técnico para permitir o confirmar la identificación única.",
  },
  {
    field: "involvesMinors",
    label: "Involucra niños, niñas o adolescentes",
    help: "Característica abstracta del tratamiento; nunca edades ni identidades reales.",
  },
  {
    field: "researchPublicInterestCandidate",
    label: "Contexto histórico, estadístico, científico o de investigación",
    help: "Señal de contexto: no significa que cumpla el régimen del art. 16 quinquies.",
  },
];

/** Contexto de regímenes especiales de una finalidad. */
export function PurposeProfileEditor({
  treatmentId,
  purposeId,
}: {
  treatmentId: string;
  purposeId: string;
}) {
  const { company, setSpecialRegimeProfile } = useWorkspace();
  const treatment = company ? getTreatment(company, treatmentId) : undefined;
  const purpose = treatment?.purposes[purposeId];
  if (!company || !treatment || !purpose) return null;
  const profile = resolveProfile(purpose.specialRegimeProfile);
  return (
    <div aria-label={`Contexto de regímenes de ${purpose.purpose.description}`}>
      {PROFILE_FIELDS.map((f) => (
        <div key={f.field} className="field">
          <span>{f.label}</span>
          <TriStateButtons
            value={profile[f.field]}
            onChange={(v) =>
              setSpecialRegimeProfile(treatmentId, purposeId, { [f.field]: v })
            }
            groupLabel={`${f.label} en ${purpose.purpose.description}`}
          />
          <p className="result-count">{f.help}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Contexto estructural de la finalidad direccionada para guías D5
 * (trabajo primero, sin claves técnicas): datos vinculados,
 * candidaturas vigentes y advertencias. Solo lectura: no edita, no
 * concluye, no persiste. Satisface la trazabilidad visible de
 * datos vinculados sin persistencia adicional ni answers por item.
 */
export function SpecialRegimeGuideContext({
  company,
  ctx,
}: {
  company: CompanyState;
  ctx: ExecutionContext;
}) {
  if (ctx.scope !== "purpose") return null;
  const treatment = getTreatment(company, ctx.treatmentId);
  if (!treatment) return null;
  const items = linkedItems(treatment, ctx.purposeId);
  const candidates =
    deriveD5CandidatesForPurpose(company, ctx.treatmentId, ctx.purposeId) ?? {};
  const warnings = validateSpecialRegimeCoherence(company, ctx.treatmentId, ctx.purposeId);
  const entries: { label: string; state: string }[] = [
    { label: "Datos sensibles", state: candidates[D5_CANDIDATE_KEYS.sensitive] },
    { label: "Salud y perfil biológico", state: candidates[D5_CANDIDATE_KEYS.healthBiological] },
    { label: "Biometría", state: candidates[D5_CANDIDATE_KEYS.biometric] },
    { label: "Niños, niñas y adolescentes", state: candidates[D5_CANDIDATE_KEYS.minors] },
    { label: "Investigación de interés público", state: candidates[D5_CANDIDATE_KEYS.research] },
    { label: "Geolocalización", state: candidates[D5_CANDIDATE_KEYS.geolocation] },
    { label: "Título III", state: candidates[D5_CANDIDATE_KEYS.titleIII] },
  ].map((e) => ({
    label: e.label,
    state:
      e.state === "yes"
        ? "revisión indicada"
        : e.state === "no"
          ? "no indicada por captura actual"
          : "por determinar",
  }));
  return (
    <section className="activity-section" aria-label="Contexto estructural de la finalidad">
      <h2>Contexto estructural de la finalidad</h2>
      {items.length === 0 ? (
        <p>Esta finalidad aún no tiene datos vinculados.</p>
      ) : (
        <>
          <h3>Datos vinculados</h3>
          <ul>
            {items.map((i) => (
              <li key={i.id}>{i.label.trim() === "" ? "Dato vinculado" : i.label}</li>
            ))}
          </ul>
        </>
      )}
      <h3>Revisiones indicadas por la captura</h3>
      <ul>
        {entries.map((e) => (
          <li key={e.label}>
            {e.label}: {e.state}
          </li>
        ))}
      </ul>
      {warnings.length > 0 ? (
        <>
          <h3>Revisar clasificación</h3>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w.reason}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

/**
 * Advertencias de coherencia estructural (runtime, no persistidas):
 * piden revisar la clasificación; nunca corrigen, bloquean ni
 * concluyen.
 */
export function SpecialRegimeWarnings({
  treatmentId,
  purposeId,
}: {
  treatmentId: string;
  purposeId?: string;
}) {
  const { company } = useWorkspace();
  if (!company) return null;
  const issues = validateSpecialRegimeCoherence(company, treatmentId, purposeId);
  if (issues.length === 0) return null;
  return (
    <div className="notice" role="alert" aria-label="Revisar clasificación">
      <strong>Revisar clasificación</strong>
      <ul>
        {issues.map((w, i) => (
          <li key={i}>{w.reason}</li>
        ))}
      </ul>
    </div>
  );
}
