import { describe, expect, it } from "vitest";
import { SENSITIVE_LAWFULNESS_ASSESS_PROTOCOL as P501 } from "../content/protocols/sensitive.lawfulness_assess";
import { SENSITIVE_HEALTH_BIOLOGICAL_ASSESS_PROTOCOL as P502 } from "../content/protocols/sensitive.health_biological_assess";
import { SENSITIVE_BIOMETRIC_ASSESS_PROTOCOL as P503 } from "../content/protocols/sensitive.biometric_assess";
import { MINORS_PROCESSING_ASSESS_PROTOCOL as P504 } from "../content/protocols/minors.processing_assess";
import { RESEARCH_PUBLIC_INTEREST_ASSESS_PROTOCOL as P505 } from "../content/protocols/research.public_interest_assess";
import { GEOLOCATION_REQUIREMENTS_ASSESS_PROTOCOL as P506 } from "../content/protocols/geolocation.requirements_assess";
import { FINANCIAL_TITLEIII_SCOPE_PROTOCOL as P507 } from "../content/protocols/financial.titleIII_scope";
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
import {
  createPurpose,
  createTreatment,
  saveScopedProtocolAnswer,
} from "../src/workspace/scope";
import {
  applyScopedProcedureFinalization,
  validateScopedProcedureFinalization,
} from "../src/workspace/finalize";
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
  readLawfulnessRoute,
  validateSpecialRegimeCoherence,
} from "../src/workspace/specialRegime";
import { isSpecialRegimeGuideProtocol } from "../src/workspace/specialRegimeGuards";
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

