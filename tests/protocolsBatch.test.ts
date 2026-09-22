import { describe, expect, it } from "vitest";
import { MPI_FORMALIZE_ADOPTION_PROTOCOL as P04 } from "../content/protocols/mpi.formalize_adoption";
import { DPO_GOVERNANCE_VALIDATION_PROTOCOL as P09 } from "../content/protocols/dpo.initial_governance_validation";
import { DPO_NEED_ASSESSMENT_PROTOCOL as P02 } from "../content/protocols/dpo.need_assessment";
import {
  getProtocolForActivity,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import type { FactMap } from "../content/protocols/types";
import { mergedFactRecords } from "../src/workspace/facts";
import { newCompany } from "../src/workspace/types";
import { getCanonicalActivity } from "../content/registry";

function mustOutcome(
  protocol: typeof P04,
  facts: FactMap,
) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

function allFactKeys(protocol: typeof P04): string[] {
  const out = new Set<string>(protocol.decision_fact_keys);
  for (const n of protocol.nodes) {
    if (n.fact_key) out.add(n.fact_key);
    for (const f of n.required_facts ?? []) out.add(f);
  }
  return [...out];
}

describe("batch D1: D1.04 procedure", () => {
  it("1. D1.04 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.formalize_adoption")).toBe(P04);
    expect(P04.protocol_key).toBe("mpi.formalize_adoption.v1");
    expect(P04.mode).toBe("procedure");
    expect(P04.version).toBe(1);
    expect(P04.entry_node_key).toBe("adoption-decision");
    expect(getCanonicalActivity(P04.activity_key)?.human_code).toBe("D1.04");
  });

  it("2. nodos y outcomes exactos, sin árbol artificial", () => {
    expect(P04.nodes.map((n) => n.node_key)).toEqual([
      "adoption-decision",
      "adoption-evidence",
      "lifecycle-update",
      "dpo-requirement",
      "final-confirmation",
    ]);
    expect(P04.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["formalization_complete", "formalization_in_progress", "not_started"].sort(),
    );
  });

  it("3. estructura válida y referencias resuelven", () => {
    expect(validateProtocolStructure(P04)).toEqual([]);
    for (const key of ["mpi.need_assessment", "dpo.designate", "mpi.lifecycle_review"]) {
      expect(getCanonicalActivity(key), key).toBeDefined();
    }
  });

  it("4. sin decisión no inicia: deriva a D1.03 sin recrearlo", () => {
    const e = mustOutcome(P04, { "mpi.adoption_decided": "no" });
    expect(e.outcome_key).toBe("not_started");
    expect(e.rule_id).toBe("no-decision");
  });

  it("5. todo verificado produce formalización completa", () => {
    const e = mustOutcome(P04, {
      "mpi.adoption_decided": "yes",
      "mpi.adoption_evidence_ready": "yes",
      "mpi.lifecycle_update_recorded": "yes",
      "mpi.dpo_requirement_activated": "yes",
    });
    expect(e.outcome_key).toBe("formalization_complete");
    expect(e.rule_id).toBe("all-verified");
  });

  it("6. pendiente o sin información mantiene en curso, nunca completo", () => {
    const e = mustOutcome(P04, {
      "mpi.adoption_decided": "yes",
      "mpi.adoption_evidence_ready": "no",
      "mpi.lifecycle_update_recorded": "yes",
      "mpi.dpo_requirement_activated": "yes",
    });
    expect(e.outcome_key).toBe("formalization_in_progress");
    const u = mustOutcome(P04, {
      "mpi.adoption_decided": "yes",
      "mpi.adoption_evidence_ready": "unknown",
      "mpi.lifecycle_update_recorded": "yes",
      "mpi.dpo_requirement_activated": "yes",
    });
    expect(u.outcome_key).toBe("formalization_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("7. unknown no equivale a verificado", () => {
    const e = evaluateProtocol(P04, { "mpi.adoption_decided": "unknown" });
    expect(e.status).toBe("awaiting_facts");
    if (e.status === "awaiting_facts") {
      expect(e.current_node_key).toBe("adoption-evidence");
    }
  });

  it("8. pasos con estados explícitos, no Sí/No ambiguo", () => {
    for (const key of ["adoption-evidence", "lifecycle-update", "dpo-requirement"]) {
      const node = P04.nodes.find((n) => n.node_key === key);
      expect(node?.answer_type).toBe("single_select");
      expect(node?.options?.map((o) => o.label)).toEqual([
        "Verificado",
        "Pendiente",
        "Sin información",
      ]);
    }
  });

  it("9. verificación usa solo evidencia canónica D1.04", () => {
    const evidence = P04.nodes.find((n) => n.node_key === "adoption-evidence");
    expect(evidence?.evidence_to_review).toEqual([
      "acta, resolución, acuerdo o evidencia interna equivalente",
      "fecha efectiva",
      "autoridad que adopta",
      "referencia documental",
    ]);
  });

  it("10. complete enlaza designación; no reformula lógica DPO", () => {
    const complete = P04.outcomes.find((o) => o.outcome_key === "formalization_complete");
    const action = complete?.next_actions.find((a) => a.kind === "activity");
    expect(action?.activity_key).toBe("dpo.designate");
    // Ninguna regla del protocolo concluye sobre necesidad de DPO.
    const text = JSON.stringify(P04.nodes.map((t) => t.transitions));
    expect(text).not.toContain("required_by_mpi");
    expect(text).not.toContain("strongly_recommended");
  });
});

