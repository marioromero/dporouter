import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DOMAINS, normalizeText } from "../data/domains";

export function DominiosPage() {
  const [filter, setFilter] = useState("");
  const results = useMemo(() => {
    const q = normalizeText(filter.trim());
    if (q === "") return DOMAINS;
    return DOMAINS.filter((d) =>
      [d.human_code, d.name].some((f) => normalizeText(f).includes(q)),
    );
  }, [filter]);

  return (
    <>
      <h1>Dominios</h1>
      <p className="lede">
        Los doce ámbitos operativos que organizan el trabajo continuo de
        protección de datos.
      </p>

      <div className="field">
        <label htmlFor="filtro-dominios">Filtrar dominios</label>
        <input
          id="filtro-dominios"
          className="input"
          type="search"
          placeholder="Filtrar dominios..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoComplete="off"
        />
      </div>

      <p className="result-count" role="status">
        {results.length} de {DOMAINS.length} dominios
      </p>

      {results.length === 0 ? (
        <div className="empty">
          <p>No encontramos coincidencias.</p>
        </div>
      ) : (
        <ul className="domain-rows">
          {results.map((d) => (
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
    </>
  );
}
