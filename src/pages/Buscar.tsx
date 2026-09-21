import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchDomains } from "../data/domains";

export function BuscarPage() {
  const [term, setTerm] = useState("");
  const trimmed = term.trim();
  const results = useMemo(() => searchDomains(trimmed), [trimmed]);

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

      {trimmed === "" ? (
        <div className="empty">
          <p>Escribe un término para comenzar.</p>
        </div>
      ) : results.length === 0 ? (
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

      <h2>Actividades</h2>
      <div className="empty">
        <p>
          La búsqueda de actividades se habilitará al importar las definiciones
          canónicas D1–D12.
        </p>
      </div>
    </>
  );
}
