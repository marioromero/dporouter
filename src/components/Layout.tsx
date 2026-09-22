import { Link, NavLink, useLocation } from "react-router-dom";

const NAV = [
  { to: "/", label: "Inicio", code: "IN", end: true },
  { to: "/diagnostico", label: "Diagnóstico / Caracterización", code: "DG", end: true },
  { to: "/mapa", label: "Mapa de cumplimiento", code: "MP", end: true },
  { to: "/dominios", label: "Dominios", code: "DO", end: false },
  { to: "/buscar", label: "Buscar", code: "BU", end: true },
  { to: "/fuentes", label: "Fuentes y estado normativo", code: "FU", end: true },
];

function modeFor(pathname: string): { label: string; className: string } | null {
  if (pathname === "/mapa" || pathname.startsWith("/dominios") || pathname.startsWith("/actividad")) {
    return { label: "MAPA", className: "map" };
  }
  if (pathname === "/diagnostico" || pathname.startsWith("/diagnostico")) {
    return { label: "GUIADO", className: "guided" };
  }
  return null;
}

function crumbsFor(pathname: string): string {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/dominios/")) return `Dominios / ${pathname.split("/")[2] ?? ""}`;
  if (pathname.startsWith("/actividad/")) return `Actividad / ${pathname.split("/")[2] ?? ""}`;
  const found = NAV.find((n) => n.to !== "/" && (pathname === n.to || pathname.startsWith(n.to + "/")));
  if (found) {
    return found.label;
  }
  return "Contenido";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const mode = modeFor(location.pathname);

  function closeNav() {
    document.querySelector(".app-shell")?.classList.remove("nav-open");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="sidebar-brand">
          <strong>Chile Privacy Operations</strong>
          <span>Etapa 1 · Manual operativo</span>
        </div>
        <nav aria-label="Áreas principales">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="nav-item"
              onClick={closeNav}
            >
              <span className="nav-code" aria-hidden="true">
                {item.code}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">Baseline funcional v1.0 · Uso interno</div>
      </aside>
      <button
        className="scrim"
        aria-label="Cerrar menú de navegación"
        onClick={closeNav}
        tabIndex={-1}
      />
      <div className="main">
        <div className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú de navegación"
            onClick={() => document.querySelector(".app-shell")?.classList.toggle("nav-open")}
          >
            ☰
          </button>
          <span className="crumbs" aria-label="Ubicación actual">
            {crumbsFor(location.pathname)}
          </span>
          {mode ? (
            <span className={`mode-tag ${mode.className}`}>{mode.label}</span>
          ) : null}
        </div>
        <main id="contenido" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DomainLink({ domainKey, children }: { domainKey: string; children?: React.ReactNode }) {
  return <Link to={`/dominios/${domainKey}`}>{children ?? domainKey}</Link>;
}
