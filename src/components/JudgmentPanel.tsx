import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  ExecutionProtocol,
  GuidanceNode,
} from "../../content/protocols/types";
import type { ActivityDefinition } from "../types";
import { useWorkspace } from "../workspace/context";
import { blockingConflicts } from "../workspace/facts";
import { ConflictResolver } from "./ConflictResolver";
import { describeFactKey } from "../workspace/factLabels";
import type {
  ProtocolActivityRef,
  ProtocolSession,
} from "./ProtocolView";
import { NextActionView, ProtocolChrome } from "./ProtocolView";
import { ProvenanceBadge, provenanceHuman } from "./ui";
import {
  considerationNodes,
  gatePasses,
  getRecordedJudgment,
  validateReasoningDraft,
  type ReasoningDraft,
} from "../workspace/reasoning";
import type { ProtocolReasoningRecord } from "../workspace/types";
import { nowIso } from "../workspace/types";

/**
 * Juicio profesional documentado (genérico, sin literales de actividad).
 *
 * Se muestra junto al nodo conclusión de cualquier protocolo que lo
 * declare por estructura (opciones = outcome keys). Cuatro bloques:
 * lo sabido, lo pendiente, la evaluación profesional y la conclusión
 * documentada. La conclusión solo queda registrada con gate superado y
 * ReasoningRecord válido, en una escritura atómica.
 */

function todayIso(): string {
  return nowIso().slice(0, 10);
}

