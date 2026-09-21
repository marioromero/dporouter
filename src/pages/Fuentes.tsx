import { ProvenanceCard } from "../components/ui";

export function FuentesPage() {
  return (
    <>
      <h1>Fuentes y estado normativo</h1>
      <p className="lede">
        Consulta cómo se distingue el origen de cada requisito y, posteriormente,
        las fuentes jurídicas vinculadas a las actividades.
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
      <div className="empty">
        <p>
          Las fuentes jurídicas se incorporarán junto con las actividades
          canónicas. No se mostrarán referencias provisionales.
        </p>
      </div>
    </>
  );
}
