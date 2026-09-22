import { Link } from "react-router-dom";
import type { ExecutionProtocol } from "../../content/protocols/types";
import { useGuidanceProtocol } from "../guidance/session";

/**
 * Sección prioritaria de evaluación guiada para la ficha de actividad.
 *
 * Se renderiza solo cuando la actividad tiene un protocolo activo (vía
 * registry). Complementa la `ActivityDefinition`; no la reemplaza. Sin
 * literales canónicos: todo proviene del protocolo y de la sesión.
 */
export function ActivityGuidedSection({
  protocol,
  activityKey,
}: {
  protocol: ExecutionProtocol;
  activityKey: string;
}) {
  const session = useGuidanceProtocol(protocol.protocol_key);
  return (
    <section
      className="activity-section guided-section"
      aria-label="Evaluación guiada"
      data-testid="actividad-guia"
    >
      <h2>Evaluación guiada</h2>
      <p>{protocol.title}</p>
      <p>
        Responde los factores relevantes y el sistema determinará si existe
        obligación derivada del MPI o el nivel de recomendación profesional
        aplicable.
      </p>
      <div className="actions">
        <Link className="btn" to={`/actividad/${activityKey}/guia`}>
          {session.started ? "Continuar evaluación" : "Iniciar evaluación"}
        </Link>
      </div>
    </section>
  );
}
