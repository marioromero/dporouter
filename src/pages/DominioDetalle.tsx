import { Link, useParams } from "react-router-dom";
import { getDomain } from "../data/domains";
import { CopyLinkButton } from "../components/ui";
import { NotFoundPage } from "./NotFound";

export function DominioDetallePage() {
  const { domainKey } = useParams<{ domainKey: string }>();
  const domain = domainKey ? getDomain(domainKey) : undefined;

  if (!domain) {
    return <NotFoundPage />;
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/dominios">Dominios</Link> / {domain.human_code}
      </p>
      <div className="activity-head">
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <span className="human-code">{domain.human_code}</span>
          <h1 style={{ marginTop: 0 }}>{domain.name}</h1>
        </div>
        <div>
          <CopyLinkButton />
        </div>
      </div>

      <h2>Objetivo</h2>
      <div className="empty">
        <p>
          El objetivo detallado de este dominio se incorporará junto con su
          especificación canónica.
        </p>
      </div>

      <h2>Actividades</h2>
      <p className="result-count">0 actividades importadas</p>
      <div className="empty">
        <p>
          Las actividades de este dominio todavía no han sido incorporadas al
          repositorio. No se generará contenido provisional.
        </p>
      </div>

      <h2>Relaciones con otros dominios</h2>
      <div className="empty">
        <p>Las relaciones se mostrarán cuando se importen dependencias canónicas.</p>
      </div>
    </>
  );
}
