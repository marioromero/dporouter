import { SOURCES } from "../../content/sources";
import {
  ProvenanceCard,
  TransitionalBadge,
  sourceKindLabel,
} from "../components/ui";

export function FuentesPage() {
  return (
    <>
      <h1>Fuentes y estado normativo</h1>
      <p className="lede">
        Consulta el origen de los requisitos, las fuentes jurídicas ya
        incorporadas y su estado normativo.
      </p>

      <h2>Tipos de procedencia</h2>
      <div className="prov-list">
        <ProvenanceCard
          kind="legal"
          text="Exigencia respaldada directamente por una fuente legal o reglamentaria aplicable."
        />
        <ProvenanceCard
          kind="method"
          text="Criterio operativo adoptado para asegurar consistencia, evidencia y auditabilidad."
        />
        <ProvenanceCard
          kind="pending"
          text="Materia que requiere un instrumento oficial futuro o una verificación regulatoria posterior."
        />
      </div>

      <h2>Fuentes canónicas</h2>
      <div className="source-list">
        {SOURCES.map((s) => (
          <article key={s.source_id} className="source-card">
            <h3>{s.name}</h3>
            <dl>
              <dt>Tipo</dt>
              <dd>{sourceKindLabel(s.kind)}</dd>
              <dt>Estado regulatorio</dt>
              <dd>
                {s.regulatory_status === "transitional" ? (
                  <>
                    <TransitionalBadge />{" "}
                    <span>Nuevo régimen con vigencia desde 01-12-2026</span>
                  </>
                ) : (
                  s.regulatory_status
                )}
              </dd>
              {s.published_at.trim() !== "" ? (
                <>
                  <dt>Publicación</dt>
                  <dd>{s.published_at}</dd>
                </>
              ) : null}
              <dt>Última revisión</dt>
              <dd>{s.last_review}</dd>
              <dt>Nota temporal</dt>
              <dd>{s.note}</dd>
            </dl>
            <h3>Provisiones utilizadas</h3>
            <ul>
              {s.provisions_used.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}
