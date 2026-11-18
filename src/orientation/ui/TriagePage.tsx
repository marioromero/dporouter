import { Link } from "react-router-dom";
import { useWorkspace } from "../../workspace/context";
import { TriageForm } from "./TriageForm";
import "./triage.css";

export function TriagePage() {
  const { data, profile, company, selectCompany } = useWorkspace();
  const companies = profile
    ? profile.companyIds
        .map((id) => data.companies[id])
        .filter((candidate) => candidate !== undefined)
    : [];
  const activeCompany = company ? companies.find((candidate) => candidate.id === company.id) : undefined;
  const activeCompanyIsAvailable = activeCompany !== undefined;

  return (
    <>
      <p className="eyebrow">ORIENTACIÓN · STAGE 1</p>
      <h1>Triage de orientación</h1>
      <p className="lede">
        Caracteriza la empresa para identificar las áreas que conviene revisar. Puedes completar la
        información progresivamente.
      </p>

      {companies.length > 0 && activeCompanyIsAvailable ? (
        <div className="panel muted">
          <div className="field">
            <label htmlFor="triage-empresa">Empresa</label>
            <select
              id="triage-empresa"
              className="input"
              value={activeCompany.id}
              onChange={(event) => selectCompany(event.target.value)}
            >
              {companies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="empty">
          <p>
            {companies.length === 0
              ? "Primero registra una empresa para iniciar el triage."
              : "Selecciona una de tus empresas desde Empresa para continuar."}{" "}
            <Link to="/empresa">Ir a Empresa</Link>
          </p>
        </div>
      )}

      {activeCompanyIsAvailable && profile ? (
        <TriageForm scope={{ advisorId: profile.id, companyId: activeCompany.id }} />
      ) : (
        <section className="activity-section" aria-labelledby="triage-cuestionario">
          <h2 id="triage-cuestionario">Cuestionario de orientación</h2>
          <p>Selecciona una empresa disponible para consultar o registrar respuestas de orientación.</p>
        </section>
      )}

      <div className="actions">
        <Link className="btn secondary" to="/trabajo">
          Ir a Trabajo
        </Link>
      </div>
    </>
  );
}
