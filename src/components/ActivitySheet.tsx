import { Link } from "react-router-dom";
import { CopyLinkButton } from "./ui";
import type { ActivityViewModel } from "../activityViewModel";

/**
 * Ficha reutilizable de actividad (Stage 1).
 * Consume exclusivamente `ActivityViewModel`, construible desde una
 * `ActivityDefinition` canónica o desde el fixture DEMO no canónico.
 * No contiene textos de contenido: jerarquía operacional primero,
 * trazabilidad técnica secundaria.
 */
export function ActivitySheet({
  view,
  banner,
}: {
  view: ActivityViewModel;
  banner?: string;
}) {
  return (
    <>
      {banner ? (
        <div className="demo-banner" role="note">
          {banner}
        </div>
      ) : null}

      <p className="breadcrumb">
        <Link to="/mapa">Mapa</Link> / Actividad
      </p>

      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{view.name}</h1>
          <span className="human-code">{view.humanCode}</span>
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>

      <section className="activity-section" aria-label="Objetivo">
        <h2>Objetivo</h2>
        <p>{view.objective}</p>
      </section>

      <section className="activity-section" aria-label="Cuándo aplica">
        <h2>Cuándo aplica</h2>
        <p>{view.appliesWhen}</p>
      </section>

      <section className="activity-section" aria-label="Pregunta gatillo">
        <h2>Pregunta gatillo</h2>
        <p>{view.triggerQuestion}</p>
      </section>

      <section className="activity-section" aria-label="Qué debe hacer el profesional">
        <h2>Qué debe hacer el profesional</h2>
        <p>{view.professionalDuty}</p>
      </section>

      <section className="activity-section" aria-label="Pasos operacionales">
        <h2>Pasos operacionales</h2>
        <ol>
          {view.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="activity-section" aria-label="Interlocutores">
        <h2>Interlocutores</h2>
        <ul>
          {view.interlocutors.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Métodos de levantamiento">
        <h2>Métodos de levantamiento</h2>
        <ul>
          {view.collectionMethods.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Evidencia requerida">
        <h2>Evidencia requerida</h2>
        <ul>
          {view.evidence.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Entregable">
        <h2>Entregable</h2>
        <p>{view.deliverable}</p>
      </section>

      <section className="activity-section" aria-label="Tiempo estimado">
        <h2>Tiempo estimado</h2>
        <p>{view.estimatedTime}</p>
      </section>

      <section className="activity-section" aria-label="Complejidad">
        <h2>Complejidad</h2>
        <p>{view.complexity}</p>
      </section>

      <section className="activity-section" aria-label="Fundamento">
        <h2>Fundamento</h2>
        <p>{view.grounds}</p>
      </section>

      <section className="activity-section" aria-label="Dependencias">
        <h2>Dependencias</h2>
        <ul>
          {view.dependencies.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Resultado o efecto esperado">
        <h2>Resultado o efecto esperado</h2>
        <p>{view.expectedResult}</p>
      </section>

      <section className="activity-section" aria-label="Estado regulatorio">
        <h2>Estado regulatorio</h2>
        <p>{view.regulatoryStatus}</p>
      </section>

      <section className="activity-section" aria-label="Última revisión legal">
        <h2>Última revisión legal</h2>
        <p>{view.lastLegalReview}</p>
      </section>

      <section className="activity-section" aria-label="Trazabilidad técnica">
        <h2>Trazabilidad técnica</h2>
        <table className="trace-table">
          <tbody>
            {view.trace.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
