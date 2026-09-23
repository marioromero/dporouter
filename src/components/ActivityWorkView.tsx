import { useState } from "react";
import { Link } from "react-router-dom";
import type { ActivityDefinition } from "../types";
import type { ExecutionProtocol } from "../../content/protocols/types";
import {
  getCanonicalActivity,
  getCanonicalKeys,
} from "../../content/registry";
import { evaluateCondition, evaluateProtocol } from "../guidance/engine";
import { useGuidanceProtocol } from "../guidance/session";
import { useWorkspace } from "../workspace/context";
import { blockingConflicts } from "../workspace/facts";
import { findConclusionNode } from "../../content/protocols/registry";
import { getRecordedJudgment } from "../workspace/reasoning";
import { statusOf } from "../workspace/store";
import {
  ACTIVITY_WORK_STATUSES,
  ACTIVITY_WORK_STATUS_LABELS,
} from "../workspace/types";
import { humanApplicability } from "../applicabilityText";
import { CopyLinkButton, provenanceHuman } from "./ui";
import { ProtocolActivityLink } from "./ProtocolView";

/**
 * Vista de trabajo de actividad (Stage 1, UX Reset).
 *
 * Muestra trabajo y decisiones en lenguaje humano: estado para la
 * empresa activa, acción principal de guía, objetivo, resultado actual,
 * revisión, evidencia, entregable, interlocutores, fundamento y
 * siguiente paso. Los enums y expresiones internas no aparecen en la
 * vista normal; quedan en un <details> de auditoría colapsado.
 */

export function modeStartLabel(mode: ExecutionProtocol["mode"], started: boolean): string {
  if (mode === "procedure") {
    return started ? "Continuar procedimiento" : "Iniciar procedimiento";
  }
  if (mode === "checklist") {
    return started ? "Continuar revisión" : "Iniciar revisión";
  }
  return started ? "Continuar evaluación" : "Iniciar evaluación";
}