describe("batch D1: D1.09 checklist", () => {
  it("11. D1.09 tiene exactamente un protocolo activo mode checklist", () => {
    expect(getProtocolForActivity("dpo.initial_governance_validation")).toBe(P09);
    expect(P09.protocol_key).toBe("dpo.initial_governance_validation.v1");
    expect(P09.mode).toBe("checklist");
    expect(P09.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P09.activity_key)?.human_code).toBe("D1.09");
  });

  it("12. seis checks canónicos más compuerta y síntesis", () => {
    expect(P09.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "check-reporting-line",
      "check-autonomy",
      "check-conflicts",
      "check-resources",
      "check-suitability",
      "check-access",
      "final-assessment",
    ]);
    expect(P09.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "governance_validated",
        "remediation_required",
        "information_incomplete",
        "prerequisite_missing",
      ].sort(),
    );
  });

  it("13. estructura válida y referencias resuelven", () => {
    expect(validateProtocolStructure(P09)).toEqual([]);
    for (const key of ["dpo.designate", "dpo.operating_model"]) {
      expect(getCanonicalActivity(key), key).toBeDefined();
    }
  });

  it("14. cada check distingue validado, brecha e insuficiente", () => {
    for (const n of P09.nodes.filter((x) => x.node_key.startsWith("check-"))) {
      expect(n.answer_type).toBe("yes_no_unknown");
      expect(n.options?.map((o) => o.label)).toEqual([
        "Revisado y satisfactorio",
        "Requiere acción o corrección",
        "Información insuficiente",
      ]);
      expect(n.required_facts).toEqual([]);
    }
  });

  it("15. sin designación deriva a D1.08", () => {
    const e = evaluateProtocol(P09, { "dpo.designated": "no" });
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") {
      expect(e.outcome_key).toBe("prerequisite_missing");
      expect(e.rule_id).toBe("no-designation");
    }
  });

  function fullChecks(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.governance.reporting_line": "yes",
      "dpo.governance.autonomy": "yes",
      "dpo.governance.conflicts": "yes",
      "dpo.governance.resources": "yes",
      "dpo.governance.suitability": "yes",
      "dpo.governance.access": "yes",
      ...over,
    };
  }

  it("16. todo satisfactorio produce validación", () => {
    const e = mustOutcome(P09, fullChecks());
    expect(e.outcome_key).toBe("governance_validated");
    expect(e.rule_id).toBe("all-validated");
  });

  it("17. una brecha produce remediación aunque haya unknowns", () => {
    const e = mustOutcome(
      P09,
      fullChecks({
        "dpo.governance.resources": "no",
        "dpo.governance.access": "unknown",
      }),
    );
    expect(e.outcome_key).toBe("remediation_required");
    expect(e.rule_id).toBe("gaps-found");
  });

  it("18. solo unknowns produce información insuficiente", () => {
    const e = mustOutcome(P09, fullChecks({ "dpo.governance.access": "unknown" }));
    expect(e.outcome_key).toBe("information_incomplete");
    expect(e.rule_id).toBe("missing-info");
  });

  it("19. unknown no equivale a satisfactorio", () => {
    const e = evaluateProtocol(P09, { "dpo.designated": "yes" });
    expect(e.status).toBe("awaiting_facts");
  });

  it("20. validado enlaza modelo operativo; sin score global", () => {
    const validated = P09.outcomes.find((o) => o.outcome_key === "governance_validated");
    expect(
      validated?.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.operating_model");
    const text = JSON.stringify(P09);
    expect(text.toLowerCase()).not.toContain("score");
    expect(text).not.toContain("Cumple");
  });

  it("21. inyección vía Diagnóstico resuelve sin recorrer UI", () => {
    // El seam real de reutilización: hechos de Diagnóstico fusionados
    // a FactMap antes de evaluar (sin respuestas de sesión).
    const at = new Date().toISOString();
    const company = newCompany("Inyección SpA");
    const facts: FactMap = {
      "dpo.designated": "yes",
      "dpo.governance.reporting_line": "yes",
      "dpo.governance.autonomy": "yes",
      "dpo.governance.conflicts": "yes",
      "dpo.governance.resources": "yes",
      "dpo.governance.suitability": "yes",
      "dpo.governance.access": "yes",
    };
    for (const [k, v] of Object.entries(facts)) {
      company.diagnosticFacts[k] = { value: v, source: "diagnostico", updatedAt: at };
    }
    const injected: FactMap = {};
    for (const [k, r] of Object.entries(mergedFactRecords(company))) {
      injected[k] = r.value;
    }
    expect(injected).toEqual(facts);
    const e = mustOutcome(P09, injected);
    expect(e.outcome_key).toBe("governance_validated");
  });
});

