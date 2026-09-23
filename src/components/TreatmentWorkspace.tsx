import { useState } from "react";
import { useWorkspace } from "../workspace/context";

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
  const { company, addDataItem, deleteDataItem } = useWorkspace();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  if (!company) return null;
  const treatment = company.treatments?.[treatmentId];
  if (!treatment) return null;
  const items = Object.values(treatment.dataItems ?? {});
  return (
    <section className="activity-section" aria-label="Datos" data-testid="workspace-data">
      <h2>Datos de {treatment.context.name}</h2>
      {items.length === 0 ? (
        <p>No hay datos registrados.</p>
      ) : (
        <ul>
          {items.map((d) => (
            <li key={d.id}>
              <strong>{d.label}</strong>
              {d.category ? ` · ${d.category}` : ""}{" "}
              <button
                type="button"
                className="btn ghost small"
                onClick={() => deleteDataItem(treatmentId, d.id)}
                aria-label={`Eliminar dato ${d.label}`}
              >
                Eliminar
              </button>
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
