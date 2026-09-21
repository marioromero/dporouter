import { Link } from "react-router-dom";
import { DOMAINS } from "../data/domains";

export function MapaPage() {
  return (
    <>
      <p className="eyebrow">MODO MAPA</p>
      <h1>Mapa de cumplimiento</h1>
      <p className="lede">
        Exploración libre del modelo operativo completo. El acceso al contenido no
        depende de haber respondido previamente un diagnóstico.
      </p>

      <h2>Dominios operativos</h2>
      <div className="panel">
        <ul className="domain-rows" style={{ border: "none", margin: 0 }}>
          {DOMAINS.map((d) => (
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
        <div className="empty" style={{ marginTop: 12 }}>
          <p>Contenido pendiente de importación controlada</p>
        </div>
      </div>
    </>
  );
}
