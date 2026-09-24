import { useState } from "react";
import { useWorkspace } from "../workspace/context";
import {
  DataItemSignalsEditor,
  PurposeProfileEditor,
  SpecialRegimeWarnings,
} from "./SpecialRegimeCapture";
import type {
  AutomatedUseLegalPath,
  AutomatedUseRecord,
  AutomatedUseSafeguards,
  SafeguardCheck,
} from "../workspace/types";

/**
 * Workspace D2 Stage 1: tratamientos, finalidades y estructuras locales.
 *
 * Componentes específicos de workspace (sin schema engine, sin lógica
 * jurídica): crean y editan objetos, nunca evalúan actividades. Crear
 * un tratamiento o una finalidad NO completa ninguna actividad D2;
 * crear una finalidad NO la hace jurídicamente específica ni adecuada.
 */

function fieldId(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

export function TreatmentWorkspace() {
  const {
    company,
    addTreatment,
    selectTreatment,
    renameTreatment,
    deleteTreatment,
  } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canonicalId, setCanonicalId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  if (!company) return null;
  const treatments = Object.values(company.treatments ?? {});
  const activeId = company.activeTreatmentId ?? null;
  return (
    <section className="activity-section" aria-label="Tratamientos" data-testid="workspace-treatments">
      <h2>Tratamientos de la empresa</h2>
      <p>
        Agregar un tratamiento es una operación de workspace: organiza el
        trabajo por operación. No completa D2.01 ni ninguna actividad.
      </p>
      {treatments.length === 0 ? (
        <p>Aún no hay tratamientos registrados para {company.name}.</p>
      ) : (
        <ul>
          {treatments.map((t) => (
            <li key={t.context.id}>
              <button
                type="button"
                className={t.context.id === activeId ? "btn small" : "btn ghost small"}
                aria-pressed={t.context.id === activeId}
                onClick={() => selectTreatment(t.context.id)}
              >
                {t.context.name}
              </button>{" "}
              <span className="result-count">
                {Object.keys(t.purposes ?? {}).length} finalidades
              </span>{" "}
              {editingId === t.context.id ? (
                <>
                  <input
                    id={fieldId("editar-tratamiento", t.context.id)}
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label={`Nuevo nombre para ${t.context.name}`}
                  />
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={editName.trim() === ""}
                    onClick={() => {
                      renameTreatment(t.context.id, { name: editName });
                      setEditingId(null);
                      setEditName("");
                    }}
                  >
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setEditingId(t.context.id);
                    setEditName(t.context.name);
                  }}
                >
                  Renombrar
                </button>
              )}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteTreatment(t.context.id)}
                aria-label={`Eliminar ${t.context.name}`}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <label htmlFor="nuevo-tratamiento">Nombre del tratamiento</label>
        <input
          id="nuevo-tratamiento"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Gestión de clientes"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="nuevo-tratamiento-desc">Descripción operacional (opcional)</label>
        <input
          id="nuevo-tratamiento-desc"
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="nuevo-tratamiento-id">Identificador canónico (opcional)</label>
        <input
          id="nuevo-tratamiento-id"
          className="input"
          value={canonicalId}
          onChange={(e) => setCanonicalId(e.target.value)}
          placeholder="treatment_id estable de D2.01"
          autoComplete="off"
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={name.trim() === ""}
          onClick={() => {
            const id = addTreatment({
              name,
              ...(description.trim() !== "" ? { description: description.trim() } : {}),
              ...(canonicalId.trim() !== "" ? { canonicalTreatmentId: canonicalId.trim() } : {}),
            });
            setName("");
            setDescription("");
            setCanonicalId("");
            if (id) selectTreatment(id);
          }}
        >
          Agregar tratamiento
        </button>
      </div>
    </section>
  );
}

export function PurposeWorkspace({ treatmentId }: { treatmentId: string }) {
  const {
    company,
    addPurpose,
    selectPurpose,
    renamePurpose,
    deletePurpose,
  } = useWorkspace();
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const purposes = Object.values(treatment.purposes ?? {});
  const activePurposeId =
    company.activeTreatmentId === treatmentId ? company.activePurposeId : undefined;
  return (
    <section className="activity-section" aria-label="Finalidades" data-testid="workspace-purposes">
      <h2>Finalidades de {treatment.context.name}</h2>
      <p>
        Crear una finalidad la registra como objeto de trabajo: no significa
        que sea jurídicamente específica, explícita ni adecuada. Eso se
        evalúa en la guía.
      </p>
      {purposes.length === 0 ? (
        <p>Sin finalidades registradas.</p>
      ) : (
        <ul>
          {purposes.map((p) => (
            <li key={p.purpose.id}>
              <button
                type="button"
                className={p.purpose.id === activePurposeId ? "btn small" : "btn ghost small"}
                aria-pressed={p.purpose.id === activePurposeId}
                onClick={() => selectPurpose(treatmentId, p.purpose.id)}
              >
                {p.purpose.description}
              </button>{" "}
              {editingId === p.purpose.id ? (
                <>
                  <input
                    id={fieldId("editar-finalidad", p.purpose.id)}
                    className="input"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    aria-label="Nueva descripción de la finalidad"
                  />
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={editDescription.trim() === ""}
                    onClick={() => {
                      renamePurpose(treatmentId, p.purpose.id, editDescription);
                      setEditingId(null);
                      setEditDescription("");
                    }}
                  >
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setEditingId(p.purpose.id);
                    setEditDescription(p.purpose.description);
                  }}
                >
                  Editar
                </button>
              )}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deletePurpose(treatmentId, p.purpose.id)}
                aria-label={`Eliminar finalidad ${p.purpose.description}`}
              >
                Eliminar
              </button>
              <PurposeProfileEditor treatmentId={treatmentId} purposeId={p.purpose.id} />
              <SpecialRegimeWarnings treatmentId={treatmentId} purposeId={p.purpose.id} />
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <label htmlFor="nueva-finalidad">Descripción de la finalidad</label>
        <input
          id="nueva-finalidad"
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={description.trim() === ""}
          onClick={() => {
            addPurpose(treatmentId, description);
            setDescription("");
          }}
        >
          Agregar finalidad
        </button>
      </div>
    </section>
  );
}

const ACTOR_KINDS = ["organization", "person"] as const;
const ACTOR_ROLES = ["responsible", "processor"] as const;

function roleLabel(role: string | undefined): string {
  if (role === "responsible") return "Responsable";
  if (role === "processor") return "Encargado";
  return "Sin determinar";
}

export function ActorWorkspace({ treatmentId }: { treatmentId: string }) {
  const { company, addActor, updateActor, deleteActor } = useWorkspace();
  const [kind, setKind] = useState<"organization" | "person">("organization");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const actors = Object.values(treatment.actors ?? {});
  const missing = actors.filter((a) => a.role === undefined).length;
  return (
    <section className="activity-section" aria-label="Actores" data-testid="workspace-actors">
      <h2>Actores de {treatment.context.name}</h2>
      <p data-testid="actors-summary">
        {actors.length === 0
          ? "No hay actores registrados."
          : missing === 0
            ? `${actors.length} ${actors.length === 1 ? "actor" : "actores"}, todos con rol definido.`
            : `${actors.length} ${actors.length === 1 ? "actor" : "actores"}, falta definir el rol de ${missing}.`}
      </p>
      {actors.length > 0 ? (
        <ul>
          {actors.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong> · {a.kind === "organization" ? "Organización" : "Persona"} ·{" "}
              {roleLabel(a.role)}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() =>
                  updateActor(treatmentId, a.id, {
                    role: a.role === "responsible" ? "processor" : "responsible",
                  })
                }
                aria-label={`Cambiar rol de ${a.name}`}
              >
                Asignar {a.role === "responsible" ? "encargado" : "responsable"}
              </button>{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteActor(treatmentId, a.id)}
                aria-label={`Eliminar actor ${a.name}`}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="field">
        <label htmlFor="actor-kind">Tipo</label>
        <select id="actor-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as "organization" | "person")}>
          {ACTOR_KINDS.map((k) => (
            <option key={k} value={k}>
              {k === "organization" ? "Organización" : "Persona"}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="actor-name">Nombre o denominación</label>
        <input
          id="actor-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="actor-role">Rol</label>
        <select id="actor-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Sin determinar</option>
          {ACTOR_ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "responsible" ? "Responsable" : "Encargado"}
            </option>
          ))}
        </select>
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={name.trim() === ""}
          onClick={() => {
            addActor(treatmentId, {
              kind,
              name,
              ...(role === "" ? {} : { role: role as "responsible" | "processor" }),
            });
            setName("");
            setRole("");
          }}
        >
          Agregar actor
        </button>
      </div>
    </section>
  );
}

export function DataWorkspace({ treatmentId }: { treatmentId: string }) {
  const { company, addDataItem, deleteDataItem, updateDataItem } = useWorkspace();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const items = Object.values(treatment.dataItems ?? {});
  const sources = Object.values(treatment.sources ?? {});
  return (
    <section className="activity-section" aria-label="Datos" data-testid="workspace-data">
      <h2>Datos de {treatment.context.name}</h2>
      <SpecialRegimeWarnings treatmentId={treatmentId} />
      {items.length === 0 ? (
        <p>No hay datos registrados.</p>
      ) : (
        <ul>
          {items.map((d) => (
            <li key={d.id}>
              <strong>{d.label}</strong>
              {d.category ? ` · ${d.category}` : ""}{" "}
              <DataItemSignalsEditor treatmentId={treatmentId} dataItemId={d.id} />
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteDataItem(treatmentId, d.id)}
                aria-label={`Eliminar dato ${d.label}`}
              >
                Eliminar
              </button>
              {sources.length > 0 ? (
                <div role="group" aria-label={`Fuentes de ${d.label}`}>
                  {sources.map((s) => {
                    const linked = d.sourceRefs.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={linked ? "btn small" : "btn ghost small"}
                        aria-pressed={linked}
                        onClick={() =>
                          updateDataItem(treatmentId, d.id, {
                            sourceRefs: linked
                              ? d.sourceRefs.filter((r) => r !== s.id)
                              : [...d.sourceRefs, s.id],
                          })
                        }
                      >
                        {s.description}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <label htmlFor="dato-label">Etiqueta del dato</label>
        <input
          id="dato-label"
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="dato-categoria">Categoría (opcional)</label>
        <input
          id="dato-categoria"
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={label.trim() === ""}
          onClick={() => {
            addDataItem(treatmentId, {
              label,
              ...(category.trim() !== "" ? { category: category.trim() } : {}),
            });
            setLabel("");
            setCategory("");
          }}
        >
          Agregar dato
        </button>
      </div>
    </section>
  );
}

const SOURCE_KINDS = ["data_subject", "third_party_org", "public_source", "other"] as const;

function sourceKindLabel(kind: string): string {
  switch (kind) {
    case "data_subject":
      return "Titular";
    case "third_party_org":
      return "Otra organización";
    case "public_source":
      return "Fuente pública";
    default:
      return "Otra fuente";
  }
}

export function SourceWorkspace({ treatmentId }: { treatmentId: string }) {
  const { company, addSource, deleteSource } = useWorkspace();
  const [kind, setKind] = useState<(typeof SOURCE_KINDS)[number]>("data_subject");
  const [description, setDescription] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const sources = Object.values(treatment.sources ?? {});
  return (
    <section className="activity-section" aria-label="Fuentes" data-testid="workspace-sources">
      <h2>Fuentes de {treatment.context.name}</h2>
      {sources.length === 0 ? (
        <p>No hay fuentes registradas.</p>
      ) : (
        <ul>
          {sources.map((s) => (
            <li key={s.id}>
              <strong>{s.description}</strong> · {sourceKindLabel(s.kind)}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteSource(treatmentId, s.id)}
                aria-label={`Eliminar fuente ${s.description}`}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <label htmlFor="fuente-kind">Tipo de fuente</label>
        <select
          id="fuente-kind"
          className="input"
          value={kind}
          onChange={(e) => setKind(e.target.value as (typeof SOURCE_KINDS)[number])}
        >
          {SOURCE_KINDS.map((k) => (
            <option key={k} value={k}>
              {sourceKindLabel(k)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="fuente-desc">Descripción</label>
        <input
          id="fuente-desc"
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={description.trim() === ""}
          onClick={() => {
            addSource(treatmentId, { kind, description });
            setDescription("");
          }}
        >
          Agregar fuente
        </button>
      </div>
    </section>
  );
}

export function LinksWorkspace({ treatmentId }: { treatmentId: string }) {
  const { company, addDataPurposeLink, removeDataPurposeLink } = useWorkspace();
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const items = Object.values(treatment.dataItems ?? {});
  const purposes = Object.values(treatment.purposes ?? {});
  const linked = (dataId: string, purposeId: string) =>
    (treatment.dataPurposeLinks ?? []).some(
      (l) => l.dataId === dataId && l.purposeId === purposeId,
    );
  if (items.length === 0 || purposes.length === 0) return null;
  return (
    <section className="activity-section" aria-label="Relación datos y finalidades" data-testid="workspace-links">
      <h2>Datos por finalidad en {treatment.context.name}</h2>
      <p>
        Marca qué datos se utilizan para cada finalidad. Es una vista de
        relaciones tipadas, no una matriz almacenada aparte.
      </p>
      <div className="table-wrap">
        <table className="trace-table">
          <thead>
            <tr>
              <th scope="col">Dato</th>
              {purposes.map((p) => (
                <th key={p.purpose.id} scope="col">
                  {p.purpose.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>{d.label}</td>
                {purposes.map((p) => {
                  const on = linked(d.id, p.purpose.id);
                  return (
                    <td key={p.purpose.id}>
                      <button
                        type="button"
                        className={on ? "btn small" : "btn ghost small"}
                        aria-pressed={on}
                        aria-label={`${d.label} para ${p.purpose.description}`}
                        onClick={() =>
                          on
                            ? removeDataPurposeLink(treatmentId, {
                                dataId: d.id,
                                purposeId: p.purpose.id,
                              })
                            : addDataPurposeLink(treatmentId, {
                                dataId: d.id,
                                purposeId: p.purpose.id,
                              })
                        }
                      >
                        {on ? "Sí" : "No"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RetentionWorkspace({ treatmentId }: { treatmentId: string }) {
  const {
    company,
    addRetentionRule,
    deleteRetentionRule,
  } = useWorkspace();
  const [criterion, setCriterion] = useState("");
  const [owner, setOwner] = useState("");
  const [event, setEvent] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const rules = Object.values(treatment.retentionRules ?? {});
  const items = Object.values(treatment.dataItems ?? {});
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <section className="activity-section" aria-label="Conservación" data-testid="workspace-retention">
      <h2>Conservación en {treatment.context.name}</h2>
      {rules.length === 0 ? (
        <p>No hay reglas de conservación.</p>
      ) : (
        <ul>
          {rules.map((r) => (
            <li key={r.id}>
              <strong>{r.criterion}</strong> · Responsable: {r.owner} ·{" "}
              {r.dataItemIds.length} {r.dataItemIds.length === 1 ? "dato" : "datos"}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteRetentionRule(treatmentId, r.id)}
                aria-label={`Eliminar regla ${r.criterion}`}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 ? (
        <p>Agrega datos antes de definir reglas.</p>
      ) : (
        <>
          <div className="field">
            <span id="regla-datos-label">Datos alcanzados</span>
            <div role="group" aria-labelledby="regla-datos-label">
              {items.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={checked.includes(d.id) ? "btn small" : "btn ghost small"}
                  aria-pressed={checked.includes(d.id)}
                  onClick={() =>
                    setChecked((prev) =>
                      prev.includes(d.id)
                        ? prev.filter((x) => x !== d.id)
                        : [...prev, d.id],
                    )
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="regla-criterio">Período o criterio de término</label>
            <input
              id="regla-criterio"
              className="input"
              value={criterion}
              onChange={(e) => setCriterion(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="regla-evento">Evento de supresión (opcional)</label>
            <input
              id="regla-evento"
              className="input"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="regla-responsable">Responsable operacional</label>
            <input
              id="regla-responsable"
              className="input"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn"
              disabled={
                checked.length === 0 ||
                criterion.trim() === "" ||
                owner.trim() === ""
              }
              onClick={() => {
                addRetentionRule(treatmentId, {
                  dataItemIds: checked,
                  criterion,
                  ...(event.trim() !== "" ? { event: event.trim() } : {}),
                  owner,
                });
                setChecked([]);
                setCriterion("");
                setEvent("");
                setOwner("");
              }}
            >
              Agregar regla
            </button>
          </div>
        </>
      )}
    </section>
  );
}

const USE_PROFILING: Array<{ value: SafeguardCheck; label: string }> = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Desconocido — pendiente" },
];

const USE_COVERAGES = [
  { value: "covered", label: "Comprendido (art. 8 bis)" },
  { value: "not_covered", label: "No comprendido" },
  { value: "unknown", label: "Desconocido — pendiente de evaluar" },
] as const;

const USE_PATHS: Record<string, Array<{ value: AutomatedUseLegalPath; label: string }>> = {
  covered: [
    { value: "contract_necessary", label: "Necesario para contrato" },
    { value: "explicit_consent", label: "Consentimiento previo y expreso" },
    { value: "legal_authorization", label: "Habilitación legal" },
    { value: "none", label: "Sin vía (ausencia determinada)" },
    { value: "unknown", label: "Pendiente (unknown)" },
  ],
  not_covered: [{ value: "not_applicable", label: "No aplica" }],
  unknown: [{ value: "unknown", label: "Pendiente (unknown)" }],
};

const SAFEGUARD_FIELDS: Array<{
  key: keyof Omit<AutomatedUseSafeguards, "interventionChannel" | "reviewChannel">;
  label: string;
}> = [
  { key: "informationTransparency", label: "Información y transparencia" },
  { key: "explanation", label: "Explicación" },
  { key: "humanIntervention", label: "Intervención humana" },
  { key: "pointOfView", label: "Punto de vista del titular" },
  { key: "review", label: "Revisión de la decisión" },
];

function coverageLabel(u: AutomatedUseRecord): string {
  if (u.article8bisCoverage === "covered") return "Comprendido (art. 8 bis)";
  if (u.article8bisCoverage === "not_covered") return "No comprendido";
  return "Cobertura pendiente";
}

function safeguardsSummary(u: AutomatedUseRecord): string {
  if (u.article8bisCoverage !== "covered") return "";
  const s = u.safeguards;
  if (!s) return "Salvaguardas sin evaluar";
  const values = SAFEGUARD_FIELDS.map((f) => s[f.key]);
  if (values.some((v) => v === "no")) return "Salvaguardas con deficiencia";
  if (values.every((v) => v === "yes")) return "Salvaguardas habilitadas";
  return "Salvaguardas incompletas";
}

/**
 * Inventario de usos automatizados del tratamiento (D4.08/D4.09).
 *
 * Edita la colección local compartida con el treatment
 * explícitamente direccionado: nunca elabora juicios, nunca ejecuta
 * protocolos, nunca escribe canonical facts. Crear o editar un uso
 * NO completa D4.08 ni D4.09; la conclusión vive en la guía con su
 * ReasoningRecord. Sin sub-rutas: el uso jamás es ExecutionContext.
 */
export function AutomatedUsesWorkspace({ treatmentId }: { treatmentId: string }) {
  const {
    company,
    addAutomatedUse,
    deleteAutomatedUse,
  } = useWorkspace();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const uses = treatment.automatedUses ?? [];
  const purposes = Object.values(treatment.purposes ?? {});
  const purposeName = (purposeId: string | undefined): string => {
    if (!purposeId) return "";
    const found = purposes.find((p) => p.purpose.id === purposeId);
    return found ? ` · Finalidad: ${found.purpose.description}` : "";
  };
  const evaluated = uses.filter((u) => u.article8bisCoverage !== "unknown").length;
  return (
    <section
      className="activity-section"
      aria-label="Usos automatizados"
      data-testid="workspace-automated-uses"
    >
      <h2>Usos automatizados de {treatment.context.name}</h2>
      <p data-testid="automated-uses-summary">
        {uses.length === 0
          ? "No hay usos automatizados registrados."
          : `${uses.length} ${uses.length === 1 ? "uso" : "usos"}, ${evaluated} con cobertura evaluada.`}
      </p>
      <p className="result-count">
        Registrar un uso organiza el inventario: no clasifica jurídicamente ni
        completa D4.08/D4.09. La cobertura pendiente (desconocido) nunca equivale
        a no comprendido.
      </p>
      {uses.length > 0 ? (
        <ul>
          {uses.map((u) => (
            <li key={u.id}>
              <strong>{u.name}</strong> · {coverageLabel(u)}
              {purposeName(u.purposeId)}
              {u.article8bisCoverage === "covered" ? ` · ${safeguardsSummary(u)}` : null}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                aria-label={`Editar uso ${u.name}`}
              >
                {editingId === u.id ? "Cerrar" : "Editar"}
              </button>{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  deleteAutomatedUse(treatmentId, u.id);
                  if (editingId === u.id) setEditingId(null);
                }}
                aria-label={`Eliminar uso ${u.name}`}
              >
                Eliminar
              </button>
              {editingId === u.id ? (
                <UseEditor
                  treatmentId={treatmentId}
                  use={u}
                  purposeOptions={purposes.map((p) => ({
                    id: p.purpose.id,
                    description: p.purpose.description,
                  }))}
                  onDone={() => setEditingId(null)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="field">
        <label htmlFor="uso-nombre">Nombre del uso</label>
        <input
          id="uso-nombre"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={name.trim() === ""}
          onClick={() => {
            addAutomatedUse(treatmentId, { name });
            setName("");
          }}
        >
          Agregar uso
        </button>
      </div>
    </section>
  );
}

function UseEditor({
  treatmentId,
  use,
  purposeOptions,
  onDone,
}: {
  treatmentId: string;
  use: AutomatedUseRecord;
  purposeOptions: Array<{ id: string; description: string }>;
  onDone: () => void;
}) {
  const { company, updateAutomatedUse } = useWorkspace();
  const [description, setDescription] = useState(use.description ?? "");
  const [purposeId, setPurposeId] = useState(use.purposeId ?? "");
  const [processDescription, setProcessDescription] = useState(
    use.processDescription ?? "",
  );
  const [mechanismDescription, setMechanismDescription] = useState(
    use.mechanismDescription ?? "",
  );
  const [decisionDescription, setDecisionDescription] = useState(
    use.decisionDescription ?? "",
  );
  const [profiling, setProfiling] = useState<SafeguardCheck>(use.profiling);
  const [evidenceRef, setEvidenceRef] = useState(use.evidenceRef ?? "");
  const [coverage, setCoverage] = useState(use.article8bisCoverage);
  const [legalPath, setLegalPath] = useState<AutomatedUseLegalPath>(use.legalPath);
  const [safeguards, setSafeguards] = useState<AutomatedUseSafeguards>(
    use.safeguards ?? {},
  );
  const [interventionChannel, setInterventionChannel] = useState(
    use.safeguards?.interventionChannel ?? "",
  );
  const [reviewChannel, setReviewChannel] = useState(
    use.safeguards?.reviewChannel ?? "",
  );
  const paths = USE_PATHS[coverage] ?? USE_PATHS.unknown;
  const save = () => {
    updateAutomatedUse(treatmentId, use.id, {
      description: description === "" ? null : description,
      purposeId: purposeId === "" ? null : purposeId,
      processDescription: processDescription === "" ? null : processDescription,
      mechanismDescription: mechanismDescription === "" ? null : mechanismDescription,
      decisionDescription: decisionDescription === "" ? null : decisionDescription,
      profiling,
      evidenceRef: evidenceRef === "" ? null : evidenceRef,
      article8bisCoverage: coverage,
      ...(coverage === "covered" ? { legalPath } : {}),
      ...(coverage === "covered"
        ? {
            safeguards: {
              ...safeguards,
              ...(interventionChannel.trim() !== ""
                ? { interventionChannel: interventionChannel.trim() }
                : {}),
              ...(reviewChannel.trim() !== "" ? { reviewChannel: reviewChannel.trim() } : {}),
            },
          }
        : {}),
    });
    // Las opciones del editor solo admiten valores válidos; si el uso
    // sigue existiendo, el guardado se aplicó.
    const stillThere = company?.treatments?.[treatmentId]?.automatedUses?.some(
      (u) => u.id === use.id,
    );
    if (stillThere) onDone();
  };
  return (
    <div className="field" data-testid={`uso-editor-${use.id}`}>
      <label htmlFor={fieldId("uso-descripcion", use.id)}>Descripción</label>
      <input
        id={fieldId("uso-descripcion", use.id)}
        className="input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor={fieldId("uso-finalidad", use.id)}>Finalidad asociada (opcional)</label>
      <select
        id={fieldId("uso-finalidad", use.id)}
        className="input"
        value={purposeId}
        onChange={(e) => setPurposeId(e.target.value)}
      >
        <option value="">Sin finalidad asociada</option>
        {purposeOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.description}
          </option>
        ))}
      </select>
      <label htmlFor={fieldId("uso-proceso", use.id)}>Proceso y contexto</label>
      <input
        id={fieldId("uso-proceso", use.id)}
        className="input"
        value={processDescription}
        onChange={(e) => setProcessDescription(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor={fieldId("uso-mecanismo", use.id)}>Mecanismo automatizado</label>
      <input
        id={fieldId("uso-mecanismo", use.id)}
        className="input"
        value={mechanismDescription}
        onChange={(e) => setMechanismDescription(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor={fieldId("uso-decision", use.id)}>Decisión o resultado producido</label>
      <input
        id={fieldId("uso-decision", use.id)}
        className="input"
        value={decisionDescription}
        onChange={(e) => setDecisionDescription(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor={fieldId("uso-profiling", use.id)}>Elaboración de perfiles</label>
      <select
        id={fieldId("uso-profiling", use.id)}
        className="input"
        value={profiling}
        onChange={(e) => setProfiling(e.target.value as SafeguardCheck)}
      >
        {USE_PROFILING.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={fieldId("uso-evidencia", use.id)}>Referencia documental</label>
      <input
        id={fieldId("uso-evidencia", use.id)}
        className="input"
        value={evidenceRef}
        onChange={(e) => setEvidenceRef(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor={fieldId("uso-cobertura", use.id)}>Cobertura art. 8 bis</label>
      <select
        id={fieldId("uso-cobertura", use.id)}
        className="input"
        value={coverage}
        onChange={(e) => {
          const next = e.target.value as AutomatedUseRecord["article8bisCoverage"];
          setCoverage(next);
          const first = (USE_PATHS[next] ?? USE_PATHS.unknown)[0];
          if (first) setLegalPath(first.value);
        }}
      >
        {USE_COVERAGES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={fieldId("uso-via", use.id)}>Vía legal</label>
      <select
        id={fieldId("uso-via", use.id)}
        className="input"
        value={legalPath}
        onChange={(e) => setLegalPath(e.target.value as AutomatedUseLegalPath)}
      >
        {paths.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {coverage === "covered" ? (
        <>
          <p className="result-count">
            Salvaguardas del uso (solo para usos comprendidos; la vía legal no las exime).
          </p>
          {SAFEGUARD_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={fieldId(`uso-sg-${f.key}`, use.id)}>{f.label}</label>
              <select
                id={fieldId(`uso-sg-${f.key}`, use.id)}
                className="input"
                value={safeguards[f.key] ?? ""}
                onChange={(e) => {
                  const next: AutomatedUseSafeguards = { ...safeguards };
                  if (e.target.value === "") delete next[f.key];
                  else next[f.key] = e.target.value as SafeguardCheck;
                  setSafeguards(next);
                }}
              >
                <option value="">Sin evaluar</option>
                <option value="yes">Verificada</option>
                <option value="no">Pendiente o deficiente</option>
                <option value="unknown">Desconocida</option>
              </select>
            </div>
          ))}
          <label htmlFor={fieldId("uso-canal-intervencion", use.id)}>
            Canal de intervención
          </label>
          <input
            id={fieldId("uso-canal-intervencion", use.id)}
            className="input"
            value={interventionChannel}
            onChange={(e) => setInterventionChannel(e.target.value)}
            autoComplete="off"
          />
          <label htmlFor={fieldId("uso-canal-revision", use.id)}>Canal de revisión</label>
          <input
            id={fieldId("uso-canal-revision", use.id)}
            className="input"
            value={reviewChannel}
            onChange={(e) => setReviewChannel(e.target.value)}
            autoComplete="off"
          />
        </>
      ) : null}
      <div className="actions">
        <button type="button" className="btn small" onClick={save}>
          Guardar uso
        </button>
      </div>
    </div>
  );
}
