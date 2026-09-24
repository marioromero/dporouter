import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { getCanonicalActivity } from "../content/registry";
import { ALL_ACTIVITIES } from "../content/registry";
import { getProtocolForActivity } from "../content/protocols/registry";
import { humanApplicability } from "../src/applicabilityText";
import { WorkspaceProvider } from "../src/workspace/context";
import { GuidanceSessionProvider } from "../src/guidance/session";
import {
  ACTIVITY_WORK_STATUS_LABELS,
  newCompany,
} from "../src/workspace/types";
import {
  STORAGE_KEY,
  loadWorkspace,
  migrateWorkspaceData,
  validateCompanyState,
} from "../src/workspace/store";
import { companyFacts, suggestNextReview, summarizeDomain } from "../src/workspace/suggest";
import {
  blockingConflicts,
  factHasConflict,
  getFactStatus,
  humanSourceName,
  mergedFactRecords,
} from "../src/workspace/facts";
import { ActivityWorkView } from "../src/components/ActivityWorkView";
import { ProtocolOutcomeView } from "../src/components/ProtocolView";
import { DPO_NEED_ASSESSMENT_PROTOCOL as PROTOCOL } from "../content/protocols/dpo.need_assessment";
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

describe("conflictos explícitos entre fuentes", () => {
  const T0 = "2026-01-01T00:00:00.000Z";
  const T1 = "2026-06-01T00:00:00.000Z";
  const T2 = "2026-09-01T00:00:00.000Z";

  function conflictCompany() {
    return companyWith({
      diagnosticFacts: {
        "dpo_assessment.international_transfers": {
          value: "no",
          source: "diagnostico",
          updatedAt: T0,
        },
      },
      protocolAnswers: {
        "dpo.need_assessment.v1": {
          "dpo_assessment.international_transfers": {
            value: "yes",
            source: "dpo.need_assessment.v1",
            updatedAt: T1,
          },
        },
      },
    });
  }

  it("misma fuente + actualización → última observación válida", () => {
    const c = companyWith({
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "no", source: "diagnostico", updatedAt: T0 },
      },
    });
    const c2: CompanyState = {
      ...c,
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "yes", source: "diagnostico", updatedAt: T1 },
      },
    };
    const st = getFactStatus(c2, "mpi.lifecycle_status");
    expect(st.state).toBe("resolved");
    if (st.state === "resolved") expect(st.value).toBe("yes");
  });

  it("fuentes distintas + mismo valor → resolved con ambas", () => {
    const c = companyWith({
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "yes", source: "diagnostico", updatedAt: T0 },
      },
      protocolAnswers: {
        p1: {
          "mpi.lifecycle_status": { value: "yes", source: "p1", updatedAt: T1 },
        },
      },
    });
    const st = getFactStatus(c, "mpi.lifecycle_status");
    expect(st.state).toBe("resolved");
    if (st.state === "resolved") {
      expect(st.value).toBe("yes");
      expect(st.sources).toContain("diagnostico");
      expect(st.sources).toContain("p1");
    }
  });

  it("fuentes distintas + valores distintos → conflict", () => {
    const c = conflictCompany();
    const st = getFactStatus(c, "dpo_assessment.international_transfers");
    expect(st.state).toBe("conflict");
    expect(factHasConflict(c, "dpo_assessment.international_transfers")).toBe(true);
  });

  it("conflict no es unknown ni false", () => {
    const c = conflictCompany();
    const st = getFactStatus(c, "dpo_assessment.international_transfers");
    expect(st.state).not.toBe("unresolved");
    if (st.state === "conflict") {
      expect(st.alternatives.map((r) => r.value).sort()).toEqual(["no", "yes"]);
    }
    // Aunque el último valor sea "no", sigue en conflicto (no resuelto-no).
    const inverted = companyWith({
      diagnosticFacts: {
        "test.f": { value: "yes", source: "diagnostico", updatedAt: T0 },
      },
      protocolAnswers: {
        p1: { "test.f": { value: "no", source: "p1", updatedAt: T1 } },
      },
    });
    expect(getFactStatus(inverted, "test.f").state).toBe("conflict");
  });

  it("fact en conflicto requerido bloquea conclusión definitiva", () => {
    const protocol = getProtocolForActivity("dpo.need_assessment");
    if (!protocol) throw new Error("protocolo ausente");
    expect(blockingConflicts(protocol, conflictCompany())).toContain(
      "dpo_assessment.international_transfers",
    );
    expect(blockingConflicts(protocol, companyWith({}))).toEqual([]);
  });

  it("resolución explícita permite continuar", () => {
    const base = conflictCompany();
    const resolved: CompanyState = {
      ...base,
      factResolutions: {
        "dpo_assessment.international_transfers": {
          factKey: "dpo_assessment.international_transfers",
          value: "yes",
          resolvedAt: T2,
          decidedBy: "professional",
          alternatives: [
            { value: "no", source: "diagnostico", updatedAt: T0 },
            { value: "yes", source: "dpo.need_assessment.v1", updatedAt: T1 },
          ],
        },
      },
    };
    const st = getFactStatus(resolved, "dpo_assessment.international_transfers");
    expect(st.state).toBe("resolved");
    if (st.state === "resolved") {
      expect(st.value).toBe("yes");
      expect(st.sources).toContain("resolucion_profesional");
    }
    const protocol = getProtocolForActivity("dpo.need_assessment");
    if (!protocol) throw new Error("protocolo ausente");
    expect(blockingConflicts(protocol, resolved)).toEqual([]);
  });

  it("nueva contradicción posterior reabre el conflicto", () => {
    const base = conflictCompany();
    const resolved: CompanyState = {
      ...base,
      factResolutions: {
        "dpo_assessment.international_transfers": {
          factKey: "dpo_assessment.international_transfers",
          value: "yes",
          resolvedAt: T1,
          decidedBy: "professional",
          alternatives: [],
        },
      },
      diagnosticFacts: {
        "dpo_assessment.international_transfers": {
          value: "no",
          source: "diagnostico",
          updatedAt: T2,
        },
      },
    };
    expect(
      getFactStatus(resolved, "dpo_assessment.international_transfers").state,
    ).toBe("conflict");
  });

  it("cambiar de empresa aísla conflictos y resoluciones", () => {
    const a = conflictCompany();
    const b = companyWith({});
    expect(factHasConflict(a, "dpo_assessment.international_transfers")).toBe(true);
    expect(factHasConflict(b, "dpo_assessment.international_transfers")).toBe(false);
    expect(getFactStatus(b, "dpo_assessment.international_transfers").state).toBe(
      "unresolved",
    );
  });

  it("export/import conserva resoluciones (validación incluida)", () => {
    const c = conflictCompany();
    const withResolution: CompanyState = {
      ...c,
      factResolutions: {
        "dpo_assessment.international_transfers": {
          factKey: "dpo_assessment.international_transfers",
          value: "no",
          resolvedAt: T2,
          decidedBy: "professional",
          alternatives: [],
        },
      },
    };
    const roundTrip = validateCompanyState(JSON.parse(JSON.stringify(withResolution)));
    expect(roundTrip.ok).toBe(true);
    if (roundTrip.ok) {
      expect(
        getFactStatus(roundTrip.value, "dpo_assessment.international_transfers").state,
      ).toBe("resolved");
    }
    const bad = { ...withResolution, factResolutions: { k: { value: "x" } } };
    expect(validateCompanyState(bad).ok).toBe(false);
  });

  it("fuentes usan nombres humanos, nunca IDs", () => {
    expect(humanSourceName("diagnostico")).toBe("Diagnóstico");
    expect(humanSourceName("resolucion_profesional")).toBe("Resolución del profesional");
    expect(humanSourceName("dpo.need_assessment.v1")).toBe("Evaluación guiada");
    expect(humanSourceName("contexto inicial")).toBe("Contexto inicial");
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
    // Primera actividad canónica sin protocolo: no depende de qué
    // actividades ya tienen guía (el conjunto crece por batch).
    const pending = ALL_ACTIVITIES.find(
      (a) => !getProtocolForActivity(a.activity_key),
    );
    if (!pending) {
      // Cobertura total D1–D6 (20 + 12 + 6 + 9 + 7 + 7 = 61): ninguna
      // actividad sin guía. La rama honesta sigue existiendo.
      expect(ALL_ACTIVITIES).toHaveLength(61);
      for (const a of ALL_ACTIVITIES) {
        expect(getProtocolForActivity(a.activity_key), a.activity_key).toBeTruthy();
      }
      return;
    }
    renderWorkView(pending.activity_key);
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

  it("resultado explicable sin rule_id ni fact_key en UI", () => {
    const outcome = PROTOCOL.outcomes.find((o) => o.outcome_key === "strongly_recommended");
    if (!outcome) throw new Error("outcome ausente");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <GuidanceSessionProvider>
            <ProtocolOutcomeView
              protocol={PROTOCOL}
              activity={{ activityKey: "dpo.need_assessment", humanCode: "D1.02", name: "x" }}
              session={{
                facts: {},
                started: false,
                answer: () => {},
                reset: () => {},
                isProvided: () => false,
                providedSource: () => null,
              }}
              outcome={outcome}
              ruleDescription="Datos de impacto especial y tratamiento a gran escala."
              explanation="Explicación humana."
            />
          </GuidanceSessionProvider>
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Por qué obtuvimos este resultado")).toBeTruthy();
    expect(document.querySelectorAll("code").length).toBe(0);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain("strong-A");
    expect(body).not.toContain("dpo_assessment.");
  });
});