describe("D5.04 minors.processing_assess (decision, purpose)", () => {
  it("25. registrado con modo, scope, reasoning y efectos canónicos", () => {
    expect(getProtocolForActivity("minors.processing_assess")).toBe(P504);
    expect(P504.protocol_key).toBe("minors.processing_assess.v1");
    expect(P504.mode).toBe("decision");
    expect(P504.execution_scope).toBe("purpose");
    expect(P504.version).toBe(1);
    expect(getCanonicalActivity(P504.activity_key)?.human_code).toBe("D5.04");
    expect(getCanonicalActivity(P504.activity_key)?.reasoning_record_required).toBe(true);
    expect(validateProtocolStructure(P504)).toEqual([]);
    expect(P504.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "minor_processing_supported",
        "minor_processing_not_supported",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
  });

  it("26. candidatura yes/no/unknown gobierna la entrada", () => {
    const { company, ctx1 } = setup();
    expect(evaluateProtocol(P504, sessionFacts(company, ctx1, {
      "derived.purpose.d5_minors_candidate": "yes",
    })).status).toBe("awaiting_facts");
    expect(
      mustOutcome(P504, sessionFacts(company, ctx1, {
        "derived.purpose.d5_minors_candidate": "no",
      })).outcome_key,
    ).toBe("regime_not_indicated");
    expect(
      mustOutcome(P504, sessionFacts(company, ctx1)).outcome_key,
    ).toBe("classification_incomplete");
  });

  it("27. ramas de población y canon completo sin datos reales", () => {
    const keys = P504.nodes.map((n) => n.node_key);
    for (const k of [
      "children-present",
      "adolescents-present",
      "adolescent-sensitive-u16",
      "superior-interest",
      "progressive-autonomy",
      "children-consent",
      "adolescent-rules",
      "adolescent-sensitive-rule",
      "authorization-norm",
      "operational-design",
      "reinforced-protection",
      "education-obligations",
    ]) {
      expect(keys, k).toContain(k);
    }
    const blob = JSON.stringify(P504).toLowerCase();
    for (const forbidden of ["fecha de nacimiento", "edad individual", "nombre del menor", "representante individual"]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
    expect(P504.decision_fact_keys).toEqual([
      "derived.purpose.d5_minors_candidate",
      "minors04.items_reviewed",
      "minors04.analysis_ready",
    ]);
  });

  it("28. precondiciones: sin links o sensitive unknown bloquean", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const guard = getSpecialRegimeGuard(P504);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "minors04.items_reviewed": "yes",
      "minors04.analysis_ready": "yes",
    };
    // Cero links → bloqueado aunque candidate yes.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P504,
        conclusion: "minor_processing_supported", extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([
      "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
    ]);
    const a = mustItem(company, treatmentId, "A", { sensitive: "unknown" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P504,
        conclusion: "minor_processing_supported", extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }).length,
    ).toBeGreaterThan(0);
  });

  it("29. subregla <16: sin sensitive=yes no se exige; con yes exige población", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    // Todos no sensibles: subregla no exigible, vía libre con u16 unknown.
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P504);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "minors04.items_reviewed": "yes",
      "minors04.analysis_ready": "yes",
    };
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P504,
        conclusion: "minor_processing_supported", extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([]);
    // Con sensitive=yes y población u16 unknown → bloqueado.
    const b = mustItem(company, treatmentId, "B", { sensitive: "yes" });
    company = b.company;
    company = mustLink(company, treatmentId, b.id, p1);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P504,
        conclusion: "minor_processing_supported",
        extras: [`data_item:${b.id}`],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([
      "Determina si la finalidad involucra datos sensibles de adolescentes menores de dieciséis años antes de concluir.",
    ]);
    // Población determinada (no) → vía libre; refs exigidas para el yes.
    const ans = saveScopedProtocolAnswer(
      company, ctx1, P504.protocol_key, "minors04.adolescent_sensitive_u16", "no", P504.protocol_key,
    );
    if (!ans) throw new Error("sin answer");
    company = ans;
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P504,
        conclusion: "minor_processing_supported",
        extras: [`data_item:${b.id}`],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([]);
  });

  it("30. supported/not_supported con effects; falta de info no es not_supported", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P504);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "minors04.items_reviewed": "yes",
      "minors04.analysis_ready": "yes",
      "minors04.children_present": "yes",
      "minors04.superior_interest": "yes",
    };
    const facts = sessionFacts(company, ctx1, ready);
    const res = finalizeJudgment({
      protocol: P504, company, facts,
      draft: { ...draftFor("minor_processing_supported"), extra_facts_considered: [] },
      legalBasis: basisFor("minors.processing_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "minors.processing_status", value: "supported" },
    ]);
    const applied = applyScopedFinalization(company, P504, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P504, applied, sessionFacts(applied, ctx1, ready), ctx1).status,
    ).toBe("valid");
    // Sin base analizada no hay not_supported.
    expect(
      finalizeJudgment({
        protocol: P504, company,
        facts: sessionFacts(company, ctx1),
        draft: draftFor("minor_processing_not_supported"),
        legalBasis: basisFor("minors.processing_assess"), ctx: ctx1,
      }).ok,
    ).toBe(false);
  });

  it("31. refs sensibles y staleness ante población/items/links", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const pop = saveScopedProtocolAnswer(
      company, ctx1, P504.protocol_key, "minors04.adolescent_sensitive_u16", "no", P504.protocol_key,
    );
    if (!pop) throw new Error("sin población");
    company = pop;
    const guard = getSpecialRegimeGuard(P504);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "minors04.items_reviewed": "yes",
      "minors04.analysis_ready": "yes",
    };
    const extras = guard.composeRefs(company, ctx1, []);
    expect(extras).toContain(`data_item:${a.id}`);
    expect(extras.some((e) => e.startsWith("answer:minors04."))).toBe(true);
    const facts = sessionFacts(company, ctx1, ready);
    const res = finalizeJudgment({
      protocol: P504, company, facts,
      draft: { ...draftFor("minor_processing_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("minors.processing_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P504, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    const validFacts = sessionFacts(applied, ctx1, ready);
    expect(getRecordedJudgment(P504, applied, validFacts, ctx1).status).toBe("valid");
    // Cambio de población → stale.
    const ch = saveScopedProtocolAnswer(
      applied, ctx1, P504.protocol_key, "minors04.adolescent_sensitive_u16", "yes", P504.protocol_key,
    );
    if (!ch) throw new Error("sin cambio");
    expect(
      getRecordedJudgment(P504, ch, sessionFacts(ch, ctx1, ready), ctx1).status,
    ).toBe("stale");
    // Nuevo sensitive → stale; unlink → stale.
    const n = mustItem(applied, treatmentId, "Nuevo", { sensitive: "yes" });
    const moved = mustLink(n.company, treatmentId, n.id, p1);
    expect(
      getRecordedJudgment(P504, moved, sessionFacts(moved, ctx1, ready), ctx1).status,
    ).toBe("stale");
    const un = removeDataPurposeLink(applied, treatmentId, { dataId: a.id, purposeId: p1 });
    if (!un) throw new Error("sin unlink");
    expect(
      getRecordedJudgment(P504, un, sessionFacts(un, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });

  it("32. aislamiento entre purposes", () => {
    let { company, treatmentId, p1, p2, ctx2 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    expect(
      deriveD5CandidatesForPurpose(company, treatmentId, p2)?.[
        "derived.purpose.d5_minors_candidate"
      ],
    ).toBeUndefined();
    expect(
      getRecordedJudgment(P504, company, sessionFacts(company, ctx2), ctx2).status,
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

describe("D5.05 research.public_interest_assess (decision, purpose)", () => {
  it("33. registrado con modo, scope, reasoning y efectos canónicos", () => {
    expect(getProtocolForActivity("research.public_interest_assess")).toBe(P505);
    expect(P505.protocol_key).toBe("research.public_interest_assess.v1");
    expect(P505.mode).toBe("decision");
    expect(P505.execution_scope).toBe("purpose");
    expect(P505.version).toBe(1);
    expect(getCanonicalActivity(P505.activity_key)?.human_code).toBe("D5.05");
    expect(getCanonicalActivity(P505.activity_key)?.reasoning_record_required).toBe(true);
    expect(validateProtocolStructure(P505)).toEqual([]);
    expect(P505.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "special_regime_supported",
        "special_regime_not_supported",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
    expect(P505.decision_fact_keys).toEqual([
      "derived.purpose.d5_research_candidate",
      "res05.items_reviewed",
      "res05.exclusivity_verified",
      "res05.public_interest_verified",
      "res05.analysis_ready",
    ]);
  });

  it("34. candidatura gobierna la entrada", () => {
    const { company, ctx1 } = setup();
    expect(evaluateProtocol(P505, sessionFacts(company, ctx1, {
      "derived.purpose.d5_research_candidate": "yes",
    })).status).toBe("awaiting_facts");
    expect(
      mustOutcome(P505, sessionFacts(company, ctx1, {
        "derived.purpose.d5_research_candidate": "no",
      })).outcome_key,
    ).toBe("regime_not_indicated");
    expect(
      mustOutcome(P505, sessionFacts(company, ctx1)).outcome_key,
    ).toBe("classification_incomplete");
  });

  it("35. completitud: ≥1 link y sensitive clasificado", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const guard = getSpecialRegimeGuard(P505);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "res05.items_reviewed": "yes",
      "res05.exclusivity_verified": "yes",
      "res05.public_interest_verified": "yes",
      "res05.analysis_ready": "yes",
    };
    // Cero links → bloqueado.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }),
    ).toEqual([
      "Sin datos vinculados no hay evaluación operacional que cerrar: vincula al menos un dato a la finalidad.",
    ]);
    const a = mustItem(company, treatmentId, "A", { sensitive: "unknown" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras: [],
        facts: sessionFacts(company, ctx1, ready),
      }).length,
    ).toBeGreaterThan(0);
  });

  it("36. exclusividad e interés público exigidos por gate", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    // Sin exclusividad verificada no hay conclusión definitiva.
    expect(
      finalizeJudgment({
        protocol: P505, company,
        facts: sessionFacts(company, ctx1, {
          "res05.items_reviewed": "yes",
          "res05.public_interest_verified": "yes",
          "res05.analysis_ready": "yes",
        }),
        draft: draftFor("special_regime_supported"),
        legalBasis: basisFor("research.public_interest_assess"), ctx: ctx1,
      }).ok,
    ).toBe(false);
  });

  it("37. rama de riesgo solo con sensibles; publicación con anonimización", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P505);
    if (!guard) throw new Error("sin guard");
    const base: FactMap = {
      "res05.items_reviewed": "yes",
      "res05.exclusivity_verified": "yes",
      "res05.public_interest_verified": "yes",
      "res05.analysis_ready": "yes",
      "res05.publishes_results": "no",
    };
    const extras = guard.composeRefs(company, ctx1, []);
    // Riesgo sin evaluar → supported bloqueado.
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras,
        facts: sessionFacts(company, ctx1, base),
      }).length,
    ).toBeGreaterThan(0);
    // Riesgo + mitigación + resto → vía libre y supported con effects.
    const full = sessionFacts(company, ctx1, {
      ...base,
      "res05.risk_assessed": "yes",
      "res05.mitigation_sufficient": "yes",
    });
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras, facts: full,
      }),
    ).toEqual([]);
    const res = finalizeJudgment({
      protocol: P505, company, facts: full,
      draft: { ...draftFor("special_regime_supported"), extra_facts_considered: extras },
      legalBasis: basisFor("research.public_interest_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "research.public_interest_status", value: "supported" },
    ]);
    // Publicación sin anonimización bloquea supported; unknown también.
    for (const pub of ["yes", "unknown"] as const) {
      const f = sessionFacts(company, ctx1, {
        ...base,
        "res05.risk_assessed": "yes",
        "res05.mitigation_sufficient": "yes",
        "res05.publishes_results": pub,
        ...(pub === "yes" ? { "res05.publication_anonymized": "no" } : {}),
      });
      expect(
        guard.validateFinalization({
          company, ctx: ctx1, protocol: P505,
          conclusion: "special_regime_supported", extras, facts: f,
        }).length,
        `publishes=${pub}`,
      ).toBeGreaterThan(0);
    }
    // Publicación anonimizada → vía libre.
    const pubOk = sessionFacts(company, ctx1, {
      ...base,
      "res05.risk_assessed": "yes",
      "res05.mitigation_sufficient": "yes",
      "res05.publishes_results": "yes",
      "res05.publication_anonymized": "yes",
    });
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras, facts: pubOk,
      }),
    ).toEqual([]);
  });

  it("38. sin sensibles la rama de riesgo no bloquea; refs y staleness", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P505);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "res05.items_reviewed": "yes",
      "res05.exclusivity_verified": "yes",
      "res05.public_interest_verified": "yes",
      "res05.analysis_ready": "yes",
      "res05.publishes_results": "no",
    };
    const facts = sessionFacts(company, ctx1, ready);
    expect(
      guard.validateFinalization({
        company, ctx: ctx1, protocol: P505,
        conclusion: "special_regime_supported", extras: [], facts,
      }),
    ).toEqual([]);
    const res = finalizeJudgment({
      protocol: P505, company, facts,
      draft: draftFor("special_regime_supported"),
      legalBasis: basisFor("research.public_interest_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P505, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P505, applied, sessionFacts(applied, ctx1, ready), ctx1).status,
    ).toBe("valid");
    // Nuevo sensitive → stale.
    const n = mustItem(applied, treatmentId, "Nuevo", { sensitive: "yes" });
    const moved = mustLink(n.company, treatmentId, n.id, p1);
    expect(
      getRecordedJudgment(P505, moved, sessionFacts(moved, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });
});

describe("D5.06 geolocation.requirements_assess (checklist, purpose)", () => {
  it("39. registrado checklist purpose sin reasoning", () => {
    expect(getProtocolForActivity("geolocation.requirements_assess")).toBe(P506);
    expect(P506.protocol_key).toBe("geolocation.requirements_assess.v1");
    expect(P506.mode).toBe("checklist");
    expect(P506.execution_scope).toBe("purpose");
    expect(getCanonicalActivity(P506.activity_key)?.human_code).toBe("D5.06");
    expect(getCanonicalActivity(P506.activity_key)?.reasoning_record_required).toBe(false);
    expect(validateProtocolStructure(P506)).toEqual([]);
    expect(P506.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "requirements_satisfied",
        "remediation_required",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
  });

  // Sin candidatura hardcodeada: los tests de síntesis la aportan
  // explícitamente; los de reevaluación usan la derivada real del
  // estado (sessionFacts) para no enmascarar cambios estructurales.
  function geoFacts(over: FactMap = {}): FactMap {
    return {
      "lawful.consent_applies": "consent_yes",
      "geo06.items_classified": "yes",
      "geo06.info_clear": "yes",
      "geo06.info_type": "yes",
      "geo06.info_purpose": "yes",
      "geo06.info_duration": "yes",
      "geo06.third_party_sharing": "no",
      "geo06.third_party_disclosed": "na",
      ...over,
    };
  }

  it("40. candidatura gobierna; contexto D2 desconocido deja incompleto", () => {
    expect(
      mustOutcome(P506, geoFacts({ "derived.purpose.d5_geolocation_candidate": "yes" })).outcome_key,
    ).toBe("requirements_satisfied");
    expect(
      mustOutcome(P506, geoFacts({ "derived.purpose.d5_geolocation_candidate": "no" })).outcome_key,
    ).toBe("regime_not_indicated");
    expect(mustOutcome(P506, {}).outcome_key).toBe("classification_incomplete");
    // Parcial (candidatura sin checks) queda en espera, sin inventar.
    expect(
      evaluateProtocol(P506, {
        "derived.purpose.d5_geolocation_candidate": "yes",
        "lawful.consent_applies": "consent_yes",
      }).status,
    ).toBe("awaiting_facts");
    // Sin vía evaluada (sin facts D2) → incomplete con next a D2.05.
    const noRoute = mustOutcome(
      P506,
      geoFacts({
        "derived.purpose.d5_geolocation_candidate": "yes",
        "lawful.consent_applies": "unknown",
      }),
    );
    expect(noRoute.outcome_key).toBe("assessment_incomplete");
    // Vía art. 13 también vale como contexto evaluado (parcial: en espera).
    const art13 = evaluateProtocol(P506, {
      "derived.purpose.d5_geolocation_candidate": "yes",
      "lawful.consent_applies": "consent_no",
      "lawful.art13_source": "legal_obligation",
      "geo06.items_classified": "yes",
    });
    expect(art13.status).toBe("awaiting_facts");
    if (art13.status !== "awaiting_facts") throw new Error("se esperaba espera");
    expect(art13.current_node_key).toBe("check-clear-info");
  });

  it("41. satisfied con todo verificado; finalización addressed idempotente", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { geolocation: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const facts = sessionFacts(company, ctx1, geoFacts());
    expect(facts["derived.purpose.d5_geolocation_candidate"]).toBe("yes");
    expect(mustOutcome(P506, facts).outcome_key).toBe("requirements_satisfied");
    const validated = validateScopedProcedureFinalization(
      { protocol: P506, company, facts, outcomeKey: "requirements_satisfied" },
      ctx1,
    );
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error("debió validar");
    const once = applyScopedProcedureFinalization(company, P506, ctx1, validated.effects);
    if (!once) throw new Error("sin apply");
    expect(once.applied).toEqual(["geolocation.requirements_status"]);
    expect(
      once.company.treatments?.[treatmentId]?.purposes[p1]?.protocolAnswers[P506.protocol_key]?.[
        "geolocation.requirements_status"
      ]?.value,
    ).toBe("satisfied");
    // Idempotente: segunda aplicación no reescribe.
    const twice = applyScopedProcedureFinalization(once.company, P506, ctx1, validated.effects);
    if (!twice) throw new Error("sin re-apply");
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["geolocation.requirements_status"]);
    // Sin ReasoningRecord en ningún lado.
    expect(Object.keys(once.company.treatments?.[treatmentId]?.purposes[p1]?.reasoningRecords ?? {})).toEqual([]);
  });

  it("42. rama de terceros: yes exige disclosure; unknown deja incompleto", () => {
    const cand = { "derived.purpose.d5_geolocation_candidate": "yes" };
    // sharing yes + disclosed no → remediation.
    expect(
      mustOutcome(
        P506,
        geoFacts({ ...cand, "geo06.third_party_sharing": "yes", "geo06.third_party_disclosed": "no" }),
      ).outcome_key,
    ).toBe("remediation_required");
    // sharing yes + disclosed yes → satisfied.
    expect(
      mustOutcome(
        P506,
        geoFacts({ ...cand, "geo06.third_party_sharing": "yes", "geo06.third_party_disclosed": "yes" }),
      ).outcome_key,
    ).toBe("requirements_satisfied");
    // sharing unknown → incomplete (nunca remediation).
    expect(
      mustOutcome(P506, geoFacts({ ...cand, "geo06.third_party_sharing": "unknown" })).outcome_key,
    ).toBe("assessment_incomplete");
    // sharing no ignora disclosure.
    expect(
      mustOutcome(
        P506,
        geoFacts({ ...cand, "geo06.third_party_sharing": "no", "geo06.third_party_disclosed": "unknown" }),
      ).outcome_key,
    ).toBe("requirements_satisfied");
  });

  it("43. unknown informativo no es remediación; contexto cruzado rechazado", () => {
    const { company, treatmentId, p2 } = setup();
    const cand = { "derived.purpose.d5_geolocation_candidate": "yes" };
    expect(
      mustOutcome(P506, geoFacts({ ...cand, "geo06.info_type": "unknown" })).outcome_key,
    ).toBe("assessment_incomplete");
    expect(
      mustOutcome(P506, geoFacts({ ...cand, "geo06.info_type": "no" })).outcome_key,
    ).toBe("remediation_required");
    // Finalizar en purpose inexistente → inválido.
    const bad = validateScopedProcedureFinalization(
      { protocol: P506, company, facts: geoFacts(), outcomeKey: "requirements_satisfied" },
      { scope: "purpose", companyId: company.id, treatmentId, purposeId: "inexistente" },
    );
    expect(bad.ok).toBe(false);
    // P2 sin links ni clasificación: candidate ausente → classification.
    const ctx2: ExecutionContext = {
      scope: "purpose", companyId: company.id, treatmentId, purposeId: p2,
    };
    expect(
      mustOutcome(P506, sessionFacts(company, ctx2, {
        "lawful.consent_applies": "consent_yes",
        "geo06.items_classified": "yes",
      })).outcome_key,
    ).toBe("classification_incomplete");
  });

  it("44. reevaluación ante cambios de signals, links y contexto D2", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", { geolocation: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const base = sessionFacts(company, ctx1, geoFacts());
    expect(mustOutcome(P506, base).outcome_key).toBe("requirements_satisfied");
    // Señal a no → candidate no → régimen no indicado.
    const off = updateDataItem(company, treatmentId, a.id, { geolocation: "no" });
    if (!off) throw new Error("sin update");
    expect(mustOutcome(P506, sessionFacts(off, ctx1, geoFacts())).outcome_key).toBe(
      "regime_not_indicated",
    );
    // Unlink → candidate ausente → clasificación incompleta.
    const un = removeDataPurposeLink(company, treatmentId, { dataId: a.id, purposeId: p1 });
    if (!un) throw new Error("sin unlink");
    expect(mustOutcome(P506, sessionFacts(un, ctx1, geoFacts())).outcome_key).toBe(
      "classification_incomplete",
    );
    // Contexto D2 a unknown → verificación incompleta.
    expect(
      mustOutcome(P506, sessionFacts(company, ctx1, geoFacts({ "lawful.consent_applies": "unknown" }))).outcome_key,
    ).toBe("assessment_incomplete");
  });
});

