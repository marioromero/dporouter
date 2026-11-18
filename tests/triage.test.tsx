import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "../src/App";
import { newCompany } from "../src/workspace/types";
import { STORAGE_KEY } from "../src/workspace/store";
import { QUESTION_IDS, OPTIONS } from "../src/orientation/catalog/questions";
import { readTriageAnswers, writeTriageAnswers } from "../src/orientation/state/repository";
import { updateTriageSession } from "../src/orientation/state/session";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function seedWorkspace(options: { activeProfile?: boolean; activeCompany?: string | null } = {}) {
  const own = newCompany("Empresa propia", "asesor-pablo");
  const ownOther = newCompany("Otra empresa propia", "asesor-pablo");
  const otherAdvisorCompany = newCompany("Empresa de otro asesor", "asesor-carlos");
  const activeCompany = options.activeCompany === null ? undefined : options.activeCompany ?? own.id;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profiles: [
        {
          id: "asesor-pablo",
          name: "Pablo",
          username: "pablo",
          createdAt: own.createdAt,
          companyIds: [own.id, "empresa-inexistente", ownOther.id],
          ...(activeCompany ? { activeCompanyId: activeCompany } : {}),
        },
        {
          id: "asesor-carlos",
          name: "Carlos",
          username: "carlos",
          createdAt: otherAdvisorCompany.createdAt,
          companyIds: [otherAdvisorCompany.id],
          activeCompanyId: otherAdvisorCompany.id,
        },
      ],
      activeProfileId: options.activeProfile === false ? undefined : "asesor-pablo",
      companies: {
        [own.id]: own,
        [ownOther.id]: ownOther,
        [otherAdvisorCompany.id]: otherAdvisorCompany,
      },
    }),
  );
  return { own, ownOther, otherAdvisorCompany };
}