describe("migración de workspace heredado", () => {
  const at = new Date().toISOString();

  function legacyStoredCompany() {
    // Empresa guardada por una versión anterior: sin protocolAnswers,
    // diagnosticFacts, factResolutions ni reasoningRecords.
    return {
      id: "emp-vieja",
      name: "Vieja SpA",
      createdAt: at,
      updatedAt: at,
      activityStates: {},
    };
  }

  function legacyStoredData() {
    return {
      version: 1,
      profiles: [
        {
          id: "p1",
          name: "P",
          createdAt: at,
          companyIds: ["emp-vieja", "emp-fantasma"],
          activeCompanyId: "emp-vieja",
        },
      ],
      activeProfileId: "p1",
      companies: { "emp-vieja": legacyStoredCompany() },
    };
  }

  it("normaliza empresas viejas en lugar de romper lecturas", () => {
    const migrated = migrateWorkspaceData(legacyStoredData());
    expect(migrated.companies["emp-vieja"]).toBeDefined();
    expect(migrated.companies["emp-vieja"].protocolAnswers).toEqual({});
    expect(migrated.companies["emp-vieja"].factResolutions).toEqual({});
    expect(migrated.companies["emp-vieja"].reasoningRecords).toEqual({});
    // Referencia huérfana podada; resto intacto.
    expect(migrated.profiles[0].companyIds).toEqual(["emp-vieja"]);
    expect(migrated.activeProfileId).toBe("p1");
  });

  it("descarta empresas inválidas y repara perfiles huérfanos", () => {
    const migrated = migrateWorkspaceData({
      version: 1,
      profiles: [
        { id: "p1", name: "P", createdAt: at, companyIds: ["x"], activeCompanyId: "x" },
      ],
      activeProfileId: "inexistente",
      companies: { x: { id: "", name: "" } },
    });
    expect(Object.keys(migrated.companies)).toEqual([]);
    expect(migrated.profiles[0].companyIds).toEqual([]);
    expect(migrated.profiles[0].activeCompanyId).toBeUndefined();
    expect(migrated.activeProfileId).toBeUndefined();
  });

  it("loadWorkspace tolera datos heredados corruptos", () => {
    localStorage.clear();
    try {
      expect(loadWorkspace().companies).toEqual({});
      localStorage.setItem(STORAGE_KEY, "no-json{{{");
      expect(loadWorkspace().companies).toEqual({});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyStoredData()));
      const loaded = loadWorkspace();
      expect(loaded.companies["emp-vieja"].diagnosticFacts).toEqual({});
      expect(loaded.companies["emp-vieja"].factResolutions).toEqual({});
      expect(loaded.companies["emp-vieja"].protocolAnswers).toEqual({});
      expect(loaded.companies["emp-vieja"].reasoningRecords).toEqual({});
    } finally {
      localStorage.clear();
    }
  });

  it("la empresa migrada no rompe Empresa (regresión del crash)", () => {
    const migrated = migrateWorkspaceData(legacyStoredData());
    const company = migrated.companies["emp-vieja"];
    // Exactamente la cadena que fallaba: suggestNextReview → blockingConflicts → getFactStatus.
    expect(() => getFactStatus(company, "dpo_assessment.high_impact_data")).not.toThrow();
    const suggestion = suggestNextReview(
      [...D01_ACTIVITIES, ...D02_ACTIVITIES],
      () => "d1",
      ["d1", "d2"],
      company,
    );
    expect(suggestion).not.toBeNull();
    expect(typeof suggestion?.activityKey).toBe("string");
    expect(mergedFactRecords(company)).toEqual({});
  });

  it("poda por entrada: conserva lo válido y descarta solo lo corrupto", () => {
    const migrated = migrateWorkspaceData({
      version: 1,
      profiles: [],
      activeProfileId: undefined,
      companies: {
        "emp-mixta": {
          ...legacyStoredCompany(),
          id: "emp-mixta",
          activityStates: {
            ok: { status: "reviewed", updatedAt: at },
            mala: { status: "cumple", updatedAt: at },
          },
          diagnosticFacts: {
            bueno: { value: "yes", source: "diagnostico", updatedAt: at },
            malo: { value: 42, source: "diagnostico", updatedAt: at },
          },
        },
      },
    });
    const kept = migrated.companies["emp-mixta"];
    expect(kept).toBeDefined();
    expect(Object.keys(kept.activityStates)).toEqual(["ok"]);
    expect(Object.keys(kept.diagnosticFacts)).toEqual(["bueno"]);
    expect(kept.protocolAnswers).toEqual({});
  });

  it("rechaza claves peligrosas y conserva la clave almacenada", () => {
    // "__proto__" como clave propia solo existe vía JSON.parse: en un
    // literal crearía prototipo en vez de clave.
    const raw = JSON.parse(
      `{"version":1,"profiles":[{"id":"p1","name":"P","createdAt":"${at}","companyIds":["toString","k1","__proto__"],"activeCompanyId":"k1"}],"activeProfileId":"p1","companies":{"k1":{"id":"otro-id","name":"K1","createdAt":"${at}","updatedAt":"${at}","activityStates":{}},"__proto__":{"id":"__proto__","name":"X","createdAt":"${at}","updatedAt":"${at}","activityStates":{}}}}`,
    );
    expect(Object.prototype.hasOwnProperty.call(raw.companies, "__proto__")).toBe(true);
    const migrated = migrateWorkspaceData(raw);
    // "toString" no es clave propia: podada. "__proto__" nunca se escribe.
    expect(migrated.profiles[0].companyIds).toEqual(["k1"]);
    expect(Object.prototype.hasOwnProperty.call(migrated.companies, "__proto__")).toBe(false);
    // Sin bifurcación: la clave almacenada manda sobre el id interno.
    expect(migrated.companies["k1"].id).toBe("k1");
    expect(migrated.companies["k1"].name).toBe("K1");
  });

  it("tolera formas adversariales de nivel superior y duplicados", () => {
    for (const bad of [[], null, 42, "x", { version: "1" }, { version: 1 }]) {
      expect(migrateWorkspaceData(bad).companies).toEqual({});
    }
    expect(
      migrateWorkspaceData({ version: 1, profiles: null, companies: [] }).companies,
    ).toEqual({});
    const duped = migrateWorkspaceData({
      version: 1,
      profiles: [
        { id: "p1", name: "A", createdAt: at, companyIds: [] },
        { id: "p1", name: "B", createdAt: at, companyIds: [] },
        null,
        7,
      ],
      activeProfileId: "p1",
      companies: {},
    });
    expect(duped.profiles.map((p) => p.name)).toEqual(["A"]);
    expect(duped.activeProfileId).toBe("p1");
  });
});

