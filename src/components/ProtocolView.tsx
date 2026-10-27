import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { SpecialRegimeGuideContext } from "./SpecialRegimeCapture";
import { isSpecialRegimeGuideProtocol } from "../workspace/specialRegimeGuards";
import { getFactStatus } from "../workspace/facts";
import {
  activeExecutionContext,
  getScopedFactState,
  getScopedProtocolAnswers,
  isValidCivilDate,
  normalizeTextAnswer,
  scopedConflictKeys,
  treatmentDisplayName,
} from "../workspace/scope";
import type { ExecutionContext } from "../workspace/types";
import { findConclusionNode } from "../../content/protocols/registry";
import { getRecordedJudgment } from "../workspace/reasoning";
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
  /** Vista del contexto addressed (igual a facts cuando no hubo cambio de selección); ausente en sesiones legacy. */
  addressedFacts?: FactMap;
  started: boolean;
  answer: (factKey: string, value: string) => void;
  reset: () => void;
  isProvided: (factKey: string) => boolean;
  providedSource: (factKey: string) => string | null;
  /** Contexto addressed de la guía (capturado al abrirla); ausente en sesiones legacy de tests. */
  ctx?: ExecutionContext | null;
}

export function sameExecutionContext(
  a: ExecutionContext | null | undefined,
  b: ExecutionContext | null,
): boolean {
  if (!a || !b) return a == null && b == null;
  if (a.scope !== b.scope || a.companyId !== b.companyId) return false;
  if (a.scope === "treatment" && b.scope === "treatment") {
    return a.treatmentId === b.treatmentId;
  }
  if (a.scope === "purpose" && b.scope === "purpose") {
    return a.treatmentId === b.treatmentId && a.purposeId === b.purposeId;
  }
  return true;
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
  const conflicted = company ? scopedConflictKeys(protocol, company) : [];
  const progress = getProtocolProgress(protocol, session.facts, conflicted);
  // Contexto jurídico activo en lenguaje humano (sin IDs): evita
  // asignar una base a otra finalidad por error. Solo para scopes
  // treatment/purpose; company no muestra nada adicional.
  const scopeLabel = (() => {
    if (!company || (protocol.execution_scope ?? "company") === "company") {
      return null;
    }
    const treatment = company.activeTreatmentId
      ? company.treatments?.[company.activeTreatmentId]
      : undefined;
    if (!treatment) {
      return "Sin tratamiento seleccionado: selecciona uno en Tratamientos para evaluar.";
    }
    if (
      protocol.execution_scope === "purpose" &&
      (!company.activePurposeId ||
        !treatment.purposes[company.activePurposeId])
    ) {
      return `Tratamiento: ${treatment.context.name}. Sin finalidad seleccionada: selecciona una en Tratamientos para evaluar.`;
    }
    const purpose =
      protocol.execution_scope === "purpose" && company.activePurposeId
        ? treatment.purposes[company.activePurposeId]
        : undefined;
    return purpose
      ? `Tratamiento: ${treatment.context.name} · Finalidad: ${purpose.purpose.description}`
      : `Tratamiento: ${treatment.context.name}`;
  })();
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
        {scopeLabel ? (
          <p style={{ margin: "0 0 6px" }} data-testid="guia-scope">
            <strong>{scopeLabel}</strong>
          </p>
        ) : null}
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
  const blocked = company != null ? scopedConflictKeys(protocol, company) : [];
  const progress = getProtocolProgress(
    protocol,
    session.facts,
    company ? scopedConflictKeys(protocol, company) : [],
  );
  const complete = evaluation.status === "outcome";
  const recorded = getRecordedJudgment(
    protocol,
    company,
    session.facts,
    company
      ? activeExecutionContext(company, protocol.execution_scope ?? "company")
      : null,
  );
  const conclusionNode = findConclusionNode(protocol);
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
          {recorded.status === "valid" && conclusionNode ? (
            <Link
              className="btn"
              to={nodeHref(activity.activityKey, conclusionNode.node_key)}
            >
              Ver conclusión documentada
            </Link>
          ) : complete && blocked.length === 0 ? (
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
                scopedConflictKeys(protocol, company).includes(n.fact_key);
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
                      {responseLabel(company, n, value)}
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

/**
 * Etiqueta de respuesta sin IDs crudos: un valor que es un treatmentId
 * de la empresa se muestra con el nombre del tratamiento; el resto usa
 * la etiqueta canónica de la opción.
 */
function responseLabel(
  company: ReturnType<typeof useWorkspace>["company"],
  node: GuidanceNode,
  value: string | undefined,
): string {
  if (value === undefined) return "Sin responder";
  const name = treatmentDisplayName(company, value);
  if (name) return name;
  return answerLabel(node, value);
}

/**
 * Selector de referencia a tratamiento (Stage 1).
 *
 * Control genérico dirigido por declaración (`options_source:
 * "same_company_treatments"`): lista los TreatmentContexts de la
 * misma empresa como opciones junto a las estáticas del nodo. Sin
 * grafo, sin workflow. Reglas:
 * - cross-company imposible (la lista nace del propio objeto empresa);
 * - el tratamiento en ejecución no se ofrece como su propio posterior
 *   (el canon exige un tratamiento posterior, necesariamente otro):
 *   solo se muestra la nota que lo excluye;
 * - un valor guardado cuyo target ya no existe se advierte como
 *   referencia obsoleta y puede re-elegirse (la respuesta sobrescribe).
 */
function TreatmentReferenceSelector({
  protocol,
  session,
  node,
}: {
  protocol: ExecutionProtocol;
  session: ProtocolSession;
  node: GuidanceNode;
}) {
  const { company } = useWorkspace();
  const entries = Object.entries(company?.treatments ?? {});
  const ctx = company
    ? activeExecutionContext(company, protocol.execution_scope ?? "company")
    : null;
  const selfId =
    ctx && (ctx.scope === "treatment" || ctx.scope === "purpose")
      ? ctx.treatmentId
      : null;
  const current = node.fact_key ? session.facts[node.fact_key] : undefined;
  const staticValues = new Set((node.options ?? []).map((o) => o.value));
  const stale =
    current !== undefined &&
    !staticValues.has(current) &&
    !entries.some(([id]) => id === current);
  const others = entries.filter(([id]) => id !== selfId);
  return (
    <div className="actions" role="group" aria-label={node.title} data-testid="guia-reference-select">
      {others.length === 0 ? (
        <p data-testid="guia-reference-empty">
          No existe otro tratamiento en esta empresa: solo puedes declarar
          la ausencia de tratamiento posterior.
        </p>
      ) : (
        others.map(([id, t]) => (
          <button
            key={id}
            type="button"
            data-testid="guia-reference-treatment"
            className={current === id ? "btn" : "btn secondary"}
            aria-pressed={current === id}
            title={`Tratamiento posterior: ${t.context.name}`}
            onClick={() =>
              node.fact_key && session.answer(node.fact_key, id)
            }
          >
            {t.context.name}
          </button>
        ))
      )}
      {(node.options ?? []).map((o) => (
        <button
          key={o.value}
          type="button"
          data-testid={`guia-option-${o.value}`}
          className={current === o.value ? "btn" : "btn secondary"}
          aria-pressed={current === o.value}
          title={o.description ?? o.label}
          onClick={() =>
            node.fact_key &&
            session.answer(node.fact_key, o.fact_effect?.value ?? o.value)
          }
        >
          {o.label}
        </button>
      ))}
      {selfId ? (
        <p data-testid="guia-reference-self">
          El tratamiento en evaluación no puede ser su propio posterior.
        </p>
      ) : null}
      {stale ? (
        <p data-testid="guia-reference-stale" role="alert">
          La referencia guardada apunta a un tratamiento que ya no existe.
          Selecciona nuevamente.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Captura escalar `text` (Stage 1).
 *
 * Control mínimo: el valor lo ingresa el profesional como string
 * escalar y se registra con el `fact_key` del nodo. Trim al guardar;
 * vacío = no respondido (no se persiste). Sin rich-text, sin
 * estructuras, sin listas.
 */
function TextAnswerControl({
  session,
  node,
}: {
  session: ProtocolSession;
  node: GuidanceNode;
}) {
  const current = node.fact_key ? session.facts[node.fact_key] : undefined;
  const [draft, setDraft] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="field">
      <label htmlFor={`guia-text-${node.node_key}`}>{node.title}</label>
      <textarea
        id={`guia-text-${node.node_key}`}
        className="input"
        data-testid="guia-text-input"
        rows={3}
        value={draft}
        aria-label={node.title}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
      />
      {error ? (
        <p data-testid="guia-answer-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="actions">
        <button
          type="button"
          className="btn"
          data-testid="guia-text-save"
          onClick={() => {
            if (!node.fact_key) return;
            const normalized = normalizeTextAnswer(draft);
            if (normalized === null) {
              setError("Ingresa un texto no vacío o deja sin responder.");
              return;
            }
            setError(null);
            session.answer(node.fact_key, normalized);
          }}
        >
          Guardar respuesta
        </button>
      </div>
      {current !== undefined ? (
        <p data-testid="guia-text-current">Registrado: {current}</p>
      ) : null}
    </div>
  );
}

/**
 * Captura escalar `date` (Stage 1).
 *
 * Fecha civil `YYYY-MM-DD` proporcionada por el profesional. El
 * control de fecha es conveniencia del stack; el valor contractual
 * sigue siendo el string, validado estrictamente y sin timezone.
 */
function DateAnswerControl({
  session,
  node,
}: {
  session: ProtocolSession;
  node: GuidanceNode;
}) {
  const current = node.fact_key ? session.facts[node.fact_key] : undefined;
  const [draft, setDraft] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="field">
      <label htmlFor={`guia-date-${node.node_key}`}>{node.title}</label>
      <input
        id={`guia-date-${node.node_key}`}
        type="date"
        className="input"
        data-testid="guia-date-input"
        value={draft}
        aria-label={node.title}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
      />
      {error ? (
        <p data-testid="guia-answer-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="actions">
        <button
          type="button"
          className="btn"
          data-testid="guia-date-save"
          onClick={() => {
            if (!node.fact_key) return;
            const trimmed = draft.trim();
            if (!isValidCivilDate(trimmed)) {
              setError("Ingresa una fecha válida con formato AAAA-MM-DD.");
              return;
            }
            setError(null);
            session.answer(node.fact_key, trimmed);
          }}
        >
          Guardar fecha
        </button>
      </div>
      {current !== undefined ? (
        <p data-testid="guia-date-current">Registrada: {current}</p>
      ) : null}
    </div>
  );
}

/**
 * Lista «Qué revisar» de un nodo con ayudas desplegables opcionales.
 *
 * El elemento canónico con ayuda se muestra como acordeón cuyo título
 * es el propio elemento; el elemento sin ayuda permanece como
 * elemento simple de lista. Dentro del nodo solo una ayuda puede
 * permanecer abierta: el estado controla `open` y el clic no delega
 * el toggle nativo del summary.
 */
function EvidenceReviewList({ node }: { node: GuidanceNode }) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const helps = node.evidence_review_help ?? [];
  return (
    <>
      <h3>Qué revisar</h3>
      <ul>
        {(node.evidence_to_review ?? []).map((e) => {
          const help = helps.find((h) => h.evidence_item === e);
          if (!help) {
            return <li key={e}>{e}</li>;
          }
          const open = openItem === e;
          return (
            <li key={e}>
              <details
                open={open}
                className="evidence-help"
                data-testid="guia-evidence-help"
              >
                <summary
                  onClick={(ev) => {
                    ev.preventDefault();
                    setOpenItem(open ? null : e);
                  }}
                >
                  {e}
                  <span className="evidence-help-arrow" aria-hidden="true" />
                </summary>
                <h4>Guía de revisión</h4>
                <p>{help.review_guide}</p>
                {help.no_evidence_guidance ? (
                  <>
                    <h4>Si no se encuentra evidencia</h4>
                    <p>{help.no_evidence_guidance}</p>
                  </>
                ) : null}
                {help.expected_result ? (
                  <>
                    <h4>Resultado esperado</h4>
                    <p>{help.expected_result}</p>
                  </>
                ) : null}
              </details>
            </li>
          );
        })}
      </ul>
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
  const nodeCtx =
    company != null
      ? activeExecutionContext(company, protocol.execution_scope ?? "company")
      : null;
  const ownConflict =
    company != null &&
    node.fact_key != null &&
    (nodeCtx && nodeCtx.scope !== "company"
      ? getScopedFactState(company, nodeCtx, node.fact_key).state === "conflict"
      : getFactStatus(company, node.fact_key).state === "conflict");

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
            <ConflictResolver factKey={node.fact_key} scope={protocol.execution_scope ?? "company"} />
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
          <EvidenceReviewList node={node} />
        ) : null}
        {node.help_text && node.help_text.length > 0
          ? node.help_text.map((h, i) => <p key={i}>{h}</p>)
          : null}
        {node.answer_type === "text" && node.fact_key ? (
          <TextAnswerControl session={session} node={node} />
        ) : node.answer_type === "date" && node.fact_key ? (
          <DateAnswerControl session={session} node={node} />
        ) : node.options_source === "same_company_treatments" && node.fact_key ? (
          <TreatmentReferenceSelector
            protocol={protocol}
            session={session}
            node={node}
          />
        ) : node.options && node.options.length > 0 && node.fact_key ? (
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
      {isSpecialRegimeGuideProtocol(protocol) &&
      company != null &&
      session.ctx?.scope === "purpose" ? (
        <SpecialRegimeGuideContext company={company} ctx={session.ctx} />
      ) : null}
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
            scopedConflictKeys(protocol, company).includes(n.fact_key);
          return (
            <li key={n.node_key}>
              <Link to={nodeHref(activity.activityKey, n.node_key)}>{n.title}</Link>{" "}
              ·{" "}
              {inConflict
                ? "En conflicto"
                : responseLabel(company, n, n.fact_key ? session.facts[n.fact_key] : undefined)}
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
  const nature = provenanceHuman(outcome.classification);
  const { company, finalizeProtocolOutcome } = useWorkspace();
  const factors = buildOutcomeFactors(protocol, session.facts).map((f) => ({
    ...f,
    // Sin IDs crudos: una referencia a tratamiento muestra su nombre.
    answer: treatmentDisplayName(company, session.facts[f.fact_key]) ?? f.answer,
  }));
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
  const [finalizeErrors, setFinalizeErrors] = useState<string[]>([]);
  const canonicalEffects = outcome.canonical_fact_effects ?? [];
  // Contexto addressed de la guía (capturado al abrirla). El registro,
  // su lectura y la vista evaluada consultan ese mismo contexto, nunca
  // la selección tardía: lo evaluado y lo escrito comparten address.
  const addressed: ExecutionContext | null | undefined = session.ctx;
  const addressedScope = addressed?.scope ?? "company";
  const evaluatedFacts = session.addressedFacts ?? session.facts;
  // Si la selección activa se movió desde que se abrió la guía, lo
  // mostrado corresponde a otro objeto: se avisa y se bloquea el
  // registro hasta reabrir la guía (nunca escritura silenciosa cruzada).
  const activeCtx = company
    ? activeExecutionContext(company, protocol.execution_scope ?? "company")
    : null;
  const contextMismatch =
    addressed != null && !sameExecutionContext(addressed, activeCtx);
  // Solo procedure/checklist con efectos declarados ofrecen registro
  // explícito. El modo decision con juicio (D1.03) usa su propio camino.
  const offersFinalize =
    (protocol.mode === "procedure" || protocol.mode === "checklist") &&
    canonicalEffects.length > 0;
  // Solo lectura: registrado si la observación propia coincide en valor
  // en la dirección de la guía. Nunca escribe al renderizar.
  const scopedAnswers =
    company != null && addressed != null
      ? getScopedProtocolAnswers(company, addressed, protocol.protocol_key)
      : undefined;
  const finalizeRegistered =
    offersFinalize &&
    scopedAnswers !== undefined &&
    canonicalEffects.every((e) => scopedAnswers[e.fact_key]?.value === e.value);
  const registerTargetLabel =
    addressedScope === "purpose"
      ? "de esta finalidad"
      : addressedScope === "treatment"
        ? "de este tratamiento"
        : "de la empresa";
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
        {offersFinalize ? (
          <>
            <h3>Registro del estado</h3>
            <div data-testid="guia-finalize">
              <p>
                Este resultado definitivo puede registrarse como antecedente{" "}
                {registerTargetLabel}. El registro es una acción explícita:
                no ocurre por abrir esta pantalla ni por navegar.
              </p>
              <p data-testid="guia-finalize-status">
                {finalizeRegistered
                  ? `Estado registrado ${registerTargetLabel === "de la empresa" ? "para esta empresa" : registerTargetLabel}.`
                  : "Estado aún no registrado."}
              </p>
              {contextMismatch ? (
                <p data-testid="guia-finalize-mismatch">
                  La selección activa cambió desde que se abrió esta guía:
                  lo mostrado corresponde a otro objeto. Vuelve a abrir la
                  guía para registrar el estado correcto.
                </p>
              ) : null}
              <div className="actions">
                <button
                  type="button"
                  className="btn secondary small"
                  data-testid="guia-finalize-apply"
                  onClick={() => {
                    if (contextMismatch) {
                      setFinalizeErrors([
                        "La selección activa cambió desde que se abrió esta guía. Vuelve a abrirla para registrar el estado.",
                      ]);
                      return;
                    }
                    const r = finalizeProtocolOutcome(
                      protocol.protocol_key,
                      outcome.outcome_key,
                      evaluatedFacts,
                      addressed ?? null,
                    );
                    setFinalizeErrors(r.ok ? [] : r.errors);
                  }}
                >
                  {finalizeRegistered
                    ? "Confirmar registro del estado"
                    : addressedScope === "purpose"
                      ? "Registrar estado de esta finalidad"
                      : addressedScope === "treatment"
                        ? "Registrar estado de este tratamiento"
                        : "Registrar estado de la empresa"}
                </button>
              </div>
              {finalizeErrors.length > 0 ? (
                <ul data-testid="guia-finalize-errors">
                  {finalizeErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
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
export function NextActionView({
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
            <ConflictResolver factKey={f} scope={protocol.execution_scope ?? "company"} />
          </div>
        ))}
      </section>
    </>
  );
}
