import { Link } from "react-router-dom";

const AREAS = [
  "Entidad",
  "Territorio",
  "Roles",
  "Titulares",
  "Categorías de datos",
  "Características del tratamiento",
  "Flujos",
  "Madurez",
  "Gobernanza",
  "Etiquetas regulatorias",
];

export function DiagnosticoPage() {
  return (
    <>
      <p className="eyebrow">MODO GUIADO</p>
      <h1>Diagnóstico / Caracterización</h1>
      <p className="lede">
        La caracterización captura hechos relevantes del cliente; no equivale por
        sí sola a una evaluación de cumplimiento.
      </p>

      <div className="notice">
        <strong>Estructura preparada</strong>
        <p>
          Las preguntas canónicas de caracterización todavía no han sido
          importadas. Esta vista no debe inventarlas ni convertir información
          desconocida en una respuesta negativa.
        </p>
      </div>

      <h2>Áreas conceptuales</h2>
      <ul className="area-list">
        {AREAS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>

      <div className="actions">
        <Link className="btn secondary" to="/mapa">
          Explorar el mapa completo
        </Link>
      </div>
    </>
  );
}
