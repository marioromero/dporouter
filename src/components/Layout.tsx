import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SOURCES } from "../../content/sources";
import { useWorkspace } from "../workspace/context";

const NAV = [
  { to: "/empresa", label: "Empresa", code: "EM", end: false },
  { to: "/trabajo", label: "Trabajo", code: "TR", end: false },
  { to: "/diagnostico", label: "Diagnóstico", code: "DG", end: true },
  { to: "/buscar", label: "Buscar", code: "BU", end: true },
  { to: "/referencias", label: "Referencias", code: "RF", end: true },
];

function modeFor(pathname: string): { label: string; className: string } | null {
  if (pathname.startsWith("/trabajo") || pathname.startsWith("/actividad")) {
    return { label: "TRABAJO", className: "map" };
  }
  if (pathname.startsWith("/diagnostico")) {
    return { label: "GUIADO", className: "guided" };
  }
  return null;
}

function crumbsFor(pathname: string): string {
  if (pathname === "/") return "Inicio";
  if (pathname === "/empresa") return "Empresa";
  if (pathname.startsWith("/trabajo/")) return `Trabajo / ${pathname.split("/")[2] ?? ""}`;
  if (pathname === "/trabajo") return "Trabajo";
  if (pathname.startsWith("/actividad/")) {
    const parts = pathname.split("/");
    const base = `Actividad / ${parts[2] ?? ""}`;
    if (parts[3] === "guia") {
      return parts[4] ? `${base} / Guía / ${parts[4]}` : `${base} / Guía`;
    }
    return base;
  }
  if (pathname.startsWith("/diagnostico")) return "Diagnóstico";
  if (pathname.startsWith("/buscar")) return "Buscar";
  if (pathname.startsWith("/referencias")) return "Referencias";
  return "Contenido";
}

const TRACKABLE = ["/trabajo", "/actividad", "/diagnostico", "/buscar", "/referencias"];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const mode = modeFor(location.pathname);
  const { company, setLastLocation } = useWorkspace();
  // La franja de vigencia existe solo mientras haya fuentes canónicas en
  // estado transitorio; el texto es presentación global única.
  const showValidity = SOURCES.some((s) => s.regulatory_status === "transitional");

  useEffect(() => {
    if (!company) return;
    if (TRACKABLE.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))) {
      setLastLocation(location.pathname);
    }
  }, [location.pathname, company, setLastLocation]);

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
          <span>Etapa 1 · Asistente operativo</span>
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
        <div className="sidebar-foot">
          Baseline funcional v1.0 · Uso interno
          <br />
          Espacio local: sin autenticación real.
        </div>
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
          {company ? (
            <span className="company-tag" title="Empresa activa">
              {company.name}
            </span>
          ) : null}
          {mode ? (
            <span className={`mode-tag ${mode.className}`}>{mode.label}</span>
          ) : null}
        </div>
        {showValidity ? (
          <p className="validity-strip">
            Nuevo régimen de protección de datos: vigencia desde 01-12-2026
          </p>
        ) : null}
        <main id="contenido" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DomainLink({ domainKey, children }: { domainKey: string; children?: React.ReactNode }) {
  return <Link to={`/trabajo/${domainKey}`}>{children ?? domainKey}</Link>;
}
