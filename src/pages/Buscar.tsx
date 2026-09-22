import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchDomains } from "../data/domains";
import {
  getDomainForActivity,
  searchCanonicalActivities,
} from "../../content/registry";
import { activityTypeLabel } from "../components/ui";

export function BuscarPage() {
  const [term, setTerm] = useState("");
  const trimmed = term.trim();
  const domains = useMemo(() => searchDomains(trimmed), [trimmed]);
  const activities = useMemo(() => searchCanonicalActivities(trimmed), [trimmed]);

  return (
    <>
      <h1>Buscar</h1>
      <p className="lede">
        Localiza dominios y, cuando estén disponibles, actividades por nombre,
        código o concepto.
      </p>

      <div className="field">
        <label htmlFor="buscar-input">Buscar</label>
        <input
          id="buscar-input"
          className="input"
          type="search"
          placeholder="Buscar por nombre, código o concepto..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
        />
      </div>

      <h2>Dominios</h2>
      {trimmed === "" ? (
        <div className="empty">
          <p>Escribe un término para comenzar.</p>
        </div>
      ) : domains.length === 0 ? (
        <div className="empty">
          <p>No encontramos coincidencias.</p>
        </div>
      ) : (
        <ul className="domain-rows">
          {domains.map((d) => (
            <li key={d.domain_key}>
              <Link className="domain-row" to={`/dominios/${d.domain_key}`}>
                <span className="domain-code" aria-hidden="true">
                  {d.human_code}
                </span>
                <span className="domain-name">{d.name}</span>
                <span className="domain-go" aria-hidden="true">
                  Abrir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2>Actividades</h2>
      {trimmed === "" ? (
        <div className="empty">
          <p>Escribe un término para comenzar.</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty">
          <p>No encontramos coincidencias.</p>
        </div>
      ) : (
        <ul className="domain-rows">
          {activities.map((a) => (
            <li key={a.activity_key}>
              <Link className="domain-row" to={`/actividad/${a.activity_key}`}>
                <span className="domain-code" aria-hidden="true">
                  {a.human_code}
                </span>
                <span className="activity-row-main">
                  <span className="activity-row-name">{a.name}</span>
                  <span className="activity-row-meta">
                    <span>{getDomainForActivity(a.activity_key)?.domainCode ?? ""}</span>
                    <span>{activityTypeLabel(a.activity_type)}</span>
                    <span>
                      <code>{a.activity_key}</code>
                    </span>
                  </span>
                </span>
                <span className="domain-go" aria-hidden="true">
                  Abrir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
