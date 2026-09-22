import { useState } from "react";
import { Link } from "react-router-dom";
import { DOMAINS } from "../data/domains";
import { getCanonicalActivity } from "../../content/registry";
import { useWorkspace } from "../workspace/context";
import { summarizeDomain } from "../workspace/suggest";
import { ContextNav } from "../components/ContextNav";

/**
 * Trabajo: única entrada global D1-D12. Resumen para escanear estado,
 * Lista para actuar (siguiente pendiente + acceso directo). Dos vistas
 * deliberadamente distintas, no dos módulos redundantes.
 */

export function TrabajoPage() {
  const { company } = useWorkspace();
  const [view, setView] = useState<"resumen" | "lista">("lista");

  const summaries = DOMAINS.map((d) => {
    const activities = d.activity_keys
      .map((k) => getCanonicalActivity(k))
      .filter((a) => a !== undefined);
    return { domain: d, ...summarizeDomain(d.domain_key, activities, company) };
  });

  return (
    <>
      <ContextNav />
      <h1>Trabajo</h1>
      <p className="lede">
        Los doce ámbitos operativos en una única superficie. El estado
        describe avance de revisión, nunca cumplimiento jurídico.
      </p>
      <div className="actions" role="group" aria-label="Vista de trabajo">
        <button
          type="button"
          className={view === "resumen" ? "btn small" : "btn ghost small"}
          aria-pressed={view === "resumen"}
          onClick={() => setView("resumen")}
        >
          Resumen
        </button>
        <button
          type="button"
          className={view === "lista" ? "btn small" : "btn ghost small"}
          aria-pressed={view === "lista"}
          onClick={() => setView("lista")}
        >
          Lista
        </button>
      </div>

      {view === "resumen" ? (
        <div className="table-wrap">
          <table className="trace-table" data-testid="trabajo-resumen">
            <thead>
              <tr>
                <th scope="col">Dominio</th>
                <th scope="col">Estado</th>
                <th scope="col">Revisadas</th>
                <th scope="col">Siguiente</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const next = s.nextPendingKey
                  ? getCanonicalActivity(s.nextPendingKey)
                  : undefined;
                return (
                  <tr key={s.domainKey}>
                    <td>
                      <Link to={`/trabajo/${s.domainKey}`}>
                        {s.domain.human_code} · {s.domain.name}
                      </Link>
                    </td>
                    <td>
                      {s.total === 0 ? (
                        "Sin contenido"
                      ) : s.isReviewed ? (
                        <span className="work-status reviewed">Revisado</span>
                      ) : (
                        "En curso"
                      )}
                    </td>
                    <td>
                      {s.total === 0 ? "—" : `${s.reviewed} de ${s.total}`}
                    </td>
                    <td>
                      {next ? (
                        <Link to={`/actividad/${next.activity_key}`}>
                          {next.human_code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="domain-rows" data-testid="trabajo-lista">
          {summaries.map((s) => {
            const next = s.nextPendingKey
              ? getCanonicalActivity(s.nextPendingKey)
              : undefined;
            return (
              <li key={s.domainKey}>
                <Link className="domain-row" to={`/trabajo/${s.domainKey}`}>
                  <span className="domain-code" aria-hidden="true">
                    {s.domain.human_code}
                  </span>
                  <span className="activity-row-main">
                    <span className="activity-row-name">{s.domain.name}</span>
                    <span className="activity-row-meta">
                      {s.total === 0 ? (
                        <span>Sin contenido importado</span>
                      ) : s.isReviewed ? (
                        <span className="work-status reviewed">Revisado</span>
                      ) : (
                        <span>
                          {s.reviewed} de {s.total} revisadas
                        </span>
                      )}
                      {next ? (
                        <span>
                          Siguiente: {next.human_code} · {next.name}
                        </span>
                      ) : null}
                      {s.blocked > 0 ? (
                        <span>{s.blocked} bloqueadas</span>
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
      {!company ? (
        <div className="empty">
          <p>
            <Link to="/empresa">Selecciona una empresa</Link> para ver avance
            de revisión por empresa.
          </p>
        </div>
      ) : null}
    </>
  );
}