export function JudgmentPanel({
  protocol,
  activityDef,
  activity,
  session,
  node,
}: {
  protocol: ExecutionProtocol;
  activityDef: ActivityDefinition;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  node: GuidanceNode;
}) {
  const { company, finalizeProfessionalJudgment } = useWorkspace();
  const facts = session.facts;
  const ready = gatePasses(protocol, company, facts);
  const recorded = getRecordedJudgment(protocol, company, facts);
  const options = node.options ?? [];

  const [conclusion, setConclusion] = useState(() => {
    const draft = node.fact_key ? facts[node.fact_key] : undefined;
    return typeof draft === "string" &&
      options.some((o) => o.value === draft)
      ? draft
      : "";
  });
  const [legalQuestion, setLegalQuestion] = useState(activityDef.trigger_question);
  const [evidenceText, setEvidenceText] = useState("");
  const [rationale, setRationale] = useState("");
  const [decidedBy, setDecidedBy] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [decidedAt, setDecidedAt] = useState(todayIso());
  const [attempted, setAttempted] = useState(false);
  const [finalizeErrors, setFinalizeErrors] = useState<string[]>([]);

  const draft: ReasoningDraft = useMemo(
    () => ({
      conclusion,
      legal_question: legalQuestion,
      evidence_refs: evidenceText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== ""),
      rationale,
      decided_by: decidedBy,
      reviewed_by: reviewedBy,
      decided_at: decidedAt,
    }),
    [conclusion, legalQuestion, evidenceText, rationale, decidedBy, reviewedBy, decidedAt],
  );
  const issues = validateReasoningDraft(protocol, draft);
  const canAdopt =
    ready && issues.length === 0 && conclusion !== "" && company !== null;

  function adopt() {
    if (!company || !canAdopt) return;
    const result = finalizeProfessionalJudgment(
      protocol.protocol_key,
      draft,
      facts,
    );
    if (!result.ok) {
      setFinalizeErrors(result.errors);
      return;
    }
    setFinalizeErrors([]);
    // Sincroniza el borrador de sesión con lo adoptado: evita que la
    // selección del nodo y la conclusión registrada diverjan en silencio.
    if (node.fact_key) {
      session.answer(node.fact_key, conclusion);
    }
  }

  return (
    <>
      <section className="activity-section" aria-label="Lo que sabemos">
        <h2>Lo que sabemos</h2>
        <KnownFacts protocol={protocol} facts={facts} />
      </section>
      <section className="activity-section" aria-label="Lo que falta resolver">
        <h2>Lo que falta resolver</h2>
        <MissingFacts protocol={protocol} facts={facts} />
      </section>
      <section className="activity-section" aria-label="Evaluación profesional">
        <h2>Evaluación profesional</h2>
        <p>
          Estos son los factores que debes ponderar con tu juicio
          profesional. El sistema no calcula la conclusión: solo verifica
          que existe base suficiente para que la adoptes.
        </p>
        <ul>
          {considerationNodes(protocol).map((c) => {
            const n = protocol.nodes.find((x) => x.node_key === c.node_key);
            return (
              <li key={c.node_key}>
                <strong>{c.title}</strong>
                {n?.why_it_matters ? <p>{n.why_it_matters}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
      <section
        className="activity-section"
        aria-label="Conclusión documentada"
        data-testid="juicio-conclusion"
      >
        <h2>Conclusión documentada</h2>
        {recorded.status === "valid" ? (
          <RecordedJudgmentBody
            protocol={protocol}
            activity={activity}
            session={session}
            record={recorded.record}
            outcomeKey={recorded.outcome.outcome_key}
          />
        ) : (
          <>
            {recorded.status === "stale" ? (
              <div className="notice" role="alert">
                <strong>Conclusión desactualizada</strong>
                <p>
                  La conclusión registrada ya no refleja los antecedentes
                  actuales. Revísala antes de continuar:
                </p>
                <ul>
                  {recorded.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recorded.status === "invalid" ? (
              <div className="notice" role="alert">
                <strong>Registro incompleto</strong>
                <ul>
                  {recorded.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!ready ? (
              <div className="notice">
                <strong>Aún sin base suficiente para concluir</strong>
                <p>
                  Completa los antecedentes pendientes para habilitar la
                  adopción de la conclusión.
                </p>
              </div>
            ) : null}
            {!company ? (
              <p>
                <Link to="/empresa">
                  Selecciona una empresa para documentar la conclusión
                </Link>
              </p>
            ) : null}
            <h3>Conclusión profesional</h3>
            <div className="actions" role="group" aria-label="Alternativas canónicas">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  data-testid={`juicio-opcion-${o.value}`}
                  className={conclusion === o.value ? "btn small" : "btn ghost small"}
                  aria-pressed={conclusion === o.value}
                  title={o.description ?? o.label}
                  onClick={() => setConclusion(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <h3>Razonamiento requerido</h3>
            <div className="field">
              <label htmlFor="juicio-pregunta">Pregunta jurídica</label>
              <input
                id="juicio-pregunta"
                className="input"
                value={legalQuestion}
                onChange={(e) => setLegalQuestion(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="juicio-evidencia">
                Referencias de evidencia (una por línea)
              </label>
              <textarea
                id="juicio-evidencia"
                className="input"
                rows={3}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="juicio-razon">Razonamiento</label>
              <textarea
                id="juicio-razon"
                className="input"
                rows={4}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Por qué esta conclusión, con estos hechos y factores"
              />
            </div>
            <div className="field">
              <label htmlFor="juicio-decisor">Quien adopta la conclusión</label>
              <input
                id="juicio-decisor"
                className="input"
                value={decidedBy}
                onChange={(e) => setDecidedBy(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="juicio-revisor">Revisado por (opcional)</label>
              <input
                id="juicio-revisor"
                className="input"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="juicio-fecha">Fecha de decisión</label>
              <input
                id="juicio-fecha"
                className="input"
                type="date"
                value={decidedAt}
                onChange={(e) => setDecidedAt(e.target.value)}
              />
            </div>
            {attempted && (issues.length > 0 || finalizeErrors.length > 0) ? (
              <div className="notice" role="alert">
                <strong>Falta para adoptar la conclusión</strong>
                <ul>
                  {issues.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                  {finalizeErrors.map((m, i) => (
                    <li key={`f-${i}`}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="actions">
              <button
                type="button"
                className="btn"
                data-testid="juicio-adoptar"
                title={
                  !company
                    ? "Requiere empresa activa"
                    : !ready
                      ? "Requiere base suficiente"
                      : issues.length > 0
                        ? "Completa el razonamiento requerido"
                        : conclusion === ""
                          ? "Elige una conclusión"
                          : "Adoptar conclusión profesional"
                }
                onClick={() => {
                  setAttempted(true);
                  adopt();
                }}
              >
                Adoptar conclusión profesional
              </button>
            </div>
            <p className="result-count">
              Al adoptar queda registrada tu conclusión junto a su
              razonamiento. El sistema no modifica tu elección.
            </p>
          </>
        )}
      </section>
    </>
  );
}

function KnownFacts({
  protocol,
  facts,
}: {
  protocol: ExecutionProtocol;
  facts: Record<string, string>;
}) {
  const items = protocol.nodes.filter(
    (n) => n.node_type === "question" && n.fact_key && facts[n.fact_key] !== undefined,
  );
  if (items.length === 0) {
    return <p>Aún no hay antecedentes resueltos.</p>;
  }
  return (
    <ul>
      {items.map((n) => (
        <li key={n.node_key}>
          {n.title}: {optionLabel(n, facts[n.fact_key as string])}
        </li>
      ))}
    </ul>
  );
}

function optionLabel(
  node: { options?: Array<{ value: string; label: string }> },
  value: string | undefined,
): string {
  if (value === undefined) return "Sin responder";
  if (value === "unknown") return "Desconocido";
  return node.options?.find((o) => o.value === value)?.label ?? "Valor registrado";
}

function MissingFacts({
  protocol,
  facts,
}: {
  protocol: ExecutionProtocol;
  facts: Record<string, string>;
}) {
  const { company } = useWorkspace();
  // Misma semántica que el gate: solo "yes" vigente cuenta como base.
  // "no" explícito también bloquea (factor no considerado). Los
  // conflictos se listan sin filtrar para no ocultar ninguno.
  const missing = protocol.decision_fact_keys.filter((f) => facts[f] !== "yes");
  const blocked = company != null ? blockingConflicts(protocol, company) : [];
  if (missing.length === 0 && blocked.length === 0) {
    return <p>No faltan antecedentes: existe base suficiente para concluir.</p>;
  }
  return (
    <>
      {missing.length > 0 ? (
        <ul>
          {missing.map((f) => (
            <li key={f}>
              {describeFactKey(f)}:{" "}
              {facts[f] === undefined
                ? "pendiente de responder"
                : facts[f] === "unknown"
                  ? "registrado como desconocido"
                  : "marcado como no considerado: debe considerarse con respaldo para concluir"}
            </li>
          ))}
        </ul>
      ) : null}
      {blocked.map((f) => (
        <div key={f}>
          <p>
            {describeFactKey(f)} en conflicto: usa el mecanismo normal de
            resolución.
          </p>
          <ConflictResolver factKey={f} />
        </div>
      ))}
    </>
  );
}

/** Vista de resultado para una conclusión profesional adoptada y válida. */
export function RecordedJudgmentView({
  protocol,
  activity,
  session,
  record,
  outcomeKey,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  record: ProtocolReasoningRecord;
  outcomeKey: string;
}) {
  return (
    <>
      <ProtocolChrome
        protocol={protocol}
        activity={activity}
        session={session}
        crumbTail="Conclusión documentada"
      />
      <section
        className="activity-section"
        aria-label="Conclusión profesional documentada"
        data-testid="juicio-registrado"
      >
        <h2>Conclusión profesional documentada</h2>
        <RecordedJudgmentBody
          protocol={protocol}
          activity={activity}
          session={session}
          record={record}
          outcomeKey={outcomeKey}
        />
      </section>
    </>
  );
}
/** Contenido de solo lectura de una conclusión profesional adoptada. */
export function RecordedJudgmentBody({
  protocol,
  activity,
  session,
  record,
  outcomeKey,
}: {
  protocol: ExecutionProtocol;
  activity: ProtocolActivityRef;
  session: ProtocolSession;
  record: ProtocolReasoningRecord;
  outcomeKey: string;
}) {
  const outcome = protocol.outcomes.find((o) => o.outcome_key === outcomeKey);
  if (!outcome) return null;
  return (
    <>
      <p>
        <strong data-testid="juicio-conclusion-label">{outcome.label}</strong>
      </p>
      <p>
        {outcome.classification === "legal_requirement" ? (
          <ProvenanceBadge kind="legal" />
        ) : (
          <ProvenanceBadge kind="method" />
        )}{" "}
        {provenanceHuman(outcome.classification)}
      </p>
      <p>
        Esta conclusión fue adoptada por el profesional y documentada con
        su razonamiento. El sistema no la dedujo.
      </p>
      <p>{outcome.explanation}</p>
      <h3>Razonamiento</h3>
      <p>{record.rationale}</p>
      <h3>Hechos considerados</h3>
      <ul>
        {record.facts_considered.map((f) => (
          <li key={f}>{describeFactKey(f)}</li>
        ))}
      </ul>
      <h3>Factores considerados</h3>
      <ul>
        {record.legal_factors.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      <h3>Alternativas consideradas</h3>
      <ul>
        {record.alternatives_considered.map((k, i) => (
          <li key={i}>
            {protocol.outcomes.find((o) => o.outcome_key === k)?.label ??
              "Alternativa registrada"}
          </li>
        ))}
      </ul>
      <h3>Evidencia</h3>
      <ul>
        {record.evidence_refs.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      <p className="result-count">
        Decidido por {record.decided_by}
        {record.reviewed_by.trim() !== "" ? ` · Revisado por ${record.reviewed_by}` : ""} ·{" "}
        {record.decided_at} · Pregunta: {record.legal_question}
      </p>
      <h3>Fundamento</h3>
      <ul>
        {record.legal_basis.map((b, i) => (
          <li key={i}>
            {b.source_name} — {b.article_or_provision}
          </li>
        ))}
      </ul>
      <h3>Siguiente paso</h3>
      <ul data-testid="juicio-next-actions">
        {outcome.next_actions.map((a, i) => (
          <li key={i}>
            <NextActionView action={a} activity={activity} session={session} />
          </li>
        ))}
      </ul>
    </>
  );
}
