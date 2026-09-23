import { describe, expect, it } from "vitest";
import { GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL as P01 } from "../content/protocols/governance.preventive_framework";
import { DPO_DESIGNATE_PROTOCOL as P08 } from "../content/protocols/dpo.designate";
import { DPO_OPERATING_MODEL_PROTOCOL as P11 } from "../content/protocols/dpo.operating_model";
import { MPI_NEED_ASSESSMENT_PROTOCOL as P03 } from "../content/protocols/mpi.need_assessment";
import type { FactMap } from "../content/protocols/types";
import {
  applyProcedureFinalization,
  getFinalizableOutcome,
  isFinalizableMode,
  validateProcedureFinalization,
} from "../src/workspace/finalize";
import { finalizeJudgment } from "../src/workspace/reasoning";
import { getFactStatus } from "../src/workspace/facts";
import { evaluateProtocol } from "../src/guidance/engine";
import { newCompany } from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";

function fullFramework(over: FactMap = {}): FactMap {
  return {
    "governance.client_is_responsible": "yes",
    "governance.actions_identified": "yes",
    "governance.gaps_determined": "yes",
    "governance.framework_defined": "yes",
    "governance.followup_established": "yes",
    ...over,
  };
}

function fullModel(over: FactMap = {}): FactMap {
  return {
    "dpo.designated": "yes",
    "dpo.operating.reporting": "yes",
    "dpo.operating.involvement": "yes",
    "dpo.operating.info_access": "yes",
    "dpo.operating.functions_map": "yes",
    "dpo.operating.cadence": "yes",
    ...over,
  };
}