function renderApp(path = "/triage") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("integración del triage", () => {
  it("ubica Triage entre Empresa y Trabajo y muestra su ruta y breadcrumb", () => {
    seedWorkspace();
    renderApp();
    const nav = screen.getByRole("navigation", { name: "Áreas principales" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "EMEmpresa",
      "TGTriage",
      "TRTrabajo",
      "DGDiagnóstico",
      "BUBuscar",
      "GLGlosario",
      "RFReferencias",
    ]);
    expect(links[1]).toHaveAttribute("href", "/triage");
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent("Triage");
    expect(screen.getByRole("heading", { name: "Triage de orientación" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cuestionario de orientación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Trabajo" })).toHaveAttribute("href", "/trabajo");
  });

  it("selecciona la empresa activa, limita opciones al asesor y delega el cambio al workspace", () => {
    const { own, ownOther, otherAdvisorCompany } = seedWorkspace();
    renderApp();
    const select = screen.getByRole("combobox", { name: "Empresa" });
    expect(select).toHaveValue(own.id);
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual([
      own.name,
      ownOther.name,
    ]);
    expect(select).not.toHaveTextContent(otherAdvisorCompany.name);

    fireEvent.change(select, { target: { value: ownOther.id } });
    expect(select).toHaveValue(ownOther.id);
    expect(screen.getByTitle("Empresa activa")).toHaveTextContent(ownOther.name);
  });

  it("carga y conserva las respuestas correctas al cambiar de empresa y regresar", () => {
    const { own, ownOther } = seedWorkspace();
    writeTriageAnswers({ advisorId: "asesor-pablo", companyId: own.id }, { [QUESTION_IDS.size]: "micro" });
    writeTriageAnswers({ advisorId: "asesor-pablo", companyId: ownOther.id }, { [QUESTION_IDS.size]: "large" });
    renderApp();
    fireEvent.click(screen.getByText("Tamaño de la empresa"));
    const micro = screen.getByRole("radio", { name: OPTIONS.companySize[0].label });
    const large = screen.getByRole("radio", { name: OPTIONS.companySize[3].label });
    expect(micro).toBeChecked();

    fireEvent.change(screen.getByRole("combobox", { name: "Empresa" }), { target: { value: ownOther.id } });
    expect(large).toBeChecked();
    expect(micro).not.toBeChecked();

    fireEvent.change(screen.getByRole("combobox", { name: "Empresa" }), { target: { value: own.id } });
    expect(micro).toBeChecked();
  });

  it("conserva los gates existentes sin sesión y sin empresa", () => {
    seedWorkspace({ activeProfile: false });
    const { unmount } = renderApp();
    expect(screen.getByRole("heading", { name: "Se requiere sesión" })).toBeInTheDocument();
    unmount();

    localStorage.clear();
    seedWorkspace({ activeCompany: null });
    renderApp();
    expect(screen.getByRole("heading", { name: "Selecciona una empresa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a mis empresas" })).toHaveAttribute("href", "/empresa");
  });

  it("mantiene intacta la ruta Diagnóstico y su estado activo", () => {
    seedWorkspace();
    renderApp("/diagnostico");
    expect(screen.getByRole("heading", { name: "Diagnóstico" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Áreas principales" });
    expect(within(nav).getByRole("link", { name: /Diagnóstico/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: /Triage/ })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("muestra el indicador en línea en Trabajo sin mezclar los estados operativos", () => {
    const { own } = seedWorkspace();
    writeTriageAnswers(
      { advisorId: "asesor-pablo", companyId: own.id },
      { [QUESTION_IDS.scopeDiversity]: "several" },
    );
    renderApp("/trabajo");
    const workList = screen.getByTestId("trabajo-lista");
    const d2 = within(workList).getByRole("link", { name: /Inventario, licitud y ciclo de vida/ });
    expect(d2).toHaveAttribute("href", "/trabajo/d2");

    const row = d2.closest("li");
    if (!row) throw new Error("fila de dominio ausente");
    const domainMain = d2.querySelector(".activity-row-main");
    const progress = domainMain?.querySelector(".activity-row-meta");
    const domainBadge = domainMain?.querySelector(".orientation-indicator-badge");
    expect(domainBadge).toHaveClass("orientation-indicator-badge--amber");
    expect(progress?.nextElementSibling).toBe(domainBadge);
    expect(within(row).getByText("Revisión sugerida")).toBeInTheDocument();
    expect(row.children).toHaveLength(1);
    expect(within(row).queryByText("Motivo")).not.toBeInTheDocument();
    expect(within(row).queryByText("Orientación de Triage")).not.toBeInTheDocument();
    expect(within(workList).getByRole("link", { name: /D1/ })).toHaveAttribute("href", "/trabajo/d1");

    fireEvent.click(screen.getByRole("button", { name: "Resumen" }));
    const summaryDomainLink = within(screen.getByTestId("trabajo-resumen")).getByRole("link", { name: /Inventario, licitud y ciclo de vida/ });
    const summaryCell = summaryDomainLink.closest("td")?.querySelector(".orientation-domain-cell");
    expect(summaryCell?.firstElementChild).toBe(summaryDomainLink);
    expect(summaryCell?.children[1]).toHaveClass("orientation-indicator-badge--amber");
    expect(summaryCell?.children).toHaveLength(2);
    expect(summaryCell).toHaveClass("orientation-domain-cell");
  });

  it("recalcula al editar triage y retira solo la señal que dejó de estar respaldada", async () => {
    const { own } = seedWorkspace();
    renderApp("/trabajo");
    const workList = screen.getByTestId("trabajo-lista");
    const d1 = within(workList).getByRole("link", { name: /Gobernanza, accountability/ });
    const d1Row = d1.closest("li");
    if (!d1Row) throw new Error("fila de dominio ausente");
    expect(within(d1Row).getByText("Sin señal específica")).toBeInTheDocument();

    const scope = { advisorId: "asesor-pablo", companyId: own.id };
    act(() => updateTriageSession(scope, (answers) => ({ ...answers, [QUESTION_IDS.scopeDiversity]: "many" })));
    await waitFor(() => expect(within(d1Row).getByText("Revisión sugerida")).toBeInTheDocument());

    act(() => updateTriageSession(scope, (answers) => {
      const next = { ...answers };
      delete next[QUESTION_IDS.scopeDiversity];
      return next;
    }));
    await waitFor(() => expect(within(d1Row).getByText("Sin señal específica")).toBeInTheDocument());
    expect(readTriageAnswers(scope)).toMatchObject({ ok: true, answers: {} });
  });

  it("muestra el indicador en la fila de actividad sin disclosures de motivos", () => {
    const { own } = seedWorkspace();
    writeTriageAnswers(
      { advisorId: "asesor-pablo", companyId: own.id },
      { [QUESTION_IDS.characteristics]: ["automated_decisions"] },
    );
    renderApp("/trabajo/d4");
    const row = screen.getByRole("link", { name: /Evaluar el alcance de decisiones automatizadas/ }).closest("li");
    if (!row) throw new Error("fila de actividad ausente");
    expect(within(row).getByText("Revisión sugerida")).toBeInTheDocument();
    const activityLink = within(row).getByRole("link", { name: /Evaluar el alcance de decisiones automatizadas/ });
    const activityMain = activityLink.querySelector(".activity-row-main");
    const activityMeta = activityMain?.querySelector(".activity-row-meta");
    const activityBadge = activityMain?.querySelector(".orientation-indicator-badge");
    expect(activityBadge).toHaveClass("orientation-indicator-badge--amber");
    expect(activityMeta?.nextElementSibling).toBe(activityBadge);
    expect(row.children).toHaveLength(1);
    expect(within(row).queryByText("Motivo")).not.toBeInTheDocument();
    expect(within(row).queryByText("Orientación de Triage")).not.toBeInTheDocument();
  });

  it("aísla los indicadores de triage por asesor aunque compartan empresa", () => {
    const { own } = seedWorkspace();
    writeTriageAnswers(
      { advisorId: "asesor-pablo", companyId: own.id },
      { [QUESTION_IDS.scopeDiversity]: "several" },
    );
    writeTriageAnswers(
      { advisorId: "asesor-carlos", companyId: own.id },
      { [QUESTION_IDS.groups]: ["workers"] },
    );

    const workspace = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const carlos = workspace.profiles.find((item: { id: string }) => item.id === "asesor-carlos");
    carlos.companyIds.push(own.id);
    carlos.activeCompanyId = own.id;
    workspace.activeProfileId = "asesor-pablo";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));

    const first = renderApp("/trabajo");
    const workList = screen.getByTestId("trabajo-lista");
    const d1 = within(workList).getByRole("link", { name: /Gobernanza, accountability/ });
    const d1Row = d1.closest("li");
    if (!d1Row) throw new Error("fila de dominio ausente");
    expect(within(d1Row).getByText("Revisión sugerida")).toBeInTheDocument();
    first.unmount();

    workspace.activeProfileId = "asesor-carlos";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    renderApp("/trabajo");
    const carlosD1 = within(screen.getByTestId("trabajo-lista")).getByRole("link", { name: /Gobernanza, accountability/ });
    expect(within(carlosD1.closest("li")!).getByText("Sin señal específica")).toBeInTheDocument();
  });

  it("recalcula las señales al cambiar la empresa activa", () => {
    const { own, ownOther } = seedWorkspace();
    writeTriageAnswers(
      { advisorId: "asesor-pablo", companyId: own.id },
      { [QUESTION_IDS.scopeDiversity]: "several" },
    );
    renderApp("/trabajo");
    const findD1 = () => within(screen.getByTestId("trabajo-lista")).getByRole("link", { name: /Gobernanza, accountability/ });
    expect(within(findD1().closest("li")!).getByText("Revisión sugerida")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Empresa" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Empresa activa" }), { target: { value: ownOther.id } });
    fireEvent.click(screen.getByRole("link", { name: "Trabajo" }));
    expect(within(findD1().closest("li")!).getByText("Sin señal específica")).toBeInTheDocument();
  });

  it("mantiene selección y estado Revisado junto a la franja de orientación del ContextNav", () => {
    const { own } = seedWorkspace();
    writeTriageAnswers(
      { advisorId: "asesor-pablo", companyId: own.id },
      { [QUESTION_IDS.scopeDiversity]: "many" },
    );
    const workspace = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    workspace.companies[own.id].activityStates = {
      "dpo.need_assessment": { status: "reviewed", updatedAt: new Date().toISOString() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));

    const domainView = renderApp("/trabajo/d1");
    const domainNav = screen.getByTestId("contextnav-domains");
    const activityNav = screen.getByTestId("contextnav-activities");
    const selectedDomain = domainNav.querySelector<HTMLAnchorElement>('a[href="/trabajo/d1"]');
    const otherDomain = domainNav.querySelector<HTMLAnchorElement>('a[href="/trabajo/d2"]');
    const reviewedActivity = activityNav.querySelector<HTMLAnchorElement>('a[href="/actividad/dpo.need_assessment"]');
    const unmarkedActivity = activityNav.querySelector<HTMLAnchorElement>('a[href="/actividad/governance.preventive_framework"]');

    expect(selectedDomain).toHaveAttribute("aria-current", "page");
    expect(selectedDomain).toHaveClass("ctx", "current", "orientation-nav-level--amber");
    expect(otherDomain).toHaveClass("orientation-nav-level--amber");
    expect(reviewedActivity).toHaveClass("ctx", "done", "orientation-nav-level--amber");
    expect(reviewedActivity).not.toHaveAttribute("aria-current", "page");
    expect(unmarkedActivity).toHaveClass("orientation-nav-level--gray");
    expect(activityNav).toHaveClass("contextnav-row", "scroll");
    expect(domainNav.querySelectorAll("a")).toHaveLength(12);

    expect(reviewedActivity?.querySelector(".orientation-nav-visually-hidden")).toHaveTextContent(
      "Orientación: Revisión sugerida",
    );

    domainView.unmount();
    renderApp("/actividad/dpo.need_assessment");
    const activeReviewed = screen.getByTestId("contextnav-activities").querySelector<HTMLAnchorElement>(
      'a[href="/actividad/dpo.need_assessment"]',
    );
    expect(activeReviewed).toHaveAttribute("aria-current", "page");
    expect(activeReviewed).toHaveClass("ctx", "current", "done", "orientation-nav-level--amber");
  });
});
