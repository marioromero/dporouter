import { Link, useNavigate } from "react-router-dom";
import type {
  ExecutionProtocol,
  FactMap,
  GuidanceNode,
  NextAction,
  ProtocolOutcome,
} from "../../content/protocols/types";
import {
  getCanonicalActivity,
  getUnresolvedReferences,
} from "../../content/registry";
import {
  answerLabel,
  buildOutcomeFactors,
  evaluateCondition,
  evaluateProtocol,
  firstProducerNodeKey,
  getMissingRequiredFacts,
  getProtocolProgress,
  isFactResolved,
  resolveNodeWithFacts,
} from "../guidance/engine";
import { CopyLinkButton, ProvenanceBadge, provenanceHuman } from "./ui";
import { ConflictResolver } from "./ConflictResolver";
import { modeStartLabel } from "./ActivityWorkView";
import { useWorkspace } from "../workspace/context";
import { getFactStatus, blockingConflicts } from "../workspace/facts";
import { describeFactKey } from "../workspace/factLabels";

/**
 * Vistas genéricas de ejecución guiada (Stage 1).
 *
 * Consumen `ExecutionProtocol` canónico sin duplicar sus preguntas. Toda
 * etiqueta, opción, regla y enlace proviene del protocolo; este archivo no
 * contiene claves semánticas de actividades ni contenido decisorio.
 */

export interface ProtocolActivityRef {
  activityKey: string;
  humanCode: string;
  name: string;
  domainKey?: string;
  domainCode?: string;
}

export interface ProtocolSession {
  facts: FactMap;
  started: boolean;
  answer: (factKey: string, value: string) => void;
  reset: () => void;
  isProvided: (factKey: string) => boolean;
  providedSource: (factKey: string) => string | null;
}

function guideBase(activityKey: string): string {
  return `/actividad/${activityKey}/guia`;
}

function nodeHref(activityKey: string, nodeKey: string): string {
  return `${guideBase(activityKey)}/${nodeKey}`;
}

/** Enlace a actividad canónica o marcador de referencia pendiente. */
export function ProtocolActivityLink({
  activityKey,
  label,
}: {
  activityKey: string;
  label: string;
}) {
  const resolved = getCanonicalActivity(activityKey);
  if (resolved) {
    // Si la etiqueta es la clave cruda, humanizar con nombre canónico.
    const text =
      label === activityKey
        ? `${resolved.human_code} · ${resolved.name}`
        : label;
    return <Link to={`/actividad/${activityKey}`}>{text}</Link>;
  }
  if (getUnresolvedReferences().includes(activityKey)) {
    return (
      <span>
        {label} ·{" "}
        <span className="dep-pending">Referencia canónica pendiente de importar</span>
      </span>
    );
  }
  return (
    <span>
      {label} · <span className="dep-pending">Referencia no resuelta</span>
    </span>
  );
}

export function ProtocolChrome({
  protocol,
  activity,
  session,
  crumbTail,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  crumbTail: string;
}) {
  const { company } = useWorkspace();
  const conflicted = company
    ? protocol.nodes
        .filter((n) => n.node_type === "question" && n.fact_key)
        .map((n) => n.fact_key as string)
        .filter((f) => getFactStatus(company, f).state === "conflict")
    : [];
  const progress = getProtocolProgress(protocol, session.facts, conflicted);
  return (
    <>
      <p className="breadcrumb">
        <Link to="/trabajo">Trabajo</Link>{" "}
        {activity.domainKey ? (
          <>
            /{" "}
            <Link to={`/trabajo/${activity.domainKey}`}>
              {activity.domainCode ?? activity.domainKey}
            </Link>{" "}
          </>
        ) : (
          "/ "
        )}
        / <Link to={`/actividad/${activity.activityKey}`}>{activity.humanCode}</Link>{" "}
        / Guía{crumbTail ? ` / ${crumbTail}` : ""}
      </p>
      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{protocol.title}</h1>
          <span className="human-code">
            {activity.humanCode} · Evaluación guiada
          </span>
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>
      <div className="panel muted" data-testid="guia-progress">
        <p style={{ margin: 0 }}>
          <strong>
            {progress.resolved} de {progress.total} antecedentes resueltos
          </strong>{" "}
          ·{" "}
          <Link to={`/actividad/${activity.activityKey}`}>
            Volver a actividad {activity.humanCode}
          </Link>
        </p>
        {session.started ? (
          <p style={{ margin: "6px 0 0" }}>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => session.reset()}
            >
              Reiniciar evaluación
            </button>{" "}
            <span className="copy-feedback" role="note">
              Reinicia las respuestas de esta guía; los hechos de
              Diagnóstico u otras guías se conservan.
            </span>
          </p>
        ) : null}
      </div>
    </>
  );
}