describe("finalización genérica procedure/checklist", () => {
  it("1. solo procedure/checklist son finalizables", () => {
    expect(isFinalizableMode(P01)).toBe(true);
    expect(isFinalizableMode(P11)).toBe(true);
    expect(isFinalizableMode(P08)).toBe(true);
    expect(isFinalizableMode(P03)).toBe(false);
  });

  it("2. D1.01 declara el efecto canónico solo en el definitivo", () => {
    const complete = getFinalizableOutcome(P01, "framework_established");
    expect(complete?.canonical_fact_effects).toEqual([
      { fact_key: "governance.prevention_framework_status", value: "established" },
    ]);
    expect(getFinalizableOutcome(P01, "framework_in_progress")).toBeUndefined();
    expect(getFinalizableOutcome(P01, "not_applicable")).toBeUndefined();
  });

  it("3. D1.01 finalizado materializa su estado canónico", () => {
    const company = newCompany("Marco SpA");
    const validated = validateProcedureFinalization({
      protocol: P01,
      company,
      facts: fullFramework(),
      outcomeKey: "framework_established",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next, applied, skipped } = applyProcedureFinalization(
      company,
      P01,
      validated.effects,
    );
    expect(applied).toEqual(["governance.prevention_framework_status"]);
    expect(skipped).toEqual([]);
    const record = next.protocolAnswers[P01.protocol_key]?.["governance.prevention_framework_status"];
    expect(record?.value).toBe("established");
    expect(record?.source).toBe(P01.protocol_key);
    // Original intacta: operación pura.
    expect(company.protocolAnswers[P01.protocol_key]).toBeUndefined();
  });

  it("4. repetir finalización no duplica ni corrompe", () => {
    const company = newCompany("Idem SpA");
    const first = validateProcedureFinalization({
      protocol: P01,
      company,
      facts: fullFramework(),
      outcomeKey: "framework_established",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const once = applyProcedureFinalization(company, P01, first.effects);
    const stamp = once.company.protocolAnswers[P01.protocol_key]?.["governance.prevention_framework_status"]?.updatedAt;
    const twice = applyProcedureFinalization(once.company, P01, first.effects);
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["governance.prevention_framework_status"]);
    expect(
      twice.company.protocolAnswers[P01.protocol_key]?.["governance.prevention_framework_status"]?.updatedAt,
    ).toBe(stamp);
    expect(
      Object.keys(twice.company.protocolAnswers[P01.protocol_key] ?? {}),
    ).toEqual(["governance.prevention_framework_status"]);
  });

  it("5. outcome incompleto no escribe estado definitivo", () => {
    const company = newCompany("Incompleta SpA");
    const partial = fullFramework({ "governance.followup_established": "no" });
    const validated = validateProcedureFinalization({
      protocol: P01,
      company,
      facts: partial,
      outcomeKey: "framework_established",
    });
    expect(validated.ok).toBe(false);
    // Pedir el outcome no definitivo tampoco materializa.
    const nonDefinitive = validateProcedureFinalization({
      protocol: P01,
      company,
      facts: partial,
      outcomeKey: "framework_in_progress",
    });
    expect(nonDefinitive.ok).toBe(false);
    expect(company.protocolAnswers).toEqual({});
  });

  it("6. D1.11 declara y materializa su estado canónico", () => {
    const active = getFinalizableOutcome(P11, "operating_model_active");
    expect(active?.canonical_fact_effects).toEqual([
      { fact_key: "dpo.operating_model_status", value: "active" },
    ]);
    expect(getFinalizableOutcome(P11, "operating_model_in_progress")).toBeUndefined();
    expect(getFinalizableOutcome(P11, "prerequisite_missing")).toBeUndefined();
    const company = newCompany("Modelo SpA");
    const validated = validateProcedureFinalization({
      protocol: P11,
      company,
      facts: fullModel(),
      outcomeKey: "operating_model_active",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next } = applyProcedureFinalization(company, P11, validated.effects);
    expect(
      next.protocolAnswers[P11.protocol_key]?.["dpo.operating_model_status"]?.value,
    ).toBe("active");
    // Repetir es no-op.
    const twice = applyProcedureFinalization(next, P11, validated.effects);
    expect(twice.applied).toEqual([]);
  });

  it("7. D1.11 incompleto no escribe", () => {
    const company = newCompany("Modelo P SpA");
    const validated = validateProcedureFinalization({
      protocol: P11,
      company,
      facts: fullModel({ "dpo.operating.cadence": "unknown" }),
      outcomeKey: "operating_model_active",
    });
    expect(validated.ok).toBe(false);
    expect(company.protocolAnswers).toEqual({});
  });

  it("8. D1.08 execution-ready pero no product-ready", () => {
    // La guía conduce al acto verificable (evaluación determinística).
    const e = evaluateProtocol(P08, {
      "dpo.designation_trigger": "voluntary",
      "dpo.designation_authority": "yes",
      "dpo.designation_modality": "internal",
      "dpo.designation_natural_person": "na",
      "dpo.designation_group_conditions": "na",
      "dpo.designation_suitability": "yes",
      "dpo.designation_formalization": "yes",
    });
    expect(e.status).toBe("outcome");
    // Pero ningún outcome declara lifecycle effects: nada que finalizar.
    for (const o of P08.outcomes) {
      expect(getFinalizableOutcome(P08, o.outcome_key)).toBeUndefined();
    }
    const rejected = validateProcedureFinalization({
      protocol: P08,
      company: newCompany("D08 SpA"),
      facts: {},
      outcomeKey: "designation_complete",
    });
    expect(rejected.ok).toBe(false);
  });

  it("9. conflicto en fact de efecto bloquea el registro", () => {
    const at = new Date().toISOString();
    const company = newCompany("Conflicto SpA");
    company.diagnosticFacts["governance.prevention_framework_status"] = {
      value: "unknown",
      source: "diagnostico",
      updatedAt: at,
    };
    company.protocolAnswers[P11.protocol_key] = {
      "governance.prevention_framework_status": {
        value: "established",
        source: P11.protocol_key,
        updatedAt: at,
      },
    };
    expect(
      getFactStatus(company, "governance.prevention_framework_status").state,
    ).toBe("conflict");
    const validated = validateProcedureFinalization({
      protocol: P01,
      company,
      facts: fullFramework(),
      outcomeKey: "framework_established",
    });
    expect(validated.ok).toBe(false);
  });

  it("10. aislamiento por empresa y export/import", () => {
    const a = newCompany("A SpA");
    const b = newCompany("B SpA");
    const validated = validateProcedureFinalization({
      protocol: P01,
      company: a,
      facts: fullFramework(),
      outcomeKey: "framework_established",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const finalized = applyProcedureFinalization(a, P01, validated.effects);
    expect(
      finalized.company.protocolAnswers[P01.protocol_key]?.["governance.prevention_framework_status"]?.value,
    ).toBe("established");
    expect(b.protocolAnswers[P01.protocol_key]).toBeUndefined();
    const checked = validateCompanyState(JSON.parse(JSON.stringify(finalized.company)));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(
      checked.value.protocolAnswers[P01.protocol_key]?.["governance.prevention_framework_status"]?.value,
    ).toBe("established");
  });

  it("11. D1.03 rechaza la vía genérica y conserva la propia", () => {
    // Modo decision con juicio: camino propio, no genérico.
    const rejected = validateProcedureFinalization({
      protocol: P03,
      company: newCompany("D03 SpA"),
      facts: {},
      outcomeKey: "recommended",
    });
    expect(rejected.ok).toBe(false);
    // La finalización propia sigue operativa con su semántica aprobada.
    const d03company = newCompany("D03b SpA");
    const gateFail = finalizeJudgment({
      protocol: P03,
      company: d03company,
      facts: {},
      draft: {
        conclusion: "recommended",
        legal_question: "x",
        evidence_refs: ["e"],
        rationale: "r",
        decided_by: "profesional",
        reviewed_by: "",
        decided_at: new Date().toISOString(),
      },
      legalBasis: [],
      ctx: { scope: "company", companyId: d03company.id },
    });
    expect(gateFail.ok).toBe(false);
  });
});
