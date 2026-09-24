import { describe, expect, it } from "vitest";
import { CONSENT_MECHANISM_DESIGN_PROTOCOL as P303 } from "../content/protocols/consent.mechanism_design";
import { CONSENT_FREEDOM_ASSESS_PROTOCOL as P304 } from "../content/protocols/consent.freedom_assess";
import { CONSENT_PROOF_DESIGN_PROTOCOL as P305 } from "../content/protocols/consent.proof_design";
import { CONSENT_WITHDRAWAL_ENABLE_PROTOCOL as P306 } from "../content/protocols/consent.withdrawal_enable";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import type { LegalBasis } from "../src/types";
import type { CompanyState, ExecutionContext } from "../src/workspace/types";
import {
  findConclusionNode,
  getProtocolForActivity,
  listProtocols,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import {
  applyScopedProcedureFinalization,
  getFinalizableOutcome,
  validateScopedProcedureFinalization,
} from "../src/workspace/finalize";
import {
  applyScopedFinalization,
  finalizeJudgment,
  gatePasses,
  getRecordedJudgment,
} from "../src/workspace/reasoning";
import { considerationNodes } from "../src/workspace/reasoning";
import { newCompany } from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getUnresolvedReferences,
} from "../content/registry";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import {
  createPurpose,
  createTreatment,
  getScopedProtocolAnswers,
} from "../src/workspace/scope";

const BRIDGE = "lawful.consent_applies";
const FREEDOM = "consent.freedom_status";
const PROOF = "consent.proof_capability_status";
const WITHDRAWAL = "consent.withdrawal_status";

