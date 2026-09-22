import { Link } from "react-router-dom";
import { DOMAINS } from "../data/domains";
import { getCanonicalActivity } from "../../content/registry";
import { getProtocolForActivity } from "../../content/protocols/registry";
import { useWorkspace } from "../workspace/context";
import { useGuidanceProtocol } from "../guidance/session";
import { statusOf } from "../workspace/store";
import { isFactResolved } from "../guidance/engine";

/**
 * Navegador sticky de contexto: dominios D1-D12, actividades del dominio
 * y, dentro de una guía, nodos del protocolo con su estado. Siempre
 * visible durante el scroll; salto directo sin volver al índice.
 */

function domainActivities(domainKey: string): string[] {
  const d = DOMAINS.find((x) => x.domain_key === domainKey);
  return d?.activity_keys ?? [];
}

function domainIndex(domainKey: string): number {
  return DOMAINS.findIndex((d) => d.domain_key === domainKey);
}

export function ContextNav({
  domainKey,
  activityKey,
  guide,
}: {
  domainKey?: string;
  activityKey?: string;
  guide?: {
    protocolKey: string;
    currentNodeKey?: string;
  };
}) {
  const { company } = useWorkspace();
  const activities = domainKey ? domainActivities(domainKey) : [];
  const activityIdx = activityKey ? activities.indexOf(activityKey) : -1;

  const prevDomain = domainKey && domainIndex(domainKey) > 0 ? DOMAINS[domainIndex(domainKey) - 1] : null;
  const nextDomain =
    domainKey && domainIndex(domainKey) < DOMAINS.length - 1
      ? DOMAINS[domainIndex(domainKey) + 1]
      : null;
  const prevActivity = activityIdx > 0 ? activities[activityIdx - 1] : null;
  const nextActivity =
    activityIdx >= 0 && activityIdx < activities.length - 1
      ? activities[activityIdx + 1]
      : null;

  return (
    <nav className="contextnav" aria-label="Navegación de contexto">
      <div className="contextnav-row" data-testid="contextnav-domains">
        {DOMAINS.map((d) => (
          <Link
            key={d.domain_key}
            to={`/trabajo/${d.domain_key}`}
            className={d.domain_key === domainKey ? "ctx current" : "ctx"}
            aria-current={d.domain_key === domainKey ? "page" : undefined}
            title={d.name}
          >
            {d.human_code}
          </Link>
        ))}
      </div>
      {domainKey && activities.length > 0 ? (
        <div className="contextnav-row scroll" data-testid="contextnav-activities">
          {activities.map((k) => {
            const def = getCanonicalActivity(k);
            const done =
              company != null &&
              (statusOf(company, k) === "reviewed" ||
                statusOf(company, k) === "not_applicable");
            return (
              <Link
                key={k}
                to={`/actividad/${k}`}
                className={
                  k === activityKey ? "ctx current" : done ? "ctx done" : "ctx"
                }
                aria-current={k === activityKey ? "page" : undefined}
                title={def?.name ?? k}
              >
                {def?.human_code ?? k}
              </Link>
            );
          })}
        </div>
      ) : null}
      {guide && activityKey ? (
        <GuideNodeStrip
          activityKey={activityKey}
          protocolKey={guide.protocolKey}
          currentNodeKey={guide.currentNodeKey}
        />
      ) : null}
      <div className="contextnav-row steps">
        {domainKey && !activityKey ? (
          <>
            {prevDomain ? (
              <Link className="btn ghost small" to={`/trabajo/${prevDomain.domain_key}`}>
                ← Anterior: {prevDomain.human_code}
              </Link>
            ) : (
              <span />
            )}
            {nextDomain ? (
              <Link className="btn ghost small" to={`/trabajo/${nextDomain.domain_key}`}>
                Siguiente: {nextDomain.human_code} →
              </Link>
            ) : (
              <span />
            )}
          </>
        ) : null}
        {activityKey ? (
          <>
            {prevActivity ? (
              <Link className="btn ghost small" to={`/actividad/${prevActivity}`}>
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            {nextActivity ? (
              <Link className="btn ghost small" to={`/actividad/${nextActivity}`}>
                Siguiente →
              </Link>
            ) : (
              <span />
            )}
          </>
        ) : null}
      </div>
    </nav>
  );
}

function GuideNodeStrip({
  activityKey,
  protocolKey,
  currentNodeKey,
}: {
  activityKey: string;
  protocolKey: string;
  currentNodeKey?: string;
}) {
  const protocol = getProtocolForActivity(activityKey);
  // Misma verdad que la sesión: hechos propios + inyectados (Diagnóstico
  // y otras guías) y modo memoria sin empresa.
  const session = useGuidanceProtocol(protocol?.protocol_key ?? "");
  if (!protocol || protocol.protocol_key !== protocolKey) return null;
  return (
    <div className="contextnav-row scroll" data-testid="contextnav-nodes">
      {protocol.nodes
        .filter((n) => n.node_type === "question")
        .map((n) => {
          const v = n.fact_key ? session.facts[n.fact_key] : undefined;
          const provided = n.fact_key ? session.isProvided(n.fact_key) : false;
          const state = isFactResolved(v)
            ? provided
              ? "ya disponible"
              : "resuelto"
            : "pendiente";
          return (
            <Link
              key={n.node_key}
              to={`/actividad/${activityKey}/guia/${n.node_key}`}
              className={n.node_key === currentNodeKey ? "ctx current" : "ctx"}
              aria-current={n.node_key === currentNodeKey ? "page" : undefined}
              title={`${n.title} · ${state}`}
            >
              {isFactResolved(v) ? "● " : "○ "}
              {n.title}
            </Link>
          );
        })}
    </div>
  );
}