describe("D5.07 financial.titleIII_scope (decision, purpose)", () => {
  function answerD2(s: { company: CompanyState; treatmentId: string; p1: string }, consent: string, source: string) {
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
    };
    const a = saveScopedProtocolAnswer(s.company, ctx, "lawful_basis.assign.v1", "lawful.consent_applies", consent, "lawful_basis.assign.v1");
    if (!a) throw new Error("sin consent");
    s.company = a;
    const b = saveScopedProtocolAnswer(s.company, ctx, "lawful_basis.assign.v1", "lawful.art13_source", source, "lawful_basis.assign.v1");
    if (!b) throw new Error("sin source");
    s.company = b;
  }

  it("45. registrado; tres outcomes definitivos con effects exactos", () => {
    expect(getProtocolForActivity("financial.titleIII_scope")).toBe(P507);
    expect(P507.protocol_key).toBe("financial.titleIII_scope.v1");
    expect(P507.mode).toBe("decision");
    expect(P507.execution_scope).toBe("purpose");
    expect(validateProtocolStructure(P507)).toEqual([]);
    expect(P507.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "titleIII_out_of_scope",
        "titleIII_in_scope_requirements_satisfied",
        "titleIII_in_scope_remediation_required",
        "assessment_incomplete",
        "classification_incomplete",
        "regime_not_indicated",
      ].sort(),
    );
    const eff = (k: string) =>
      P507.outcomes.find((o) => o.outcome_key === k)?.canonical_fact_effects;
    expect(eff("titleIII_out_of_scope")).toEqual([
      { fact_key: "financial.titleIII_scope_status", value: "out_of_scope" },
    ]);
    expect(eff("titleIII_in_scope_requirements_satisfied")).toEqual([
      { fact_key: "financial.titleIII_scope_status", value: "in_scope" },
      { fact_key: "financial.titleIII_requirements_status", value: "satisfied" },
    ]);
    expect(eff("titleIII_in_scope_remediation_required")).toEqual([
      { fact_key: "financial.titleIII_scope_status", value: "in_scope" },
      { fact_key: "financial.titleIII_requirements_status", value: "remediation_required" },
    ]);
    const keys = P507.nodes.map((n) => n.node_key);
    for (const k of [
      "route-confirm", "obligation-nature", "art17-fit", "art17-exclusions",
      "art17-special", "decree-conditions", "prescription-capacity",
      "five-year-rule", "payment-extinction", "judicial-context",
      "creditor-notification", "debtor-request", "downstream-update",
      "update-deadline", "temp-blocking", "scope-select", "requirements-select",
    ]) {
      expect(keys, k).toContain(k);
    }
  });

  it("46. candidatura desde el bridge D2 vigente", () => {
    const s = setup();
    expect(
      deriveD5CandidatesForPurpose(s.company, s.treatmentId, s.p1)?.["derived.purpose.d5_titleIII_candidate"],
    ).toBeUndefined();
    answerD2(s, "consent_no", "financial_titleIII");
    expect(
      deriveD5CandidatesForPurpose(s.company, s.treatmentId, s.p1)?.["derived.purpose.d5_titleIII_candidate"],
    ).toBe("yes");
    expect(
      evaluateProtocol(P507, sessionFacts(s.company, { scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1 })).status,
    ).toBe("awaiting_facts");
    // Otra ruta afirmada → régimen no indicado.
    const s2 = setup();
    answerD2(s2, "consent_no", "legal_obligation");
    expect(
      mustOutcome(
        P507,
        sessionFacts(s2.company, { scope: "purpose", companyId: s2.company.id, treatmentId: s2.treatmentId, purposeId: s2.p1 }),
      ).outcome_key,
    ).toBe("regime_not_indicated");
  });

  it("47. sin links no hay ámbito; todos los vinculados exigidos", () => {
    const s = setup();
    answerD2(s, "consent_no", "financial_titleIII");
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
    };
    const ready: FactMap = {
      "fin07.items_reviewed": "yes",
      "fin07.analysis_ready": "yes",
    };
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_in_scope_requirements_satisfied", extras: [],
        facts: sessionFacts(s.company, ctx, ready),
      }),
    ).toEqual([
      "Sin datos vinculados no hay ámbito material que evaluar: vincula al menos un dato a la finalidad.",
    ]);
    const a = mustItem(s.company, s.treatmentId, "A", {});
    let c = a.company;
    const b = mustItem(c, s.treatmentId, "B", {});
    c = b.company;
    c = mustLink(c, s.treatmentId, a.id, s.p1);
    c = mustLink(c, s.treatmentId, b.id, s.p1);
    // Falta un vinculado → error con su etiqueta.
    const partial = guard.validateFinalization({
      company: c, ctx, protocol: P507,
      conclusion: "titleIII_in_scope_requirements_satisfied",
      extras: [`data_item:${a.id}`],
      facts: sessionFacts(c, ctx, ready),
    });
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.join(" ")).toContain("B");
    // Todos → sin error de refs (puede seguir faltando ámbito determinado).
    const full = guard.validateFinalization({
      company: c, ctx, protocol: P507,
      conclusion: "titleIII_in_scope_requirements_satisfied",
      extras: [`data_item:${a.id}`, `data_item:${b.id}`],
      facts: sessionFacts(c, ctx, ready),
    });
    expect(full.join(" ")).not.toContain("B");
  });

  it("48. compatibilidad conclusión↔ámbito; combinaciones imposibles bloqueadas", () => {
    const s = setup();
    answerD2(s, "consent_no", "financial_titleIII");
    const a = mustItem(s.company, s.treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, s.treatmentId, a.id, s.p1);
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
    };
    const ready: FactMap = {
      "fin07.items_reviewed": "yes",
      "fin07.analysis_ready": "yes",
    };
    const scopeIn = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.scope_assessed", "in_scope", P507.protocol_key,
    );
    if (!scopeIn) throw new Error("sin scope");
    s.company = scopeIn;
    const reqSat = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.requirements_assessed", "satisfied", P507.protocol_key,
    );
    if (!reqSat) throw new Error("sin req");
    s.company = reqSat;
    const extras = [`data_item:${a.id}`];
    // satisfied con ámbito+requisitos determinados → vía libre.
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_in_scope_requirements_satisfied", extras,
        facts: sessionFacts(s.company, ctx, ready),
      }),
    ).toEqual([]);
    // satisfied con scope out → imposible.
    const scopeOut = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.scope_assessed", "out_of_scope", P507.protocol_key,
    );
    if (!scopeOut) throw new Error("sin scope out");
    expect(
      guard.validateFinalization({
        company: scopeOut, ctx, protocol: P507,
        conclusion: "titleIII_in_scope_requirements_satisfied", extras,
        facts: sessionFacts(scopeOut, ctx, ready),
      }).length,
    ).toBeGreaterThan(0);
    // out_of_scope con scope in → imposible.
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_out_of_scope", extras,
        facts: sessionFacts(s.company, ctx, ready),
      }).length,
    ).toBeGreaterThan(0);
    // out_of_scope con scope out → vía libre.
    expect(
      guard.validateFinalization({
        company: scopeOut, ctx, protocol: P507,
        conclusion: "titleIII_out_of_scope", extras,
        facts: sessionFacts(scopeOut, ctx, ready),
      }),
    ).toEqual([]);
  });

  it("49. out_of_scope finaliza sin tocar D2; effects exactos e idempotencia", () => {
    const s = setup();
    answerD2(s, "consent_no", "financial_titleIII");
    const a = mustItem(s.company, s.treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, s.treatmentId, a.id, s.p1);
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
    };
    const scopeOut = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.scope_assessed", "out_of_scope", P507.protocol_key,
    );
    if (!scopeOut) throw new Error("sin scope");
    s.company = scopeOut;
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "fin07.items_reviewed": "yes",
      "fin07.analysis_ready": "yes",
    };
    const facts = sessionFacts(s.company, ctx, ready);
    const extras = guard.composeRefs(s.company, ctx, []);
    const res = finalizeJudgment({
      protocol: P507, company: s.company, facts,
      draft: { ...draftFor("titleIII_out_of_scope"), extra_facts_considered: extras },
      legalBasis: basisFor("financial.titleIII_scope"), ctx,
    });
    if (!res.ok) throw new Error(`debió finalizar: ${JSON.stringify(res)}`);
    expect(res.effects).toEqual([
      { fact_key: "financial.titleIII_scope_status", value: "out_of_scope" },
    ]);
    const applied = applyScopedFinalization(s.company, P507, ctx, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    // D2 intacto: la ruta sigue afirmada, sin requirements positivo.
    const t = applied.treatments?.[s.treatmentId];
    expect(t?.purposes[s.p1]?.protocolAnswers["lawful_basis.assign.v1"]?.["lawful.art13_source"]?.value).toBe(
      "financial_titleIII",
    );
    expect(
      t?.purposes[s.p1]?.protocolAnswers[P507.protocol_key]?.["financial.titleIII_requirements_status"],
    ).toBeUndefined();
    expect(
      getRecordedJudgment(P507, applied, sessionFacts(applied, ctx, ready), ctx).status,
    ).toBe("valid");
    // Idempotente: re-finalizar no duplica ni falla.
    const again = finalizeJudgment({
      protocol: P507, company: applied, facts: sessionFacts(applied, ctx, ready),
      draft: { ...draftFor("titleIII_out_of_scope"), extra_facts_considered: extras },
      legalBasis: basisFor("financial.titleIII_scope"), ctx,
    });
    expect(again.ok).toBe(true);
  });

  it("50. stale ante mapping, ruta D2 y respuestas materiales", () => {
    const s = setup();
    answerD2(s, "consent_no", "financial_titleIII");
    const a = mustItem(s.company, s.treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, s.treatmentId, a.id, s.p1);
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
    };
    const scopeIn = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.scope_assessed", "in_scope", P507.protocol_key,
    );
    if (!scopeIn) throw new Error("sin scope");
    s.company = scopeIn;
    const reqSat = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.requirements_assessed", "satisfied", P507.protocol_key,
    );
    if (!reqSat) throw new Error("sin req");
    s.company = reqSat;
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "fin07.items_reviewed": "yes",
      "fin07.analysis_ready": "yes",
    };
    const facts = sessionFacts(s.company, ctx, ready);
    const res = finalizeJudgment({
      protocol: P507, company: s.company, facts,
      draft: {
        ...draftFor("titleIII_in_scope_requirements_satisfied"),
        extra_facts_considered: guard.composeRefs(s.company, ctx, []),
      },
      legalBasis: basisFor("financial.titleIII_scope"), ctx,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(s.company, P507, ctx, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    const vf = sessionFacts(applied, ctx, ready);
    expect(getRecordedJudgment(P507, applied, vf, ctx).status).toBe("valid");
    // Nuevo link → stale.
    const n = mustItem(applied, s.treatmentId, "Nuevo", {});
    const moved = mustLink(n.company, s.treatmentId, n.id, s.p1);
    expect(
      getRecordedJudgment(P507, moved, sessionFacts(moved, ctx, ready), ctx).status,
    ).toBe("stale");
    // Ruta D2 cambia → stale (candidatura ausente).
    const route = saveScopedProtocolAnswer(
      applied, ctx, "lawful_basis.assign.v1", "lawful.art13_source", "legal_obligation", "lawful_basis.assign.v1",
    );
    if (!route) throw new Error("sin cambio ruta");
    expect(
      getRecordedJudgment(P507, route, sessionFacts(route, ctx, ready), ctx).status,
    ).toBe("stale");
    // Respuesta material cambia (scope in→out) → stale por snapshot.
    const flip = saveScopedProtocolAnswer(
      applied, ctx, P507.protocol_key, "fin07.scope_assessed", "out_of_scope", P507.protocol_key,
    );
    if (!flip) throw new Error("sin flip");
    expect(
      getRecordedJudgment(P507, flip, sessionFacts(flip, ctx, ready), ctx).status,
    ).toBe("stale");
    // Unlink → stale.
    const un = removeDataPurposeLink(applied, s.treatmentId, { dataId: a.id, purposeId: s.p1 });
    if (!un) throw new Error("sin unlink");
    expect(
      getRecordedJudgment(P507, un, sessionFacts(un, ctx, ready), ctx).status,
    ).toBe("stale");
  });
});

