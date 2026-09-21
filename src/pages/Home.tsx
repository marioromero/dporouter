import { Link } from "react-router-dom";
import { DOMAINS } from "../data/domains";

export function HomePage() {
  return (
    <>
      <p className="eyebrow">ETAPA 1 · MANUAL OPERATIVO</p>
      <h1>Protección de datos, llevada a ejecución</h1>
      <p className="lede">
        Navega el modelo completo o parte por la caracterización para priorizar
        actividades. El contenido jurídico y operativo se incorporará por dominios
        de forma controlada.
      </p>
      <div className="actions">
        <Link className="btn" to="/diagnostico">
          Iniciar caracterización
        </Link>
        <Link className="btn secondary" to="/mapa">
          Abrir mapa completo
        </Link>
      </div>

      <h2>Acceso rápido</h2>
      <ul className="quick-links">
        <li>
          <Link to="/buscar">
            <strong>Buscar actividad o concepto</strong>
            <span>Localiza dominios por nombre, código o concepto.</span>
          </Link>
        </li>
        <li>
          <Link to="/dominios">
            <strong>Explorar dominios</strong>
            <span>Los doce ámbitos operativos del trabajo continuo.</span>
          </Link>
        </li>
        <li>
          <Link to="/fuentes">
            <strong>Fuentes y estado normativo</strong>
            <span>Cómo se distingue el origen de cada requisito.</span>
          </Link>
        </li>
      </ul>

      <h2>Dominios operativos</h2>
      <ul className="domain-grid-compact">
        {DOMAINS.map((d) => (
          <li key={d.domain_key}>
            <Link to={`/dominios/${d.domain_key}`}>
              <span className="domain-code" aria-hidden="true">
                {d.human_code}
              </span>
              <span>{d.name}</span>
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