describe("aislamiento asesor/empresa con answers nuevos", () => {
  const at = new Date().toISOString();

  function companyWithAnswer(name: string, protocolKey: string, factKey: string, value: string) {
    const c = newCompany(name);
    return {
      ...c,
      protocolAnswers: {
        [protocolKey]: { [factKey]: { value, source: protocolKey, updatedAt: at } },
      },
    };
  }

  function workspaceData() {
    const c1 = companyWithAnswer("E1", "treatment.change_review.v1", "change.date", "2026-09-20");
    const c2 = companyWithAnswer("E2", "treatment.change_review.v1", "change.date", "2026-09-21");
    return {
      version: 1 as const,
      profiles: [
        { id: "p1", name: "Asesor Uno", createdAt: at, companyIds: [c1.id], activeCompanyId: c1.id },
        { id: "p2", name: "Asesor Dos", createdAt: at, companyIds: [c2.id], activeCompanyId: c2.id },
      ],
      activeProfileId: "p1",
      companies: { [c1.id]: c1, [c2.id]: c2 },
    };
  }

  it("dos empresas y dos asesores no cruzan answers text/date", () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceData()));
    const loaded = loadWorkspace();
    const ids = Object.keys(loaded.companies);
    expect(ids).toHaveLength(2);
    const values = ids.map(
      (id) => loaded.companies[id].protocolAnswers["treatment.change_review.v1"]?.["change.date"]?.value,
    );
    expect(values.sort()).toEqual(["2026-09-20", "2026-09-21"]);
    // Perfiles separados con sus empresas (más los asesores fijos
    // garantizados por ensureAdvisorProfiles en la carga real).
    expect(loaded.profiles.map((p) => p.id)).toEqual(
      expect.arrayContaining(["p1", "p2", "asesor-pablo", "asesor-carlos", "asesor-mario"]),
    );
    const p1 = loaded.profiles.find((p) => p.id === "p1")!;
    const p2 = loaded.profiles.find((p) => p.id === "p2")!;
    expect(p1.companyIds).not.toEqual(p2.companyIds);
    localStorage.clear();
  });

  it("export por empresa conserva sus answers; import los restaura", () => {
    const data = workspaceData();
    const c1 = data.companies[data.profiles[0].companyIds[0]];
    const exported = JSON.stringify(c1);
    const checked = validateCompanyState(JSON.parse(exported));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(
      checked.value.protocolAnswers["treatment.change_review.v1"]?.["change.date"]?.value,
    ).toBe("2026-09-20");
    // La otra empresa no viaja en el export de esta.
    expect(exported).not.toContain("2026-09-21");
  });
});
