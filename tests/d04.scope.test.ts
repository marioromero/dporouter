import { describe, expect, it } from "vitest";
import { AUTOMATED_DECISION_SCOPE_ASSESS_PROTOCOL as P408 } from "../content/protocols/automated_decision.scope_assess";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import {
  getProtocolForActivity,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import {
  finalizeJudgment,
  getRecordedJudgment,
} from "../src/workspace/reasoning";
import { deriveSessionFacts } from "../src/workspace/derived";
import { newCompany } from "../src/workspace/types";
import type { CompanyState, ExecutionContext } from "../src/workspace/types";
import { createTreatment } from "../src/workspace/scope";
import {
  addAutomatedUse,
  deleteAutomatedUse,
  updateAutomatedUse,
} from "../src/workspace/locals";
import {
  expectedScopeOutcome,
  getScopeFinalizeGuard,
} from "../src/workspace/automatedScope";
import { getCanonicalActivity } from "../content/registry";

const REVIEWED = "automated_scope.inventory_reviewed";

function setup(): { company: CompanyState; treatmentId: string; ctx: ExecutionContext } {
  let c = newCompany("Scope SpA");
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

function setCoverage(
  c: CompanyState,
  treatmentId: string,
  id: string,
  coverage: "covered" | "not_covered" | "unknown",
  path?: "contract_necessary" | "explicit_consent" | "legal_authorization" | "none" | "unknown" | "not_applicable",
): CompanyState {
  const next = updateAutomatedUse(c, treatmentId, id, {
    article8bisCoverage: coverage,
    ...(path === undefined ? {} : { legalPath: path }),
  });
  if (!next) throw new Error("coverage falló");
  return next;
}

/** Facts de sesión reales: respuesta propia + derived del estado actual. */
function sessionFacts(c: CompanyState, ctx: ExecutionContext, over: FactMap = {}): FactMap {
  return { ...deriveSessionFacts(c, ctx), ...over };
}

function draftFor(conclusion: string) {
  return {
    conclusion,
    legal_question: "¿Alcance del art. 8 bis?",
    evidence_refs: ["matriz"],
    rationale: "Análisis por uso con conclusión agregada.",
    decided_by: "profesional",
    reviewed_by: "",
    decided_at: "2026-09-24",
  };
}

describe("D4.08 automated_decision.scope_assess (decision, treatment)", () => {
  it("1. registrado con modo, scope y reasoning canónicos", () => {
    expect(getProtocolForActivity("automated_decision.scope_assess")).toBe(P408);
    expect(P408.protocol_key).toBe("automated_decision.scope_assess.v1");
    expect(P408.mode).toBe("decision");
    expect(P408.execution_scope).toBe("treatment");
    expect(P408.version).toBe(1);
    expect(getCanonicalActivity(P408.activity_key)?.human_code).toBe("D4.08");
    expect(getCanonicalActivity(P408.activity_key)?.reasoning_record_required).toBe(true);
  });

  it("2. estructura válida; inventario estático + derived externos", () => {
    expect(validateProtocolStructure(P408)).toEqual([]);
    expect(P408.nodes.map((n) => n.node_key)).toEqual([
      "confirm-inventory",
      "structural-gate",
      "adopt-conclusion",
    ]);
    expect(P408.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "no_covered_use",
        "covered_uses_with_legal_path",
        "covered_use_without_legal_path",
        "assessment_incomplete",
      ].sort(),
    );
    expect(P408.decision_fact_keys).toEqual([REVIEWED]);
    expect(P408.external_fact_keys).toContain(
      "derived.treatment.automated_uses_coverage_complete",
    );
  });

  it("3. inventario vacío sin revisar → incomplete", () => {
    const { company, ctx } = setup();
    // Sin responder: espera en confirmación sin inventar respuesta.
    const waiting = evaluateProtocol(P408, sessionFacts(company, ctx));
    expect(waiting.status).toBe("awaiting_facts");
    // Respondido negativamente: el gate concluye incompleto.
    const e = evaluateProtocol(
      P408,
      sessionFacts(company, ctx, { [REVIEWED]: "no" }),
    );
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("assessment_incomplete");
  });

  it("4. vacío + revisado habilita no_covered_use solo vía juicio", () => {
    const { company, ctx } = setup();
    const facts = sessionFacts(company, ctx, { [REVIEWED]: "yes" });
    const e = evaluateProtocol(P408, facts);
    expect(e.status).toBe("awaiting_facts");
    if (e.status !== "awaiting_facts") throw new Error("se esperaba espera");
    expect(e.current_node_key).toBe("adopt-conclusion");
    expect(expectedScopeOutcome([], true)).toBe("no_covered_use");
  });

  it("5. todos not_covered → no_covered_use esperado", () => {
    let { company, treatmentId, ctx } = setup();
    const r1 = mustAdd(company, treatmentId, "U1");
    company = r1.company;
    const r2 = mustAdd(company, treatmentId, "U2");
    company = r2.company;
    company = setCoverage(company, treatmentId, r1.id, "not_covered");
    company = setCoverage(company, treatmentId, r2.id, "not_covered");
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("no_covered_use");
    const facts = sessionFacts(company, ctx, { [REVIEWED]: "yes" });
    const e = evaluateProtocol(P408, facts);
    expect(e.status).toBe("awaiting_facts");
  });

  it("6. covered + vías positivas → with_legal_path con 2 effects", () => {
    let { company, treatmentId } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = setCoverage(company, treatmentId, r.id, "covered", "explicit_consent");
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("covered_uses_with_legal_path");
    const guard = getScopeFinalizeGuard(P408);
    if (!guard) throw new Error("sin guard");
    const extras = guard.composeRefs(uses);
    expect(
      guard.validateFinalization({
        uses,
        inventoryReviewed: true,
        conclusion: "covered_uses_with_legal_path",
        extras,
      }),
    ).toEqual([]);
    const res = finalizeJudgment({
      protocol: P408 as ExecutionProtocol,
      company,
      facts: { [REVIEWED]: "yes" },
      draft: draftFor("covered_uses_with_legal_path"),
      legalBasis:
        getCanonicalActivity("automated_decision.scope_assess")?.legal_basis ?? [],
      ctx: { scope: "treatment", companyId: company.id, treatmentId },
    });
    // finalizeJudgment genérico no compone extras: el wiring de contexto lo hace.
    if (!res.ok) throw new Error("debió finalizar");
    expect(res.effects).toEqual([
      { fact_key: "automated_decision.scope_status", value: "covered_use_present" },
      { fact_key: "automated_decision.legal_path_status", value: "exception_identified" },
    ]);
  });

  it("7. covered + none → without_legal_path; unknown path → incompleto", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = setCoverage(company, treatmentId, r.id, "covered", "none");
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses, true)).toBe("covered_use_without_legal_path");
    company = setCoverage(company, treatmentId, r.id, "covered", "unknown");
    const uses2 = company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(expectedScopeOutcome(uses2, true)).toBe("assessment_incomplete");
    const facts = sessionFacts(company, ctx, { [REVIEWED]: "yes" });
    const e = evaluateProtocol(P408, facts);
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("assessment_incomplete");
  });

  it("8. coverage unknown → gate incompleto aunque inventario revisado", () => {
    let { company, treatmentId, ctx } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    const facts = sessionFacts(company, ctx, { [REVIEWED]: "yes" });
    const e = evaluateProtocol(P408, facts);
    if (e.status !== "outcome") throw new Error(`fue ${e.status}`);
    expect(e.outcome_key).toBe("assessment_incomplete");
  });

  it("9. guard: ID omitido o desconocido bloquea; rationale ignorado", () => {
    let { company, treatmentId } = setup();
    const r1 = mustAdd(company, treatmentId, "Mismo nombre");
    company = r1.company;
    const r2 = mustAdd(company, treatmentId, "Mismo nombre");
    company = r2.company;
    company = setCoverage(company, treatmentId, r1.id, "not_covered");
    company = setCoverage(company, treatmentId, r2.id, "not_covered");
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    const guard = getScopeFinalizeGuard(P408);
    if (!guard) throw new Error("sin guard");
    const full = guard.composeRefs(uses);
    // El guard expone la lectura de inventario: el wiring genérico
    // no posee claves de facts del protocolo.
    expect(guard.isInventoryReviewed({ [REVIEWED]: "yes" })).toBe(true);
    expect(guard.isInventoryReviewed({})).toBe(false);
    // Omitido un ID actual → bloquea aunque los nombres coincidan.
    expect(
      guard.validateFinalization({
        uses,
        inventoryReviewed: true,
        conclusion: "no_covered_use",
        extras: [full[0] as string],
      }).length,
    ).toBeGreaterThan(0);
    // Referencia inexistente → bloquea.
    expect(
      guard.validateFinalization({
        uses,
        inventoryReviewed: true,
        conclusion: "no_covered_use",
        extras: [...full, "automated_use:inexistente"],
      }).length,
    ).toBeGreaterThan(0);
    // Rationale con tokens no crea referencias: el guard solo mira extras.
    expect(
      guard.validateFinalization({
        uses,
        inventoryReviewed: true,
        conclusion: "wrong_outcome",
        extras: full,
      }),
    ).toEqual([
      "La conclusión elegida no coincide con el estado actual de los usos: revisa la evaluación antes de adoptar.",
    ]);
    // Sin inventario revisado → bloquea primero.
    expect(
      guard.validateFinalization({
        uses,
        inventoryReviewed: false,
        conclusion: "no_covered_use",
        extras: full,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("10. sin conclusión o con mismatch no hay finalización definitiva", () => {
    let { company, treatmentId } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = setCoverage(company, treatmentId, r.id, "covered", "none");
    const bad = finalizeJudgment({
      protocol: P408 as ExecutionProtocol,
      company,
      facts: { [REVIEWED]: "yes" },
      draft: draftFor(""),
      legalBasis:
        getCanonicalActivity("automated_decision.scope_assess")?.legal_basis ?? [],
      ctx: { scope: "treatment", companyId: company.id, treatmentId },
    });
    expect(bad.ok).toBe(false);
  });

  it("11. staleness: agregar/eliminar/cambiar invalida el record", () => {
    let { company, treatmentId, ctx } = setup();
    const r1 = mustAdd(company, treatmentId, "U1");
    company = r1.company;
    company = setCoverage(company, treatmentId, r1.id, "not_covered");
    const uses = company.treatments?.[treatmentId]?.automatedUses ?? [];
    const guard = getScopeFinalizeGuard(P408);
    if (!guard) throw new Error("sin guard");
    const record = {
      protocolKey: P408.protocol_key,
      activityKey: P408.activity_key,
      conclusion: "no_covered_use",
      legal_question: "q",
      facts_considered: [REVIEWED, ...guard.composeRefs(uses)],
      legal_factors: [],
      evidence_refs: ["matriz de usos"],
      alternatives_considered: [],
      rationale: "r",
      decided_by: "p",
      reviewed_by: "",
      decided_at: "2026-09-24",
      legal_basis:
        getCanonicalActivity("automated_decision.scope_assess")?.legal_basis.map((b) => ({
          ...b,
        })) ?? [],
      updatedAt: "2026-09-24T00:00:00.000Z",
    };
    // Estado sin cambios → sin staleness.
    expect(guard.stalenessReasons(record, uses)).toEqual([]);
    // Agregar uso → mismatch.
    const r2 = mustAdd(company, treatmentId, "U2");
    const uses2 = r2.company.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(guard.stalenessReasons(record, uses2).length).toBeGreaterThan(0);
    // Eliminar uso → mismatch (nunca satisface).
    const del = deleteAutomatedUse(company, treatmentId, r1.id);
    if (!del) throw new Error("delete falló");
    const uses3 = del.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(guard.stalenessReasons(record, uses3).length).toBeGreaterThan(0);
    // Cambio de agregado (not_covered → covered sin vía) → mismatch.
    let changed = setCoverage(company, treatmentId, r1.id, "covered", "none");
    const uses4 = changed.treatments?.[treatmentId]?.automatedUses ?? [];
    expect(guard.stalenessReasons(record, uses4).length).toBeGreaterThan(0);
    // Y getRecordedJudgment lo refleja como stale con empresa real.
    const judged = getRecordedJudgment(
      P408 as ExecutionProtocol,
      {
        ...changed,
        treatments: {
          ...changed.treatments,
          [treatmentId]: {
            ...changed.treatments?.[treatmentId],
            reasoningRecords: { [P408.protocol_key]: record },
          },
        },
      } as CompanyState,
      { [REVIEWED]: "yes" },
      ctx,
    );
    expect(judged.status).toBe("stale");
  });

  it("12. editar usos no escribe canonical facts", () => {
    let { company, treatmentId } = setup();
    const r = mustAdd(company, treatmentId, "U1");
    company = r.company;
    company = setCoverage(company, treatmentId, r.id, "covered", "none");
    const answers = company.treatments?.[treatmentId]?.protocolAnswers ?? {};
    expect(JSON.stringify(answers)).not.toContain("automated_decision.");
  });
});