function mustOutcome(protocol: ExecutionProtocol, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

function mustTreatment(c: CompanyState, name: string) {
  const r = createTreatment(c, { name });
  if (!r) throw new Error(`sin treatment ${name}`);
  return { company: r.company, id: r.treatmentId };
}

function mustPurpose(c: CompanyState, treatmentId: string, description: string) {
  const r = createPurpose(c, treatmentId, description);
  if (!r) throw new Error(`sin purpose ${description}`);
  return { company: r.company, id: r.purposeId };
}

function purposeCtx(c: CompanyState, treatmentId: string, purposeId: string): ExecutionContext {
  return { scope: "purpose", companyId: c.id, treatmentId, purposeId };
}

function fullChecks(protocol: ExecutionProtocol, over: FactMap = {}): FactMap {
  return {
    ...Object.fromEntries(protocol.decision_fact_keys.map((k) => [k, "yes"])),
    ...over,
  };
}

function freedomFacts(over: FactMap = {}): FactMap {
  return {
    [BRIDGE]: "consent_yes",
    "consent.freedom.context_reviewed": "yes",
    "consent.freedom.contract_identified": "yes",
    "consent.freedom.necessity_presumption_reviewed": "yes",
    "consent.freedom.sole_exception_reviewed": "yes",
    "consent.freedom.background_reviewed": "yes",
    ...over,
  };
}

function freedomDraft(conclusion = "freedom_supported") {
  return {
    conclusion,
    legal_question: "¿Es libre el consentimiento en este contexto?",
    evidence_refs: ["Contrato y oferta v1"],
    rationale: "Contexto evaluado con presunción aplicable considerada.",
    decided_by: "Abogada",
    reviewed_by: "",
    decided_at: new Date().toISOString(),
  };
}

const FREEDOM_BASIS: LegalBasis[] = [
  {
    source_id: "cl_ley_19628_2026",
    source_name: "Ley N° 19.628",
    article_or_provision: "Artículo 12",
    reference_text: "",
    source_url: "",
    basis_type: "law",
    regulatory_status: "transitional",
    last_verified_at: "2026-09-21",
  },
];

function d303Facts(over: FactMap = {}): FactMap {
  return {
    [BRIDGE]: "consent_yes",
    ...fullChecks(P303),
    [FREEDOM]: "supported",
    [PROOF]: "designed",
    [WITHDRAWAL]: "enabled",
    ...over,
  };
}

describe("D3.03 consent.mechanism_design (procedure, purpose)", () => {
  it("1. registrado con modo, scope y bridge correctos", () => {
    expect(getProtocolForActivity("consent.mechanism_design")).toBe(P303);
    expect(P303.protocol_key).toBe("consent.mechanism_design.v1");
    expect(P303.mode).toBe("procedure");
    expect(P303.execution_scope).toBe("purpose");
    expect(P303.version).toBe(1);
    expect(P303.entry_node_key).toBe("route-gate");
    expect(getCanonicalActivity(P303.activity_key)?.human_code).toBe("D3.03");
    expect(P303.external_fact_keys).toEqual([BRIDGE, FREEDOM, PROOF, WITHDRAWAL]);
  });

  it("2. estructura válida; 9 checks propios sin duplicar D3.04–06", () => {
    expect(validateProtocolStructure(P303)).toEqual([]);
    expect(P303.decision_fact_keys).toHaveLength(9);
    expect(P303.nodes.map((n) => n.node_key)).toEqual([
      "route-gate",
      "check-purpose",
      "check-channel",
      "check-information",
      "check-specificity",
      "check-priority",
      "check-affirmative",
      "check-no-silence",
      "check-mandate",
      "check-documented",
      "synthesis",
    ]);
    expect(P303.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "mechanism_designed",
        "dependency_remediation_required",
        "remediation_required",
        "assessment_incomplete",
        "prerequisite_missing",
      ].sort(),
    );
    // Sin evaluación interna de libertad/prueba/retiro: solo dependencias.
    const blob = JSON.stringify(P303.nodes);
    expect(blob).not.toContain("freedom_supported");
    expect(blob).not.toContain("proof_capability_designed");
    expect(blob).not.toContain("withdrawal_enabled");
  });

  it("3. bridge: sin consent_yes no inicia", () => {
    expect(mustOutcome(P303, {}).outcome_key).toBe("prerequisite_missing");
    expect(
      mustOutcome(P303, d303Facts({ [BRIDGE]: "consent_no" })).outcome_key,
    ).toBe("prerequisite_missing");
    expect(
      mustOutcome(P303, d303Facts({ [BRIDGE]: "unknown" })).outcome_key,
    ).toBe("prerequisite_missing");
  });

  it("4. checks propios: mandatario na, brecha e incompleto", () => {
    expect(
      mustOutcome(
        P303,
        d303Facts({ "consent.mechanism.mandate_covered": "na" }),
      ).outcome_key,
    ).toBe("mechanism_designed");
    expect(
      mustOutcome(P303, d303Facts({ "consent.mechanism.channel_identified": "no" }))
        .outcome_key,
    ).toBe("remediation_required");
    expect(
      mustOutcome(P303, d303Facts({ "consent.mechanism.channel_identified": "unknown" }))
        .outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("5. Caso 1: checks completos pero D3.04 pendiente → no designed", () => {
    const e = mustOutcome(P303, d303Facts({ [FREEDOM]: "unknown" } as FactMap));
    expect(e.outcome_key).toBe("assessment_incomplete");
  });

  it("6. Caso 2: dependencias positivas → mechanism_designed con efecto", () => {
    const e = mustOutcome(P303, d303Facts());
    expect(e.outcome_key).toBe("mechanism_designed");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "consent.mechanism_status", value: "designed" },
    ]);
    expect(getFinalizableOutcome(P303, "mechanism_designed")).toBeTruthy();
    expect(getFinalizableOutcome(P303, "dependency_remediation_required")).toBeUndefined();
  });

  it("7. Casos 3–5: dependencias negativas bloquean designed", () => {
    expect(
      mustOutcome(P303, d303Facts({ [FREEDOM]: "not_supported" })).outcome_key,
    ).toBe("dependency_remediation_required");
    expect(
      mustOutcome(P303, d303Facts({ [PROOF]: "remediation_required" })).outcome_key,
    ).toBe("dependency_remediation_required");
    expect(
      mustOutcome(P303, d303Facts({ [WITHDRAWAL]: "remediation_required" })).outcome_key,
    ).toBe("dependency_remediation_required");
    // Sibling purpose no satisface: A1 sin deps propias sigue incompleto
    // aunque A2 tenga todo positivo (las vistas son por address).
    expect(
      mustOutcome(
        P303,
        fullChecks(P303, { [BRIDGE]: "consent_yes" }),
      ).outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("8. finalización purpose-scoped idempotente + next actions a D3.04–06", () => {
    let c = newCompany("Mecanismo SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p = mustPurpose(c, t.id, "P");
    c = p.company;
    const ctx = purposeCtx(c, t.id, p.id);
    const v = validateScopedProcedureFinalization(
      { protocol: P303, company: c, facts: d303Facts(), outcomeKey: "mechanism_designed" },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const once = applyScopedProcedureFinalization(c, P303, ctx, v.effects);
    expect(once?.applied).toEqual(["consent.mechanism_status"]);
    expect(
      getScopedProtocolAnswers(once!.company, ctx, P303.protocol_key)["consent.mechanism_status"]?.value,
    ).toBe("designed");
    const twice = applyScopedProcedureFinalization(once!.company, P303, ctx, v.effects);
    expect(twice?.applied).toEqual([]);
    expect(twice?.skipped).toEqual(["consent.mechanism_status"]);
    const dep = P303.outcomes.find((o) => o.outcome_key === "dependency_remediation_required");
    expect(dep?.next_actions.map((a) => a.activity_key).sort()).toEqual(
      ["consent.freedom_assess", "consent.proof_design", "consent.withdrawal_enable"].sort(),
    );
    for (const a of dep?.next_actions ?? []) {
      expect(a.kind).toBe("activity");
      expect(a.show_when).toBeTruthy();
    }
  });
});

describe("D3.04 consent.freedom_assess (decision + juicio, purpose)", () => {
  it("9. registrado con modo decision y prerrequisito de ruta", () => {
    expect(getProtocolForActivity("consent.freedom_assess")).toBe(P304);
    expect(P304.mode).toBe("decision");
    expect(P304.execution_scope).toBe("purpose");
    expect(P304.entry_node_key).toBe("prerequisite-gate");
    expect(getCanonicalActivity(P304.activity_key)?.human_code).toBe("D3.04");
    expect(P304.external_fact_keys).toEqual([BRIDGE]);
    expect(validateProtocolStructure(P304)).toEqual([]);
  });

  it("10. cinco factores exactos + nodo conclusión profesional", () => {
    expect(P304.decision_fact_keys).toEqual([
      "consent.freedom.context_reviewed",
      "consent.freedom.contract_identified",
      "consent.freedom.necessity_presumption_reviewed",
      "consent.freedom.sole_exception_reviewed",
      "consent.freedom.background_reviewed",
    ]);
    const conclusion = findConclusionNode(P304);
    expect(conclusion?.node_key).toBe("adopt-conclusion");
    expect(P304.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["freedom_supported", "freedom_not_supported", "assessment_incomplete", "prerequisite_missing"].sort(),
    );
  });

  it("11. sin ruta no entra; base completa habilita sin deducir", () => {
    expect(mustOutcome(P304, freedomFacts({ [BRIDGE]: "consent_no" })).outcome_key).toBe(
      "prerequisite_missing",
    );
    const e = evaluateProtocol(P304, freedomFacts());
    // La puerta deriva a factores; la conclusión queda pendiente: jamás auto-supported.
    expect(e.status === "outcome" && e.outcome_key === "freedom_supported").toBe(false);
  });

  it("12. presunción visible y en legal_factors", () => {
    const blob = JSON.stringify(P304.nodes);
    expect(blob).toContain("presunción");
    expect(blob).toContain("contraprestación única");
    const titles = considerationNodes(P304).map((n) => n.title);
    expect(titles.some((t) => t.toLowerCase().includes("presunción"))).toBe(true);
    // Sin scoring ni ponderaciones automáticas (el disclaimer
    // "ningún puntaje sustituye tu conclusión" niega, no afirma).
    expect(blob.toLowerCase()).not.toContain("scoring");
    expect(blob.toLowerCase()).not.toContain("threshold");
    expect(blob.toLowerCase()).not.toContain("ponderación");
    expect(blob).toContain("ningún puntaje sustituyen tu conclusión");
  });

  it("13. requirements del contrato (9 campos, sin record especial)", () => {
    expect(P304.reasoning_requirements?.required_fields).toEqual([
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ]);
  });

  it("14. juicio supported/not_supported con efectos + aislamiento A1/A2", () => {
    let c = newCompany("Libertad SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p1 = mustPurpose(c, t.id, "A1");
    c = p1.company;
    const p2 = mustPurpose(c, t.id, "A2");
    c = p2.company;
    const ctx1 = purposeCtx(c, t.id, p1.id);
    const ctx2 = purposeCtx(c, t.id, p2.id);
    expect(gatePasses(P304, c, freedomFacts(), ctx1)).toBe(true);
    const r = finalizeJudgment({
      protocol: P304,
      company: c,
      facts: freedomFacts(),
      draft: freedomDraft("freedom_supported"),
      legalBasis: FREEDOM_BASIS,
      ctx: ctx1,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.effects).toEqual([{ fact_key: "consent.freedom_status", value: "supported" }]);
    const applied = applyScopedFinalization(c, P304, ctx1, r.record, r.effects);
    if (!applied) throw new Error("sin aplicación");
    expect(
      applied.treatments?.[t.id]?.purposes[p1.id]?.protocolAnswers[P304.protocol_key]?.["consent.freedom_status"]?.value,
    ).toBe("supported");
    expect(getRecordedJudgment(P304, applied, freedomFacts(), ctx1).status).toBe("valid");
    expect(getRecordedJudgment(P304, applied, freedomFacts(), ctx2).status).toBe("none");
    // Rama negativa en A2.
    const rn = finalizeJudgment({
      protocol: P304,
      company: applied,
      facts: freedomFacts(),
      draft: freedomDraft("freedom_not_supported"),
      legalBasis: FREEDOM_BASIS,
      ctx: ctx2,
    });
    expect(rn.ok).toBe(true);
    if (!rn.ok) return;
    expect(rn.effects).toEqual([{ fact_key: "consent.freedom_status", value: "not_supported" }]);
  });
});

describe("D3.05 consent.proof_design (checklist, purpose)", () => {
  it("15. registrado con seis checks 1:1 y mandatario na", () => {
    expect(getProtocolForActivity("consent.proof_design")).toBe(P305);
    expect(P305.mode).toBe("checklist");
    expect(P305.execution_scope).toBe("purpose");
    expect(validateProtocolStructure(P305)).toEqual([]);
    expect(P305.decision_fact_keys).toHaveLength(6);
    expect(P305.nodes.map((n) => n.node_key)).toEqual([
      "route-gate",
      "check-manifestation",
      "check-purpose",
      "check-information",
      "check-priority",
      "check-mandate",
      "check-recovery",
      "synthesis",
    ]);
  });

  it("16. capacidad, no prueba individual; sin plazo inventado", () => {
    const blob = JSON.stringify(P305).toLowerCase();
    for (const forbidden of ["cada titular", "por persona", "timestamp", "withdrawalevent", "consentrecord"]) {
      expect(blob).not.toContain(forbidden);
    }
    expect(blob).not.toContain("plazo");
    expect(mustOutcome(P305, fullChecks(P305, { [BRIDGE]: "consent_yes" })).outcome_key).toBe(
      "proof_capability_designed",
    );
  });

  it("17. designed/remediation con efectos + scope isolation", () => {
    let c = newCompany("Prueba SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p = mustPurpose(c, t.id, "P");
    c = p.company;
    const ctx = purposeCtx(c, t.id, p.id);
    const facts = fullChecks(P305, {
      [BRIDGE]: "consent_yes",
      "consent.proof.mandate_recorded": "na",
    });
    expect(mustOutcome(P305, facts).outcome_key).toBe("proof_capability_designed");
    const v = validateScopedProcedureFinalization(
      { protocol: P305, company: c, facts, outcomeKey: "proof_capability_designed" },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(c, P305, ctx, v.effects);
    expect(
      getScopedProtocolAnswers(applied!.company, ctx, P305.protocol_key)["consent.proof_capability_status"]?.value,
    ).toBe("designed");
    expect(applied!.company.protocolAnswers[P305.protocol_key]).toBeUndefined();
    const vr = validateScopedProcedureFinalization(
      {
        protocol: P305,
        company: applied!.company,
        facts: fullChecks(P305, { [BRIDGE]: "consent_yes", "consent.proof.priority_provable": "no" }),
        outcomeKey: "remediation_required",
      },
      ctx,
    );
    expect(vr.ok).toBe(true);
    if (!vr.ok) return;
    expect(vr.effects).toEqual([
      { fact_key: "consent.proof_capability_status", value: "remediation_required" },
    ]);
  });
});

describe("D3.06 consent.withdrawal_enable (procedure, purpose)", () => {
  it("18. registrado con nueve condiciones 1:1", () => {
    expect(getProtocolForActivity("consent.withdrawal_enable")).toBe(P306);
    expect(P306.mode).toBe("procedure");
    expect(P306.execution_scope).toBe("purpose");
    expect(validateProtocolStructure(P306)).toEqual([]);
    expect(P306.decision_fact_keys).toHaveLength(9);
  });

  it("19. sin eventos individuales ni retroactividad afirmada", () => {
    const blob = JSON.stringify(P306).toLowerCase();
    for (const forbidden of ["withdrawalevent", "consentrecord", "cada titular"]) {
      expect(blob).not.toContain(forbidden);
    }
    // El disclaimer honesto está presente: habilita, no registra.
    expect(blob).toContain("no registra revocaciones individuales");
    expect(blob).toContain("hacia futuro");
    expect(blob).not.toContain("con efecto retroactivo");
  });

  it("20. enabled/remediation con efectos + finalize purpose", () => {
    let c = newCompany("Retiro SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p = mustPurpose(c, t.id, "P");
    c = p.company;
    const ctx = purposeCtx(c, t.id, p.id);
    const facts = fullChecks(P306, { [BRIDGE]: "consent_yes" });
    expect(mustOutcome(P306, facts).outcome_key).toBe("withdrawal_enabled");
    const v = validateScopedProcedureFinalization(
      { protocol: P306, company: c, facts, outcomeKey: "withdrawal_enabled" },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(c, P306, ctx, v.effects);
    expect(
      getScopedProtocolAnswers(applied!.company, ctx, P306.protocol_key)["consent.withdrawal_status"]?.value,
    ).toBe("enabled");
    const twice = applyScopedProcedureFinalization(applied!.company, P306, ctx, v.effects);
    expect(twice?.applied).toEqual([]);
  });
});

describe("integración rama consentimiento A1/A2", () => {
  function greenCompany() {
    let c = newCompany("Rama SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p1 = mustPurpose(c, t.id, "A1");
    c = p1.company;
    const p2 = mustPurpose(c, t.id, "A2");
    c = p2.company;
    return { c, t: t.id, p1: p1.id, p2: p2.id };
  }

  function finalizeAll(
    c: CompanyState,
    ctx: ExecutionContext,
    conclusion: "freedom_supported" | "freedom_not_supported" = "freedom_supported",
  ) {
    const r04 = finalizeJudgment({
      protocol: P304,
      company: c,
      facts: freedomFacts(),
      draft: freedomDraft(conclusion),
      legalBasis: FREEDOM_BASIS,
      ctx,
    });
    if (!r04.ok) throw new Error("D3.04 no finaliza");
    c = applyScopedFinalization(c, P304, ctx, r04.record, r04.effects) ?? c;
    for (const [protocol, outcome, fact] of [
      [P305, "proof_capability_designed", fullChecks(P305, { [BRIDGE]: "consent_yes" })],
      [P306, "withdrawal_enabled", fullChecks(P306, { [BRIDGE]: "consent_yes" })],
    ] as const) {
      const v = validateScopedProcedureFinalization({ protocol, company: c, facts: fact, outcomeKey: outcome }, ctx);
      if (!v.ok) throw new Error(`${protocol.protocol_key} no valida`);
      const applied = applyScopedProcedureFinalization(c, protocol, ctx, v.effects);
      if (!applied) throw new Error(`${protocol.protocol_key} no aplica`);
      c = applied.company;
    }
    return c;
  }

  it("21. A1 full green cierra D3.03; A2 independiente no hereda", () => {
    const g = greenCompany();
    const c = finalizeAll(g.c, purposeCtx(g.c, g.t, g.p1));
    // Vista addressed real de A1: efectos sibling ya materializados.
    const viewA1: FactMap = {
      [BRIDGE]: "consent_yes",
      ...fullChecks(P303),
      [FREEDOM]: "supported",
      [PROOF]: "designed",
      [WITHDRAWAL]: "enabled",
    };
    expect(mustOutcome(P303, viewA1).outcome_key).toBe("mechanism_designed");
    const v = validateScopedProcedureFinalization(
      { protocol: P303, company: c, facts: viewA1, outcomeKey: "mechanism_designed" },
      purposeCtx(c, g.t, g.p1),
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(c, P303, purposeCtx(c, g.t, g.p1), v.effects);
    expect(
      getScopedProtocolAnswers(applied!.company, purposeCtx(c, g.t, g.p1), P303.protocol_key)["consent.mechanism_status"]?.value,
    ).toBe("designed");
    // A2 sin nada: D3.03 incompleto (los positivos de A1 no cruzan).
    expect(
      mustOutcome(P303, fullChecks(P303, { [BRIDGE]: "consent_yes" })).outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("22. addressed context por familia: A1→A2→finaliza A1", () => {
    const g = greenCompany();
    const c = g.c;
    const ctxA1 = purposeCtx(c, g.t, g.p1);
    // A1: D3.04 supported + D3.05 designed + D3.06 enabled, escritos solo en A1.
    let next = finalizeAll(c, ctxA1);
    const read = (ctx: ExecutionContext, pk: string, fk: string) =>
      getScopedProtocolAnswers(next, ctx, pk)[fk]?.value ?? "";
    const ctxA2 = purposeCtx(next, g.t, g.p2);
    expect(read(ctxA1, P304.protocol_key, FREEDOM)).toBe("supported");
    expect(read(ctxA2, P304.protocol_key, FREEDOM)).toBe("");
    expect(read(ctxA1, P305.protocol_key, PROOF)).toBe("designed");
    expect(read(ctxA2, P305.protocol_key, PROOF)).toBe("");
    expect(read(ctxA1, P306.protocol_key, WITHDRAWAL)).toBe("enabled");
    expect(read(ctxA2, P306.protocol_key, WITHDRAWAL)).toBe("");
    // D3.03 en A1 con la vista addressed de A1 cierra; A2 intacto.
    const v = validateScopedProcedureFinalization(
      { protocol: P303, company: next, facts: d303Facts(), outcomeKey: "mechanism_designed" },
      ctxA1,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(next, P303, ctxA1, v.effects);
    expect(
      getScopedProtocolAnswers(applied!.company, ctxA1, P303.protocol_key)["consent.mechanism_status"]?.value,
    ).toBe("designed");
    expect(
      getScopedProtocolAnswers(applied!.company, ctxA2, P303.protocol_key)["consent.mechanism_status"],
    ).toBeUndefined();
  });

  it("23. export/import preserva rama por purpose sin instances", () => {
    const g = greenCompany();
    const c = finalizeAll(g.c, purposeCtx(g.c, g.t, g.p1));
    const roundTrip = validateCompanyState(JSON.parse(JSON.stringify(c)));
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    const ctx = purposeCtx(roundTrip.value, g.t, g.p1);
    expect(getScopedProtocolAnswers(roundTrip.value, ctx, P304.protocol_key)[FREEDOM]?.value).toBe("supported");
    expect(getScopedProtocolAnswers(roundTrip.value, ctx, P305.protocol_key)[PROOF]?.value).toBe("designed");
    expect(getScopedProtocolAnswers(roundTrip.value, ctx, P306.protocol_key)[WITHDRAWAL]?.value).toBe("enabled");
    expect(roundTrip.value.reasoningRecords[P304.protocol_key]).toBeUndefined();
    const blob = JSON.stringify(roundTrip.value).toLowerCase();
    for (const forbidden of ["consentrecord", "datasubjectconsent", "withdrawalevent"]) {
      expect(blob).not.toContain(forbidden);
    }
  });
});

describe("regresión cierre D3", () => {
  it("24. 54 actividades, 2 pendings, D1/D2/D3.01-02 intactos, 50 protocolos", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(ALL_ACTIVITIES).toHaveLength(54);
    expect(getUnresolvedReferences()).toEqual([
      "mpi.diffusion",
      "risk.mpi_sync",
    ]);
    expect(listProtocols()).toHaveLength(50);
    for (const k of [
      "transparency.policy_assemble",
      "transparency.publication_validate",
      "consent.mechanism_design",
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getProtocolForActivity(k)?.execution_scope ?? "company", k).not.toBe("treatment");
    }
  });

  it("25. provenance agency_standard en los cuatro protocolos", () => {
    for (const p of [P303, P304, P305, P306]) {
      expect(p.provenance).toBe("agency_standard");
      for (const o of p.outcomes) {
        expect(o.classification).toBe("agency_standard");
      }
      for (const a of [getCanonicalActivity(p.activity_key)] as const) {
        expect(a?.evidence_basis).toBe("agency_standard");
      }
    }
    expect(getCanonicalActivity("transparency.policy_assemble")?.evidence_basis).toBe(
      "legal_requirement",
    );
  });
});