/** Portada del protocolo: estado, índice no lineal y punto de entrada. */
export function ProtocolEntryView({
  protocol,
  activity,
  session,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
}) {
  const evaluation = evaluateProtocol(protocol, session.facts);
  const { company } = useWorkspace();
  const blocked =
    company != null ? blockingConflicts(protocol, company) : [];
  const progress = getProtocolProgress(
    protocol,
    session.facts,
    company
      ? protocol.nodes
          .filter((n) => n.node_type === "question" && n.fact_key)
          .map((n) => n.fact_key as string)
          .filter((f) => getFactStatus(company, f).state === "conflict")
      : [],
  );
  const complete = evaluation.status === "outcome";
  const targetNode =
    evaluation.status === "awaiting_facts"
      ? evaluation.current_node_key
      : protocol.entry_node_key;
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail=""
      />
      <section className="activity-section" aria-label="Evaluación guiada" data-testid="guia-entry">
        <h2>Evaluación guiada</h2>
        <p>{protocol.description}</p>
        <div className="actions">
          {complete && blocked.length === 0 ? (
            <Link
              className="btn"
              to={`${guideBase(activity.activityKey)}/resultado`}
            >
              Ver resultado
            </Link>
          ) : blocked.length > 0 ? (
            <Link
              className="btn"
              to={`${guideBase(activity.activityKey)}/resultado`}
            >
              Resolver datos en conflicto
            </Link>
          ) : session.started ? (
            <Link className="btn" to={nodeHref(activity.activityKey, targetNode)}>
              {modeStartLabel(protocol.mode, true)}
            </Link>
          ) : (
            <Link
              className="btn"
              to={nodeHref(activity.activityKey, protocol.entry_node_key)}
            >
              {modeStartLabel(protocol.mode, false)}
            </Link>
          )}
          <Link
            className="btn secondary"
            to={nodeHref(activity.activityKey, protocol.entry_node_key)}
          >
            Revisar primer antecedente
          </Link>
        </div>
        <p>
          {progress.resolved} de {progress.total} antecedentes resueltos.
          Puedes responder en cualquier orden y revisar respuestas anteriores.
        </p>
      </section>
      <section className="activity-section" aria-label="Antecedentes">
        <h2>Antecedentes</h2>
        <ul>
          {protocol.nodes
            .filter((n) => n.node_type === "question" && n.fact_key)
            .map((n) => {
              const value = n.fact_key ? session.facts[n.fact_key] : undefined;
              const inConflict =
                company != null &&
                n.fact_key != null &&
                getFactStatus(company, n.fact_key).state === "conflict";
              return (
                <li key={n.node_key}>
                  <Link to={nodeHref(activity.activityKey, n.node_key)}>
                    {n.title}
                  </Link>{" "}
                  ·{" "}
                  {inConflict ? (
                    "En conflicto"
                  ) : isFactResolved(value) ? (
                    <>
                      {answerLabel(n, value)}
                      {n.fact_key && session.isProvided(n.fact_key) ? (
                        <> · Dato ya disponible</>
                      ) : null}
                    </>
                  ) : (
                    "Pendiente"
                  )}
                </li>
              );
            })}
        </ul>
      </section>
    </>
  );
}

