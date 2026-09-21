import { Link } from "react-router-dom";
import { CopyLinkButton } from "./ui";
import type { DemoActivityView } from "../data/demoActivity";

/**
 * Ficha reutilizable de actividad (Stage 1).
 * Jerarquía operacional primero; trazabilidad técnica secundaria.
 * Hoy se ejercita con el fixture DEMO no canónico; recibirá
 * `ActivityDefinition` canónicas sin cambiar su estructura.
 */
export function ActivitySheet({
  activity,
  demoBanner,
  trace,
}: {
  activity: DemoActivityView;
  demoBanner?: string;
  trace: { label: string; value: string }[];
}) {
  return (
    <>
      {demoBanner ? (
        <div className="demo-banner" role="note">
          {demoBanner}
        </div>
      ) : null}

      <p className="breadcrumb">
        <Link to="/mapa">Mapa</Link> / Actividad
      </p>

      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{activity.name}</h1>
          <span className="human-code">{activity.human_code}</span>
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>

      <section className="activity-section" aria-label="Objetivo">
        <h2>Objetivo</h2>
        <p>{activity.objective}</p>
      </section>

      <section className="activity-section" aria-label="Cuándo aplica">
        <h2>Cuándo aplica</h2>
        <p>{activity.applies_when}</p>
      </section>

      <section className="activity-section" aria-label="Pregunta gatillo">
        <h2>Pregunta gatillo</h2>
        <p>{activity.trigger_question}</p>
      </section>

      <section className="activity-section" aria-label="Qué debe hacer el profesional">
        <h2>Qué debe hacer el profesional</h2>
        <p>{activity.professional_duty}</p>
      </section>

      <section className="activity-section" aria-label="Pasos operacionales">
        <h2>Pasos operacionales</h2>
        <ol>
          {activity.steps_operational.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="activity-section" aria-label="Interlocutores">
        <h2>Interlocutores</h2>
        <ul>
          {activity.interlocutors.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Métodos de levantamiento">
        <h2>Métodos de levantamiento</h2>
        <ul>
          {activity.data_collection_methods.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Evidencia requerida">
        <h2>Evidencia requerida</h2>
        <ul>
          {activity.evidence_required.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="activity-section" aria-label="Entregable">
        <h2>Entregable</h2>
        <p>{activity.deliverable}</p>
      </section>

      <section className="activity-section" aria-label="Tiempo estimado">
        <h2>Tiempo estimado</h2>
        <p>{activity.estimated_time}</p>
      </section>

      <section className="activity-section" aria-label="Complejidad">
        <h2>Complejidad</h2>
        <p>{activity.complexity}</p>
      </section>

      <section className="activity-section" aria-label="Fundamento">
        <h2>Fundamento</h2>
        <p>{activity.legal_ground}</p>
      </section>

      <section className="activity-section" aria-label="Dependencias">
        <h2>Dependencias</h2>
        <p>Sin dependencias en el contenido demostrativo.</p>
      </section>

      <section className="activity-section" aria-label="Resultado o efecto esperado">
        <h2>Resultado o efecto esperado</h2>
        <p>{activity.expected_result}</p>
      </section>

      <section className="activity-section" aria-label="Estado regulatorio">
        <h2>Estado regulatorio</h2>
        <p>No aplica: contenido exclusivamente demostrativo.</p>
      </section>

      <section className="activity-section" aria-label="Última revisión legal">
        <h2>Última revisión legal</h2>
        <p>No aplica: contenido exclusivamente demostrativo.</p>
      </section>

      <section className="activity-section" aria-label="Trazabilidad técnica">
        <h2>Trazabilidad técnica</h2>
        <table className="trace-table">
          <tbody>
            {trace.map((row) => (
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
