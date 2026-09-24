import { describe, expect, it } from "vitest";
import { SENSITIVE_LAWFULNESS_ASSESS_PROTOCOL as P501 } from "../content/protocols/sensitive.lawfulness_assess";
import { SENSITIVE_HEALTH_BIOLOGICAL_ASSESS_PROTOCOL as P502 } from "../content/protocols/sensitive.health_biological_assess";
import { SENSITIVE_BIOMETRIC_ASSESS_PROTOCOL as P503 } from "../content/protocols/sensitive.biometric_assess";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import {
  getProtocolForActivity,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import {
  applyScopedFinalization,
  finalizeJudgment,
  getRecordedJudgment,
} from "../src/workspace/reasoning";
import { deriveSessionFacts } from "../src/workspace/derived";
import { newCompany } from "../src/workspace/types";
import type { CompanyState, ExecutionContext } from "../src/workspace/types";
import { createPurpose, createTreatment } from "../src/workspace/scope";
import {
  addDataItem,
  addDataPurposeLink,
  deleteDataItem,
  removeDataPurposeLink,
  updateDataItem,
} from "../src/workspace/locals";
import { setSpecialRegimeProfile } from "../src/workspace/scope";
import {
  deriveD5CandidatesForPurpose,
  validateSpecialRegimeCoherence,
} from "../src/workspace/specialRegime";
import { getSpecialRegimeGuard } from "../src/workspace/specialRegimeGuards";
import { getCanonicalActivity } from "../content/registry";
import { D05_ACTIVITIES } from "../content/domains/d05";

/**
 * Guías D5.01–D5.03 (decision, purpose): candidatura estructural,
 * cobertura de datos vinculados, rutas art. 16/16 bis, cautelas
 * propias, refs data_item, staleness y aislamiento. Sin D5.04–D5.07.
 */

function setup(): {
  company: CompanyState;
  treatmentId: string;
  p1: string;
  p2: string;
  ctx1: ExecutionContext;
  ctx2: ExecutionContext;
} {
  let c = newCompany("D5 SpA");
  const t = createTreatment(c, { name: "T" });
  if (!t) throw new Error("sin T");
  c = t.company;
  const p1 = createPurpose(c, t.treatmentId, "P1");
  if (!p1) throw new Error("sin P1");
  c = p1.company;
  const p2 = createPurpose(c, t.treatmentId, "P2");
  if (!p2) throw new Error("sin P2");
  c = p2.company;
  const base = { scope: "purpose" as const, companyId: c.id, treatmentId: t.treatmentId };
  return {
    company: c,
    treatmentId: t.treatmentId,
    p1: p1.purposeId,
    p2: p2.purposeId,
    ctx1: { ...base, purposeId: p1.purposeId },
    ctx2: { ...base, purposeId: p2.purposeId },
  };
}

function mustItem(
  c: CompanyState,
  t: string,
  label: string,
  patch: Record<string, "yes" | "no" | "unknown"> = {},
): { company: CompanyState; id: string } {
  const r = addDataItem(c, t, { label, ...patch });
  if (!r) throw new Error(`sin item ${label}`);
  return r;
}

function mustLink(c: CompanyState, t: string, dataId: string, purposeId: string): CompanyState {
  const next = addDataPurposeLink(c, t, { dataId, purposeId });
  if (!next) throw new Error("sin link");
  return next;
}

/** Facts de sesión reales: derived del estado + respuestas propias. */
function sessionFacts(c: CompanyState, ctx: ExecutionContext, over: FactMap = {}): FactMap {
  return { ...deriveSessionFacts(c, ctx), ...over };
}

function draftFor(conclusion: string) {
  return {
    conclusion,
    legal_question: "¿Vía aplicable?",
    evidence_refs: ["matriz"],
    rationale: "Análisis profesional con hechos y alternativas.",
    decided_by: "profesional",
    reviewed_by: "",
    decided_at: "2026-09-24",
  };
}

function basisFor(activityKey: string) {
  return getCanonicalActivity(activityKey)?.legal_basis ?? [];
}

function mustOutcome(protocol: ExecutionProtocol, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") throw new Error(`se esperaba outcome, fue ${e.status}`);
  return e;
}

describe("D5.01 sensitive.lawfulness_assess (decision, purpose)", () => {
  it("1. registrado con modo, scope, reasoning y efectos canónicos", () => {
    expect(getProtocolForActivity("sensitive.lawfulness_assess")).toBe(P501);
    expect(P501.protocol_key).toBe("sensitive.lawfulness_assess.v1");
    expect(P501.mode).toBe("decision");
    expect(P501.execution_scope).toBe("purpose");
    expect(P501.version).toBe(1);
    expect(getCanonicalActivity(P501.activity_key)?.human_code).toBe("D5.01");
    expect(getCanonicalActivity(P501.activity_key)?.reasoning_record_required).toBe(true);
    expect(validateProtocolStructure(P501)).toEqual([]);
    expect(P501.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "lawful_path_supported",
        "lawful_path_not_supported",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
  });

  it("2. candidatura yes/no/unknown gobierna la entrada", () => {
    const { company, ctx1 } = setup();
    const yes = sessionFacts(company, ctx1, {
      "derived.purpose.d5_sensitive_candidate": "yes",
    });
    expect(evaluateProtocol(P501, yes).status).toBe("awaiting_facts");
    const no = mustOutcome(
      P501,
      sessionFacts(company, ctx1, { "derived.purpose.d5_sensitive_candidate": "no" }),
    );
    expect(no.outcome_key).toBe("regime_not_indicated");
    expect(no.rule_id).toBe("candidate-no");
    const unk = mustOutcome(P501, sessionFacts(company, ctx1));
    expect(unk.outcome_key).toBe("classification_incomplete");
  });

  it("3. seis rutas + subcondiciones nonprofit + información posterior", () => {
    const keys = P501.nodes.map((n) => n.node_key);
    for (const k of [
      "route-select",
      "consent-check",
      "manifestly-public",
      "nonprofit-route",
      "nonprofit-conditions",
      "vital-route",
      "vital-later-info",
      "claims-route",
      "labor-route",
      "legal-auth-route",
    ]) {
      expect(keys, k).toContain(k);
    }
    const route = P501.nodes.find((n) => n.node_key === "route-select");
    expect(route?.options?.map((o) => o.value).sort()).toEqual(
      [
        "express_consent",
        "manifestly_public",
        "nonprofit",
        "vital_integrity",
        "claims_defense",
        "labor_social_security",
        "legal_authorization",
        "none_identified",
        "unknown",
      ].sort(),
    );
    // Subcondiciones acumulativas visibles en el nodo nonprofit.
    const npc = P501.nodes.find((n) => n.node_key === "nonprofit-conditions");
    expect(JSON.stringify(npc)).toContain("anonimización o supresión");
    // Rutas alternativas: ninguna exige a las demás en el gate.
    expect(P501.decision_fact_keys).toEqual([
      "derived.purpose.d5_sensitive_candidate",
      "sens01.items_reviewed",
      "sens01.analysis_ready",
    ]);
  });

  it("4. unknown bloquea finalización aunque candidate sea yes", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    const b = mustItem(company, treatmentId, "B", { sensitive: "unknown" });
    company = b.company;
    company = mustLink(company, treatmentId, a.id, p1);
    company = mustLink(company, treatmentId, b.id, p1);
    const facts = sessionFacts(company, ctx1, {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
    });
    expect(facts["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    expect(
      guard.validateFinalization({
        company,
        ctx: ctx1,
        protocol: P501,
        conclusion: "lawful_path_supported",
        extras: guard.composeRefs(company, ctx1, []),
        facts,
      }),
    ).toEqual([
      "Aún hay datos vinculados sin clasificar como sensibles o no: la conclusión definitiva requiere el universo vinculado completo.",
    ]);
    // Resuelto el unknown → vía libre.
    const u = updateDataItem(company, treatmentId, b.id, { sensitive: "no" });
    if (!u) throw new Error("sin update");
    company = u;
    const facts2 = sessionFacts(company, ctx1, {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
    });
    expect(
      guard.validateFinalization({
        company,
        ctx: ctx1,
        protocol: P501,
        conclusion: "lawful_path_supported",
        extras: guard.composeRefs(company, ctx1, []),
        facts: facts2,
      }),
    ).toEqual([]);
  });

  it("5. supported/not_supported con effects; falta de info no es not_supported", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
      "sens01.route_main": "express_consent",
      "sens01.consent_verified": "yes",
    };
    const facts = sessionFacts(company, ctx1, ready);
    const extras = guard.composeRefs(company, ctx1, []);
    expect(extras).toEqual([`data_item:${a.id}`]);
    const res = finalizeJudgment({
      protocol: P501,
      company,
      facts,
      draft: { ...draftFor("lawful_path_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.lawfulness_assess"),
      ctx: ctx1,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "sensitive.lawfulness_status", value: "supported" },
    ]);
    const applied = applyScopedFinalization(company, P501, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P501, applied, sessionFacts(applied, ctx1, ready), ctx1).status,
    ).toBe("valid");
    expect(
      applied.treatments?.[treatmentId]?.purposes[p1]?.protocolAnswers[P501.protocol_key]?.[
        "sensitive.lawfulness_status"
      ]?.value,
    ).toBe("supported");
    // Sin base analizada no hay not_supported: el gate bloquea.
    const noBase = finalizeJudgment({
      protocol: P501,
      company,
      facts: sessionFacts(company, ctx1),
      draft: draftFor("lawful_path_not_supported"),
      legalBasis: basisFor("sensitive.lawfulness_assess"),
      ctx: ctx1,
    });
    expect(noBase.ok).toBe(false);
  });

  it("6. refs requeridas, unknowns y staleness contra current state", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
    };
    const facts = sessionFacts(company, ctx1, ready);
    // Sin refs → error; ref desconocida → error.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P501,
        conclusion: "lawful_path_supported", extras: [], facts,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P501,
        conclusion: "lawful_path_supported",
        extras: ["data_item:inexistente"], facts,
      }).length,
    ).toBeGreaterThan(0);
    // Finaliza válido y luego: nuevo item yes → stale.
    const extras = guard.composeRefs(company, ctx1, []);
    const res = finalizeJudgment({
      protocol: P501, company, facts,
      draft: { ...draftFor("lawful_path_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.lawfulness_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P501, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    const n = mustItem(applied, treatmentId, "Nuevo", { sensitive: "yes" });
    let moved = mustLink(n.company, treatmentId, n.id, p1);
    expect(
      getRecordedJudgment(P501, moved, sessionFacts(moved, ctx1, ready), ctx1).status,
    ).toBe("stale");
    // no→yes también invalida.
    const f = mustItem(applied, treatmentId, "F", { sensitive: "no" });
    moved = mustLink(f.company, treatmentId, f.id, p1);
    const flip = updateDataItem(moved, treatmentId, f.id, { sensitive: "yes" });
    if (!flip) throw new Error("sin flip");
    expect(
      getRecordedJudgment(P501, flip, sessionFacts(flip, ctx1, ready), ctx1).status,
    ).toBe("stale");
    // Unlink del referenciado → stale.
    const un = removeDataPurposeLink(applied, treatmentId, { dataId: a.id, purposeId: p1 });
    if (!un) throw new Error("sin unlink");
    expect(
      getRecordedJudgment(P501, un, sessionFacts(un, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });

  it("7. addressed ctx: otra purpose no finaliza ni lee el juicio", () => {
    let { company, treatmentId, p1, p2, ctx1, ctx2 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const ready: FactMap = {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
    };
    const cross = finalizeJudgment({
      protocol: P501,
      company,
      facts: sessionFacts(company, ctx2, ready),
      draft: draftFor("lawful_path_supported"),
      legalBasis: basisFor("sensitive.lawfulness_assess"),
      ctx: ctx2,
    });
    // Gate P2: candidate ausente (sin links) → bloqueado.
    expect(cross.ok).toBe(false);
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    const extras = guard.composeRefs(company, ctx1, []);
    const res = finalizeJudgment({
      protocol: P501, company,
      facts: sessionFacts(company, ctx1, ready),
      draft: { ...draftFor("lawful_path_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.lawfulness_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P501, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P501, applied, sessionFacts(applied, ctx2, ready), ctx2).status,
    ).toBe("none");
    expect(
      applied.treatments?.[treatmentId]?.purposes[p1]?.protocolAnswers[P501.protocol_key]?.[
        "sensitive.lawfulness_status"
      ]?.value,
    ).toBe("supported");
    expect(
      applied.treatments?.[treatmentId]?.purposes[p2]?.protocolAnswers[P501.protocol_key],
    ).toBeUndefined();
  });

  it("8. next actions a D5.02/D5.03 condicionales; sin dependencias", () => {
    const out = P501.outcomes.find((o) => o.outcome_key === "lawful_path_supported");
    const acts = (out?.next_actions ?? []).filter((a) => a.kind === "activity");
    expect(acts.map((a) => a.activity_key).sort()).toEqual(
      ["sensitive.biometric_assess", "sensitive.health_biological_assess"].sort(),
    );
    for (const a of acts) {
      expect(a.show_when).toMatchObject({ op: "fact_equals", value: "yes" });
    }
    expect(
      D05_ACTIVITIES.find((a) => a.activity_key === "sensitive.lawfulness_assess")
        ?.activity_dependencies,
    ).toEqual([]);
  });
});

describe("D5.02 sensitive.health_biological_assess (decision, purpose)", () => {
  it("9. registrado; candidatura y cautela de consentimiento en el canon guiado", () => {
    expect(getProtocolForActivity("sensitive.health_biological_assess")).toBe(P502);
    expect(P502.mode).toBe("decision");
    expect(P502.execution_scope).toBe("purpose");
    expect(validateProtocolStructure(P502)).toEqual([]);
    expect(P502.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "conditions_supported",
        "conditions_not_supported",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
    const keys = P502.nodes.map((n) => n.node_key);
    for (const k of [
      "route-select",
      "consent-express",
      "sanitary-law",
      "sanitary-law-ref",
      "vital-route",
      "alert-route",
      "research-route",
      "research-publishes",
      "research-anonymized",
      "claims-route",
      "medicine-route",
      "legal-auth-route",
      "prohibition-state",
    ]) {
      expect(keys, k).toContain(k);
    }
    // Sin dependency a D5.01 en ningún lado.
    expect(
      D05_ACTIVITIES.find((a) => a.activity_key === "sensitive.health_biological_assess")
        ?.activity_dependencies,
    ).toEqual([]);
    expect(JSON.stringify(P502)).not.toContain("sensitive.lawfulness_assess");
  });

  it("10. candidatura gobierna; warning sensible no altera candidate", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const facts = sessionFacts(company, ctx1);
    expect(facts["derived.purpose.d5_health_biological_candidate"]).toBe("yes");
    expect(validateSpecialRegimeCoherence(company, treatmentId, p1).map((i) => i.code)).toContain(
      "health_sensitive_mismatch",
    );
    expect(evaluateProtocol(P502, facts).status).toBe("awaiting_facts");
  });

  it("11. consentimiento solo insuficiente sin ley sanitaria", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", biologicalProfile: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P502);
    if (!guard) throw new Error("sin guard");
    const base: FactMap = {
      "health02.items_reviewed": "yes",
      "health02.analysis_ready": "yes",
      "health02.route_main": "consent_route",
      "health02.consent_express": "yes",
    };
    const facts = sessionFacts(company, ctx1, base);
    const extras = guard.composeRefs(company, ctx1, []);
    // Sin ley sanitaria identificada → supported bloqueado.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported", extras, facts,
      }).length,
    ).toBeGreaterThan(0);
    // Con ley + finalidad + norma citada → vía libre.
    const facts2 = sessionFacts(company, ctx1, {
      ...base,
      "health02.sanitary_law": "yes",
      "health02.sanitary_law_ref": "Ley 20.584, atención clínica",
    });
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported", extras, facts: facts2,
      }),
    ).toEqual([]);
    const res = finalizeJudgment({
      protocol: P502, company, facts: facts2,
      draft: { ...draftFor("conditions_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.health_biological_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "sensitive.health_biological_status", value: "supported" },
    ]);
  });

  it("12. prohibición sin habilitación bloquea supported (no not_supported)", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", biologicalProfile: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P502);
    if (!guard) throw new Error("sin guard");
    const facts = sessionFacts(company, ctx1, {
      "health02.items_reviewed": "yes",
      "health02.analysis_ready": "yes",
      "health02.route_main": "medicine_route",
      "health02.prohibition_state": "relevant_unenabled",
    });
    const extras = guard.composeRefs(company, ctx1, []);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported", extras, facts,
      }),
    ).toEqual([
      "La prohibición especial aplica sin habilitación legal: la conclusión favorable queda bloqueada.",
    ]);
    // La conclusión desfavorable sí puede adoptarse.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_not_supported", extras, facts,
      }),
    ).toEqual([]);
  });

  it("13. publicación sin anonimización bloquea supported en ruta investigación", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", biologicalProfile: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P502);
    if (!guard) throw new Error("sin guard");
    const facts = sessionFacts(company, ctx1, {
      "health02.items_reviewed": "yes",
      "health02.analysis_ready": "yes",
      "health02.route_main": "research_route",
      "health02.research_publishes": "yes",
      "health02.research_anonymized": "no",
      "health02.prohibition_state": "not_relevant",
    });
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported",
        extras: guard.composeRefs(company, ctx1, []), facts,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("13b. publicación por determinar bloquea supported; conclusión no definitiva rechazada", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", biologicalProfile: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P502);
    if (!guard) throw new Error("sin guard");
    const base: FactMap = {
      "health02.items_reviewed": "yes",
      "health02.analysis_ready": "yes",
      "health02.route_main": "research_route",
      "health02.research_publishes": "unknown",
      "health02.prohibition_state": "not_relevant",
    };
    const extras = guard.composeRefs(company, ctx1, []);
    // unknown != false: sin saber si hay publicación no hay favorable.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported", extras,
        facts: sessionFacts(company, ctx1, base),
      }).length,
    ).toBeGreaterThan(0);
    // Sin publicación declarada (no) sí hay vía libre.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "conditions_supported", extras,
        facts: sessionFacts(company, ctx1, { ...base, "health02.research_publishes": "no" }),
      }),
    ).toEqual([]);
    // Estados de ruta no se adoptan como conclusión: ningún guard
    // deja pasar assessment_incomplete en silencio.
    for (const proto of [P501, P502, P503] as const) {
      const g = getSpecialRegimeGuard(proto);
      if (!g) throw new Error("sin guard");
      expect(
        g.validateFinalization({
          company, ctx: ctx1, protocol: proto,
          conclusion: "assessment_incomplete", extras: [], facts: sessionFacts(company, ctx1),
        }).length,
        proto.protocol_key,
      ).toBeGreaterThan(0);
    }
    // Con candidatura y cobertura vigentes (D5.02), el motivo es
    // explícitamente la falta de carácter definitivo.
    const g502 = getSpecialRegimeGuard(P502);
    if (!g502) throw new Error("sin guard");
    expect(
      g502.validateFinalization({
        company, ctx: ctx1, protocol: P502,
        conclusion: "assessment_incomplete",
        extras: g502.composeRefs(company, ctx1, []),
        facts: sessionFacts(company, ctx1, {
          "health02.items_reviewed": "yes",
          "health02.analysis_ready": "yes",
        }),
      }),
    ).toContain(
      "La conclusión debe ser definitiva (soportada o no soportada): los estados de ruta no se adoptan como conclusión.",
    );
  });

  it("14. refs y staleness tras cambios de items/links", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { health: "yes", biologicalProfile: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P502);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "health02.items_reviewed": "yes",
      "health02.analysis_ready": "yes",
      "health02.route_main": "medicine_route",
      "health02.prohibition_state": "not_relevant",
    };
    const facts = sessionFacts(company, ctx1, ready);
    const extras = guard.composeRefs(company, ctx1, []);
    const res = finalizeJudgment({
      protocol: P502, company, facts,
      draft: { ...draftFor("conditions_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.health_biological_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P502, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    // Nuevo item health → stale; unlink → stale.
    const n = mustItem(applied, treatmentId, "Nuevo", { biologicalProfile: "yes" });
    const moved = mustLink(n.company, treatmentId, n.id, p1);
    expect(
      getRecordedJudgment(P502, moved, sessionFacts(moved, ctx1, ready), ctx1).status,
    ).toBe("stale");
    const un = removeDataPurposeLink(applied, treatmentId, { dataId: a.id, purposeId: p1 });
    if (!un) throw new Error("sin unlink");
    expect(
      getRecordedJudgment(P502, un, sessionFacts(un, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });
});

describe("D5.03 sensitive.biometric_assess (decision, purpose)", () => {
  it("15. registrado; candidatura solo desde perfil", () => {
    expect(getProtocolForActivity("sensitive.biometric_assess")).toBe(P503);
    expect(P503.mode).toBe("decision");
    expect(P503.execution_scope).toBe("purpose");
    expect(validateProtocolStructure(P503)).toEqual([]);
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes", health: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    // Flags de items no crean candidatura biométrica.
    expect(
      deriveD5CandidatesForPurpose(company, treatmentId, p1)?.[
        "derived.purpose.d5_biometric_candidate"
      ],
    ).toBeUndefined();
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    expect(
      deriveD5CandidatesForPurpose(company, treatmentId, p1)?.[
        "derived.purpose.d5_biometric_candidate"
      ],
    ).toBe("yes");
    expect(sessionFacts(company, ctx1)["derived.purpose.d5_biometric_candidate"]).toBe("yes");
  });

  it("16. warning visible pero no mutante: candidate yes finaliza", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    expect(
      validateSpecialRegimeCoherence(company, treatmentId, p1).map((i) => i.code),
    ).toContain("biometric_context_mismatch");
    const guard = getSpecialRegimeGuard(P503);
    if (!guard) throw new Error("sin guard");
    const facts = sessionFacts(company, ctx1, {
      "bio03.use_reviewed": "yes",
      "bio03.analysis_ready": "yes",
      "bio03.technical_identification": "yes",
      "bio03.system_identified": "yes",
      "bio03.specific_purpose": "yes",
      "bio03.usage_period": "yes",
      "bio03.rights_info": "yes",
      "bio03.consent_verified": "yes",
    });
    // El warning no bloquea: con ref válida e información completa, vía libre.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_supported",
        extras: [`data_item:${a.id}`], facts,
      }),
    ).toEqual([]);
  });

  it("17. cero links bloquea; ref única basta (no todos)", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    const guard = getSpecialRegimeGuard(P503);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "bio03.use_reviewed": "yes",
      "bio03.analysis_ready": "yes",
    };
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_supported",
        extras: [], facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([
      "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
    ]);
    const a = mustItem(company, treatmentId, "A", {});
    company = a.company;
    const b = mustItem(company, treatmentId, "B", {});
    company = b.company;
    company = mustLink(company, treatmentId, a.id, p1);
    company = mustLink(company, treatmentId, b.id, p1);
    // Una sola ref válida basta para la forma (desfavorable no exige
    // información completa); ref desconocida se rechaza.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_not_supported",
        extras: [`data_item:${a.id}`],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([]);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_supported",
        extras: ["data_item:inexistente"],
        facts: sessionFacts(company, ctx1, ready),
      }).length,
    ).toBeGreaterThan(0);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_supported",
        extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }).length,
    ).toBeGreaterThan(0);
  });

  it("18. cuatro requisitos de información exigibles para supported", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", {});
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    const guard = getSpecialRegimeGuard(P503);
    if (!guard) throw new Error("sin guard");
    const base: FactMap = {
      "bio03.use_reviewed": "yes",
      "bio03.analysis_ready": "yes",
      "bio03.system_identified": "yes",
      "bio03.specific_purpose": "yes",
      "bio03.usage_period": "no",
      "bio03.rights_info": "yes",
    };
    const extras = [`data_item:${a.id}`];
    const blocked = guard.validateFinalization({
      company, ctx: ctx1, protocol: P503,
      conclusion: "biometric_conditions_supported",
      extras, facts: sessionFacts(company, ctx1, base),
    });
    expect(blocked.length).toBe(1);
    expect(blocked[0]).toContain("período de utilización");
    // Desfavorable no exige información completa.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_not_supported",
        extras, facts: sessionFacts(company, ctx1, base),
      }),
    ).toEqual([]);
    const full = sessionFacts(company, ctx1, { ...base, "bio03.usage_period": "yes" });
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P503,
        conclusion: "biometric_conditions_supported", extras, facts: full,
      }),
    ).toEqual([]);
    const res = finalizeJudgment({
      protocol: P503, company, facts: full,
      draft: { ...draftFor("biometric_conditions_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("sensitive.biometric_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "sensitive.biometric_status", value: "supported" },
    ]);
  });

  it("19. sin vía general art. 16 por analogía; stale tras cambios", () => {
    const keys = P503.nodes.map((n) => n.node_key);
    expect(keys).toContain("consent-route");
    expect(keys).toContain("noconsent-route");
    expect(JSON.stringify(P503)).not.toContain("manifestly_public");
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", {});
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    const guard = getSpecialRegimeGuard(P503);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "bio03.use_reviewed": "yes",
      "bio03.analysis_ready": "yes",
      "bio03.system_identified": "yes",
      "bio03.specific_purpose": "yes",
      "bio03.usage_period": "yes",
      "bio03.rights_info": "yes",
    };
    const facts = sessionFacts(company, ctx1, ready);
    const res = finalizeJudgment({
      protocol: P503, company, facts,
      draft: { ...draftFor("biometric_conditions_supported"), extra_facts_considered: [`data_item:${a.id}`] },
      legalBasis: basisFor("sensitive.biometric_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P503, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    // Unlink del referenciado → stale.
    const un = removeDataPurposeLink(applied, treatmentId, { dataId: a.id, purposeId: p1 });
    if (!un) throw new Error("sin unlink");
    expect(
      getRecordedJudgment(P503, un, sessionFacts(un, ctx1, ready), ctx1).status,
    ).toBe("stale");
    // Perfil yes→no → stale (candidatura ausente).
    const off = setSpecialRegimeProfile(applied, treatmentId, p1, {
      biometricIdentificationUse: "no",
    });
    if (!off) throw new Error("sin off");
    expect(
      getRecordedJudgment(P503, off, sessionFacts(off, ctx1, ready), ctx1).status,
    ).toBe("stale");
    // Delete del referenciado → stale.
    const del = deleteDataItem(applied, treatmentId, a.id);
    if (!del) throw new Error("sin delete");
    expect(
      getRecordedJudgment(P503, del, sessionFacts(del, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });

  it("20. aislamiento entre purposes del mismo treatment", () => {
    let { company, treatmentId, p1, p2, ctx2 } = setup();
    const a = mustItem(company, treatmentId, "A", {});
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    expect(
      deriveD5CandidatesForPurpose(company, treatmentId, p2)?.[
        "derived.purpose.d5_biometric_candidate"
      ],
    ).toBeUndefined();
    expect(
      getRecordedJudgment(P503, company, sessionFacts(company, ctx2), ctx2).status,
    ).toBe("none");
  });
});

describe("D5 integración rama sensible→salud→biometría", () => {
  it("21. caso A: solo sensible general", () => {
    let { company, treatmentId, p1 } = setup();
    const a = mustItem(company, treatmentId, "A", {
      sensitive: "yes",
      health: "no",
      biologicalProfile: "no",
      geolocation: "no",
    });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_health_biological_candidate"]).toBe("no");
    expect(c?.["derived.purpose.d5_biometric_candidate"]).toBeUndefined();
    // Sin implicancias: D5.02/D5.03 no indicados.
    expect(c?.["derived.purpose.d5_minors_candidate"]).toBeUndefined();
  });

  it("22. caso B: salud requiere D5.01 y D5.02 independientes", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes", health: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_health_biological_candidate"]).toBe("yes");
    const ready: FactMap = {
      "sens01.items_reviewed": "yes",
      "sens01.analysis_ready": "yes",
    };
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    const res = finalizeJudgment({
      protocol: P501, company,
      facts: sessionFacts(company, ctx1, ready),
      draft: {
        ...draftFor("lawful_path_supported"),
        extra_facts_considered: guard.composeRefs(company, ctx1, []),
      },
      legalBasis: basisFor("sensitive.lawfulness_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar D5.01");
    const applied = applyScopedFinalization(company, P501, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    // D5.01 completo no completa D5.02: sin record ni effects allí.
    expect(
      getRecordedJudgment(P502, applied, sessionFacts(applied, ctx1), ctx1).status,
    ).toBe("none");
    expect(
      applied.treatments?.[treatmentId]?.purposes[p1]?.protocolAnswers[P502.protocol_key],
    ).toBeUndefined();
  });

  it("23. caso C: biométrico independiente sin arrastre sensible", () => {
    let { company, treatmentId, p1 } = setup();
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_biometric_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("no");
    expect(c?.["derived.purpose.d5_health_biological_candidate"]).toBeUndefined();
  });

  it("24. caso D: triple overlap, tres guías y resultados independientes", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", {
      sensitive: "yes",
      health: "yes",
      biologicalProfile: "no",
    });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const p = setSpecialRegimeProfile(company, treatmentId, p1, {
      biometricIdentificationUse: "yes",
    });
    if (!p) throw new Error("sin profile");
    company = p;
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_health_biological_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_biometric_candidate"]).toBe("yes");
    // Sin jerarquía: ningún finalize escribe facts de otro régimen.
    for (const [proto, key, conclusion, ready] of [
      [P501, "sensitive.lawfulness_assess", "lawful_path_supported", {
        "sens01.items_reviewed": "yes", "sens01.analysis_ready": "yes",
      }],
      [P502, "sensitive.health_biological_assess", "conditions_supported", {
        "health02.items_reviewed": "yes", "health02.analysis_ready": "yes",
        "health02.route_main": "medicine_route", "health02.prohibition_state": "not_relevant",
      }],
      [P503, "sensitive.biometric_assess", "biometric_conditions_supported", {
        "bio03.use_reviewed": "yes", "bio03.analysis_ready": "yes",
        "bio03.system_identified": "yes", "bio03.specific_purpose": "yes",
        "bio03.usage_period": "yes", "bio03.rights_info": "yes",
      }],
    ] as const) {
      const g = getSpecialRegimeGuard(proto);
      if (!g) throw new Error("sin guard");
      const facts = sessionFacts(company, ctx1, { ...ready });
      const extras =
        proto === P503 ? [`data_item:${a.id}`] : g.composeRefs(company, ctx1, []);
      const errors = g.validateFinalization({
        company, ctx: ctx1, protocol: proto, conclusion, extras, facts,
      });
      expect(errors, key).toEqual([]);
    }
  });
});
