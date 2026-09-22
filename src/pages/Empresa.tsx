import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DOMAINS, getDomain } from "../data/domains";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainForActivity,
} from "../../content/registry";
import { useWorkspace } from "../workspace/context";
import { statusOf } from "../workspace/store";
import { summarizeDomain, suggestNextReview } from "../workspace/suggest";

/**
 * Empresa: vista principal tras seleccionar empresa. Trabajo real por
 * empresa (estados, continuación, sugerencia, respaldo), sin porcentajes
 * de cumplimiento jurídico y sin perfiles ficticios.
 */

const IMPORTED_DOMAINS = DOMAINS.filter((d) => d.activity_keys.length > 0).map(
  (d) => d.domain_key,
);

function locationLabel(path: string): string {
  const parts = path.split("/");
  if (parts[1] === "actividad" && parts[2]) {
    const def = getCanonicalActivity(parts[2].split("?")[0]);
    if (def) return `${def.human_code} · ${def.name}`;
  }
  if (parts[1] === "trabajo" && parts[2]) {
    const d = getDomain(parts[2]);
    if (d) return `${d.human_code} · ${d.name}`;
  }
  if (path === "/trabajo") return "Trabajo";
  if (path === "/diagnostico") return "Diagnóstico";
  if (path === "/buscar") return "Buscar";
  if (path === "/referencias") return "Referencias";
  if (path === "/empresa") return "Empresa";
  return path;
}

