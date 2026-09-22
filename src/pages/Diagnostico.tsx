import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../workspace/context";
import { factHasConflict, factSources, humanSourceName, mergedFactRecords } from "../workspace/facts";
import {
  describeFactKey,
  describeFactValue,
  producerOptions,
} from "../workspace/factLabels";

const AREAS = [
  "Entidad",
  "Territorio",
  "Roles",
  "Titulares",
  "Categorías de datos",
  "Características del tratamiento",
  "Flujos",
  "Madurez",
  "Gobernanza",
  "Etiquetas regulatorias",
];

/** Estado MPI canónico: hecho de caracterización reutilizable por guías. */
const MPI_FACT = "mpi.lifecycle_status";

export function DiagnosticoPage() {
  const {
    company,
    setDiagnosticFact,
    clearDiagnosticFact,
    clearProtocolFact,
  } = useWorkspace();
  const [mpiDraft, setMpiDraft] = useState("");
  const mpiOptions = producerOptions(MPI_FACT);
  const mpiCurrent = company?.diagnosticFacts[MPI_FACT]?.value;

  const knownFacts: Array<{
    factKey: string;
    value: string;
    sources: string[];
    conflict: boolean;
    remove: () => void;
  }> = [];
  if (company) {
    const merged = mergedFactRecords(company);
    for (const [k, r] of Object.entries(merged)) {
      knownFacts.push({
        factKey: k,
        value: r.value,
        sources: factSources(company, k),
        conflict: factHasConflict(company, k),
        remove: () => {
          clearDiagnosticFact(k);
          for (const pk of Object.keys(company.protocolAnswers)) {
            clearProtocolFact(pk, k);
          }
        },
      });
    }
  }

  return (
    <>
      <p className="eyebrow">MODO GUIADO</p>
      <h1>Diagnóstico</h1>
      <p className="lede">
        La caracterización captura hechos relevantes del cliente; no equivale por
        sí sola a una evaluación de cumplimiento. Los hechos registrados aquí
        se reutilizan como antecedentes conocidos en las guías de ejecución.
      </p>

      <div className="notice">
        <strong>Estructura preparada</strong>
        <p>
          Las preguntas canónicas de caracterización todavía no han sido
          importadas. Esta vista no debe inventarlas ni convertir información
          desconocida en una respuesta negativa.
        </p>
      </div>

      <h2>Áreas conceptuales</h2>
      <ul className="area-list">
        {AREAS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>

      <h2>Hechos conocidos de la empresa</h2>
      {!company ? (
        <div className="empty">
          <p>
            <Link to="/empresa">Selecciona una empresa</Link> para registrar y
            reutilizar hechos de caracterización.
          </p>
        </div>
      ) : (
        <>
          {mpiOptions.length > 0 ? (
            <div className="panel">
              <div className="field">
                <label htmlFor="registro-mpi">Estado del MPI (caracterización)</label>
                <select
                  id="registro-mpi"
                  className="input"
                  value={mpiDraft}
                  onChange={(e) => setMpiDraft(e.target.value)}
                >
                  <option value="">Seleccionar estado…</option>
                  {mpiOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn secondary small"
                  disabled={mpiDraft === ""}
                  onClick={() => {
                    setDiagnosticFact(MPI_FACT, mpiDraft);
                    setMpiDraft("");
                  }}
                >
                  Registrar hecho
                </button>
                {mpiCurrent ? (
                  <span className="result-count">
                    Actual: {describeFactValue(MPI_FACT, mpiCurrent)}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          {knownFacts.length === 0 ? (
            <div className="empty">
              <p>
                Aún no hay hechos registrados para {company.name}. Responder
                guías de ejecución también alimenta esta lista.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="trace-table" data-testid="diagnostico-facts">
                <thead>
                  <tr>
                    <th scope="col">Hecho</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Origen</th>
                    <th scope="col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {knownFacts.map((f) => (
                    <tr key={f.factKey}>
                      <td>{describeFactKey(f.factKey)}</td>
                      <td>
                        {f.conflict ? (
                          <>
                            En conflicto{" "}
                            <span className="dep-pending">
                              · valores distintos según origen, sin resolución
                              vigente
                            </span>
                          </>
                        ) : (
                          describeFactValue(f.factKey, f.value)
                        )}
                      </td>
                      <td>
                        {f.sources.map(humanSourceName).join(" + ")}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={f.remove}
                          aria-label={`Quitar ${describeFactKey(f.factKey)}`}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="actions">
        <Link className="btn secondary" to="/trabajo">
          Explorar el trabajo
        </Link>
      </div>
    </>
  );
}
