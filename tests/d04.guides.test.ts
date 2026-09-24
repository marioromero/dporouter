import { describe, expect, it } from "vitest";
import { RIGHTS_EXERCISE_MECHANISM_DESIGN_PROTOCOL as P401 } from "../content/protocols/rights.exercise_mechanism_design";
import { RIGHTS_ACCESS_ENABLE_PROTOCOL as P402 } from "../content/protocols/rights.access_enable";
import { RIGHTS_RECTIFICATION_ENABLE_PROTOCOL as P403 } from "../content/protocols/rights.rectification_enable";
import { RIGHTS_SUPPRESSION_ENABLE_PROTOCOL as P404 } from "../content/protocols/rights.suppression_enable";
import { RIGHTS_OPPOSITION_ENABLE_PROTOCOL as P405 } from "../content/protocols/rights.opposition_enable";
import { RIGHTS_BLOCKING_ENABLE_PROTOCOL as P406 } from "../content/protocols/rights.blocking_enable";
import { RIGHTS_PORTABILITY_ENABLE_PROTOCOL as P407 } from "../content/protocols/rights.portability_enable";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import {
  getProtocolForActivity,
  listProtocols,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import {
  applyProcedureFinalization,
  getFinalizableOutcome,
  validateProcedureFinalization,
} from "../src/workspace/finalize";
import { newCompany } from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";
import { ALL_ACTIVITIES, getCanonicalActivity } from "../content/registry";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import { D04_ACTIVITIES } from "../content/domains/d04";

function mustOutcome(protocol: ExecutionProtocol, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

function allYes(protocol: ExecutionProtocol, over: FactMap = {}): FactMap {
  const facts: FactMap = {};
  for (const f of protocol.decision_fact_keys) facts[f] = "yes";
  return { ...facts, ...over };
}

const DESIGNED: FactMap = { "rights.exercise_mechanism_status": "designed" };

describe("D4.01 rights.exercise_mechanism_design (procedure, company)", () => {
  it("1. protocolo registrado con modo y scope canónicos", () => {
    expect(getProtocolForActivity("rights.exercise_mechanism_design")).toBe(P401);
    expect(P401.protocol_key).toBe("rights.exercise_mechanism_design.v1");
    expect(P401.mode).toBe("procedure");
    expect(P401.execution_scope).toBe("company");
    expect(P401.version).toBe(1);
    expect(getCanonicalActivity(P401.activity_key)?.human_code).toBe("D4.01");
  });

  it("2. estructura válida; 19 checks company-scoped", () => {
    expect(validateProtocolStructure(P401)).toEqual([]);
    expect(P401.decision_fact_keys).toHaveLength(19);
    for (const n of P401.nodes) {
      if (n.node_type === "question" && n.fact_key) {
        expect(n.fact_key.startsWith("rights.mechanism.")).toBe(true);
      }
    }
    expect(P401.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["mechanism_designed", "remediation_required", "assessment_incomplete"].sort(),
    );
  });

  it("3. 30-day + extensión representados como capacidad, sin timers", () => {
    const e = mustOutcome(P401, allYes(P401));
    expect(e.outcome_key).toBe("mechanism_designed");
    const blob = JSON.stringify(P401).toLowerCase();
    for (const forbidden of ["dueat", "receivedat", "requestevent", "extension date", "response date", "request timeline"]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
    expect(blob).toContain("30 días corridos");
    // Sin captura escalar ni efectos fecha: el plazo es capacidad, no timer.
    for (const n of P401.nodes) {
      expect(["yes_no_unknown", "single_select", "none"], n.answer_type).toContain(
        n.answer_type,
      );
    }
  });

  it("4. condicionales (herederos, entidad extranjera) con No aplica no incumplen", () => {
    const e = mustOutcome(
      P401,
      allYes(P401, {
        "rights.mechanism.heirs_covered": "na",
        "rights.mechanism.foreign_entity_covered": "na",
      }),
    );
    expect(e.outcome_key).toBe("mechanism_designed");
  });

  it("5. denegación, gratuidad y bloqueo cubiertos; brecha → remediación", () => {
    expect(
      mustOutcome(P401, allYes(P401, { "rights.mechanism.denial_founded": "no" }))
        .outcome_key,
    ).toBe("remediation_required");
    expect(
      mustOutcome(P401, allYes(P401, { "rights.mechanism.gratuity_rules": "unknown" }))
        .outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("6. efecto designed con finalización explícita e idempotente", () => {
    const company = newCompany("Mecanismo SpA");
    expect(
      getFinalizableOutcome(P401, "mechanism_designed")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.exercise_mechanism_status", value: "designed" }]);
    const validated = validateProcedureFinalization({
      protocol: P401,
      company,
      facts: allYes(P401),
      outcomeKey: "mechanism_designed",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const once = applyProcedureFinalization(company, P401, validated.effects);
    expect(once.applied).toEqual(["rights.exercise_mechanism_status"]);
    const twice = applyProcedureFinalization(once.company, P401, validated.effects);
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["rights.exercise_mechanism_status"]);
    expect(validateCompanyState(JSON.parse(JSON.stringify(twice.company))).ok).toBe(true);
  });
});

describe("D4.02 rights.access_enable (checklist, company, gated D4.01)", () => {
  it("7. registrado; 12 categorías; sin construir respuestas reales", () => {
    expect(getProtocolForActivity("rights.access_enable")).toBe(P402);
    expect(P402.mode).toBe("checklist");
    expect(P402.execution_scope).toBe("company");
    expect(validateProtocolStructure(P402)).toEqual([]);
    expect(P402.decision_fact_keys).toHaveLength(12);
    const blob = JSON.stringify(P402).toLowerCase();
    expect(blob).not.toContain("rightsrequest");
  });

  it("8. sin D4.01 → mechanism_pending aunque todo esté satisfactorio", () => {
    expect(mustOutcome(P402, allYes(P402)).outcome_key).toBe("mechanism_pending");
    expect(
      mustOutcome(P402, {
        ...allYes(P402),
        ...DESIGNED,
        "rights.access.automated_logic_covered": "na",
        "rights.access.legitimate_interests_covered": "na",
      }).outcome_key,
    ).toBe("access_enabled");
  });

  it("9. lógica automatizada condicional; acceso sin requisitos extra; efecto", () => {
    expect(
      mustOutcome(P402, { ...allYes(P402), ...DESIGNED }).outcome_key,
    ).toBe("access_enabled");
    expect(
      mustOutcome(
        P402,
        { ...allYes(P402), ...DESIGNED, "rights.access.identification_sufficient": "no" },
      ).outcome_key,
    ).toBe("remediation_required");
    expect(
      getFinalizableOutcome(P402, "access_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.access_status", value: "enabled" }]);
  });
});

describe("D4.03 rights.rectification_enable (procedure, company, gated D4.01)", () => {
  it("10. registrado; propagación y excepción documentada; sin juicio de casos", () => {
    expect(getProtocolForActivity("rights.rectification_enable")).toBe(P403);
    expect(P403.mode).toBe("procedure");
    expect(P403.execution_scope).toBe("company");
    expect(validateProtocolStructure(P403)).toEqual([]);
    const facts = P403.decision_fact_keys;
    for (const f of [
      "rights.rectification.recipients_identified",
      "rights.rectification.recipients_notified",
      "rights.rectification.exception_criterion",
      "rights.rectification.exception_evidenced",
      "rights.rectification.blocking_coordinated",
    ]) {
      expect(facts, f).toContain(f);
    }
    expect(
      mustOutcome(P403, allYes(P403)).outcome_key,
    ).toBe("mechanism_pending");
    expect(
      mustOutcome(P403, { ...allYes(P403), ...DESIGNED }).outcome_key,
    ).toBe("rectification_enabled");
    expect(
      getFinalizableOutcome(P403, "rectification_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.rectification_status", value: "enabled" }]);
  });
});

describe("D4.04 rights.suppression_enable (checklist 6+6, company, gated D4.01)", () => {
  it("11. seis causales y seis excepciones como checks propios", () => {
    expect(getProtocolForActivity("rights.suppression_enable")).toBe(P404);
    expect(P404.mode).toBe("checklist");
    expect(validateProtocolStructure(P404)).toEqual([]);
    const facts = P404.decision_fact_keys;
    for (const f of [
      "rights.suppression.cause_unnecessary",
      "rights.suppression.cause_consent_withdrawn",
      "rights.suppression.cause_unlawful",
      "rights.suppression.cause_outdated",
      "rights.suppression.cause_legal_order",
      "rights.suppression.cause_opposition",
      "rights.suppression.exception_expression",
      "rights.suppression.exception_legal_contract",
      "rights.suppression.exception_public_function",
      "rights.suppression.exception_public_health",
      "rights.suppression.exception_research",
      "rights.suppression.exception_claims",
    ]) {
      expect(facts, f).toContain(f);
    }
  });

  it("12. sin decisión automática de casos; efecto y dependencia", () => {
    const blob = JSON.stringify(P404).toLowerCase();
    expect(blob).toContain("sin adoptar decisiones sobre casos reales");
    expect(mustOutcome(P404, allYes(P404)).outcome_key).toBe("mechanism_pending");
    expect(
      mustOutcome(P404, { ...allYes(P404), ...DESIGNED }).outcome_key,
    ).toBe("suppression_enabled");
    expect(
      getFinalizableOutcome(P404, "suppression_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.suppression_status", value: "enabled" }]);
  });
});

describe("D4.05 rights.opposition_enable (checklist ramas, company, gated D4.01)", () => {
  it("13. ramas interés legítimo, marketing, fuente pública y excepción", () => {
    expect(getProtocolForActivity("rights.opposition_enable")).toBe(P405);
    expect(P405.mode).toBe("checklist");
    expect(validateProtocolStructure(P405)).toEqual([]);
    const facts = P405.decision_fact_keys;
    for (const f of [
      "rights.opposition.li_opposition_allowed",
      "rights.opposition.li_cessation_criteria",
      "rights.opposition.marketing_opposition",
      "rights.opposition.marketing_cessation",
      "rights.opposition.public_source_covered",
      "rights.opposition.research_exception",
    ]) {
      expect(facts, f).toContain(f);
    }
  });

  it("14. sin ReasoningRecord de casos; efecto", () => {
    expect(P405.reasoning_requirements).toBeUndefined();
    expect(mustOutcome(P405, allYes(P405)).outcome_key).toBe("mechanism_pending");
    expect(
      mustOutcome(P405, { ...allYes(P405), ...DESIGNED }).outcome_key,
    ).toBe("opposition_enabled");
    expect(
      getFinalizableOutcome(P405, "opposition_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.opposition_status", value: "enabled" }]);
  });
});

describe("D4.06 rights.blocking_enable (procedure, 2 días hábiles sin timer)", () => {
  it("15. registrado; suspensión + almacenamiento + rechazo fundado + Agencia", () => {
    expect(getProtocolForActivity("rights.blocking_enable")).toBe(P406);
    expect(P406.mode).toBe("procedure");
    expect(P406.execution_scope).toBe("company");
    expect(validateProtocolStructure(P406)).toEqual([]);
    const facts = P406.decision_fact_keys;
    for (const f of [
      "rights.blocking.two_day_capacity",
      "rights.blocking.treatment_halted",
      "rights.blocking.storage_permitted",
      "rights.blocking.rejection_founded",
      "rights.blocking.agency_communication",
    ]) {
      expect(facts, f).toContain(f);
    }
  });

  it("16. plazo como capacidad, prueba de no-timer, efecto", () => {
    const blob = JSON.stringify(P406).toLowerCase();
    expect(blob).toContain("2 días hábiles");
    for (const forbidden of ["dueat", "scheduler", "calendar engine", "blockingrequest", "receivedat", "requestevent"]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
    expect(mustOutcome(P406, allYes(P406)).outcome_key).toBe("mechanism_pending");
    expect(
      mustOutcome(P406, { ...allYes(P406), ...DESIGNED }).outcome_key,
    ).toBe("blocking_enabled");
    expect(
      getFinalizableOutcome(P406, "blocking_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.blocking_status", value: "enabled" }]);
  });
});

describe("D4.07 rights.portability_enable (checklist elegibilidad + técnica)", () => {
  it("17. registrado; elegibilidad automatizado + consentimiento sin tocar D2/D3", () => {
    expect(getProtocolForActivity("rights.portability_enable")).toBe(P407);
    expect(P407.mode).toBe("checklist");
    expect(P407.execution_scope).toBe("company");
    expect(validateProtocolStructure(P407)).toEqual([]);
    const facts = P407.decision_fact_keys;
    for (const f of [
      "rights.portability.eligibility_automated",
      "rights.portability.eligibility_consent",
      "rights.portability.structured_format",
      "rights.portability.interoperable",
      "rights.portability.direct_transmission",
      "rights.portability.no_auto_deletion",
    ]) {
      expect(facts, f).toContain(f);
    }
    const blob = JSON.stringify(P407);
    expect(blob).not.toContain("purpose.lawful_basis");
    expect(blob).not.toContain("lawful_basis.assign");
  });

  it("18. transmisión directa condicional; portabilidad ≠ supresión; efecto", () => {
    expect(
      mustOutcome(
        P407,
        { ...allYes(P407), ...DESIGNED, "rights.portability.direct_transmission": "na" },
      ).outcome_key,
    ).toBe("portability_enabled");
    expect(mustOutcome(P407, allYes(P407)).outcome_key).toBe("mechanism_pending");
    expect(
      getFinalizableOutcome(P407, "portability_enabled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "rights.portability_status", value: "enabled" }]);
  });
});

describe("integración D4.01 → D4.02–D4.07", () => {
  const SIBLINGS: [ExecutionProtocol, string][] = [
    [P402, "access_enabled"],
    [P403, "rectification_enabled"],
    [P404, "suppression_enabled"],
    [P405, "opposition_enabled"],
    [P406, "blocking_enabled"],
    [P407, "portability_enabled"],
  ];

  it("19. con D4.01 positivo cada hermano finaliza independiente", () => {
    for (const [p, positive] of SIBLINGS) {
      const over: FactMap =
        p === P402
          ? {
              "rights.access.automated_logic_covered": "na",
              "rights.access.legitimate_interests_covered": "na",
            }
          : p === P407
            ? { "rights.portability.direct_transmission": "na" }
            : {};
      expect(mustOutcome(p, { ...allYes(p, over), ...DESIGNED }).outcome_key, p.activity_key).toBe(
        positive,
      );
    }
  });

  it("20. sin D4.01 ningún hermano finaliza positivo; inspeccionar sí", () => {
    for (const [p] of SIBLINGS) {
      expect(mustOutcome(p, allYes(p)).outcome_key, p.activity_key).toBe(
        "mechanism_pending",
      );
      // Inspección parcial posible: brecha visible sin concluir positivo.
      const first = p.decision_fact_keys[0];
      expect(
        mustOutcome(p, allYes(p, { [first]: "no" })).outcome_key,
        p.activity_key,
      ).toBe("mechanism_pending");
    }
  });

  it("21. ningún derecho hermano depende de otro hermano", () => {
    for (const [p] of SIBLINGS) {
      for (const f of p.external_fact_keys ?? []) {
        expect(f, p.activity_key).toBe("rights.exercise_mechanism_status");
      }
    }
  });
});

describe("regresión cierre batch D4.01–D4.07", () => {
  it("22. D1/D2/D3/D4 canon intactos; 54 actividades; 54 protocolos; 2 pendings", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(D04_ACTIVITIES).toHaveLength(9);
    expect(ALL_ACTIVITIES).toHaveLength(54);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(54);
    expect(listProtocols()).toHaveLength(54);
    for (const k of [
      "rights.exercise_mechanism_design",
      "rights.access_enable",
      "rights.rectification_enable",
      "rights.suppression_enable",
      "rights.opposition_enable",
      "rights.blocking_enable",
      "rights.portability_enable",
      "automated_decision.scope_assess",
      "automated_decision.safeguards_enable",
    ]) {
      expect(getProtocolForActivity(k), k).toBeTruthy();
    }
  });

  it("23. frontera Stage 1 en todo el batch: sin requests, titulares, timers ni history", () => {
    for (const p of [P401, P402, P403, P404, P405, P406, P407]) {
      const blob = JSON.stringify(p).toLowerCase();
      for (const forbidden of [
        "rightsrequest",
        "datasubject",
        "requestevent",
        "request status",
        "receivedat",
        "dueat",
        "request timeline",
        "titular identity",
        "extension date",
        "response date",
      ]) {
        expect(blob, `${p.activity_key}:${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("24. readiness factual: 7 protocolos con efecto estático company finalizable", () => {
    const EXPECTED: [ExecutionProtocol, string, string][] = [
      [P401, "mechanism_designed", "rights.exercise_mechanism_status"],
      [P402, "access_enabled", "rights.access_status"],
      [P403, "rectification_enabled", "rights.rectification_status"],
      [P404, "suppression_enabled", "rights.suppression_status"],
      [P405, "opposition_enabled", "rights.opposition_status"],
      [P406, "blocking_enabled", "rights.blocking_status"],
      [P407, "portability_enabled", "rights.portability_status"],
    ];
    for (const [p, outcome, fact] of EXPECTED) {
      expect(validateProtocolStructure(p), p.activity_key).toEqual([]);
      expect(
        getFinalizableOutcome(p, outcome)?.canonical_fact_effects,
        p.activity_key,
      ).toEqual([{ fact_key: fact, value: expect.any(String) }]);
      expect(p.execution_scope ?? "company", p.activity_key).toBe("company");
    }
  });
});