export function EmpresaPage() {
  const {
    data,
    profile,
    company,
    createProfile,
    selectProfile,
    createCompany,
    selectCompany,
    exportCompany,
    importCompany,
  } = useWorkspace();
  const [profileName, setProfileName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) {
    return (
      <>
        <h1>Empresa</h1>
        <p className="lede">
          El espacio local organiza el trabajo por empresa. Primero crea un
          perfil local (solo separación operativa en este navegador, no es
          autenticación segura).
        </p>
        <div className="field">
          <label htmlFor="nuevo-perfil">Nombre del perfil local</label>
          <input
            id="nuevo-perfil"
            className="input"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="p. ej. Consultor interno"
            autoComplete="off"
          />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={profileName.trim() === ""}
            onClick={() => {
              createProfile(profileName);
              setProfileName("");
            }}
          >
            Crear perfil
          </button>
        </div>
        {data.profiles.length > 0 ? (
          <>
            <h2>O entrar con un perfil existente</h2>
            <ul>
              {data.profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => selectProfile(p.id)}
                  >
                    Entrar como {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </>
    );
  }

  if (!company) {
    return (
      <>
        <h1>Empresa</h1>
        <p className="lede">
          Perfil <strong>{profile.name}</strong>. Asocia tu primera empresa
          para comenzar a registrar avance.
        </p>
        <div className="field">
          <label htmlFor="nueva-empresa">Nombre de la empresa</label>
          <input
            id="nueva-empresa"
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="p. ej. Comercial Alfa SpA"
            autoComplete="off"
          />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={companyName.trim() === ""}
            onClick={() => {
              createCompany(companyName);
              setCompanyName("");
            }}
          >
            Crear empresa
          </button>
        </div>
      </>
    );
  }

  const domainOf = (k: string) => getDomainForActivity(k)?.domainKey;
  const currentFromLocation = company.lastLocation?.startsWith("/actividad/")
    ? company.lastLocation.split("/")[2]
    : undefined;
  const suggestion = suggestNextReview(
    ALL_ACTIVITIES,
    domainOf,
    IMPORTED_DOMAINS,
    company,
    currentFromLocation,
  );
  const suggestionDef = suggestion
    ? getCanonicalActivity(suggestion.activityKey)
    : undefined;

  const reviewedTotal = ALL_ACTIVITIES.filter((a) => {
    const s = statusOf(company, a.activity_key);
    return s === "reviewed" || s === "not_applicable";
  }).length;
  const inReviewList = ALL_ACTIVITIES.filter(
    (a) => statusOf(company, a.activity_key) === "in_review",
  );
  const blockedList = ALL_ACTIVITIES.filter(
    (a) => statusOf(company, a.activity_key) === "blocked",
  );

  function downloadExport() {
    const json = exportCompany(company?.id ?? "");
    if (!json || !company) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-${company.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    setImportError(null);
    if (!file) return;
    const text = await file.text();
    const result = importCompany(text);
    if (!result.ok) setImportError(result.error);
  }

  return (
    <>
      <p className="eyebrow">ESPACIO LOCAL · STAGE 1</p>
      <h1>{company.name}</h1>
      <div className="panel muted">
        <div className="field">
          <label htmlFor="cambio-empresa">Empresa activa</label>
          <select
            id="cambio-empresa"
            className="input"
            value={company.id}
            onChange={(e) => selectCompany(e.target.value)}
          >
            {profile.companyIds
              .map((id) => data.companies[id])
              .filter(Boolean)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="nueva-empresa-2">Asociar otra empresa</label>
          <input
            id="nueva-empresa-2"
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nombre de la empresa"
            autoComplete="off"
          />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn secondary small"
            disabled={companyName.trim() === ""}
            onClick={() => {
              createCompany(companyName);
              setCompanyName("");
            }}
          >
            Agregar empresa
          </button>
          <button type="button" className="btn ghost small" onClick={downloadExport}>
            Exportar respaldo JSON
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => fileRef.current?.click()}
          >
            Importar respaldo JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            aria-label="Archivo de respaldo JSON"
            onChange={(e) => {
              void handleImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {importError ? (
          <div className="notice" role="alert">
            <strong>No se pudo importar</strong>
            <p>{importError}</p>
          </div>
        ) : null}
        <p className="result-count">
          Perfil {profile.name} · Espacio local del navegador, sin
          autenticación real.
        </p>
      </div>

      <section className="activity-section" aria-label="Continuar" data-testid="empresa-continuar">
        <h2>Continuar donde quedaste</h2>
        {company.lastLocation ? (
          <p>
            <Link to={company.lastLocation}>{locationLabel(company.lastLocation)}</Link>
          </p>
        ) : (
          <p>Aún no hay recorrido registrado para esta empresa.</p>
        )}
        {suggestion && suggestionDef ? (
          <>
            <h2>Siguiente revisión sugerida</h2>
            <p>
              <Link to={`/actividad/${suggestion.activityKey}`}>
                {suggestionDef.human_code} · {suggestionDef.name}
              </Link>
            </p>
            <p className="result-count">{suggestion.reason}</p>
          </>
        ) : (
          <>
            <h2>Siguiente revisión sugerida</h2>
            <p>No hay pendientes: todo lo importado está revisado.</p>
          </>
        )}
      </section>

      <h2>Dominios</h2>
      <ul className="domain-rows">
        {DOMAINS.map((d) => {
          const activities = d.activity_keys
            .map((k) => getCanonicalActivity(k))
            .filter((a) => a !== undefined);
          const s = summarizeDomain(d.domain_key, activities, company);
          return (
            <li key={d.domain_key}>
              <Link className="domain-row" to={`/trabajo/${d.domain_key}`}>
                <span className="domain-code" aria-hidden="true">
                  {d.human_code}
                </span>
                <span className="activity-row-main">
                  <span className="activity-row-name">{d.name}</span>
                  <span className="activity-row-meta">
                    {s.total === 0 ? (
                      <span>Sin contenido</span>
                    ) : s.isReviewed ? (
                      <span className="work-status reviewed">Revisado</span>
                    ) : (
                      <span>
                        {s.reviewed} de {s.total} revisadas
                      </span>
                    )}
                  </span>
                </span>
                <span className="domain-go" aria-hidden="true">
                  Abrir →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p data-testid="empresa-conteo">
        {reviewedTotal} de {ALL_ACTIVITIES.length} actividades revisadas
      </p>

      {inReviewList.length > 0 ? (
        <>
          <h2>En revisión</h2>
          <ul>
            {inReviewList.map((a) => (
              <li key={a.activity_key}>
                <Link to={`/actividad/${a.activity_key}`}>
                  {a.human_code} · {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {blockedList.length > 0 ? (
        <>
          <h2>Bloqueadas</h2>
          <ul>
            {blockedList.map((a) => (
              <li key={a.activity_key}>
                <Link to={`/actividad/${a.activity_key}`}>
                  {a.human_code} · {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
