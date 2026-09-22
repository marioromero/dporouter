import { Link } from "react-router-dom";
import { DOMAINS } from "../data/domains";

export function HomePage() {
  return (
    <>
      <p className="eyebrow">ETAPA 1 · ASISTENTE OPERATIVO</p>
      <h1>Protección de datos, llevada a ejecución</h1>
      <p className="lede">
        Trabaja por empresa: revisa actividades, responde guías de ejecución
        y conserva el avance en tu espacio local.
      </p>
      <div className="actions">
        <Link className="btn" to="/empresa">
          Ir a mi empresa
        </Link>
        <Link className="btn secondary" to="/trabajo">
          Abrir trabajo
        </Link>
      </div>

      <h2>Acceso rápido</h2>
      <ul className="quick-links">
        <li>
          <Link to="/empresa">
            <strong>Empresa y avance</strong>
            <span>Continuar donde quedaste y ver el trabajo pendiente.</span>
          </Link>
        </li>
        <li>
          <Link to="/trabajo">
            <strong>Explorar trabajo</strong>
            <span>Los doce ámbitos operativos del trabajo continuo.</span>
          </Link>
        </li>
        <li>
          <Link to="/buscar">
            <strong>Buscar actividad o concepto</strong>
            <span>Localiza actividades por nombre, código o concepto.</span>
          </Link>
        </li>
        <li>
          <Link to="/referencias">
            <strong>Referencias</strong>
            <span>Cómo se distingue el origen de cada requisito.</span>
          </Link>
        </li>
      </ul>

      <h2>Dominios operativos</h2>
      <ul className="domain-grid-compact">
        {DOMAINS.map((d) => (
          <li key={d.domain_key}>
            <Link to={`/trabajo/${d.domain_key}`}>
              <span className="domain-code" aria-hidden="true">
                {d.human_code}
              </span>
              <span>{d.name}</span>
              {d.activity_keys.length > 0 ? (
                <span className="domain-count">
                  {d.activity_keys.length} actividades
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      <h2>Baseline funcional v1.0</h2>
      <p className="lede">
        La arquitectura jurídica y operativa está congelada. Las actividades y
        fuentes canónicas se incorporarán progresivamente en las siguientes
        iteraciones.
      </p>
    </>
  );
}
