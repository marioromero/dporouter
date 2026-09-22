import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDomain, normalizeText } from "../data/domains";
import { getCanonicalActivity } from "../../content/registry";
import { CopyLinkButton, activityTypeLabel } from "../components/ui";
import { ContextNav } from "../components/ContextNav";
import { useWorkspace } from "../workspace/context";
import { summarizeDomain } from "../workspace/suggest";
import { ACTIVITY_WORK_STATUS_LABELS } from "../workspace/types";
import { statusOf } from "../workspace/store";
import { NotFoundPage } from "./NotFound";

export function DominioDetallePage() {
  const { domainKey } = useParams<{ domainKey: string }>();
  const domain = domainKey ? getDomain(domainKey) : undefined;
  const [filter, setFilter] = useState("");
  const { company } = useWorkspace();

  const activities = useMemo(() => {
    if (!domain) return [];
    return domain.activity_keys
      .map((k) => getCanonicalActivity(k))
      .filter((a) => a !== undefined);
  }, [domain]);

  const visible = useMemo(() => {
    const q = normalizeText(filter.trim());
    if (q === "") return activities;
    return activities.filter((a) =>
      [a.human_code, a.name, a.activity_key].some((f) =>
        normalizeText(f).includes(q),
      ),
    );
  }, [activities, filter]);

  if (!domain || !domainKey) {
    return <NotFoundPage />;
  }

  const summary = summarizeDomain(domainKey, activities, company);
  const hasActivities = activities.length > 0;

  return (
    <>
      <ContextNav domainKey={domainKey} />
      <p className="breadcrumb">
        <Link to="/trabajo">Trabajo</Link> / {domain.human_code}
      </p>
      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <span className="human-code">{domain.human_code}</span>
          <h1 style={{ marginTop: 0 }}>{domain.name}</h1>
          {company && hasActivities ? (
            <p style={{ margin: 0 }} data-testid="dominio-estado">
              {summary.isReviewed ? (
                <span className="work-status reviewed">Revisado</span>
              ) : (
                <span>
                  {summary.reviewed} de {summary.total} revisadas
                </span>
              )}
              {summary.inReview > 0 ? ` · ${summary.inReview} en revisión` : ""}
              {summary.blocked > 0 ? ` · ${summary.blocked} bloqueadas` : ""}
            </p>
          ) : null}
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>

      <h2>Objetivo</h2>
      {domain.objective.trim() === "" ? (
        <div className="empty">
          <p>
            El objetivo detallado de este dominio se incorporará junto con su
            especificación canónica.
          </p>
        </div>
      ) : (
        <p className="lede">{domain.objective}</p>
      )}
      {domain.description.trim() !== "" ? (
        <p className="lede">{domain.description}</p>
      ) : null}

      <h2>Actividades</h2>
      <p className="result-count">
        {activities.length}{" "}
        {activities.length === 1 ? "actividad importada" : "actividades importadas"}
      </p>
      {!hasActivities ? (
        <div className="empty">
          <p>
            Las actividades de este dominio todavía no han sido incorporadas al
            repositorio. No se generará contenido provisional.
          </p>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="filtro-actividades">Filtrar actividades</label>
            <input
              id="filtro-actividades"
              className="input"
              type="search"
              placeholder="Filtrar por código, nombre o clave..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoComplete="off"
            />
          </div>
          {visible.length === 0 ? (
            <div className="empty">
              <p>No encontramos coincidencias.</p>
            </div>
          ) : (
            <ul className="domain-rows">
              {visible.map((a) => {
                const st = company ? statusOf(company, a.activity_key) : null;
                return (
                  <li key={a.activity_key}>
                    <Link className="domain-row" to={`/actividad/${a.activity_key}`}>
                      <span className="domain-code" aria-hidden="true">
                        {a.human_code}
                      </span>
                      <span className="activity-row-main">
                        <span className="activity-row-name">{a.name}</span>
                        <span className="activity-row-meta">
                          <span>{activityTypeLabel(a.activity_type)}</span>
                          {st && st !== "not_started" ? (
                            <span className={`work-status ${st}`}>
                              {ACTIVITY_WORK_STATUS_LABELS[st]}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="domain-go" aria-hidden="true">
                        Abrir →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <h2>Relaciones con otros dominios</h2>
      <div className="empty">
        <p>Las relaciones se mostrarán cuando se importen dependencias canónicas.</p>
      </div>
    </>
  );
}
