import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ECONOMIC_ACTIVITIES, ECONOMIC_ACTIVITY_SOURCE, searchEconomicActivities } from "../src/orientation/catalog/economicActivities";
import { OPTIONS, QUESTION_IDS, TRIAGE_QUESTIONS } from "../src/orientation/catalog/questions";
import { ORIENTATION_STORAGE_KEY } from "../src/orientation/state/types";
import { readTriageAnswers, writeTriageAnswers } from "../src/orientation/state/repository";
import { validateTriageAnswers, validateTriageDocument } from "../src/orientation/state/validation";
import { toggleMultiSelection } from "../src/orientation/ui/selection";
import { TriageForm } from "../src/orientation/ui/TriageForm";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("catálogo y definiciones de orientación", () => {
  it("contiene ocho bloques estables y las alternativas entregadas", () => {
    expect(TRIAGE_QUESTIONS.map((question) => question.id)).toEqual([
      "T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
    ]);
    expect(TRIAGE_QUESTIONS).toHaveLength(8);
    expect(OPTIONS.companySize.map((option) => option.id)).toEqual([
      "micro", "small", "medium", "large", "no_sales", "unknown",
    ]);
    expect(OPTIONS.peopleGroups).toHaveLength(14);
    expect(QUESTION_IDS.groups).toBe("T04_people_groups");
  });

  it("incluye catálogo SII completo, único y con procedencia", () => {
    expect(ECONOMIC_ACTIVITIES).toHaveLength(674);
    expect(new Set(ECONOMIC_ACTIVITIES.map((activity) => activity.code)).size).toBe(674);
    expect(ECONOMIC_ACTIVITIES.every((activity) => /^\d{6}$/.test(activity.code) && activity.description.length > 0)).toBe(true);
    expect(ECONOMIC_ACTIVITY_SOURCE).toEqual({
      url: "https://www.sii.cl/ayudas/ayudas_por_servicios/1956-codigos-1959.html",
      consultedAt: "2026-11-18",
      version: null,
    });
  });

  it("busca por código, texto parcial y descripción sin distinguir tildes", () => {
    expect(searchEconomicActivities("011102").map((activity) => activity.code)).toContain("011102");
    expect(searchEconomicActivities("cultivo de maiz").map((activity) => activity.code)).toContain("011102");
    expect(searchEconomicActivities("MAÍZ", 1)[0].code).toBe("011102");
    expect(searchEconomicActivities("cultivo", 4)).toHaveLength(4);
  });
});

describe("selección múltiple reversible y estados desconocidos", () => {
  it("hace exclusivas las opciones Ninguna/No lo sé sin confundir ausencia con selección", () => {
    expect(toggleMultiSelection([], "unknown", ["none", "unknown"])).toEqual(["unknown"]);
    expect(toggleMultiSelection(["unknown"], "customers", ["none", "unknown"])).toEqual(["customers"]);
    expect(toggleMultiSelection(["customers"], "customers", ["none", "unknown"])).toEqual([]);
    expect(toggleMultiSelection(["customers"], "none", ["none", "unknown"])).toEqual(["none"]);
    expect(validateTriageAnswers({})).toBe(true);
    expect(validateTriageAnswers({ [QUESTION_IDS.groups]: ["unknown"] })).toBe(true);
    expect(validateTriageAnswers({ [QUESTION_IDS.groups]: ["customers", "unknown"] })).toBe(false);
  });

  it("distingue una respuesta sin ventas de una respuesta desconocida", () => {
    expect(validateTriageAnswers({ [QUESTION_IDS.size]: "no_sales" })).toBe(true);
    expect(validateTriageAnswers({ [QUESTION_IDS.size]: "unknown" })).toBe(true);
    expect(validateTriageAnswers({ [QUESTION_IDS.size]: "no" })).toBe(false);
    expect(validateTriageAnswers({})).toBe(true);
  });
});