describe("D5 revisión (hallazgos corregidos)", () => {
  it("56. staleness D5.05 ante cambios en riesgo/publicación", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P505);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "res05.items_reviewed": "yes",
      "res05.exclusivity_verified": "yes",
      "res05.public_interest_verified": "yes",
      "res05.analysis_ready": "yes",
      "res05.publishes_results": "no",
      "res05.risk_assessed": "yes",
      "res05.mitigation_sufficient": "yes",
    };
    // Registrar riesgo/publicación como answers para el snapshot.
    for (const [k, v] of Object.entries({
      "res05.risk_assessed": "yes",
      "res05.mitigation_sufficient": "yes",
      "res05.publishes_results": "no",
    })) {
      const w = saveScopedProtocolAnswer(company, ctx1, P505.protocol_key, k, v, P505.protocol_key);
      if (!w) throw new Error("sin answer");
      company = w;
    }
    const facts = sessionFacts(company, ctx1, ready);
    const res = finalizeJudgment({
      protocol: P505, company, facts,
      draft: {
        ...draftFor("special_regime_supported"),
        extra_facts_considered: guard.composeRefs(company, ctx1, []),
      },
      legalBasis: basisFor("research.public_interest_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(company, P505, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P505, applied, sessionFacts(applied, ctx1, ready), ctx1).status,
    ).toBe("valid");
    // Flip en mitigación → stale por snapshot.
    const flip = saveScopedProtocolAnswer(
      applied, ctx1, P505.protocol_key, "res05.mitigation_sufficient", "no", P505.protocol_key,
    );
    if (!flip) throw new Error("sin flip");
    expect(
      getRecordedJudgment(P505, flip, sessionFacts(flip, ctx1, ready), ctx1).status,
    ).toBe("stale");
  });

  it("57. Título III: requirements residual no bloquea out_of_scope", () => {
    // Los flujos no lineales pueden determinar requisitos antes que el
    // ámbito; sin des-respuesta individual, bloquear sería callejón sin
    // salida. La combinación imposible de EFFECTS ya es inexpresable
    // (out_of_scope solo escribe scope_status).
    let { company, treatmentId, p1 } = setup();
    const s = { company, treatmentId, p1 };
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: company.id, treatmentId, purposeId: p1,
    };
    for (const [k, v] of [
      ["lawful.consent_applies", "consent_no"],
      ["lawful.art13_source", "financial_titleIII"],
    ] as const) {
      const r = saveScopedProtocolAnswer(s.company, ctx, "lawful_basis.assign.v1", k, v, "lawful_basis.assign.v1");
      if (!r) throw new Error(`sin ${k}`);
      s.company = r;
    }
    const w = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.scope_assessed", "out_of_scope", P507.protocol_key,
    );
    if (!w) throw new Error("sin scope");
    s.company = w;
    const w2 = saveScopedProtocolAnswer(
      s.company, ctx, P507.protocol_key, "fin07.requirements_assessed", "satisfied", P507.protocol_key,
    );
    if (!w2) throw new Error("sin req");
    s.company = w2;
    const a = mustItem(s.company, treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_out_of_scope",
        extras: [`data_item:${a.id}`],
        facts: sessionFacts(s.company, ctx, {
          "fin07.items_reviewed": "yes", "fin07.analysis_ready": "yes",
        }),
      }),
    ).toEqual([]);
  });

  it("57b. vía por decreto exige norma identificada y staleness de ref", () => {
    let { company, treatmentId, p1 } = setup();
    const s = { company, treatmentId, p1 };
    const ctx0: ExecutionContext = {
      scope: "purpose", companyId: company.id, treatmentId, purposeId: p1,
    };
    for (const [k, v] of [
      ["lawful.consent_applies", "consent_no"],
      ["lawful.art13_source", "financial_titleIII"],
    ] as const) {
      const w = saveScopedProtocolAnswer(s.company, ctx0, "lawful_basis.assign.v1", k, v, "lawful_basis.assign.v1");
      if (!w) throw new Error(`sin ${k}`);
      s.company = w;
    }
    const ctx: ExecutionContext = {
      scope: "purpose", companyId: company.id, treatmentId, purposeId: p1,
    };
    const ans = (k: string, v: string) => {
      const w = saveScopedProtocolAnswer(s.company, ctx, P507.protocol_key, k, v, P507.protocol_key);
      if (!w) throw new Error(`sin ${k}`);
      s.company = w;
    };
    ans("fin07.scope_assessed", "in_scope");
    ans("fin07.requirements_assessed", "satisfied");
    ans("fin07.decree_conditions", "yes");
    const a = mustItem(s.company, treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, treatmentId, a.id, p1);
    const guard = getSpecialRegimeGuard(P507);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "fin07.items_reviewed": "yes",
      "fin07.analysis_ready": "yes",
      "fin07.decree_conditions": "yes",
    };
    const extras = [`data_item:${a.id}`];
    // Sin norma citada → supported bloqueado.
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_in_scope_requirements_satisfied", extras,
        facts: sessionFacts(s.company, ctx, ready),
      }),
    ).toContain(
      "Identifica el decreto o norma invocada antes de concluir con la vía por decreto.",
    );
    ans("fin07.decree_ref", "DS 123");
    const readyFull: FactMap = { ...ready, "fin07.decree_ref": "DS 123" };
    expect(
      guard.validateFinalization({
        company: s.company, ctx, protocol: P507,
        conclusion: "titleIII_in_scope_requirements_satisfied",
        extras: guard.composeRefs(s.company, ctx, []),
        facts: sessionFacts(s.company, ctx, readyFull),
      }),
    ).toEqual([]);
    // Editar la ref post-record → stale por snapshot.
    const res = finalizeJudgment({
      protocol: P507, company: s.company,
      facts: sessionFacts(s.company, ctx, ready),
      draft: {
        ...draftFor("titleIII_in_scope_requirements_satisfied"),
        extra_facts_considered: guard.composeRefs(s.company, ctx, []),
      },
      legalBasis: basisFor("financial.titleIII_scope"), ctx,
    });
    if (!res.ok) throw new Error("debió finalizar");
    const applied = applyScopedFinalization(s.company, P507, ctx, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    const edit = saveScopedProtocolAnswer(
      applied, ctx, P507.protocol_key, "fin07.decree_ref", "DS 456", P507.protocol_key,
    );
    if (!edit) throw new Error("sin edit");
    expect(
      getRecordedJudgment(P507, edit, sessionFacts(edit, ctx, ready), ctx).status,
    ).toBe("stale");
  });

  it("58. decreto invocado exige norma citada; contexto visible en D5.06", () => {
    expect(isSpecialRegimeGuideProtocol(P506)).toBe(true);
    expect(isSpecialRegimeGuideProtocol(P501)).toBe(true);
    expect(isSpecialRegimeGuideProtocol(P505)).toBe(true);
    // Checklist no-juicio genérico fuera de D5: sin contexto estructural.
    expect(
      isSpecialRegimeGuideProtocol(
        getProtocolForActivity("consent.proof_design")!,
      ),
    ).toBe(false);
  });
});

