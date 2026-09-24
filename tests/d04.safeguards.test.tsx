import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AUTOMATED_DECISION_SAFEGUARDS_ENABLE_PROTOCOL as P409 } from "../content/protocols/automated_decision.safeguards_enable";
import { AUTOMATED_DECISION_SCOPE_ASSESS_PROTOCOL as P408 } from "../content/protocols/automated_decision.scope_assess";
import type { FactMap } from "../content/protocols/types";
import {
  getProtocolForActivity,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import {
  applyScopedProcedureFinalization,
  getFinalizableOutcome,
  validateScopedProcedureFinalization,
} from "../src/workspace/finalize";
import { newCompany } from "../src/workspace/types";
import type { CompanyState, ExecutionContext } from "../src/workspace/types";
import { createTreatment } from "../src/workspace/scope";
import {
  addAutomatedUse,
  updateAutomatedUse,
} from "../src/workspace/locals";
import { deriveSessionFacts } from "../src/workspace/derived";
import { validateCompanyState, STORAGE_KEY } from "../src/workspace/store";
import { WorkspaceProvider } from "../src/workspace/context";
import { AutomatedUsesWorkspace } from "../src/components/TreatmentWorkspace";
import { getCanonicalActivity } from "../content/registry";
import { expectedScopeOutcome } from "../src/workspace/automatedScope";

const SCOPE = "automated_decision.scope_status";

function setup(): { company: CompanyState; treatmentId: string; ctx: ExecutionContext } {
  let c = newCompany("Safeguards SpA");
  const t = createTreatment(c, { name: "T" });
  if (!t) throw new Error("sin treatment");
  c = t.company;
  const ctx: ExecutionContext = {
    scope: "treatment",
    companyId: c.id,
    treatmentId: t.treatmentId,
  };
  return { company: c, treatmentId: t.treatmentId, ctx };
}

function mustAdd(c: CompanyState, treatmentId: string, name: string) {
  const r = addAutomatedUse(c, treatmentId, { name });
  if (!r) throw new Error("add falló");
  return r;
}

function cover(
  c: CompanyState,
  treatmentId: string,
  id: string,
  path: "contract_necessary" | "explicit_consent" | "legal_authorization" | "none" | "unknown" = "explicit_consent",
): CompanyState {
  const next = updateAutomatedUse(c, treatmentId, id, {
    article8bisCoverage: "covered",
    legalPath: path,
  });
  if (!next) throw new Error("cover falló");
  return next;
}

const FULL_SG = {
  informationTransparency: "yes",
  explanation: "yes",
  humanIntervention: "yes",
  pointOfView: "yes",
  review: "yes",
} as const;

function safeguard(
  c: CompanyState,
  treatmentId: string,
  id: string,
  sg: Record<string, "yes" | "no" | "unknown">,
): CompanyState {
  const next = updateAutomatedUse(c, treatmentId, id, {
    safeguards: {
      informationTransparency: sg.informationTransparency,
      explanation: sg.explanation,
      humanIntervention: sg.humanIntervention,
      pointOfView: sg.pointOfView,
      review: sg.review,
    },
  });
  if (!next) throw new Error("safeguards falló");
  return next;
}

function staticYes(): FactMap {
  const out: FactMap = {};
  for (const f of P409.decision_fact_keys) out[f] = "yes";
  return out;
}

function sessionFacts(c: CompanyState, ctx: ExecutionContext, over: FactMap = {}): FactMap {
  return { ...deriveSessionFacts(c, ctx), ...over };
}

function mustOutcome(protocol: typeof P409, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") throw new Error(`se esperaba outcome, fue ${e.status}`);
  return e;
}

describe("D4.09 automated_decision.safeguards_enable (checklist, treatment)", () => {
  it("1. registrado con modo, scope, applicability y dependencia canónicos", () => {
    expect(getProtocolForActivity("automated_decision.safeguards_enable")).toBe(P409);
    expect(P409.protocol_key).toBe("automated_decision.safeguards_enable.v1");
    expect(P409.mode).toBe("checklist");
    expect(P409.execution_scope).toBe("treatment");
    expect(
      getCanonicalActivity(P409.activity_key)?.conditions_applicability,
    ).toEqual(["automated_decision.scope_status = covered_use_present"]);
    expect(
      getCanonicalActivity(P409.activity_key)?.activity_dependencies,
    ).toEqual([
      expect.objectContaining({
        target_activity_key: "automated_decision.scope_assess",
        scope: "same_domain",
        type: "completion_dependency",
      }),
    ]);
    expect(getCanonicalActivity(P409.activity_key)?.reasoning_record_required).toBe(false);
  });

  it("2. estructura válida; 6 checks + síntesis con scope y derived", () => {
    expect(validateProtocolStructure(P409)).toEqual([]);
    expect(P409.decision_fact_keys).toHaveLength(6);
    expect(P409.external_fact_keys).toContain(SCOPE);
    expect(P409.external_fact_keys).toContain(
      "derived.treatment.automated_uses_safeguards_enabled",
    );
    expect(P409.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["safeguards_enabled", "remediation_required", "assessment_incomplete", "not_applicable"].sort(),
    );
    // Sin answers por uso: ningún fact contiene IDs.
    const blob = JSON.stringify(P409);
    expect(blob).not.toMatch(/autouse-/);
  });

  it("3. sin D4.08 completado → not_applicable sin effect", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id);
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const e = mustOutcome(P409, {
      ...sessionFacts(company, ctx),
      ...staticYes(),
    });
    expect(e.outcome_key).toBe("not_applicable");
    expect(
      getFinalizableOutcome(P409, "not_applicable")?.canonical_fact_effects,
    ).toBeUndefined();
  });

  it("4. stale legal_path_status no rehabilita D4.09 con scope no_covered", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    // Fact canónico antiguo: scope dice no_covered pero legal_path arrastra valor.
    const facts: FactMap = {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "no_covered_use",
      "automated_decision.legal_path_status": "exception_identified",
    };
    const e = mustOutcome(P409, facts);
    // legal_path_status jamás se consulta: solo scope + colección actual.
    expect(e.outcome_key).toBe("not_applicable");
  });

  it("5. stale scope covered sin usos cubiertos → not_applicable", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id);
    // El uso deja de estar cubierto después de la finalización D4.08.
    const next = updateAutomatedUse(company, treatmentId, r.id, {
      article8bisCoverage: "not_covered",
    });
    if (!next) throw new Error("falló not_covered");
    company = next;
    const e = mustOutcome(P409, {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    });
    expect(e.outcome_key).toBe("not_applicable");
  });

  it("6. solo covered se evalúan; unknown/not_covered excluidos", () => {
    let { company, treatmentId, ctx } = setup();
    const r1 = mustAdd(company, treatmentId, "U1");
    company = r1.company;
    const r2 = mustAdd(company, treatmentId, "U2");
    company = r2.company;
    const r3 = mustAdd(company, treatmentId, "U3");
    company = r3.company;
    company = cover(company, treatmentId, r1.id);
    company = safeguard(company, treatmentId, r1.id, { ...FULL_SG });
    const n2 = updateAutomatedUse(company, treatmentId, r2.id, {
      article8bisCoverage: "not_covered",
    });
    if (!n2) throw new Error("falló U2");
    company = n2;
    // U3 queda unknown: pendiente de D4.08, fuera del ámbito D4.09.
    const e = mustOutcome(P409, {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    });
    expect(e.outcome_key).toBe("safeguards_enabled");
  });

  it("7. cinco yes en todo covered → enabled con effect exacto", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id, "contract_necessary");
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const facts: FactMap = {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    };
    expect(mustOutcome(P409, facts).outcome_key).toBe("safeguards_enabled");
    expect(
      getFinalizableOutcome(P409, "safeguards_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "automated_decision.safeguards_status", value: "enabled" }]);
    const validated = validateScopedProcedureFinalization(
      { protocol: P409, company, facts, outcomeKey: "safeguards_enabled" },
      ctx,
    );
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const once = applyScopedProcedureFinalization(company, P409, ctx, validated.effects);
    expect(once).toBeDefined();
  });

  it("8. un no → remediation; faltante/unknown → incomplete", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id);
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG, review: "no" });
    const base: FactMap = {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    };
    expect(mustOutcome(P409, base).outcome_key).toBe("remediation_required");
    expect(
      getFinalizableOutcome(P409, "remediation_required")?.canonical_fact_effects,
    ).toEqual([
      { fact_key: "automated_decision.safeguards_status", value: "remediation_required" },
    ]);
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG, review: "unknown" });
    const incomplete = mustOutcome(P409, {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    });
    expect(incomplete.outcome_key).toBe("assessment_incomplete");
  });

  it("9. cero covered nunca enabled; vía positiva igual exige safeguards", () => {
    const { company, ctx } = setup();
    const e = mustOutcome(P409, {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    });
    // Sin usos cubiertos actuales: stale, jamás enabled por vacuidad.
    expect(e.outcome_key).toBe("not_applicable");
  });

  it("10. addressed treatment + idempotencia", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id);
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const facts: FactMap = {
      ...sessionFacts(company, ctx),
      ...staticYes(),
      [SCOPE]: "covered_use_present",
    };
    const v1 = validateScopedProcedureFinalization(
      { protocol: P409, company, facts, outcomeKey: "safeguards_enabled" },
      ctx,
    );
    expect(v1.ok).toBe(true);
    if (!v1.ok) return;
    const once = applyScopedProcedureFinalization(company, P409, ctx, v1.effects);
    if (!once) throw new Error("apply falló");
    expect(once.applied).toEqual(["automated_decision.safeguards_status"]);
    const v2 = validateScopedProcedureFinalization(
      { protocol: P409, company: once.company, facts, outcomeKey: "safeguards_enabled" },
      ctx,
    );
    expect(v2.ok).toBe(true);
    if (!v2.ok) return;
    const twice = applyScopedProcedureFinalization(once.company, P409, ctx, v2.effects);
    if (!twice) throw new Error("apply 2 falló");
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["automated_decision.safeguards_status"]);
  });
});

