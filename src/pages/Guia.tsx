import { useParams } from "react-router-dom";
import { getProtocolForActivity, getProtocolNode } from "../../content/protocols/registry";
import { getCanonicalActivity, getDomainForActivity } from "../../content/registry";
import { evaluateProtocol } from "../guidance/engine";
import { useGuidanceProtocol } from "../guidance/session";
import {
  ProtocolChrome,
  ProtocolEntryView,
  ProtocolNodeView,
  ProtocolOutcomeView,
  ProtocolPendingView,
} from "../components/ProtocolView";
import { NotFoundPage } from "./NotFound";

/**
 * Página de guía de ejecución (`/actividad/:activityKey/guia[/...]`).
 *
 * Resuelve el protocolo canónico por `activity_key` vía registry; cada nodo
 * tiene URL estable y abre sin estado previo (sin inventar respuestas).
 */
export function GuiaPage() {
  const { activityKey, nodeKey } = useParams<{
    activityKey: string;
    nodeKey?: string;
  }>();

  const protocol = activityKey ? getProtocolForActivity(activityKey) : undefined;
  const def = activityKey ? getCanonicalActivity(activityKey) : undefined;
  if (!protocol || !def || !activityKey) {
    return <NotFoundPage />;
  }
  return <GuiaContent activityKey={activityKey} nodeKey={nodeKey} />;
}

function GuiaContent({
  activityKey,
  nodeKey,
}: {
  activityKey: string;
  nodeKey?: string;
}) {
  const protocol = getProtocolForActivity(activityKey);
  const def = getCanonicalActivity(activityKey);
  const domain = getDomainForActivity(activityKey);
  const session = useGuidanceProtocol(protocol?.protocol_key ?? "");
  if (!protocol || !def) {
    return <NotFoundPage />;
  }
  const activity = {
    activityKey,
    humanCode: def.human_code,
    name: def.name,
    domainKey: domain?.domainKey,
    domainCode: domain?.domainCode,
  };

  if (!nodeKey) {
    return (
      <ProtocolEntryView protocol={protocol} activity={activity} session={session} />
    );
  }

  if (nodeKey === "resultado") {
    const evaluation = evaluateProtocol(protocol, session.facts);
    if (evaluation.status === "outcome") {
      return (
        <ProtocolOutcomeView
          protocol={protocol}
          activity={activity}
          session={session}
          outcome={evaluation.outcome}
          ruleId={evaluation.rule_id}
          explanation={evaluation.explanation}
        />
      );
    }
    if (evaluation.status === "awaiting_facts") {
      return (
        <ProtocolPendingView
          protocol={protocol}
          activity={activity}
          session={session}
          currentNodeKey={evaluation.current_node_key}
          missingCount={evaluation.missing_fact_keys.length}
        />
      );
    }
    return (
      <>
        <ProtocolChrome
          protocol={protocol}
          activity={activity}
          session={session}
          crumbTail="Resultado"
        />
        <section className="activity-section" aria-label="Error de configuración" data-testid="guia-misconfigured">
          <h2>Error de configuración del protocolo</h2>
          <p>
            <code>{evaluation.detail}</code>
          </p>
          <p>
            Esta es una falla de configuración canónica, no un resultado
            profesional. Repórtala como issue de especificación.
          </p>
        </section>
      </>
    );
  }

  const node = getProtocolNode(protocol, nodeKey);
  if (!node) {
    return <NotFoundPage />;
  }

  if (node.node_type === "decision") {
    // El nodo decisión no pide respuestas: evalúa el protocolo completo con
    // los hechos de sesión. Sin hechos suficientes no se inventa conclusión:
    // se conduce al primer antecedente requerido.
    const evaluation = evaluateProtocol(protocol, session.facts);
    if (evaluation.status === "outcome") {
      return (
        <ProtocolOutcomeView
          protocol={protocol}
          activity={activity}
          session={session}
          outcome={evaluation.outcome}
          ruleId={evaluation.rule_id}
          explanation={evaluation.explanation}
        />
      );
    }
    if (evaluation.status === "awaiting_facts") {
      return (
        <ProtocolPendingView
          protocol={protocol}
          activity={activity}
          session={session}
          currentNodeKey={evaluation.current_node_key}
          missingCount={evaluation.missing_fact_keys.length}
        />
      );
    }
    return (
      <>
        <ProtocolChrome
          protocol={protocol}
          activity={activity}
          session={session}
          crumbTail={node.title}
        />
        <section className="activity-section" aria-label="Error de configuración" data-testid="guia-misconfigured">
          <h2>Error de configuración del protocolo</h2>
          <p>
            <code>{evaluation.detail}</code>
          </p>
          <p>
            Esta es una falla de configuración canónica, no un resultado
            profesional. Repórtala como issue de especificación.
          </p>
        </section>
      </>
    );
  }

  return (
    <ProtocolNodeView
      protocol={protocol}
      activity={activity}
      session={session}
      node={node}
    />
  );
}
