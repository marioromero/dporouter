import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { findConclusionNode, getProtocolForActivity, getProtocolNode } from "../../content/protocols/registry";
import { getCanonicalActivity, getDomainForActivity } from "../../content/registry";
import {
  evaluateProtocol,
  firstProducerNodeKey,
  getMissingRequiredFacts,
  resolveDecisionNode,
} from "../guidance/engine";
import { useGuidanceProtocol } from "../guidance/session";
import { useWorkspace } from "../workspace/context";
import { blockingConflicts, protocolNeededFacts } from "../workspace/facts";
import {
  activeExecutionContext,
  blockingScopedConflicts,
} from "../workspace/scope";
import { ContextNav } from "../components/ContextNav";
import {
  ProtocolChrome,
  ProtocolConflictView,
  ProtocolEntryView,
  ProtocolNodeView,
  ProtocolOutcomeView,
  ProtocolPendingView,
} from "../components/ProtocolView";
import { RecordedJudgmentView, JudgmentPanel } from "../components/JudgmentPanel";
import { resolveGuideResult } from "../workspace/reasoning";
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
  const domain = getDomainForActivity(activityKey);
  return (
    <>
      <ContextNav
        domainKey={domain?.domainKey}
        activityKey={activityKey}
        guide={{ protocolKey: protocol.protocol_key, currentNodeKey: nodeKey }}
      />
      <GuiaContent activityKey={activityKey} nodeKey={nodeKey} />
    </>
  );
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
  const session = useGuidanceProtocol(
    protocol?.protocol_key ?? "",
    protocol?.execution_scope ?? "company",
  );
  const { company } = useWorkspace();
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
  // Un fact necesario en conflicto bloquea cualquier conclusión definitiva
  // (no equivale a pendiente ni a desconocido). En scopes treatment y
  // purpose solo cuentan conflictos intra-dirección efectiva.
  const judgmentCtx = company
    ? activeExecutionContext(company, protocol.execution_scope ?? "company")
    : null;
  const blocks =
    judgmentCtx && judgmentCtx.scope !== "company"
      ? blockingScopedConflicts(protocolNeededFacts(protocol), company, judgmentCtx)
      : blockingConflicts(protocol, company);

  if (!nodeKey) {
    return (
      <ProtocolEntryView protocol={protocol} activity={activity} session={session} />
    );
  }

  if (nodeKey === "resultado") {
    if (blocks.length > 0) {
      return (
        <ProtocolConflictView
          protocol={protocol}
          activity={activity}
          session={session}
          conflictedFacts={blocks}
        />
      );
    }
    const resolved = resolveGuideResult(protocol, company, session.facts, judgmentCtx);
    if (resolved.kind === "recorded") {
      return (
        <RecordedJudgmentView
          protocol={protocol}
          activity={activity}
          session={session}
          record={resolved.record}
          outcomeKey={resolved.outcome.outcome_key}
        />
      );
    }
    if (resolved.kind === "continue") {
      return (
        <Navigate
          to={`/actividad/${activityKey}/guia/${resolved.nodeKey}`}
          replace
        />
      );
    }
    const evaluation = evaluateProtocol(protocol, session.facts);
    if (evaluation.status === "outcome") {
      return (
        <ProtocolOutcomeView
          protocol={protocol}
          activity={activity}
          session={session}
          outcome={evaluation.outcome}
          ruleDescription={evaluation.rule_description}
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
      <ProtocolMisconfigured
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail="Resultado"
        detail={evaluation.detail}
        activityKey={activityKey}
      />
    );
  }

  const node = getProtocolNode(protocol, nodeKey);
  if (!node) {
    return <NotFoundPage />;
  }

  const conclusionNode = findConclusionNode(protocol);
  if (conclusionNode && node.node_key === conclusionNode.node_key) {
    return (
      <>
        <ProtocolNodeView
          protocol={protocol}
          activity={activity}
          session={session}
          node={node}
        />
        <JudgmentPanel
          protocol={protocol}
          activityDef={def}
          activity={activity}
          session={session}
          node={node}
        />
      </>
    );
  }

  if (node.node_type === "decision") {
    if (blocks.length > 0) {
      return (
        <ProtocolConflictView
          protocol={protocol}
          activity={activity}
          session={session}
          conflictedFacts={blocks}
        />
      );
    }
    // El nodo decisión no pide respuestas. Primero se resuelven SOLO sus
    // transiciones. goto_node_key navega al nodo (deep link, sesión
    // preservada), pero un short-circuit previo del recorrido completo
    // (p. ej. obligación MPI) siempre tiene prioridad y se rendea como
    // resultado: ninguna navegación puede ocultar una conclusión anterior.
    const resolution = resolveDecisionNode(node, session.facts);
    if (resolution.kind === "misconfigured") {
      return (
        <ProtocolMisconfigured
          protocol={protocol}
          activity={activity}
          session={session}
          crumbTail={node.title}
          detail={resolution.detail}
          activityKey={activityKey}
        />
      );
    }
    const evaluation = evaluateProtocol(protocol, session.facts);
    if (resolution.kind === "node") {
      if (evaluation.status === "outcome") {
        return (
          <ProtocolOutcomeView
            protocol={protocol}
            activity={activity}
            session={session}
            outcome={evaluation.outcome}
            ruleDescription={evaluation.rule_description}
            explanation={evaluation.explanation}
          />
        );
      }
      const target = getProtocolNode(protocol, resolution.node_key);
      if (!target) {
        return (
          <ProtocolMisconfigured
            protocol={protocol}
            activity={activity}
            session={session}
            crumbTail={node.title}
            detail={resolution.node_key}
            activityKey={activityKey}
          />
        );
      }
      return (
        <Navigate
          to={`/actividad/${activityKey}/guia/${resolution.node_key}`}
          replace
        />
      );
    }
    if (evaluation.status === "outcome") {
      return (
        <ProtocolOutcomeView
          protocol={protocol}
          activity={activity}
          session={session}
          outcome={evaluation.outcome}
          ruleDescription={evaluation.rule_description}
          explanation={evaluation.explanation}
        />
      );
    }
    if (evaluation.status === "awaiting_facts") {
      const producerKey =
        resolution.kind === "awaiting"
          ? firstProducerNodeKey(protocol, resolution.missing_fact_keys)
          : null;
      // Si el nodo declara required_facts, el conteo los refleja; si no,
      // se usa el del recorrido.
      const declaredMissing = getMissingRequiredFacts(protocol, node, session.facts);
      const missingCount =
        (node.required_facts?.length ?? 0) > 0
          ? declaredMissing.length
          : resolution.kind === "awaiting"
            ? resolution.missing_fact_keys.length
            : evaluation.missing_fact_keys.length;
      return (
        <ProtocolPendingView
          protocol={protocol}
          activity={activity}
          session={session}
          currentNodeKey={producerKey ?? evaluation.current_node_key}
          missingCount={missingCount}
        />
      );
    }
    return (
      <ProtocolMisconfigured
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail={node.title}
        detail={evaluation.detail}
        activityKey={activityKey}
      />
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

function ProtocolMisconfigured({
  protocol,
  activity,
  session,
  crumbTail,
  detail,
  activityKey,
}: {
  protocol: NonNullable<ReturnType<typeof getProtocolForActivity>>;
  activity: {
    activityKey: string;
    humanCode: string;
    name: string;
    domainKey?: string;
    domainCode?: string;
  };
  session: {
    facts: Record<string, string>;
    started: boolean;
    answer: (factKey: string, value: string) => void;
    reset: () => void;
    isProvided: (factKey: string) => boolean;
    providedSource: (factKey: string) => string | null;
  };
  crumbTail: string;
  detail: string;
  activityKey: string;
}) {
  // Detalle técnico solo en logs de desarrollo, nunca en UI de usuario.
  useEffect(() => {
    console.error(`[guia] protocolo mal configurado: ${detail}`);
  }, [detail]);
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail={crumbTail}
      />
      <section className="activity-section" aria-label="Error de configuración" data-testid="guia-misconfigured">
        <h2>Error de configuración del protocolo</h2>
        <p>
          No pudimos preparar esta guía por un problema de configuración
          interna.
        </p>
        <p>
          Esta es una falla de configuración canónica, no un resultado
          profesional. Repórtala como issue de especificación.
        </p>
        <div className="actions">
          <Link to={`/actividad/${activityKey}`}>Volver a actividad</Link>
        </div>
      </section>
    </>
  );
}