describe("integración D4.08 → D4.09", () => {
  function fullStatic(): FactMap {
    const out: FactMap = {};
    for (const f of P409.decision_fact_keys) out[f] = "yes";
    return out;
  }

  it("A. sin cubiertos: no_covered_use + D4.09 no aplicable", () => {
    let { company, treatmentId, ctx } = setup();
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("no_covered_use");
    const e = evaluateProtocol(P409, {
      ...sessionFacts(company, ctx),
      ...fullStatic(),
      [SCOPE]: "no_covered_use",
    });
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("not_applicable");
  });

  it("B. covered con excepción + safeguards completas → enabled", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id, "explicit_consent");
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("covered_uses_with_legal_path");
    const e = evaluateProtocol(P409, {
      ...sessionFacts(company, ctx),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("safeguards_enabled");
  });

  it("C. covered sin vía: remediación jurídica; safeguards revisables sin curarla", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id, "none");
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("covered_use_without_legal_path");
    // D4.09 puede habilitar safeguards aunque falte vía: no la cura.
    const e = evaluateProtocol(P409, {
      ...sessionFacts(company, ctx),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("safeguards_enabled");
  });

  it("D. múltiples usos: U1 covered, U2 not_covered, U3 covered → D4.09 solo U1/U3", () => {
    let { company, treatmentId, ctx } = setup();
    const r1 = mustAdd(company, treatmentId, "U1");
    company = r1.company;
    const r2 = mustAdd(company, treatmentId, "U2");
    company = r2.company;
    const r3 = mustAdd(company, treatmentId, "U3");
    company = r3.company;
    company = cover(company, treatmentId, r1.id, "contract_necessary");
    const n2 = updateAutomatedUse(company, treatmentId, r2.id, {
      article8bisCoverage: "not_covered",
    });
    if (!n2) throw new Error("falló U2");
    company = n2;
    company = cover(company, treatmentId, r3.id, "legal_authorization");
    company = safeguard(company, treatmentId, r1.id, { ...FULL_SG });
    company = safeguard(company, treatmentId, r3.id, { ...FULL_SG });
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(uses).toHaveLength(3);
    const e = evaluateProtocol(P409, {
      ...sessionFacts(company, ctx),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("safeguards_enabled");
  });

  it("E. U1 completo + U3 con un no → remediación agregada", () => {
    let { company, treatmentId, ctx } = setup();
    const r1 = mustAdd(company, treatmentId, "U1");
    company = r1.company;
    const r3 = mustAdd(company, treatmentId, "U3");
    company = r3.company;
    company = cover(company, treatmentId, r1.id);
    company = cover(company, treatmentId, r3.id);
    company = safeguard(company, treatmentId, r1.id, { ...FULL_SG });
    company = safeguard(company, treatmentId, r3.id, { ...FULL_SG, humanIntervention: "no" });
    const e = evaluateProtocol(P409, {
      ...sessionFacts(company, ctx),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("remediation_required");
  });

  it("F. aislamiento cross-treatment con mismo ID local", () => {
    let c = newCompany("Aislada SpA");
    const ta = createTreatment(c, { name: "A" });
    if (!ta) throw new Error("sin A");
    c = ta.company;
    const tb = createTreatment(c, { name: "B" });
    if (!tb) throw new Error("sin B");
    c = tb.company;
    const ra = mustAdd(c, ta.treatmentId, "Scoring");
    c = ra.company;
    c = cover(c, ta.treatmentId, ra.id);
    c = safeguard(c, ta.treatmentId, ra.id, { ...FULL_SG });
    // Mismo ID local permitido en B con estado diferente: forzar
    // colisión nominal es imposible vía API (IDs por colección).
    const rb = mustAdd(c, tb.treatmentId, "Scoring");
    c = rb.company;
    expect(ra.id === rb.id).toBe(false);
    // B con uso cubierto propio pero sin safeguards: incompleto por
    // estado propio, sin contaminar ni heredar nada de A.
    c = cover(c, tb.treatmentId, rb.id);
    const ctxA: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: ta.treatmentId };
    const ctxB: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: tb.treatmentId };
    const eA = evaluateProtocol(P409, {
      ...sessionFacts(c, ctxA),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (eA.status !== "outcome") throw new Error(`A fue ${eA.status}`);
    expect(eA.outcome_key).toBe("safeguards_enabled");
    const eB = evaluateProtocol(P409, {
      ...sessionFacts(c, ctxB),
      ...fullStatic(),
      [SCOPE]: "covered_use_present",
    });
    if (eB.status !== "outcome") throw new Error(`B fue ${eB.status}`);
    expect(eB.outcome_key).toBe("assessment_incomplete");
  });

  it("G. round-trip con record D4.08 + effects + safeguards", () => {
    let { company, treatmentId } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = cover(company, treatmentId, r.id, "legal_authorization");
    company = safeguard(company, treatmentId, r.id, { ...FULL_SG });
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    const record = {
      protocolKey: P408.protocol_key,
      activityKey: P408.activity_key,
      conclusion: "covered_uses_with_legal_path",
      legal_question: "q",
      facts_considered: ["automated_scope.inventory_reviewed", `automated_use:${r.id}`],
      legal_factors: [],
      evidence_refs: ["matriz"],
      alternatives_considered: [],
      rationale: "r",
      decided_by: "p",
      reviewed_by: "",
      decided_at: "2026-09-24",
      legal_basis: [],
      updatedAt: "2026-09-24T00:00:00.000Z",
    };
    const withState: CompanyState = {
      ...company,
      treatments: {
        ...company.treatments,
        [treatmentId]: {
          ...company.treatments?.[treatmentId],
          protocolAnswers: {
            "automated_decision.scope_assess.v1": {
              "automated_decision.scope_status": {
                value: "covered_use_present",
                source: "automated_decision.scope_assess.v1",
                updatedAt: "2026-09-24T00:00:00.000Z",
              },
              "automated_decision.legal_path_status": {
                value: "exception_identified",
                source: "automated_decision.scope_assess.v1",
                updatedAt: "2026-09-24T00:00:00.000Z",
              },
            },
          },
          reasoningRecords: { [P408.protocol_key]: record },
        },
      },
    } as CompanyState;
    const v = validateCompanyState(JSON.parse(JSON.stringify(withState)));
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const back = v.value;
    expect(back.treatments?.[treatmentId]?.automatedUses).toHaveLength(1);
    expect(
      back.treatments?.[treatmentId]?.reasoningRecords?.[P408.protocol_key]?.facts_considered,
    ).toContain(`automated_use:${r.id}`);
    expect(
      back.treatments?.[treatmentId]?.protocolAnswers?.["automated_decision.scope_assess.v1"]?.[
        "automated_decision.scope_status"
      ]?.value,
    ).toBe("covered_use_present");
    // Sin derived persistidos; el agregado D4.08 es el esperado.
    expect(JSON.stringify(back)).not.toContain("derived.treatment.automated_uses_");
    expect(expectedScopeOutcome(uses, true)).toBe("covered_uses_with_legal_path");
  });
});

describe("AutomatedUsesWorkspace (UI colección)", () => {
  function seed(): { company: CompanyState; treatmentId: string } {
    let c = newCompany("UI SpA");
    const t = createTreatment(c, { name: "T" });
    if (!t) throw new Error("sin treatment");
    return { company: t.company, treatmentId: t.treatmentId };
  }

  function renderUses(company: CompanyState, treatmentId: string) {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p",
            name: "P",
            createdAt: "2026-09-24T00:00:00.000Z",
            companyIds: [company.id],
            activeCompanyId: company.id,
          },
        ],
        activeProfileId: "p",
        companies: { [company.id]: company },
      }),
    );
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <AutomatedUsesWorkspace treatmentId={treatmentId} />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
  }

  it("H. listar, agregar, editar cobertura y eliminar en el treatment direccionado", () => {
    const { company, treatmentId } = seed();
    renderUses(company, treatmentId);
    expect(screen.getByText("No hay usos automatizados registrados.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Nombre del uso"), {
      target: { value: "Scoring" },
    });
    fireEvent.click(screen.getByText("Agregar uso"));
    expect(screen.getByText("Scoring")).toBeTruthy();
    // Editar cobertura a comprendido.
    fireEvent.click(screen.getByLabelText("Editar uso Scoring"));
    const coverage = screen.getByLabelText("Cobertura art. 8 bis") as HTMLSelectElement;
    fireEvent.change(coverage, { target: { value: "covered" } });
    const path = screen.getByLabelText("Vía legal") as HTMLSelectElement;
    fireEvent.change(path, { target: { value: "explicit_consent" } });
    fireEvent.click(screen.getByText("Guardar uso"));
    expect(document.body.textContent).toContain("Comprendido (art. 8 bis)");
    // Eliminar.
    fireEvent.click(screen.getByLabelText("Eliminar uso Scoring"));
    expect(screen.queryByText("Scoring")).toBeNull();
    localStorage.clear();
  });

  it("I. unknown ≠ not_covered y salvaguardas solo en covered", () => {
    const { company, treatmentId } = seed();
    renderUses(company, treatmentId);
    fireEvent.change(screen.getByLabelText("Nombre del uso"), {
      target: { value: "Perfilado" },
    });
    fireEvent.click(screen.getByText("Agregar uso"));
    expect(document.body.textContent).toContain("Cobertura pendiente");
    fireEvent.click(screen.getByLabelText("Editar uso Perfilado"));
    // Sin salvaguardas visibles fuera de covered.
    expect(screen.queryByText(/Salvaguardas del uso/)).toBeNull();
    const coverage = screen.getByLabelText("Cobertura art. 8 bis") as HTMLSelectElement;
    fireEvent.change(coverage, { target: { value: "covered" } });
    expect(screen.getByText(/Salvaguardas del uso/)).toBeTruthy();
    localStorage.clear();
  });
});