export function ActivityWorkView({
  def,
  domain,
  protocol,
}: {
  def: ActivityDefinition;
  domain?: { domainKey: string; domainCode: string };
  protocol?: ExecutionProtocol;
}) {
  const { company, setActivityStatus } = useWorkspace();
  const session = useGuidanceProtocol(
    protocol?.protocol_key ?? "",
    protocol?.execution_scope ?? "company",
  );
  const status = company ? statusOf(company, def.activity_key) : null;
  const evaluation = protocol ? evaluateProtocol(protocol, session.facts) : null;
  const blocked =
    protocol && company ? blockingConflicts(protocol, company) : [];
  const outcome =
    evaluation?.status === "outcome" && blocked.length === 0
      ? evaluation.outcome
      : null;
  const recorded =
    protocol != null
      ? getRecordedJudgment(protocol, company, session.facts)
      : { status: "none" as const };
  const conclusionNode =
    protocol != null ? findConclusionNode(protocol) : undefined;
  const appliesWhen = humanApplicability(def.conditions_applicability);
  const grounds =
    def.legal_basis.length > 0
      ? def.legal_basis
          .map((b) => `${b.source_name} — ${b.article_or_provision}`)
          .join("; ")
      : "Sin fundamento registrado.";
  const provenance = provenanceHuman(
    def.regulatory_status.startsWith("pending")
      ? def.regulatory_status
      : def.evidence_basis,
  );

  const knownKeys = getCanonicalKeys();
  const firstDependency = def.activity_dependencies.find((d) =>
    knownKeys.has(d.target_activity_key),
  );
  const firstDependencyDef = firstDependency
    ? getCanonicalActivity(firstDependency.target_activity_key)
    : undefined;

  const guideBase = `/actividad/${def.activity_key}/guia`;
  const primaryGuide = protocol
    ? recorded.status === "valid"
      ? { label: "Revisar resultado", to: `${guideBase}/resultado` }
      : outcome
        ? { label: "Revisar resultado", to: `${guideBase}/resultado` }
        : { label: modeStartLabel(protocol.mode, session.started), to: guideBase }
    : null;
  const incomplete =
    evaluation?.status === "outcome" &&
    evaluation.outcome_key === "assessment_incomplete";

  const visibleOutcomeAction = outcome
    ? outcome.next_actions.find(
        (a) =>
          (a.kind === "activity" || a.kind === "node") &&
          (a.show_when ? evaluateCondition(a.show_when, session.facts) : true),
      )
    : undefined;

  return (
    <>
      <p className="breadcrumb">
        <Link to="/trabajo">Trabajo</Link>{" "}
        {domain ? (
          <>
            /{" "}
            <Link to={`/trabajo/${domain.domainKey}`}>
              {domain.domainCode}
            </Link>{" "}
          </>
        ) : (
          "/ "
        )}
        / {def.human_code}
      </p>

      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <span className="human-code">{def.human_code}</span>
          <h1 style={{ marginTop: 6, marginBottom: 8 }}>{def.name}</h1>
          {company && status ? (
            <p style={{ margin: 0 }}>
              <span className={`work-status ${status}`} data-testid="actividad-estado">
                {ACTIVITY_WORK_STATUS_LABELS[status]}
              </span>{" "}
              <span className="copy-feedback">· {company.name}</span>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <Link to="/empresa">Selecciona una empresa para registrar avance</Link>
            </p>
          )}
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>

      <section className="activity-section" aria-label="Acción principal" data-testid="actividad-accion">
        <h2>Acción principal</h2>
        {primaryGuide ? (
          <div className="actions">
            <Link className="btn" to={primaryGuide.to}>
              {primaryGuide.label}
            </Link>
          </div>
        ) : (
          <p className="empty" style={{ margin: 0 }}>
            Guía operativa pendiente de incorporar
          </p>
        )}
        {company ? (
          <>
            <div className="actions" role="group" aria-label="Estado de trabajo">
              {ACTIVITY_WORK_STATUSES.filter((s) =>
                incomplete ? s !== "reviewed" : true,
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`estado-${s}`}
                  className={status === s ? "btn small" : "btn ghost small"}
                  aria-pressed={status === s}
                  onClick={() => setActivityStatus(def.activity_key, s)}
                >
                  {ACTIVITY_WORK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {incomplete ? (
              <p>
                La evaluación está incompleta: completa los antecedentes o
                marca <strong>Bloqueado</strong> si no puedes avanzar.{" "}
                <Link to={guideBase}>Continuar con antecedentes</Link>
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="activity-section" aria-label="Qué se busca resolver">
        <h2>Qué se busca resolver</h2>
        <p>{def.objective}</p>
        {def.trigger_question.trim() !== "" ? (
          <p>
            <strong>Pregunta de partida:</strong> {def.trigger_question}
          </p>
        ) : null}
        {appliesWhen.length > 0 ? (
          <>
            <h3>Cuándo aplica</h3>
            <ul>
              {appliesWhen.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        ) : def.conditions_applicability.length > 0 ? (
          <p className="result-count">
            Condiciones de aplicabilidad registradas en auditoría interna.
          </p>
        ) : null}
      </section>

      {blocked.length > 0 ? (
        <section className="activity-section" aria-label="Dato en conflicto" data-testid="actividad-conflicto">
          <h2>Dato en conflicto</h2>
          <p>
            Debes resolver un dato en conflicto antes de obtener una
            conclusión definitiva.
          </p>
          <div className="actions">
            <Link className="btn" to={guideBase}>
              Resolver en la guía
            </Link>
          </div>
        </section>
      ) : null}

      {recorded.status === "valid" && conclusionNode ? (
        <section className="activity-section" aria-label="Conclusión profesional" data-testid="actividad-juicio">
          <h2>Conclusión profesional</h2>
          <p>
            <strong>{recorded.outcome.label}</strong>
          </p>
          <p className="result-count">Juicio profesional documentado</p>
          <div className="actions">
            <Link className="btn secondary" to={`${guideBase}/${conclusionNode.node_key}`}>
              Ver conclusión documentada
            </Link>
          </div>
        </section>
      ) : null}

      {recorded.status === "stale" && conclusionNode ? (
        <section className="activity-section" aria-label="Conclusión desactualizada">
          <h2>Conclusión desactualizada</h2>
          <p>
            La conclusión registrada ya no refleja los antecedentes
            actuales. Revísala antes de continuar:
          </p>
          <ul>
            {recorded.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div className="actions">
            <Link className="btn secondary" to={`${guideBase}/${conclusionNode.node_key}`}>
              Reevaluar conclusión
            </Link>
          </div>
        </section>
      ) : null}

      {outcome ? (
        <section className="activity-section" aria-label="Resultado actual" data-testid="actividad-resultado">
          <h2>Resultado actual</h2>
          <p>
            <strong>{outcome.label}</strong>
          </p>
          <div className="actions">
            <Link className="btn secondary" to={`${guideBase}/resultado`}>
              Ver detalle del resultado
            </Link>
          </div>
        </section>
      ) : null}

      <section className="activity-section" aria-label="Qué revisar">
        <h2>Qué revisar</h2>
        {def.data_collection_methods.length > 0 ? (
          <ul>
            {def.data_collection_methods.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
        {def.steps_operational.length > 0 ? (
          <>
            <h3>Cómo avanzar</h3>
            <ol>
              {def.steps_operational.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </>
        ) : null}
      </section>

      <section className="activity-section" aria-label="Evidencia que debes obtener">
        <h2>Evidencia que debes obtener</h2>
        {provenance ? <p>{provenance}</p> : null}
        {def.evidence_required.length > 0 ? (
          <ul>
            {def.evidence_required.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {def.deliverable.trim() !== "" ? (
        <section className="activity-section" aria-label="Entregable">
          <h2>Entregable</h2>
          <p>{def.deliverable}</p>
        </section>
      ) : null}

      {def.interlocutors.length > 0 ? (
        <section className="activity-section" aria-label="Con quién hablar">
          <h2>Con quién hablar</h2>
          <ul>
            {def.interlocutors.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="activity-section" aria-label="Fundamento">
        <h2>Fundamento</h2>
        <p>{grounds}</p>
        <details>
          <summary>Ver fundamento legal</summary>
          <ul>
            {def.legal_basis.map((b, i) => (
              <li key={i}>
                {b.source_name} — {b.article_or_provision}
                {b.reference_text.trim() !== "" ? ` · ${b.reference_text}` : ""}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {def.activity_dependencies.length > 0 ? (
        <section className="activity-section" aria-label="Se relaciona con">
          <h2>Se relaciona con</h2>
          <ul>
            {def.activity_dependencies
              .filter((d) => knownKeys.has(d.target_activity_key))
              .map((d) => (
                <li key={d.target_activity_key}>
                  <Link to={`/actividad/${d.target_activity_key}`}>
                    {getCanonicalActivity(d.target_activity_key)?.name ??
                      d.target_activity_key}
                  </Link>
                  {d.rationale.trim() !== "" ? ` — ${d.rationale}` : ""}
                </li>
              ))}
          </ul>
          {def.activity_dependencies.some(
            (d) => !knownKeys.has(d.target_activity_key),
          ) ? (
            <p className="result-count">
              Más referencias canónicas pendientes de importar (detalle en
              auditoría interna).
            </p>
          ) : null}
        </section>
      ) : null}

      {visibleOutcomeAction || firstDependencyDef ? (
        <section className="activity-section" aria-label="Siguiente paso" data-testid="actividad-siguiente">
          <h2>Siguiente paso</h2>
          {visibleOutcomeAction ? (
            <p>
              {visibleOutcomeAction.kind === "activity" &&
              visibleOutcomeAction.activity_key ? (
                <ProtocolActivityLink
                  activityKey={visibleOutcomeAction.activity_key}
                  label={visibleOutcomeAction.label}
                />
              ) : visibleOutcomeAction.kind === "node" &&
                visibleOutcomeAction.node_key &&
                protocol ? (
                <Link to={`${guideBase}/${visibleOutcomeAction.node_key}`}>
                  {visibleOutcomeAction.label}
                </Link>
              ) : null}
            </p>
          ) : firstDependencyDef ? (
            <p>
              <Link to={`/actividad/${firstDependencyDef.activity_key}`}>
                {firstDependencyDef.name}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <AuditDetails def={def} />
    </>
  );
}

function AuditDetails({ def }: { def: ActivityDefinition }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="activity-section"
      data-testid="auditoria-detalle"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>Datos técnicos (auditoría interna)</summary>
      {open ? (
        <table className="trace-table">
          <tbody>
            <tr>
              <th scope="row">Clave semántica</th>
              <td>{def.activity_key}</td>
            </tr>
            <tr>
              <th scope="row">Tipo</th>
              <td>{def.activity_type}</td>
            </tr>
            <tr>
              <th scope="row">Roles aplicables</th>
              <td>{def.applicable_role.join(", ") || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Condiciones crudas</th>
              <td>{def.conditions_applicability.join("; ") || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Dependencias</th>
              <td>
                {def.activity_dependencies.length > 0
                  ? def.activity_dependencies
                      .map((d) => `${d.target_activity_key} (${d.type}, ${d.scope})`)
                      .join("; ")
                  : "—"}
              </td>
            </tr>
            <tr>
              <th scope="row">Registro de razonamiento</th>
              <td>{def.reasoning_record_required ? "Requerido" : "No requerido"}</td>
            </tr>
            <tr>
              <th scope="row">Efectos de estado</th>
              <td>{def.state_effect.join("; ") || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Efectos de relación</th>
              <td>{def.relationship_effect.join("; ") || "—"}</td>
            </tr>
            <tr>
              <th scope="row">Base de evidencia</th>
              <td>{def.evidence_basis}</td>
            </tr>
            <tr>
              <th scope="row">Estado regulatorio</th>
              <td>{def.regulatory_status}</td>
            </tr>
            <tr>
              <th scope="row">Última revisión</th>
              <td>{def.last_legal_review || "—"}</td>
            </tr>
          </tbody>
        </table>
      ) : null}
    </details>
  );
}