describe("repositorio local aislado de workspace jurídico", () => {
  const pabloAlfa = { advisorId: "asesor-pablo", companyId: "emp-alfa" };
  const carlosAlfa = { advisorId: "asesor-carlos", companyId: "emp-alfa" };
  const pabloBeta = { advisorId: "asesor-pablo", companyId: "emp-beta" };

  it("aísla respuestas por asesor y empresa", () => {
    expect(writeTriageAnswers(pabloAlfa, { [QUESTION_IDS.size]: "micro" }).ok).toBe(true);
    expect(writeTriageAnswers(carlosAlfa, { [QUESTION_IDS.size]: "large" }).ok).toBe(true);
    expect(writeTriageAnswers(pabloBeta, { [QUESTION_IDS.size]: "unknown" }).ok).toBe(true);
    expect(readTriageAnswers(pabloAlfa)).toEqual({ ok: true, answers: { [QUESTION_IDS.size]: "micro" } });
    expect(readTriageAnswers(carlosAlfa)).toEqual({ ok: true, answers: { [QUESTION_IDS.size]: "large" } });
    expect(readTriageAnswers(pabloBeta)).toEqual({ ok: true, answers: { [QUESTION_IDS.size]: "unknown" } });
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).not.toContain("dporouter.stage1.v1");
  });

  it("conserva datos corruptos o de una versión futura sin sobrescribirlos", () => {
    const future = JSON.stringify({ schemaVersion: 9, entries: { keep: { untouched: true } } });
    localStorage.setItem(ORIENTATION_STORAGE_KEY, future);
    expect(validateTriageDocument(JSON.parse(future)).ok).toBe(false);
    expect(writeTriageAnswers(pabloAlfa, { [QUESTION_IDS.size]: "micro" }).ok).toBe(false);
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).toBe(future);

    localStorage.setItem(ORIENTATION_STORAGE_KEY, "not-json");
    expect(readTriageAnswers(pabloAlfa).ok).toBe(false);
    expect(writeTriageAnswers(pabloAlfa, {}).ok).toBe(false);
    expect(localStorage.getItem(ORIENTATION_STORAGE_KEY)).toBe("not-json");
  });

  it("informa errores de lectura y escritura de localStorage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readTriageAnswers(pabloAlfa).ok).toBe(false);
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(writeTriageAnswers(pabloAlfa, { [QUESTION_IDS.size]: "micro" })).toMatchObject({ ok: false });
  });
});

describe("formulario progresivo y guardado automático", () => {
  it("permite selección excluyente, desmarcado y persiste después de un cambio", async () => {
    const scope = { advisorId: "asesor-ui", companyId: "emp-ui" };
    render(<TriageForm scope={scope} />);
    expect(document.querySelectorAll("details.triage-section")).toHaveLength(8);
    fireEvent.click(screen.getByText("Grupos de personas"));
    const none = screen.getByRole("checkbox", { name: "Ninguno de los anteriores" });
    const customers = screen.getByRole("checkbox", { name: "Clientes o consumidores" });
    fireEvent.click(none);
    expect(none).toBeChecked();
    fireEvent.click(customers);
    expect(none).not.toBeChecked();
    expect(customers).toBeChecked();
    fireEvent.click(customers);
    expect(customers).not.toBeChecked();

    fireEvent.click(screen.getByText("Tamaño de la empresa"));
    fireEvent.click(screen.getByRole("radio", { name: OPTIONS.companySize[0].label }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(ORIENTATION_STORAGE_KEY) ?? "{}").entries).toBeDefined();
    });
    expect(readTriageAnswers(scope)).toMatchObject({ ok: true, answers: { [QUESTION_IDS.size]: "micro" } });
    expect(screen.getByText("Guardado.")).toBeInTheDocument();
  });

  it("usa el combobox por teclado y permite quitar actividad principal", () => {
    render(<TriageForm scope={{ advisorId: "asesor-combo", companyId: "emp-combo" }} />);
    fireEvent.click(screen.getByText("Actividad económica"));
    const combo = screen.getByRole("combobox", { name: "Actividad económica principal" });
    fireEvent.change(combo, { target: { value: "011102" } });
    fireEvent.keyDown(combo, { key: "ArrowDown" });
    fireEvent.keyDown(combo, { key: "Enter" });
    expect(screen.getByText("011102", { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
    expect(screen.queryByText("011102", { exact: false })).not.toBeInTheDocument();
  });

  it("conserva la respuesta en memoria si falla el guardado y permite reintentar", async () => {
    const scope = { advisorId: "asesor-retry", companyId: "emp-retry" };
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    render(<TriageForm scope={scope} />);
    fireEvent.click(screen.getByText("Tamaño de la empresa"));
    const sizeOption = screen.getByRole("radio", { name: OPTIONS.companySize[0].label });
    fireEvent.click(sizeOption);
    await waitFor(() => expect(screen.getByText(/No se pudo guardar/)).toBeInTheDocument());
    expect(sizeOption).toBeChecked();
    setItem.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByText("Guardado.")).toBeInTheDocument());
    expect(readTriageAnswers(scope)).toMatchObject({ ok: true, answers: { [QUESTION_IDS.size]: "micro" } });
  });

  it("restaura respuestas cargadas y mantiene desconocido separado de vacío", async () => {
    const scope = { advisorId: "asesor-restore", companyId: "emp-restore" };
    writeTriageAnswers(scope, { [QUESTION_IDS.size]: "unknown" });
    render(<TriageForm scope={scope} />);
    fireEvent.click(screen.getByText("Tamaño de la empresa"));
    const unknown = screen.getByRole("radio", { name: OPTIONS.companySize.find((option) => option.id === "unknown")!.label });
    expect(unknown).toBeChecked();
    expect(within(document.querySelector("details.triage-section:nth-child(2)")!).getByText("Tamaño de la empresa")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar respuesta" }));
    expect(unknown).not.toBeChecked();
    await waitFor(() => expect(readTriageAnswers(scope)).toMatchObject({ ok: true, answers: {} }));
  });
});