describe("batch D1: integridad del batch", () => {
  it("22. D1.03 no tiene protocolo (FUNCTIONAL_BLOCKER, sin pseudo-protocolo)", () => {
    expect(getProtocolForActivity("mpi.need_assessment")).toBeUndefined();
  });

  it("23. namespaces de facts disjuntos entre protocolos", () => {
    const f02 = new Set(allFactKeys(P02));
    const f04 = new Set(allFactKeys(P04));
    const f09 = new Set(allFactKeys(P09));
    for (const f of f04) expect(f02.has(f), `D1.04 colisiona: ${f}`).toBe(false);
    for (const f of f09) expect(f02.has(f), `D1.09 colisiona: ${f}`).toBe(false);
    for (const f of f09) expect(f04.has(f), `D1.09/D1.04 colisionan: ${f}`).toBe(false);
  });

  it("24. outcomes con clasificación metodológica, sin obligación inventada", () => {
    for (const p of [P04, P09]) {
      for (const o of p.outcomes) {
        expect(o.classification, `${p.protocol_key}/${o.outcome_key}`).toBe(
          "agency_standard",
        );
        expect(o.provenance).toBe("agency_standard");
      }
    }
  });

  it("25. D1.02 intacto tras el batch", () => {
    expect(getProtocolForActivity("dpo.need_assessment")).toBe(P02);
    expect(P02.mode).toBe("decision");
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});