describe("D5 integración multirrégimen (casos A–E)", () => {
  it("51. caso A: NNA + sensible, D5.01 y D5.04 independientes", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_minors_candidate"]).toBe("yes");
    const guard = getSpecialRegimeGuard(P501);
    if (!guard) throw new Error("sin guard");
    const res = finalizeJudgment({
      protocol: P501, company,
      facts: sessionFacts(company, ctx1, {
        "sens01.items_reviewed": "yes", "sens01.analysis_ready": "yes",
      }),
      draft: {
        ...draftFor("lawful_path_supported"),
        extra_facts_considered: guard.composeRefs(company, ctx1, []),
      },
      legalBasis: basisFor("sensitive.lawfulness_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar D5.01");
    const applied = applyScopedFinalization(company, P501, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    expect(
      getRecordedJudgment(P504, applied, sessionFacts(applied, ctx1), ctx1).status,
    ).toBe("none");
  });

  it("52. caso B: investigación + sensible, rama de riesgo D5.05", () => {
    let { company, treatmentId, p1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, {
      researchPublicInterestCandidate: "yes",
    });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "yes" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_research_candidate"]).toBe("yes");
    // Rama de riesgo exigible: sin risk_assessed no hay supported.
    const guard = getSpecialRegimeGuard(P505);
    if (!guard) throw new Error("sin guard");
    const ready: FactMap = {
      "res05.items_reviewed": "yes",
      "res05.exclusivity_verified": "yes",
      "res05.public_interest_verified": "yes",
      "res05.analysis_ready": "yes",
      "res05.publishes_results": "no",
    };
    expect(
      guard.validateFinalization({
        company,
        ctx: { scope: "purpose", companyId: company.id, treatmentId, purposeId: p1 },
        protocol: P505,
        conclusion: "special_regime_supported",
        extras: guard.composeRefs(
          company,
          { scope: "purpose", companyId: company.id, treatmentId, purposeId: p1 },
          [],
        ),
        facts: sessionFacts(company, {
          scope: "purpose", companyId: company.id, treatmentId, purposeId: p1,
        }, ready),
      }).length,
    ).toBeGreaterThan(0);
  });

  it("53. caso C: solo geolocalización, sin inferencia sensible", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const a = mustItem(company, treatmentId, "A", {
      sensitive: "no",
      geolocation: "yes",
    });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const c = deriveD5CandidatesForPurpose(company, treatmentId, p1);
    expect(c?.["derived.purpose.d5_geolocation_candidate"]).toBe("yes");
    expect(c?.["derived.purpose.d5_sensitive_candidate"]).toBe("no");
    expect(
      mustOutcome(P506, sessionFacts(company, ctx1, {
        "derived.purpose.d5_geolocation_candidate": "yes",
        "lawful.consent_applies": "consent_yes",
        "geo06.items_classified": "yes",
        "geo06.info_clear": "yes",
        "geo06.info_type": "yes",
        "geo06.info_purpose": "yes",
        "geo06.info_duration": "yes",
        "geo06.third_party_sharing": "no",
        "geo06.third_party_disclosed": "na",
      })).outcome_key,
    ).toBe("requirements_satisfied");
  });

  it("54. caso D: ruta financiera con out_of_scope sin tocar D2", () => {
    const s = setup();
    const ans = (consent: string, source: string) => {
      const ctx: ExecutionContext = {
        scope: "purpose", companyId: s.company.id, treatmentId: s.treatmentId, purposeId: s.p1,
      };
      const a = saveScopedProtocolAnswer(s.company, ctx, "lawful_basis.assign.v1", "lawful.consent_applies", consent, "lawful_basis.assign.v1");
      if (!a) throw new Error("sin consent");
      s.company = a;
      const b = saveScopedProtocolAnswer(s.company, ctx, "lawful_basis.assign.v1", "lawful.art13_source", source, "lawful_basis.assign.v1");
      if (!b) throw new Error("sin source");
      s.company = b;
    };
    ans("consent_no", "financial_titleIII");
    const a = mustItem(s.company, s.treatmentId, "A", {});
    s.company = a.company;
    s.company = mustLink(s.company, s.treatmentId, a.id, s.p1);
    expect(
      deriveD5CandidatesForPurpose(s.company, s.treatmentId, s.p1)?.["derived.purpose.d5_titleIII_candidate"],
    ).toBe("yes");
    // D2 sigue afirmando la ruta mientras D5.07 evalúa ámbito.
    expect(
      readLawfulnessRoute(s.company, s.treatmentId, s.p1).source,
    ).toBe("financial_titleIII");
  });

  it("55. caso E: misma purpose con resultados canónicos coexistentes", () => {
    let { company, treatmentId, p1, ctx1 } = setup();
    const prof = setSpecialRegimeProfile(company, treatmentId, p1, { involvesMinors: "yes" });
    if (!prof) throw new Error("sin profile");
    company = prof;
    const a = mustItem(company, treatmentId, "A", { sensitive: "no" });
    company = a.company;
    company = mustLink(company, treatmentId, a.id, p1);
    const ready01: FactMap = {
      "sens01.items_reviewed": "yes", "sens01.analysis_ready": "yes",
    };
    const g01 = getSpecialRegimeGuard(P501);
    if (!g01) throw new Error("sin guard");
    // D5.01 candidate no (all no) → no puede finalizar supported; D5.04 sí.
    expect(
      deriveD5CandidatesForPurpose(company, treatmentId, p1)?.["derived.purpose.d5_sensitive_candidate"],
    ).toBe("no");
    const ready04: FactMap = {
      "minors04.items_reviewed": "yes", "minors04.analysis_ready": "yes",
    };
    const g04 = getSpecialRegimeGuard(P504);
    if (!g04) throw new Error("sin guard");
    const res = finalizeJudgment({
      protocol: P504, company,
      facts: sessionFacts(company, ctx1, ready04),
      draft: { ...draftFor("minor_processing_supported"), extra_facts_considered: [] },
      legalBasis: basisFor("minors.processing_assess"), ctx: ctx1,
    });
    if (!res.ok) throw new Error("debió finalizar D5.04");
    const applied = applyScopedFinalization(company, P504, ctx1, res.record, res.effects);
    if (!applied) throw new Error("sin apply");
    // Coexisten sin conflicto: D5.04 supported + D5.01 sin juicio.
    expect(
      applied.treatments?.[treatmentId]?.purposes[p1]?.protocolAnswers[P504.protocol_key]?.[
        "minors.processing_status"
      ]?.value,
    ).toBe("supported");
    expect(
      getRecordedJudgment(P501, applied, sessionFacts(applied, ctx1, ready01), ctx1).status,
    ).toBe("none");
  });
});