/** Vista de un nodo pregunta con sus opciones canónicas. */
export function ProtocolNodeView({
  protocol,
  activity,
  session,
  node,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  node: GuidanceNode;
}) {
  const navigate = useNavigate();
  // Prerrequisitos semánticos declarados; la posición en el array no
  // define dependencias. Un fact puede venir de initialFacts.
  const missingRequired = getMissingRequiredFacts(protocol, node, session.facts);
  const nextProducerKey = firstProducerNodeKey(
    protocol,
    missingRequired.map((m) => m.fact_key),
  );
  const nextProducer = nextProducerKey
    ? protocol.nodes.find((n) => n.node_key === nextProducerKey)
    : undefined;
  const currentValue = node.fact_key ? session.facts[node.fact_key] : undefined;
  const provided = node.fact_key ? session.isProvided(node.fact_key) : false;
  const selectedOption = node.options?.find((o) => o.value === currentValue);
  const route =
    node.fact_key && currentValue !== undefined
      ? resolveNodeWithFacts(
          node,
          { ...session.facts, [node.fact_key]: currentValue },
          selectedOption,
        )
      : null;

  function continueHref(): string | null {
    if (!route) return null;
    if (route.kind === "outcome") {
      return `${guideBase(activity.activityKey)}/resultado`;
    }
    return nodeHref(activity.activityKey, route.node_key);
  }

  const next = continueHref();
  const nextNode =
    route?.kind === "node"
      ? protocol.nodes.find((n) => n.node_key === route.node_key)
      : undefined;
  const { company } = useWorkspace();
  const ownConflict =
    company != null &&
    node.fact_key != null &&
    getFactStatus(company, node.fact_key).state === "conflict";

  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail={node.title}
      />
      <section className="activity-section" aria-label={node.title} data-testid="guia-node">
        <h2>{node.title}</h2>
        {ownConflict && node.fact_key ? (
          <div className="notice" role="alert" data-testid="guia-conflict">
            <strong>Dato en conflicto</strong>
            <p>
              Existen antecedentes distintos para este dato. Revisa cuál
              refleja actualmente la situación de la empresa antes de
              continuar.
            </p>
            <ConflictResolver factKey={node.fact_key} />
          </div>
        ) : null}
        {missingRequired.length > 0 ? (
          <div className="notice" role="alert" data-testid="guia-prerequisites">
            <strong>
              Para resolver este punto faltan antecedentes previos.
            </strong>
            <ul>
              {missingRequired.map((m) => (
                <li key={m.fact_key}>
                  {m.producer
                    ? m.producer.title
                    : "No pudimos relacionar automáticamente este antecedente."}
                  {m.state === "unknown" ? " (registrado como desconocido)" : ""}
                </li>
              ))}
            </ul>
            {nextProducer ? (
              <p>
                <Link to={nodeHref(activity.activityKey, nextProducer.node_key)}>
                  Ir al nodo que produce el siguiente antecedente:{" "}
                  {nextProducer.title}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
        {node.prompt ? <p>{node.prompt}</p> : null}
        {node.why_it_matters ? (
          <div className="notice">
            <strong>Por qué importa</strong>
            <p>{node.why_it_matters}</p>
          </div>
        ) : null}
        {provided ? (
          <p data-testid="guia-provided">
            <strong>Dato ya disponible:</strong> este hecho proviene de
            antecedentes conocidos y no es necesario responderlo
            nuevamente. Puedes mantenerlo o actualizarlo.
            {node.fact_key && session.providedSource(node.fact_key) ? (
              <> Origen: {session.providedSource(node.fact_key)}.</>
            ) : null}
          </p>
        ) : null}
        {node.evidence_to_review && node.evidence_to_review.length > 0 ? (
          <>
            <h3>Qué revisar</h3>
            <ul>
              {node.evidence_to_review.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </>
        ) : null}
        {node.help_text && node.help_text.length > 0
          ? node.help_text.map((h, i) => <p key={i}>{h}</p>)
          : null}
        {node.options && node.options.length > 0 && node.fact_key ? (
          <div className="actions" role="group" aria-label="Respuestas">
            {node.options.map((o) => (
              <button
                key={o.value}
                type="button"
                data-testid={`guia-option-${o.value}`}
                className={
                  currentValue === o.value ? "btn" : "btn secondary"
                }
                aria-pressed={currentValue === o.value}
                title={o.description ?? o.label}
                onClick={() =>
                  node.fact_key &&
                  session.answer(node.fact_key, o.fact_effect?.value ?? o.value)
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}
        {node.options?.find((o) => o.value === currentValue)?.description ? (
          <p>{node.options.find((o) => o.value === currentValue)?.description}</p>
        ) : null}
        {next ? (
          <div className="actions">
            <button
              type="button"
              className="btn"
              data-testid="guia-continue"
              onClick={() => navigate(next)}
            >
              {route?.kind === "outcome"
                ? "Ver resultado"
                : `Continuar: ${nextNode?.title ?? "siguiente"}`}
            </button>
          </div>
        ) : null}
        {node.related_activity_keys &&
        node.related_activity_keys.length > 0 ? (
          <>
            <h3>Actividades relacionadas</h3>
            <ul>
              {node.related_activity_keys.map((k) => (
                <li key={k}>
                  <ProtocolActivityLink activityKey={k} label={k} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
      <AnsweredFactsPanel
        protocol={protocol}
        activity={activity}
        session={session}
        exceptNodeKey={node.node_key}
      />
    </>
  );
}

/** Hechos ya respondidos con acceso de revisión no lineal. */
function AnsweredFactsPanel({
  protocol,
  activity,
  session,
  exceptNodeKey,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  exceptNodeKey?: string;
}) {
  const { company } = useWorkspace();
  const answered = protocol.nodes.filter(
    (n) =>
      n.node_type === "question" &&
      n.fact_key &&
      n.node_key !== exceptNodeKey &&
      session.facts[n.fact_key] !== undefined,
  );
  if (answered.length === 0) return null;
  return (
    <section className="activity-section" aria-label="Antecedentes ya respondidos">
      <h2>Antecedentes ya respondidos</h2>
      <ul>
        {answered.map((n) => {
          const inConflict =
            company != null &&
            n.fact_key != null &&
            getFactStatus(company, n.fact_key).state === "conflict";
          return (
            <li key={n.node_key}>
              <Link to={nodeHref(activity.activityKey, n.node_key)}>{n.title}</Link>{" "}
              ·{" "}
              {inConflict
                ? "En conflicto"
                : answerLabel(n, n.fact_key ? session.facts[n.fact_key] : undefined)}
              {!inConflict && n.fact_key && session.isProvided(n.fact_key) ? (
                <> · Dato ya disponible</>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Pantalla de resultado explicable con reglas, factores y siguiente paso. */
export function ProtocolOutcomeView({
  protocol,
  activity,
  session,
  outcome,
  ruleDescription,
  explanation,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  outcome: ProtocolOutcome;
  ruleDescription: string;
  explanation: string;
}) {
  const factors = buildOutcomeFactors(protocol, session.facts);
  // Pendientes: nodos pregunta con hecho sin resolver, en orden canónico.
  // La sección solo se muestra cuando al menos un pendiente fue marcado
  // explícitamente (unknown): un resultado definitivo por otra vía (p. ej.
  // obligación MPI) no exige resolver factores de recomendación.
  const missingNodes = protocol.nodes.filter(
    (n) =>
      n.node_type === "question" &&
      n.fact_key &&
      !isFactResolved(session.facts[n.fact_key]),
  );
  const hasEngagedMissing = missingNodes.some(
    (n) => n.fact_key && session.facts[n.fact_key] !== undefined,
  );
  const visibleActions = outcome.next_actions.filter((a) =>
    a.show_when ? evaluateCondition(a.show_when, session.facts) : true,
  );
  const nature = provenanceHuman(outcome.classification);
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail="Resultado"
      />
      <section className="activity-section" aria-label="Resultado" data-testid="guia-outcome">
        <h2>Resultado</h2>
        <p>
          <strong data-testid="guia-outcome-label">{outcome.label}</strong>
        </p>
        <h3>Naturaleza</h3>
        <p>
          {outcome.classification === "legal_requirement" ? (
            <ProvenanceBadge kind="legal" />
          ) : (
            <ProvenanceBadge kind="method" />
          )}{" "}
          {nature}
        </p>
        <h3>Por qué obtuvimos este resultado</h3>
        <ul>
          <li data-testid="guia-outcome-rule">
            {ruleDescription} — {explanation}
          </li>
        </ul>
        <p>{outcome.explanation}</p>
        {outcome.detail ? <p>{outcome.detail}</p> : null}
        <h3>Factores considerados</h3>
        <div className="table-wrap">
          <table className="trace-table" data-testid="guia-factors">
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Respuesta</th>
                <th scope="col">Efecto</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f) => (
                <tr key={f.node_key}>
                  <td>{f.title}</td>
                  <td>{f.answer}</td>
                  <td>{f.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Antecedentes revisados en esta sesión</h3>
        {factors.some((f) => f.resolved) ? (
          <ul>
            {factors
              .filter((f) => f.resolved)
              .map((f) => (
                <li key={f.node_key}>
                  {f.title}: {f.answer}
                </li>
              ))}
          </ul>
        ) : (
          <p>Sin antecedentes resueltos en esta sesión.</p>
        )}
        {missingNodes.length > 0 && hasEngagedMissing ? (
          <>
            <h3>Antecedentes pendientes ({missingNodes.length})</h3>
            <ul>
              {missingNodes.map((n) => (
                <li key={n.node_key}>
                  <Link to={nodeHref(activity.activityKey, n.node_key)}>
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="actions">
              <Link
                className="btn"
                to={nodeHref(activity.activityKey, missingNodes[0].node_key)}
              >
                Resolver siguiente antecedente
              </Link>
            </div>
          </>
        ) : null}
        <h3>Siguiente paso</h3>
        <ul data-testid="guia-next-actions">
          {visibleActions.map((a, i) => (
            <li key={i}>
              <NextActionView action={a} activity={activity} session={session} />
            </li>
          ))}
        </ul>
      </section>
      <AnsweredFactsPanel
        protocol={protocol}
        activity={activity}
        session={session}
      />
    </>
  );
}

function NextActionView({
  action,
  activity,
  session,
}: {
  action: NextAction;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
}) {
  const navigate = useNavigate();
  if (action.kind === "activity" && action.activity_key) {
    return (
      <ProtocolActivityLink activityKey={action.activity_key} label={action.label} />
    );
  }
  if (action.kind === "node" && action.node_key) {
    return (
      <Link to={nodeHref(activity.activityKey, action.node_key)}>
        {action.label}
      </Link>
    );
  }
  if (action.kind === "restart") {
    return (
      <button
        type="button"
        className="btn secondary small"
        onClick={() => {
          session.reset();
          navigate(guideBase(activity.activityKey));
        }}
      >
        {action.label}
      </button>
    );
  }
  return <span>{action.note ?? action.label}</span>;
}

/** Evaluación en curso: sin resultado definitivo todavía. */
export function ProtocolPendingView({  protocol,
  activity,
  session,
  currentNodeKey,
  missingCount,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  currentNodeKey: string;
  missingCount: number;
}) {
  const current = protocol.nodes.find((n) => n.node_key === currentNodeKey);
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail="Resultado"
      />
      <section className="activity-section" aria-label="Evaluación en curso" data-testid="guia-pending">
        <h2>Evaluación en curso</h2>
        <p>
          Faltan {missingCount} antecedente(s) por resolver. El sistema no emite
          una conclusión definitiva con información faltante.
        </p>
        <div className="actions">
          <Link
            className="btn"
            to={nodeHref(activity.activityKey, currentNodeKey)}
          >
            Continuar: {current?.title ?? "siguiente antecedente"}
          </Link>
        </div>
      </section>
    </>
  );
}

/**
 * Bloqueo por conflicto: un fact necesario tiene antecedentes distintos
 * según la fuente. No equivale a pendiente ni a desconocido: exige
 * resolución humana explícita antes de cualquier conclusión definitiva.
 */
export function ProtocolConflictView({
  protocol,
  activity,
  session,
  conflictedFacts,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  conflictedFacts: string[];
}) {
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail="Resultado"
      />
      <section
        className="activity-section"
        aria-label="Dato en conflicto"
        data-testid="guia-conflict-block"
      >
        <h2>Dato en conflicto</h2>
        <p>
          Debes resolver un dato en conflicto antes de obtener una
          conclusión definitiva.
        </p>
        <p>
          Existen antecedentes distintos para este dato. Revisa cuál refleja
          actualmente la situación de la empresa antes de continuar.
        </p>
        {conflictedFacts.map((f) => (
          <div key={f}>
            <h3>{describeFactKey(f)}</h3>
            <ConflictResolver factKey={f} />
          </div>
        ))}
      </section>
    </>
  );
}
