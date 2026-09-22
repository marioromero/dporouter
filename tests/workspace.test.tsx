import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { getCanonicalActivity } from "../content/registry";
import { getProtocolForActivity } from "../content/protocols/registry";
import { humanApplicability } from "../src/applicabilityText";
import { WorkspaceProvider } from "../src/workspace/context";
import { GuidanceSessionProvider } from "../src/guidance/session";
import {
  ACTIVITY_WORK_STATUS_LABELS,
  newCompany,
} from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";
import { companyFacts, suggestNextReview, summarizeDomain } from "../src/workspace/suggest";
import { factHasConflict, mergedFactRecords } from "../src/workspace/facts";
import { ActivityWorkView } from "../src/components/ActivityWorkView";
import type { CompanyState } from "../src/workspace/types";

function companyWith(over: Partial<CompanyState>): CompanyState {
  return { ...newCompany("Test SpA"), ...over };
}

describe("workspace local Stage 1", () => {
  it("valida respaldo antes de importar", () => {
    expect(validateCompanyState(newCompany("Alfa")).ok).toBe(true);
    expect(validateCompanyState({}).ok).toBe(false);
    expect(validateCompanyState({ id: "x", name: "  " }).ok).toBe(false);
    const bad = newCompany("Alfa");
    (bad.activityStates as Record<string, unknown>)["k"] = {
      status: "cumple",
      updatedAt: new Date().toISOString(),
    };
    const checked = validateCompanyState(bad);
    expect(checked.ok).toBe(false);
  });

  it("estados de trabajo usan exactamente los labels aprobados", () => {
    expect(ACTIVITY_WORK_STATUS_LABELS).toEqual({
      not_started: "No iniciado",
      in_review: "En revisión",
      reviewed: "Revisado",
      not_applicable: "No aplica",
      blocked: "Bloqueado",
    });
    expect(Object.values(ACTIVITY_WORK_STATUS_LABELS)).not.toContain("Cumple");
  });

  it("dominio Revisado solo con todo revisado/no-aplica y nada bloqueado", () => {
    const d1 = D01_ACTIVITIES;
    const reviewed = companyWith({
      activityStates: Object.fromEntries(
        d1.map((a) => [
          a.activity_key,
          { status: "reviewed" as const, updatedAt: new Date().toISOString() },
        ]),
      ),
    });
    expect(summarizeDomain("d1", d1, reviewed).isReviewed).toBe(true);
    const blocked = companyWith({
      activityStates: {
        [d1[0].activity_key]: { status: "blocked", updatedAt: new Date().toISOString() },
      },
    });
    const s = summarizeDomain("d1", d1, blocked);
    expect(s.isReviewed).toBe(false);
    expect(s.blocked).toBe(1);
    expect(summarizeDomain("d1", d1, null).isReviewed).toBe(false);
    expect(summarizeDomain("d8", [], null).isReviewed).toBe(false);
  });

  it("sugerencia prioriza en-revisión y luego next action de protocolo", () => {
    const at = new Date().toISOString();
    const inReview = companyWith({
      activityStates: {
        "treatment.inventory_create": { status: "in_review", updatedAt: at },
      },
    });
    const domainOf = (k: string) =>
      k.startsWith("treatment.") || k.startsWith("lawful") || k.startsWith("legitimate")
        ? "d2"
        : "d1";
    const all = [...D01_ACTIVITIES, ...D02_ACTIVITIES];
    const first = suggestNextReview(all, domainOf, ["d1", "d2"], inReview);
    expect(first?.activityKey).toBe("treatment.inventory_create");

    const mpiActive = companyWith({
      protocolAnswers: {
        "dpo.need_assessment.v1": {
          "mpi.lifecycle_status": {
            value: "implementing",
            source: "dpo.need_assessment.v1",
            updatedAt: at,
          },
        },
      },
    });
    const second = suggestNextReview(all, domainOf, ["d1", "d2"], mpiActive);
    expect(second?.activityKey).toBe("dpo.designate");
    expect(second?.reason).toContain("DPO requerido por MPI");
  });

  it("facts de empresa mezclan diagnóstico y guías sin perder origen", () => {
    const at = new Date().toISOString();
    const c = companyWith({
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "not_adopted", source: "diagnostico", updatedAt: at },
      },
      protocolAnswers: {
        p1: {
          "test.f": { value: "yes", source: "p1", updatedAt: at },
        },
      },
    });
    expect(companyFacts(c)).toEqual({
      "mpi.lifecycle_status": "not_adopted",
      "test.f": "yes",
    });
    expect(c.diagnosticFacts["mpi.lifecycle_status"].source).toBe("diagnostico");
  });

  it("conflicto entre orígenes: gana el más reciente y queda visible", () => {
    const c = companyWith({
      diagnosticFacts: {
        "mpi.lifecycle_status": {
          value: "not_adopted",
          source: "diagnostico",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      protocolAnswers: {
        p1: {
          "mpi.lifecycle_status": {
            value: "implementing",
            source: "p1",
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        },
      },
    });
    expect(factHasConflict(c, "mpi.lifecycle_status")).toBe(true);
    expect(factHasConflict(c, "otro.f")).toBe(false);
    const merged = mergedFactRecords(c);
    expect(merged["mpi.lifecycle_status"].value).toBe("implementing");
    expect(merged["mpi.lifecycle_status"].source).toBe("p1");
    expect(companyFacts(c)["mpi.lifecycle_status"]).toBe("implementing");
    // Sin conflicto no hay marca.
    expect(factHasConflict(companyWith({}), "mpi.lifecycle_status")).toBe(false);
  });

  it("contexto inyectado excluye respuestas propias del protocolo", () => {
    const at = new Date().toISOString();
    const c = companyWith({
      diagnosticFacts: {
        "test.shared": { value: "no", source: "diagnostico", updatedAt: at },
      },
      protocolAnswers: {
        own: {
          "test.shared": { value: "yes", source: "own", updatedAt: at },
        },
      },
    });
    const injected = mergedFactRecords(c, "own");
    expect(injected["test.shared"].value).toBe("no");
    expect(injected["test.shared"].source).toBe("diagnostico");
  });
});

describe("aplicabilidad en lenguaje humano", () => {
  it("todas las condiciones D1-D2 tienen traducción fiable", () => {
    const all = [...D01_ACTIVITIES, ...D02_ACTIVITIES];
    const conditions = new Set<string>();
    for (const a of all) {
      for (const c of a.conditions_applicability) conditions.add(c);
    }
    expect(conditions.size).toBeGreaterThan(0);
    for (const c of conditions) {
      expect(humanApplicability([c]), c).toHaveLength(1);
      expect(humanApplicability([c])[0]).not.toMatch(/[=|]/);
    }
  });

  it("condición sin traducción se omite, no se muestra cruda", () => {
    expect(humanApplicability(["alguna_expresion_futura == x"])).toEqual([]);
  });
});

function renderWorkView(activityKey: string) {
  const def = getCanonicalActivity(activityKey);
  if (!def) throw new Error("actividad ausente");
  const protocol = getProtocolForActivity(activityKey);
  render(
    <MemoryRouter>
      <WorkspaceProvider>
        <GuidanceSessionProvider>
          <ActivityWorkView def={def} protocol={protocol} />
        </GuidanceSessionProvider>
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

describe("Activity View V2", () => {
  it("D1.02 muestra guía y oculta metadata técnica", () => {
    renderWorkView("dpo.need_assessment");
    expect(screen.getByTestId("actividad-accion")).toBeTruthy();
    // Vista normal: secciones visibles, sin el <details> de auditoría.
    const visible = [...document.querySelectorAll("section")]
      .filter((s) => s.tagName !== "DETAILS")
      .map((s) => s.textContent ?? "")
      .join(" ");
    for (const token of [
      "client.roles_present",
      "Trazabilidad técnica",
      "Vigencia diferida",
      "Cumple",
      "semantic key",
      "applicable roles",
      "agency_standard",
      "transitional",
      "execution_prerequisite",
    ]) {
      expect(visible, token).not.toContain(token);
    }
    expect(visible).toContain("Criterio interno recomendado");
    expect(screen.getByRole("link", { name: "Iniciar evaluación" })).toBeTruthy();
  });

  it("sin protocolo muestra pendiente honesto y sin fingir", () => {
    renderWorkView("governance.preventive_framework");
    expect(screen.getByText("Guía operativa pendiente de incorporar")).toBeTruthy();
    const body = document.body.textContent ?? "";
    expect(body).not.toContain("Iniciar evaluación");
  });

  it("auditoría queda colapsada fuera del flujo normal", () => {
    renderWorkView("dpo.need_assessment");
    const details = screen.getByTestId("auditoria-detalle");
    expect((details as HTMLDetailsElement).open).toBe(false);
    // Ni siquiera en el DOM hasta expandir: nada técnico por defecto.
    expect(details.textContent ?? "").not.toContain("client.roles_present");
  });
});
