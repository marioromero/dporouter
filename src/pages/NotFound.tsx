import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="notfound">
      <h1>No encontramos este contenido</h1>
      <p className="lede">
        La ruta puede ser incorrecta o el contenido todavía no ha sido incorporado
        al modelo canónico.
      </p>
      <div className="actions">
        <Link className="btn" to="/">
          Ir al inicio
        </Link>
        <Link className="btn secondary" to="/trabajo">
          Explorar trabajo
        </Link>
      </div>
    </div>
  );
}
