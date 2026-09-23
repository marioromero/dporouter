import { describe, expect, it } from "vitest";
import { MPI_FORMALIZE_ADOPTION_PROTOCOL as P04 } from "../content/protocols/mpi.formalize_adoption";
import { DPO_GOVERNANCE_VALIDATION_PROTOCOL as P09 } from "../content/protocols/dpo.initial_governance_validation";
import { DPO_NEED_ASSESSMENT_PROTOCOL as P02 } from "../content/protocols/dpo.need_assessment";
import { MPI_NEED_ASSESSMENT_PROTOCOL as P03 } from "../content/protocols/mpi.need_assessment";
import { GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL as P01 } from "../content/protocols/governance.preventive_framework";
import { DPO_DESIGNATE_PROTOCOL as P08 } from "../content/protocols/dpo.designate";
import { DPO_OPERATING_MODEL_PROTOCOL as P11 } from "../content/protocols/dpo.operating_model";
import { DPO_INFRINGEMENT_ESCALATION_PROTOCOL as P15 } from "../content/protocols/dpo.infringement_escalation";
import { DPO_TERMINATE_OR_REPLACE_PROTOCOL as P17 } from "../content/protocols/dpo.terminate_or_replace";
import { MPI_ASSEMBLE_PROGRAM_PROTOCOL as P18 } from "../content/protocols/mpi.assemble_program";
import { MPI_REPORTING_WHISTLEBLOWING_PROTOCOL as P05 } from "../content/protocols/mpi.internal_reporting_and_whistleblowing";
import { MPI_DISCIPLINARY_FRAMEWORK_PROTOCOL as P06 } from "../content/protocols/mpi.internal_disciplinary_framework";
import { MPI_REGULATION_INTEGRATE_PROTOCOL as P07 } from "../content/protocols/mpi.internal_regulation_integrate";
import { DPO_CONFIDENTIALITY_DUTY_PROTOCOL as P12 } from "../content/protocols/dpo.confidentiality_duty";
import { DPO_CONTACT_NOTIFICATION_PROTOCOL as P10 } from "../content/protocols/dpo.contact_and_agency_notification";
import { DPO_ANNUAL_PLAN_PROTOCOL as P13 } from "../content/protocols/dpo.annual_plan";
import { DPO_ANNUAL_REPORT_PROTOCOL as P14 } from "../content/protocols/dpo.annual_report";
import { DPO_GOVERNANCE_REVALIDATION_PROTOCOL as P16 } from "../content/protocols/dpo.governance_revalidation";
import { MPI_CERTIFICATION_LIFECYCLE_PROTOCOL as P19 } from "../content/protocols/mpi.certification_lifecycle";
import { MPI_LIFECYCLE_REVIEW_PROTOCOL as P20 } from "../content/protocols/mpi.lifecycle_review";
import { TREATMENT_INVENTORY_CREATE_PROTOCOL as PD201 } from "../content/protocols/treatment.inventory_create";
import { TREATMENT_ACTOR_ROLES_PROTOCOL as PD202 } from "../content/protocols/treatment.actor_roles";
import { TREATMENT_PURPOSE_DEFINE_PROTOCOL as PD203 } from "../content/protocols/treatment.purpose_define";
import type { ExecutionProtocol } from "../content/protocols/types";
import {
  getProtocolForActivity,
  listProtocols,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import type { FactMap } from "../content/protocols/types";
import { blockingConflicts, mergedFactRecords } from "../src/workspace/facts";
import {
  applyProcedureFinalization,
  getFinalizableOutcome,
  validateProcedureFinalization,
} from "../src/workspace/finalize";
import { newCompany } from "../src/workspace/types";
import { finalizeJudgment } from "../src/workspace/reasoning";
import { validateCompanyState } from "../src/workspace/store";
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
  it("22. D1.03 ahora tiene protocolo de juicio (blocker anterior resuelto)", () => {
    expect(getProtocolForActivity("mpi.need_assessment")).toBeDefined();
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

function mustOutcomeFor(protocol: ExecutionProtocol, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

function protocolFactKeys(protocol: ExecutionProtocol): string[] {
  const out = new Set<string>(protocol.decision_fact_keys);
  for (const n of protocol.nodes) {
    if (n.fact_key) out.add(n.fact_key);
    for (const f of n.required_facts ?? []) out.add(f);
  }
  return [...out];
}

describe("batch D1: D1.01 procedure", () => {
  it("26. D1.01 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("governance.preventive_framework")).toBe(P01);
    expect(P01.protocol_key).toBe("governance.preventive_framework.v1");
    expect(P01.mode).toBe("procedure");
    expect(P01.version).toBe(1);
    expect(P01.entry_node_key).toBe("role-gate");
    expect(getCanonicalActivity(P01.activity_key)?.human_code).toBe("D1.01");
  });

  it("27. compuerta, cuatro verificaciones canónicas y síntesis", () => {
    expect(P01.nodes.map((n) => n.node_key)).toEqual([
      "role-gate",
      "identify-actions",
      "determine-gaps",
      "define-framework",
      "followup-mechanism",
      "final-confirmation",
    ]);
    expect(P01.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["framework_established", "framework_in_progress", "not_applicable"].sort(),
    );
  });

  it("28. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P01)).toEqual([]);
    expect(getCanonicalActivity("treatment.actor_roles")).toBeDefined();
  });

  it("29. sin rol de responsable no aplica y deriva a roles D2", () => {
    const e = mustOutcomeFor(P01, { "governance.client_is_responsible": "no" });
    expect(e.outcome_key).toBe("not_applicable");
    expect(e.rule_id).toBe("not-responsible");
    const action = e.outcome.next_actions.find((a) => a.kind === "activity");
    expect(action?.activity_key).toBe("treatment.actor_roles");
  });

  it("30. todo verificado produce marco establecido", () => {
    const e = mustOutcomeFor(P01, {
      "governance.client_is_responsible": "yes",
      "governance.actions_identified": "yes",
      "governance.gaps_determined": "yes",
      "governance.framework_defined": "yes",
      "governance.followup_established": "yes",
    });
    expect(e.outcome_key).toBe("framework_established");
    expect(e.rule_id).toBe("all-verified");
  });

  it("31. pendiente o sin información mantiene en construcción, nunca establecido", () => {
    const e = mustOutcomeFor(P01, {
      "governance.client_is_responsible": "yes",
      "governance.actions_identified": "yes",
      "governance.gaps_determined": "no",
      "governance.framework_defined": "yes",
      "governance.followup_established": "yes",
    });
    expect(e.outcome_key).toBe("framework_in_progress");
    const u = mustOutcomeFor(P01, {
      "governance.client_is_responsible": "yes",
      "governance.actions_identified": "unknown",
      "governance.gaps_determined": "yes",
      "governance.framework_defined": "yes",
      "governance.followup_established": "yes",
    });
    expect(u.outcome_key).toBe("framework_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("32. unknown no equivale a verificado", () => {
    const e = evaluateProtocol(P01, { "governance.client_is_responsible": "yes" });
    expect(e.status).toBe("awaiting_facts");
    if (e.status === "awaiting_facts") {
      expect(e.current_node_key).toBe("identify-actions");
    }
  });

  it("33. marco distinguido de MPI: sin rama de adopción", () => {
    const complete = P01.outcomes.find((o) => o.outcome_key === "framework_established");
    expect(
      complete?.next_actions.some(
        (a) => a.kind === "info" && (a.note ?? "").includes("independiente"),
      ),
    ).toBe(true);
    // Ninguna regla ni acción deriva a evaluar o formalizar MPI.
    const text = JSON.stringify({ t: P01.nodes.map((n) => n.transitions), o: P01.outcomes });
    expect(text).not.toContain("mpi.need_assessment");
    expect(text).not.toContain("mpi.formalize_adoption");
  });
});

describe("batch D1: D1.08 procedure", () => {
  it("34. D1.08 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.designate")).toBe(P08);
    expect(P08.protocol_key).toBe("dpo.designate.v1");
    expect(P08.mode).toBe("procedure");
    expect(P08.version).toBe(1);
    expect(P08.entry_node_key).toBe("trigger-gate");
    expect(getCanonicalActivity(P08.activity_key)?.human_code).toBe("D1.08");
  });

  it("35. antecedente, prerrequisitos, acto y síntesis sin árbol artificial", () => {
    expect(P08.nodes.map((n) => n.node_key)).toEqual([
      "trigger-gate",
      "confirm-authority",
      "modality",
      "natural-person",
      "group-conditions",
      "suitability",
      "formalization",
      "final-confirmation",
    ]);
    expect(P08.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["designation_complete", "designation_in_progress", "prerequisite_pending"].sort(),
    );
    // Una sola síntesis decisional; el resto son verificaciones planas.
    expect(P08.nodes.filter((n) => n.node_type === "decision")).toHaveLength(1);
  });

  it("36. estructura válida y siguientes pasos resuelven", () => {
    expect(validateProtocolStructure(P08)).toEqual([]);
    expect(getCanonicalActivity("dpo.initial_governance_validation")).toBeDefined();
    expect(getCanonicalActivity("dpo.need_assessment")).toBeDefined();
  });

  it("37. sin antecedente deriva a D1.02 sin re-resolverlo", () => {
    const e = mustOutcomeFor(P08, { "dpo.designation_trigger": "undecided" });
    expect(e.outcome_key).toBe("prerequisite_pending");
    expect(e.rule_id).toBe("trigger-undefined");
    const action = e.outcome.next_actions.find((a) => a.kind === "activity");
    expect(action?.activity_key).toBe("dpo.need_assessment");
    // No re-pregunta factores de D1.02 ni estados MPI: namespace propio.
    for (const f of protocolFactKeys(P08)) {
      expect(f.startsWith("dpo.designation_"), f).toBe(true);
    }
  });

  function fullDesignation(over: FactMap = {}): FactMap {
    return {
      "dpo.designation_trigger": "voluntary",
      "dpo.designation_authority": "yes",
      "dpo.designation_modality": "internal",
      "dpo.designation_natural_person": "na",
      "dpo.designation_group_conditions": "na",
      "dpo.designation_suitability": "yes",
      "dpo.designation_formalization": "yes",
      ...over,
    };
  }

  it("38. designación interna completa enlaza validación D1.09", () => {
    const e = mustOutcomeFor(P08, fullDesignation());
    expect(e.outcome_key).toBe("designation_complete");
    expect(e.rule_id).toBe("all-verified");
    const complete = e.outcome;
    expect(complete.classification).toBe("legal_requirement");
    expect(complete.provenance).toBe("legal_requirement");
    expect(
      complete.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.initial_governance_validation");
  });

  it("39. persona jurídica sin persona natural no completa", () => {
    const e = mustOutcomeFor(
      P08,
      fullDesignation({
        "dpo.designation_modality": "external_entity",
        "dpo.designation_natural_person": "na",
      }),
    );
    expect(e.outcome_key).toBe("designation_in_progress");
    expect(e.rule_id).toBe("entity-without-natural-person");
    const ok = mustOutcomeFor(
      P08,
      fullDesignation({
        "dpo.designation_modality": "external_entity",
        "dpo.designation_natural_person": "yes",
      }),
    );
    expect(ok.outcome_key).toBe("designation_complete");
  });

  it("40. pendiente o sin información mantiene en curso, nunca completa", () => {
    const e = mustOutcomeFor(P08, fullDesignation({ "dpo.designation_suitability": "no" }));
    expect(e.outcome_key).toBe("designation_in_progress");
    const u = mustOutcomeFor(
      P08,
      fullDesignation({ "dpo.designation_formalization": "unknown" }),
    );
    expect(u.outcome_key).toBe("designation_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("41. obligación y estándar no se mezclan en resultados", () => {
    const byKey = new Map(P08.outcomes.map((o) => [o.outcome_key, o]));
    expect(byKey.get("designation_complete")?.classification).toBe("legal_requirement");
    expect(byKey.get("designation_in_progress")?.classification).toBe("agency_standard");
    expect(byKey.get("prerequisite_pending")?.classification).toBe("agency_standard");
  });
});

describe("batch D1: D1.11 procedure", () => {
  it("42. D1.11 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.operating_model")).toBe(P11);
    expect(P11.protocol_key).toBe("dpo.operating_model.v1");
    expect(P11.mode).toBe("procedure");
    expect(P11.version).toBe(1);
    expect(P11.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P11.activity_key)?.human_code).toBe("D1.11");
  });

  it("43. lista operacional plana: compuerta, cinco verificaciones y síntesis", () => {
    expect(P11.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "organize-reporting",
      "organize-involvement",
      "organize-info-access",
      "organize-functions",
      "organize-cadence",
      "final-confirmation",
    ]);
    expect(P11.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["operating_model_active", "operating_model_in_progress", "prerequisite_missing"].sort(),
    );
    expect(P11.nodes.filter((n) => n.node_type === "decision")).toHaveLength(1);
  });

  it("44. estructura válida y siguientes pasos resuelven", () => {
    expect(validateProtocolStructure(P11)).toEqual([]);
    expect(getCanonicalActivity("dpo.annual_plan")).toBeDefined();
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
  });

  it("45. sin designación deriva a D1.08", () => {
    const e = mustOutcomeFor(P11, { "dpo.designated": "no" });
    expect(e.outcome_key).toBe("prerequisite_missing");
    expect(e.rule_id).toBe("no-designation");
    const action = e.outcome.next_actions.find((a) => a.kind === "activity");
    expect(action?.activity_key).toBe("dpo.designate");
  });

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

  it("46. todo organizado produce modelo activo y enlaza plan anual", () => {
    const e = mustOutcomeFor(P11, fullModel());
    expect(e.outcome_key).toBe("operating_model_active");
    expect(e.rule_id).toBe("all-verified");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.annual_plan");
  });

  it("47. pendiente mantiene en organización con elementos visibles", () => {
    const e = mustOutcomeFor(P11, fullModel({ "dpo.operating.cadence": "no" }));
    expect(e.outcome_key).toBe("operating_model_in_progress");
    const u = mustOutcomeFor(P11, fullModel({ "dpo.operating.involvement": "unknown" }));
    expect(u.outcome_key).toBe("operating_model_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("48. compuerta reutiliza el fact de D1.09", () => {
    const gate = P11.nodes.find((n) => n.node_key === "designation-gate");
    expect(gate?.fact_key).toBe("dpo.designated");
    // Namespace propio salvo la compuerta compartida y documentada.
    for (const f of protocolFactKeys(P11)) {
      expect(f === "dpo.designated" || f.startsWith("dpo.operating."), f).toBe(true);
    }
  });
});

describe("batch D1: integridad del segundo batch", () => {
  it("49. namespaces disjuntos salvo compuerta compartida documentada", () => {
    const f01 = new Set(protocolFactKeys(P01));
    const f08 = new Set(protocolFactKeys(P08));
    const f11 = new Set(protocolFactKeys(P11));
    const f02 = new Set(protocolFactKeys(P02));
    const f04 = new Set(protocolFactKeys(P04));
    const f09 = new Set(protocolFactKeys(P09));
    const prior = new Set([...f02, ...f04, ...f09]);
    for (const f of f01) expect(prior.has(f), `D1.01 colisiona: ${f}`).toBe(false);
    for (const f of f08) expect(prior.has(f), `D1.08 colisiona: ${f}`).toBe(false);
    for (const f of f11) {
      if (f === "dpo.designated") continue;
      expect(prior.has(f), `D1.11 colisiona: ${f}`).toBe(false);
    }
    for (const f of f08) expect(f01.has(f), `D1.08/D1.01 colisionan: ${f}`).toBe(false);
    for (const f of f11) {
      if (f === "dpo.designated") continue;
      expect(f01.has(f), `D1.11/D1.01 colisionan: ${f}`).toBe(false);
      expect(f08.has(f), `D1.11/D1.08 colisionan: ${f}`).toBe(false);
    }
  });

  it("50. protocolos anteriores intactos tras el batch", () => {
    expect(getProtocolForActivity("dpo.need_assessment")).toBe(P02);
    expect(getProtocolForActivity("mpi.need_assessment")).toBe(P03);
    expect(getProtocolForActivity("mpi.formalize_adoption")).toBe(P04);
    expect(getProtocolForActivity("dpo.initial_governance_validation")).toBe(P09);
    for (const p of [P02, P03, P04, P09, P01, P08, P11]) {
      expect(validateProtocolStructure(p), p.protocol_key).toEqual([]);
    }
  });

  it("51. respuestas aisladas por empresa", () => {
    const at = new Date().toISOString();
    const a = newCompany("Empresa A SpA");
    const b = newCompany("Empresa B SpA");
    a.protocolAnswers[P01.protocol_key] = {
      "governance.framework_defined": { value: "yes", source: P01.protocol_key, updatedAt: at },
    };
    b.protocolAnswers[P01.protocol_key] = {
      "governance.framework_defined": { value: "no", source: P01.protocol_key, updatedAt: at },
    };
    const fa = mergedFactRecords(a);
    const fb = mergedFactRecords(b);
    expect(fa["governance.framework_defined"]?.value).toBe("yes");
    expect(fb["governance.framework_defined"]?.value).toBe("no");
    // Cambiar de empresa cambia el contexto: sin fuga entre empresas.
    expect(fa["governance.framework_defined"]?.value).not.toBe(
      fb["governance.framework_defined"]?.value,
    );
  });

  it("52. efectos de verificación sobreviven export/import", () => {
    const at = new Date().toISOString();
    const company = newCompany("Export SpA");
    company.protocolAnswers[P08.protocol_key] = {
      "dpo.designation_trigger": { value: "voluntary", source: P08.protocol_key, updatedAt: at },
      "dpo.designation_formalization": { value: "yes", source: P08.protocol_key, updatedAt: at },
    };
    // Mecanismo existente: la empresa se serializa íntegra a JSON.
    const exported = JSON.stringify(company);
    const checked = validateCompanyState(JSON.parse(exported));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const facts: FactMap = {};
    for (const [k, r] of Object.entries(mergedFactRecords(checked.value))) {
      facts[k] = r.value;
    }
    expect(facts["dpo.designation_trigger"]).toBe("voluntary");
    expect(facts["dpo.designation_formalization"]).toBe("yes");
  });

  it("53. desacuerdo entre fuentes bloquea conclusión definitiva", () => {
    const at = new Date().toISOString();
    const company = newCompany("Conflicto SpA");
    company.diagnosticFacts["dpo.designated"] = {
      value: "yes",
      source: "diagnostico",
      updatedAt: at,
    };
    company.protocolAnswers[P11.protocol_key] = {
      "dpo.designated": { value: "no", source: P11.protocol_key, updatedAt: at },
    };
    // Conflicto visible y bloqueante, nunca unknown ni false.
    expect(blockingConflicts(P11, company)).toContain("dpo.designated");
    // Acuerdo entre fuentes resuelve sin conflicto.
    company.protocolAnswers[P11.protocol_key] = {
      "dpo.designated": { value: "yes", source: P11.protocol_key, updatedAt: at },
    };
    expect(blockingConflicts(P11, company)).not.toContain("dpo.designated");
  });
});

describe("batch D1: D1.15 procedure", () => {
  it("54. D1.15 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.infringement_escalation")).toBe(P15);
    expect(P15.protocol_key).toBe("dpo.infringement_escalation.v1");
    expect(P15.mode).toBe("procedure");
    expect(P15.version).toBe(1);
    expect(P15.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P15.activity_key)?.human_code).toBe("D1.15");
  });

  it("55. compuertas, cinco verificaciones y síntesis", () => {
    expect(P15.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "case-gate",
      "register-case",
      "determine-facts",
      "communicate-authority",
      "record-measures",
      "derive-findings",
      "final-confirmation",
    ]);
    expect(P15.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "escalation_complete",
        "escalation_in_progress",
        "prerequisite_missing",
        "no_pending_case",
      ].sort(),
    );
  });

  it("56. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P15)).toEqual([]);
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
    expect(getCanonicalActivity("dpo.operating_model")).toBeDefined();
  });

  it("57. sin designación o sin caso deriva sin inventar", () => {
    const missing = mustOutcomeFor(P15, { "dpo.designated": "no" });
    expect(missing.outcome_key).toBe("prerequisite_missing");
    expect(
      missing.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.designate");
    const idle = mustOutcomeFor(P15, {
      "dpo.designated": "yes",
      "dpo.escalation.case_known": "none",
    });
    expect(idle.outcome_key).toBe("no_pending_case");
    expect(idle.rule_id).toBe("no-case");
  });

  function fullEscalation(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.escalation.case_known": "known",
      "dpo.escalation.registered": "yes",
      "dpo.escalation.determined": "yes",
      "dpo.escalation.communicated": "yes",
      "dpo.escalation.measures": "yes",
      "dpo.escalation.findings_derivation": "na",
      ...over,
    };
  }

  it("58. caso completo produce escalamiento con expediente", () => {
    const e = mustOutcomeFor(P15, fullEscalation());
    expect(e.outcome_key).toBe("escalation_complete");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    const note = e.outcome.next_actions.find((a) => a.kind === "info")?.note ?? "";
    for (const item of [
      "registro de comunicación",
      "antecedentes remitidos",
      "fecha y destinatario",
      "medidas adoptadas o instruidas",
    ]) {
      expect(note, item).toContain(item);
    }
  });

  it("59. pendiente o sin información mantiene en curso", () => {
    const e = mustOutcomeFor(P15, fullEscalation({ "dpo.escalation.measures": "no" }));
    expect(e.outcome_key).toBe("escalation_in_progress");
    const u = mustOutcomeFor(
      P15,
      fullEscalation({ "dpo.escalation.communicated": "unknown" }),
    );
    expect(u.outcome_key).toBe("escalation_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("60. sin gravedad ni scoring inventados", () => {
    const text = JSON.stringify(P15).toLowerCase();
    expect(text).not.toContain("score");
    expect(text).not.toContain("gravedad");
    expect(text).not.toContain("severidad");
    expect(text).not.toContain("criticidad");
  });
});

describe("batch D1: D1.17 decision", () => {
  it("61. D1.17 tiene exactamente un protocolo activo mode decision", () => {
    expect(getProtocolForActivity("dpo.terminate_or_replace")).toBe(P17);
    expect(P17.protocol_key).toBe("dpo.terminate_or_replace.v1");
    expect(P17.mode).toBe("decision");
    expect(P17.version).toBe(1);
    expect(P17.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P17.activity_key)?.human_code).toBe("D1.17");
  });

  it("62. tres determinaciones y síntesis con lifecycle externo", () => {
    expect(P17.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "event-confirmation",
      "other-source",
      "requirement-assessment",
    ]);
    expect(P17.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "replacement_required",
        "voluntary_closure",
        "assessment_incomplete",
        "prerequisite_missing",
        "no_pending_event",
      ].sort(),
    );
    expect(P17.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("63. estructura válida y siguientes pasos resuelven", () => {
    expect(validateProtocolStructure(P17)).toEqual([]);
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
    expect(getCanonicalActivity("mpi.lifecycle_review")).toBeDefined();
  });

  function terminationFacts(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.termination.event_occurred": "occurred",
      "mpi.lifecycle_status": "implemented",
      "dpo.termination.other_source": "no",
      ...over,
    };
  }

  it("64. MPI activo exige vacancia con reemplazo y enlaza D1.08", () => {
    const e = mustOutcomeFor(P17, terminationFacts());
    expect(e.outcome_key).toBe("replacement_required");
    expect(e.rule_id).toBe("mpi-active-replacement");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.designate");
  });

  it("65. voluntario sin otra fuente cierra sin deber automático", () => {
    const e = mustOutcomeFor(
      P17,
      terminationFacts({
        "mpi.lifecycle_status": "not_adopted",
        "dpo.termination.other_source": "no",
      }),
    );
    expect(e.outcome_key).toBe("voluntary_closure");
    expect(e.rule_id).toBe("voluntary-closure");
  });

  it("66. otra fuente vigente también exige reemplazo", () => {
    const e = mustOutcomeFor(
      P17,
      terminationFacts({
        "mpi.lifecycle_status": "discontinued",
        "dpo.termination.other_source": "yes",
      }),
    );
    expect(e.outcome_key).toBe("replacement_required");
    expect(e.rule_id).toBe("other-source-replacement");
  });

  it("67. sin evento no hay gestión; unknown nunca cierra", () => {
    const idle = mustOutcomeFor(
      P17,
      terminationFacts({ "dpo.termination.event_occurred": "none" }),
    );
    expect(idle.outcome_key).toBe("no_pending_event");
    const noLifecycle = mustOutcomeFor(
      P17,
      terminationFacts({ "mpi.lifecycle_status": "unknown" }),
    );
    expect(noLifecycle.outcome_key).toBe("assessment_incomplete");
    const noEvent = mustOutcomeFor(
      P17,
      terminationFacts({ "dpo.termination.event_occurred": "unknown" }),
    );
    expect(noEvent.outcome_key).toBe("assessment_incomplete");
    // Incompleto deriva a revisar el ciclo de vida, no a cerrar.
    const review = noLifecycle.outcome.next_actions.find((a) => a.kind === "activity");
    expect(review?.activity_key).toBe("mpi.lifecycle_review");
  });

  it("68. no recrea D1.02 ni D1.04: lifecycle solo externo", () => {
    for (const f of protocolFactKeys(P17)) {
      expect(
        f === "dpo.designated" ||
          f.startsWith("dpo.termination.") ||
          f === "mpi.lifecycle_status",
        f,
      ).toBe(true);
    }
    expect(P17.external_fact_keys).toEqual(["mpi.lifecycle_status"]);
    const text = JSON.stringify(P17.nodes);
    expect(text).not.toContain("dpo_assessment.");
  });
});

describe("batch D1: D1.18 procedure", () => {
  it("69. D1.18 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.assemble_program")).toBe(P18);
    expect(P18.protocol_key).toBe("mpi.assemble_program.v1");
    expect(P18.mode).toBe("procedure");
    expect(P18.version).toBe(1);
    expect(P18.entry_node_key).toBe("verify-responsible");
    expect(getCanonicalActivity(P18.activity_key)?.human_code).toBe("D1.18");
  });

  it("70. nueve componentes planos más síntesis", () => {
    expect(P18.nodes.map((n) => n.node_key)).toEqual([
      "verify-responsible",
      "verify-dpo",
      "characterize-treatments",
      "identify-risks",
      "verify-protocols",
      "verify-obligations",
      "verify-integration",
      "verify-diffusion",
      "consolidate-evidence",
      "final-confirmation",
    ]);
    expect(P18.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["assembly_complete", "assembly_in_progress", "not_started"].sort(),
    );
    expect(P18.nodes.filter((n) => n.node_type === "decision")).toHaveLength(1);
    expect(P18.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("71. estructura válida y siguientes pasos resuelven", () => {
    expect(validateProtocolStructure(P18)).toEqual([]);
    expect(getCanonicalActivity("mpi.lifecycle_review")).toBeDefined();
    expect(getCanonicalActivity("mpi.formalize_adoption")).toBeDefined();
  });

  function fullAssembly(over: FactMap = {}): FactMap {
    return {
      "mpi.lifecycle_status": "implementing",
      "mpi.assembly.responsible_identified": "yes",
      "mpi.assembly.dpo_verified": "yes",
      "mpi.assembly.treatments_characterized": "yes",
      "mpi.assembly.risks_identified": "yes",
      "mpi.assembly.protocols_verified": "yes",
      "mpi.assembly.obligations_verified": "yes",
      "mpi.assembly.integration_verified": "yes",
      "mpi.assembly.diffusion_verified": "yes",
      "mpi.assembly.evidence_consolidated": "yes",
      ...over,
    };
  }

  it("72. sin adopción no inicia y deriva a D1.04 sin recrearlo", () => {
    const e = mustOutcomeFor(P18, {
      ...fullAssembly(),
      "mpi.lifecycle_status": "not_adopted",
    });
    expect(e.outcome_key).toBe("not_started");
    expect(e.rule_id).toBe("not-adopted");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("mpi.formalize_adoption");
  });

  it("73. todo operativo produce programa implementado con efecto", () => {
    const e = mustOutcomeFor(P18, fullAssembly());
    expect(e.outcome_key).toBe("assembly_complete");
    expect(e.rule_id).toBe("all-operative");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "mpi.lifecycle_status", value: "implemented" },
    ]);
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("mpi.lifecycle_review");
  });

  it("74. pendiente mantiene en ensamblaje sin efectos", () => {
    const e = mustOutcomeFor(
      P18,
      fullAssembly({ "mpi.assembly.diffusion_verified": "no" }),
    );
    expect(e.outcome_key).toBe("assembly_in_progress");
    const u = mustOutcomeFor(
      P18,
      fullAssembly({ "mpi.assembly.risks_identified": "unknown" }),
    );
    expect(u.outcome_key).toBe("assembly_in_progress");
    expect(u.rule_id).toBe("pending-components");
  });

  it("75. namespaces propios y disjuntos", () => {
    for (const f of protocolFactKeys(P18)) {
      expect(
        f === "mpi.lifecycle_status" || f.startsWith("mpi.assembly."),
        f,
      ).toBe(true);
    }
    const own = new Set(
      protocolFactKeys(P18).filter((f) => f !== "mpi.lifecycle_status"),
    );
    for (const f of protocolFactKeys(P15)) {
      expect(own.has(f), `D1.18/D1.15 colisionan: ${f}`).toBe(false);
    }
    for (const f of protocolFactKeys(P17)) {
      if (f === "mpi.lifecycle_status" || f === "dpo.designated") continue;
      expect(own.has(f), `D1.18/D1.17 colisionan: ${f}`).toBe(false);
    }
  });
});

describe("batch D1: integridad del tercer batch", () => {
  it("76. diez protocolos registrados, anteriores intactos", () => {
    expect(
      [
        P01,
        P08,
        P11,
        P15,
        P17,
        P18,
      ].every((p) => validateProtocolStructure(p).length === 0),
    ).toBe(true);
    expect(getProtocolForActivity("dpo.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.formalize_adoption")?.mode).toBe("procedure");
    expect(
      getProtocolForActivity("dpo.initial_governance_validation")?.mode,
    ).toBe("checklist");
  });

  it("77. D1.18 finalizado materializa implemented; incompleto no", () => {
    const company = newCompany("Ensambla SpA");
    const facts: FactMap = {
      "mpi.lifecycle_status": "implementing",
      "mpi.assembly.responsible_identified": "yes",
      "mpi.assembly.dpo_verified": "yes",
      "mpi.assembly.treatments_characterized": "yes",
      "mpi.assembly.risks_identified": "yes",
      "mpi.assembly.protocols_verified": "yes",
      "mpi.assembly.obligations_verified": "yes",
      "mpi.assembly.integration_verified": "yes",
      "mpi.assembly.diffusion_verified": "yes",
      "mpi.assembly.evidence_consolidated": "yes",
    };
    const validated = validateProcedureFinalization({
      protocol: P18,
      company,
      facts,
      outcomeKey: "assembly_complete",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next, applied } = applyProcedureFinalization(
      company,
      P18,
      validated.effects,
    );
    expect(applied).toEqual(["mpi.lifecycle_status"]);
    expect(
      next.protocolAnswers[P18.protocol_key]?.["mpi.lifecycle_status"]?.value,
    ).toBe("implemented");
    // Repetir es no-op.
    const twice = applyProcedureFinalization(next, P18, validated.effects);
    expect(twice.applied).toEqual([]);
    // Incompleto nunca escribe.
    const rejected = validateProcedureFinalization({
      protocol: P18,
      company,
      facts: { ...facts, "mpi.assembly.diffusion_verified": "no" },
      outcomeKey: "assembly_complete",
    });
    expect(rejected.ok).toBe(false);
  });

  it("78. desacuerdo de lifecycle bloquea D1.17 hasta resolución", () => {
    const at = new Date().toISOString();
    const company = newCompany("Ciclo SpA");
    company.protocolAnswers[P18.protocol_key] = {
      "mpi.lifecycle_status": {
        value: "implemented",
        source: P18.protocol_key,
        updatedAt: at,
      },
    };
    company.protocolAnswers["dpo.need_assessment.v1"] = {
      "mpi.lifecycle_status": {
        value: "implementing",
        source: "dpo.need_assessment.v1",
        updatedAt: at,
      },
    };
    expect(blockingConflicts(P17, company)).toContain("mpi.lifecycle_status");
    // Acuerdo entre fuentes libera.
    company.protocolAnswers["dpo.need_assessment.v1"] = {
      "mpi.lifecycle_status": {
        value: "implemented",
        source: "dpo.need_assessment.v1",
        updatedAt: at,
      },
    };
    expect(blockingConflicts(P17, company)).not.toContain("mpi.lifecycle_status");
  });

  it("79. D1.15 y D1.17 sin lifecycle effects: solo execution-ready", () => {
    for (const p of [P15, P17]) {
      for (const o of p.outcomes) {
        expect(
          o.canonical_fact_effects ?? [],
          `${p.protocol_key}/${o.outcome_key}`,
        ).toEqual([]);
      }
    }
  });
});

describe("batch D1: D1.05 procedure", () => {
  it("80. D1.05 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.internal_reporting_and_whistleblowing")).toBe(P05);
    expect(P05.protocol_key).toBe("mpi.internal_reporting_and_whistleblowing.v1");
    expect(P05.mode).toBe("procedure");
    expect(P05.version).toBe(1);
    expect(P05.entry_node_key).toBe("define-channel");
    expect(getCanonicalActivity(P05.activity_key)?.human_code).toBe("D1.05");
  });

  it("81. cinco verificaciones del mecanismo más síntesis", () => {
    expect(P05.nodes.map((n) => n.node_key)).toEqual([
      "define-channel",
      "identity-reserve",
      "non-retaliation",
      "handling-flow",
      "test-channel",
      "final-confirmation",
    ]);
    expect(P05.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["mechanism_implemented", "mechanism_in_progress", "not_started"].sort(),
    );
    expect(P05.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("82. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P05)).toEqual([]);
    expect(getCanonicalActivity("mpi.formalize_adoption")).toBeDefined();
  });

  function fullMechanism(over: FactMap = {}): FactMap {
    return {
      "mpi.lifecycle_status": "implementing",
      "mpi.whistleblowing.channel_defined": "yes",
      "mpi.whistleblowing.identity_reserve": "yes",
      "mpi.whistleblowing.non_retaliation": "yes",
      "mpi.whistleblowing.handling_defined": "yes",
      "mpi.whistleblowing.tested": "yes",
      ...over,
    };
  }

  it("83. sin adopción no inicia y deriva a D1.04 sin recrearlo", () => {
    const e = mustOutcomeFor(P05, {
      ...fullMechanism(),
      "mpi.lifecycle_status": "not_adopted",
    });
    expect(e.outcome_key).toBe("not_started");
    expect(e.rule_id).toBe("not-adopted");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("mpi.formalize_adoption");
    for (const f of protocolFactKeys(P05)) {
      expect(
        f === "mpi.lifecycle_status" || f.startsWith("mpi.whistleblowing."),
        f,
      ).toBe(true);
    }
  });

  it("84. todo operativo produce mecanismo con efecto", () => {
    const e = mustOutcomeFor(P05, fullMechanism());
    expect(e.outcome_key).toBe("mechanism_implemented");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "mpi.whistleblowing_status", value: "implemented" },
    ]);
  });

  it("85. pendiente o sin información mantiene en implementación", () => {
    const e = mustOutcomeFor(
      P05,
      fullMechanism({ "mpi.whistleblowing.tested": "no" }),
    );
    expect(e.outcome_key).toBe("mechanism_in_progress");
    const u = mustOutcomeFor(
      P05,
      fullMechanism({ "mpi.whistleblowing.non_retaliation": "unknown" }),
    );
    expect(u.outcome_key).toBe("mechanism_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("86. guía el mecanismo, no casos individuales", () => {
    const text = JSON.stringify(P05).toLowerCase();
    expect(text).not.toContain("denunciante");
    for (const f of protocolFactKeys(P05)) {
      expect(f).not.toContain("case");
    }
  });
});

describe("batch D1: D1.06 procedure", () => {
  it("87. D1.06 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.internal_disciplinary_framework")).toBe(P06);
    expect(P06.protocol_key).toBe("mpi.internal_disciplinary_framework.v1");
    expect(P06.mode).toBe("procedure");
    expect(P06.entry_node_key).toBe("map-existing");
    expect(getCanonicalActivity(P06.activity_key)?.human_code).toBe("D1.06");
  });

  it("88. cinco verificaciones del régimen más síntesis", () => {
    expect(P06.nodes.map((n) => n.node_key)).toEqual([
      "map-existing",
      "integrate-breaches",
      "define-procedure",
      "verify-coherence",
      "formalize-approved",
      "final-confirmation",
    ]);
    expect(P06.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["framework_established", "framework_in_progress", "not_started"].sort(),
    );
    expect(P06.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("89. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P06)).toEqual([]);
    expect(getCanonicalActivity("mpi.formalize_adoption")).toBeDefined();
  });

  function fullRegime(over: FactMap = {}): FactMap {
    return {
      "mpi.lifecycle_status": "adoption_formalized",
      "mpi.disciplinary.existing_mapped": "yes",
      "mpi.disciplinary.breaches_integrated": "yes",
      "mpi.disciplinary.procedure_defined": "yes",
      "mpi.disciplinary.coherence_verified": "yes",
      "mpi.disciplinary.approved": "yes",
      ...over,
    };
  }

  it("90. todo verificado produce régimen con efecto", () => {
    const e = mustOutcomeFor(P06, fullRegime());
    expect(e.outcome_key).toBe("framework_established");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "mpi.disciplinary_framework_status", value: "implemented" },
    ]);
  });

  it("91. pendiente mantiene en elaboración", () => {
    const e = mustOutcomeFor(P06, fullRegime({ "mpi.disciplinary.approved": "no" }));
    expect(e.outcome_key).toBe("framework_in_progress");
    const u = mustOutcomeFor(
      P06,
      fullRegime({ "mpi.disciplinary.procedure_defined": "unknown" }),
    );
    expect(u.outcome_key).toBe("framework_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("92. sin sanciones, gravedad ni scoring inventados", () => {
    const text = JSON.stringify(P06).toLowerCase();
    expect(text).not.toContain("score");
    expect(text).not.toContain("gravedad");
    expect(text).not.toContain("severidad");
    expect(text).not.toContain("leve");
    expect(text).not.toContain("grave");
  });
});

describe("batch D1: D1.07 procedure", () => {
  it("93. D1.07 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.internal_regulation_integrate")).toBe(P07);
    expect(P07.protocol_key).toBe("mpi.internal_regulation_integrate.v1");
    expect(P07.mode).toBe("procedure");
    expect(P07.entry_node_key).toBe("identify-subjects");
    expect(getCanonicalActivity(P07.activity_key)?.human_code).toBe("D1.07");
  });

  it("94. aplicabilidad explícita más cinco verificaciones y síntesis", () => {
    expect(P07.nodes.map((n) => n.node_key)).toEqual([
      "identify-subjects",
      "identify-instruments",
      "incorporate-obligations",
      "bylaws-applicability",
      "update-bylaws",
      "verify-publicity",
      "final-confirmation",
    ]);
    expect(P07.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["integration_complete", "integration_in_progress", "not_started"].sort(),
    );
    for (const key of ["update-bylaws", "verify-publicity"]) {
      const node = P07.nodes.find((n) => n.node_key === key);
      expect(node?.options?.map((o) => o.value).sort()).toEqual(
        ["na", "no", "unknown", "yes"].sort(),
      );
    }
  });

  it("95. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P07)).toEqual([]);
    expect(getCanonicalActivity("mpi.formalize_adoption")).toBeDefined();
  });

  function fullIntegration(over: FactMap = {}): FactMap {
    return {
      "mpi.lifecycle_status": "implementing",
      "mpi.regulation.subjects_identified": "yes",
      "mpi.regulation.instruments_identified": "yes",
      "mpi.regulation.obligations_incorporated": "yes",
      "mpi.regulation.bylaws_applicable": "applies",
      "mpi.regulation.bylaws_updated": "yes",
      "mpi.regulation.publicity_verified": "yes",
      ...over,
    };
  }

  it("96. rama aplicable completa produce efecto", () => {
    const e = mustOutcomeFor(P07, fullIntegration());
    expect(e.outcome_key).toBe("integration_complete");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "mpi.internal_regulation_status", value: "integrated" },
    ]);
  });

  it("97. pendiente se distingue de incorporado; unknown bloquea", () => {
    const e = mustOutcomeFor(
      P07,
      fullIntegration({ "mpi.regulation.obligations_incorporated": "no" }),
    );
    expect(e.outcome_key).toBe("integration_in_progress");
    const u = mustOutcomeFor(
      P07,
      fullIntegration({ "mpi.regulation.instruments_identified": "unknown" }),
    );
    expect(u.outcome_key).toBe("integration_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });

  it("98. namespace propio con lifecycle solo externo", () => {
    for (const f of protocolFactKeys(P07)) {
      expect(
        f === "mpi.lifecycle_status" || f.startsWith("mpi.regulation."),
        f,
      ).toBe(true);
    }
  });

  it("109. rama aplicable con incorporación pendiente no finaliza", () => {
    const e = mustOutcomeFor(
      P07,
      fullIntegration({ "mpi.regulation.bylaws_updated": "na" }),
    );
    expect(e.outcome_key).toBe("integration_in_progress");
    expect(e.rule_id).toBe("branch-required-but-skipped");
  });

  it("110. rama aplicable con publicidad pendiente no finaliza", () => {
    const e = mustOutcomeFor(
      P07,
      fullIntegration({ "mpi.regulation.publicity_verified": "na" }),
    );
    expect(e.outcome_key).toBe("integration_in_progress");
    expect(e.rule_id).toBe("branch-required-but-skipped");
  });

  it("111. rama no aplicable se cierra sin brecha", () => {
    const e = mustOutcomeFor(
      P07,
      fullIntegration({
        "mpi.regulation.bylaws_applicable": "not_applies",
        "mpi.regulation.bylaws_updated": "na",
        "mpi.regulation.publicity_verified": "na",
      }),
    );
    expect(e.outcome_key).toBe("integration_complete");
    expect(e.rule_id).toBe("all-verified");
  });

  it("112. No aplica es distinto de Pendiente y de Sin información", () => {
    // unknown en la rama bloquea aunque el resto esté verificado.
    const u = mustOutcomeFor(
      P07,
      fullIntegration({
        "mpi.regulation.bylaws_applicable": "not_applies",
        "mpi.regulation.bylaws_updated": "unknown",
        "mpi.regulation.publicity_verified": "na",
      }),
    );
    expect(u.outcome_key).toBe("integration_in_progress");
    expect(u.rule_id).toBe("pending-verification");
    // na con rama aplicable no equivale a verificado.
    const skip = mustOutcomeFor(
      P07,
      fullIntegration({ "mpi.regulation.publicity_verified": "na" }),
    );
    expect(skip.outcome_key).toBe("integration_in_progress");
  });

  it("113. No aplica no omite requisitos contractuales", () => {
    // Los tres requisitos contractuales no ofrecen No aplica.
    for (const key of [
      "identify-subjects",
      "identify-instruments",
      "incorporate-obligations",
    ]) {
      const node = P07.nodes.find((n) => n.node_key === key);
      expect(node?.options?.map((o) => o.value).sort()).toEqual(
        ["no", "unknown", "yes"].sort(),
      );
    }
    // Determinación contradictoria tampoco finaliza.
    const e = mustOutcomeFor(
      P07,
      fullIntegration({
        "mpi.regulation.bylaws_applicable": "not_applies",
        "mpi.regulation.bylaws_updated": "yes",
        "mpi.regulation.publicity_verified": "na",
      }),
    );
    expect(e.outcome_key).toBe("integration_in_progress");
    expect(e.rule_id).toBe("branch-dismissed-but-verified");
  });

  it("114. solo requisitos aplicables satisfechos materializan", () => {
    const company = newCompany("Reglamento SpA");
    const facts = fullIntegration({
      "mpi.regulation.bylaws_applicable": "not_applies",
      "mpi.regulation.bylaws_updated": "na",
      "mpi.regulation.publicity_verified": "na",
    });
    const validated = validateProcedureFinalization({
      protocol: P07,
      company,
      facts,
      outcomeKey: "integration_complete",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next, applied } = applyProcedureFinalization(
      company,
      P07,
      validated.effects,
    );
    expect(applied).toEqual(["mpi.internal_regulation_status"]);
    expect(
      next.protocolAnswers[P07.protocol_key]?.["mpi.internal_regulation_status"]?.value,
    ).toBe("integrated");
  });

  it("115. aplicabilidad sin resolver bloquea aunque la rama esté marcada", () => {
    const e = mustOutcomeFor(
      P07,
      fullIntegration({
        "mpi.regulation.bylaws_applicable": "unknown",
        "mpi.regulation.bylaws_updated": "na",
        "mpi.regulation.publicity_verified": "na",
      }),
    );
    expect(e.outcome_key).toBe("integration_in_progress");
    expect(e.rule_id).toBe("pending-verification");
  });
});

describe("batch D1: D1.10 procedure", () => {
  it("116. D1.10 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.contact_and_agency_notification")).toBe(P10);
    expect(P10.protocol_key).toBe("dpo.contact_and_agency_notification.v1");
    expect(P10.mode).toBe("procedure");
    expect(P10.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P10.activity_key)?.human_code).toBe("D1.10");
  });

  it("117. compuerta, cinco verificaciones y síntesis", () => {
    expect(P10.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "define-medium",
      "publish-contact",
      "notify-agency",
      "notify-internal",
      "change-mechanism",
      "final-confirmation",
    ]);
    expect(P10.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["communication_complete", "communication_in_progress", "prerequisite_missing"].sort(),
    );
  });

  it("118. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P10)).toEqual([]);
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
  });

  function fullContact(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.contact.medium_defined": "yes",
      "dpo.contact.published": "yes",
      "dpo.contact.agency_notified": "yes",
      "dpo.contact.internal_notified": "yes",
      "dpo.contact.change_mechanism": "yes",
      ...over,
    };
  }

  it("119. sin designación deriva a D1.08", () => {
    const e = mustOutcomeFor(P10, { "dpo.designated": "no" });
    expect(e.outcome_key).toBe("prerequisite_missing");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.designate");
  });

  it("120. todo comunicado produce efecto doble y expediente", () => {
    const e = mustOutcomeFor(P10, fullContact());
    expect(e.outcome_key).toBe("communication_complete");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "dpo.contact_publication_status", value: "published" },
      { fact_key: "dpo.agency_notification_status", value: "notified" },
    ]);
  });

  it("121. pendiente mantiene en curso", () => {
    const e = mustOutcomeFor(P10, fullContact({ "dpo.contact.published": "no" }));
    expect(e.outcome_key).toBe("communication_in_progress");
    const u = mustOutcomeFor(
      P10,
      fullContact({ "dpo.contact.agency_notified": "unknown" }),
    );
    expect(u.outcome_key).toBe("communication_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });
});

describe("batch D1: D1.13 procedure", () => {
  it("122. D1.13 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.annual_plan")).toBe(P13);
    expect(P13.protocol_key).toBe("dpo.annual_plan.v1");
    expect(P13.mode).toBe("procedure");
    expect(P13.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P13.activity_key)?.human_code).toBe("D1.13");
  });

  it("123. compuerta, cinco verificaciones y síntesis", () => {
    expect(P13.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "review-risks",
      "define-objectives",
      "define-owners",
      "present-plan",
      "diffuse-plan",
      "final-confirmation",
    ]);
    expect(P13.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["plan_developed", "plan_in_progress", "prerequisite_missing"].sort(),
    );
  });

  it("124. estructura válida y siguiente enlaza rendición D1.14", () => {
    expect(validateProtocolStructure(P13)).toEqual([]);
    expect(getCanonicalActivity("dpo.annual_report")).toBeDefined();
    expect(getCanonicalActivity("dpo.operating_model")).toBeDefined();
  });

  function fullPlan(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.plan.risks_reviewed": "yes",
      "dpo.plan.objectives_defined": "yes",
      "dpo.plan.owners_defined": "na",
      "dpo.plan.presented": "yes",
      "dpo.plan.diffused": "yes",
      ...over,
    };
  }

  it("125. plan desarrollado enlaza D1.14 sin efectos de período", () => {
    const e = mustOutcomeFor(P13, fullPlan());
    expect(e.outcome_key).toBe("plan_developed");
    expect(e.rule_id).toBe("all-verified");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.annual_report");
    // Guía por período: sin estado canónico materializable.
    for (const o of P13.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
  });

  it("126. pendiente mantiene en elaboración", () => {
    const e = mustOutcomeFor(P13, fullPlan({ "dpo.plan.presented": "no" }));
    expect(e.outcome_key).toBe("plan_in_progress");
  });
});

describe("batch D1: D1.14 procedure", () => {
  it("127. D1.14 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.annual_report")).toBe(P14);
    expect(P14.protocol_key).toBe("dpo.annual_report.v1");
    expect(P14.mode).toBe("procedure");
    expect(P14.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P14.activity_key)?.human_code).toBe("D1.14");
  });

  it("128. compuertas, cinco verificaciones y síntesis", () => {
    expect(P14.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "plan-gate",
      "consolidate-execution",
      "identify-findings",
      "prepare-rendering",
      "record-decisions",
      "diffuse-results",
      "final-confirmation",
    ]);
    expect(P14.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["report_issued", "report_in_progress", "awaiting_plan", "prerequisite_missing"].sort(),
    );
  });

  it("129. estructura válida y compuerta deriva a D1.13 sin reelaborar", () => {
    expect(validateProtocolStructure(P14)).toEqual([]);
    const awaiting = mustOutcomeFor(P14, {
      "dpo.designated": "yes",
      "dpo.reporting.plan_available": "no",
    });
    expect(awaiting.outcome_key).toBe("awaiting_plan");
    expect(
      awaiting.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.annual_plan");
  });

  function fullReport(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.reporting.plan_available": "yes",
      "dpo.reporting.execution_consolidated": "yes",
      "dpo.reporting.findings_identified": "yes",
      "dpo.reporting.rendering_prepared": "yes",
      "dpo.reporting.decisions_recorded": "yes",
      "dpo.reporting.diffused": "yes",
      ...over,
    };
  }

  it("130. rendición emitida sin efectos de período ni fecha", () => {
    const e = mustOutcomeFor(P14, fullReport());
    expect(e.outcome_key).toBe("report_issued");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    for (const o of P14.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
  });

  it("131. pendiente mantiene en elaboración", () => {
    const e = mustOutcomeFor(
      P14,
      fullReport({ "dpo.reporting.decisions_recorded": "unknown" }),
    );
    expect(e.outcome_key).toBe("report_in_progress");
    expect(e.rule_id).toBe("pending-verification");
  });
});

describe("batch D1: D1.16 checklist", () => {
  it("132. D1.16 tiene exactamente un protocolo activo mode checklist", () => {
    expect(getProtocolForActivity("dpo.governance_revalidation")).toBe(P16);
    expect(P16.protocol_key).toBe("dpo.governance_revalidation.v1");
    expect(P16.mode).toBe("checklist");
    expect(P16.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P16.activity_key)?.human_code).toBe("D1.16");
  });

  it("133. compuerta, seis checks y síntesis", () => {
    expect(P16.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "check-changes",
      "check-conflicts",
      "check-resources",
      "check-updating",
      "check-access",
      "check-remediation",
      "final-assessment",
    ]);
    expect(P16.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "governance_revalidated",
        "remediation_required",
        "information_incomplete",
        "prerequisite_missing",
      ].sort(),
    );
  });

  it("134. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P16)).toEqual([]);
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
    expect(getCanonicalActivity("dpo.initial_governance_validation")).toBeDefined();
  });

  function fullRevalidation(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.revalidation.changes": "yes",
      "dpo.revalidation.conflicts": "yes",
      "dpo.revalidation.resources": "yes",
      "dpo.revalidation.updating": "yes",
      "dpo.revalidation.access": "yes",
      "dpo.revalidation.remediation": "yes",
      ...over,
    };
  }

  it("135. todo satisfactorio revalida; brecha exige remediación", () => {
    const e = mustOutcomeFor(P16, fullRevalidation());
    expect(e.outcome_key).toBe("governance_revalidated");
    expect(e.rule_id).toBe("all-validated");
    const gap = mustOutcomeFor(
      P16,
      fullRevalidation({ "dpo.revalidation.resources": "no" }),
    );
    expect(gap.outcome_key).toBe("remediation_required");
    expect(gap.rule_id).toBe("gaps-found");
    const missing = mustOutcomeFor(
      P16,
      fullRevalidation({ "dpo.revalidation.access": "unknown" }),
    );
    expect(missing.outcome_key).toBe("information_incomplete");
  });

  it("136. namespace propio periódico, sin estado materializable", () => {
    for (const f of protocolFactKeys(P16)) {
      expect(
        f === "dpo.designated" || f.startsWith("dpo.revalidation."),
        f,
      ).toBe(true);
    }
    for (const o of P16.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
  });
});

describe("batch D1: D1.19 procedure", () => {
  it("137. D1.19 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("mpi.certification_lifecycle")).toBe(P19);
    expect(P19.protocol_key).toBe("mpi.certification_lifecycle.v1");
    expect(P19.mode).toBe("procedure");
    expect(P19.entry_node_key).toBe("case-gate");
    expect(getCanonicalActivity(P19.activity_key)?.human_code).toBe("D1.19");
  });

  it("138. compuerta de gestión, seis verificaciones y síntesis", () => {
    expect(P19.nodes.map((n) => n.node_key)).toEqual([
      "case-gate",
      "confirm-implemented",
      "prepare-antecedents",
      "record-request",
      "record-grant",
      "control-renewal",
      "record-closures",
      "final-confirmation",
    ]);
    expect(P19.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["dossier_complete", "dossier_in_progress", "prerequisite_missing", "no_pending_case"].sort(),
    );
    expect(P19.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("139. estructura válida y prerrequisito deriva a D1.18", () => {
    expect(validateProtocolStructure(P19)).toEqual([]);
    const pre = mustOutcomeFor(P19, {
      "mpi.lifecycle_status": "implementing",
      "mpi.certification.case_known": "certify",
      "mpi.certification.implemented_confirmed": "yes",
      "mpi.certification.antecedents_prepared": "yes",
      "mpi.certification.request_recorded": "yes",
      "mpi.certification.grant_recorded": "yes",
      "mpi.certification.renewal_controlled": "yes",
      "mpi.certification.closures_recorded": "yes",
    });
    expect(pre.outcome_key).toBe("prerequisite_missing");
    expect(pre.rule_id).toBe("not-implemented");
    expect(
      pre.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("mpi.assemble_program");
  });

  function fullDossier(over: FactMap = {}): FactMap {
    return {
      "mpi.lifecycle_status": "implemented",
      "mpi.certification.case_known": "renew",
      "mpi.certification.implemented_confirmed": "yes",
      "mpi.certification.antecedents_prepared": "yes",
      "mpi.certification.request_recorded": "yes",
      "mpi.certification.grant_recorded": "yes",
      "mpi.certification.renewal_controlled": "yes",
      "mpi.certification.closures_recorded": "yes",
      ...over,
    };
  }

  it("140. expediente completo sin tocar el lifecycle", () => {
    const e = mustOutcomeFor(P19, fullDossier());
    expect(e.outcome_key).toBe("dossier_complete");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    for (const o of P19.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
    // Sin gestión no hay expediente.
    const idle = mustOutcomeFor(P19, {
      ...fullDossier(),
      "mpi.certification.case_known": "none",
    });
    expect(idle.outcome_key).toBe("no_pending_case");
  });

  it("141. pendiente mantiene en elaboración", () => {
    const e = mustOutcomeFor(
      P19,
      fullDossier({ "mpi.certification.request_recorded": "no" }),
    );
    expect(e.outcome_key).toBe("dossier_in_progress");
  });
});

describe("batch D1: D1.20 decision", () => {
  it("142. D1.20 tiene exactamente un protocolo activo mode decision", () => {
    expect(getProtocolForActivity("mpi.lifecycle_review")).toBe(P20);
    expect(P20.protocol_key).toBe("mpi.lifecycle_review.v1");
    expect(P20.mode).toBe("decision");
    expect(P20.entry_node_key).toBe("changes-review");
    expect(getCanonicalActivity(P20.activity_key)?.human_code).toBe("D1.20");
  });

  it("143. revisión, determinación y síntesis con lifecycle externo", () => {
    expect(P20.nodes.map((n) => n.node_key)).toEqual([
      "changes-review",
      "continuity-determination",
      "lifecycle-assessment",
    ]);
    expect(P20.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["lifecycle_confirmed", "discontinuation_path", "assessment_incomplete"].sort(),
    );
    expect(P20.external_fact_keys).toContain("mpi.lifecycle_status");
  });

  it("144. estructura válida sin re-derivar el ciclo", () => {
    expect(validateProtocolStructure(P20)).toEqual([]);
    for (const f of protocolFactKeys(P20)) {
      expect(
        f === "mpi.lifecycle_status" || f.startsWith("mpi.lifecycle."),
        f,
      ).toBe(true);
    }
  });

  it("145. continuidad confirma; discontinuación documenta con resguardos", () => {
    const confirmed = mustOutcomeFor(P20, {
      "mpi.lifecycle_status": "implemented",
      "mpi.lifecycle.changes_reviewed": "yes",
      "mpi.lifecycle.determination": "continues",
    });
    expect(confirmed.outcome_key).toBe("lifecycle_confirmed");
    expect(confirmed.rule_id).toBe("lifecycle-confirmed");
    const discontinued = mustOutcomeFor(P20, {
      "mpi.lifecycle_status": "implemented",
      "mpi.lifecycle.changes_reviewed": "yes",
      "mpi.lifecycle.determination": "discontinued",
    });
    expect(discontinued.outcome_key).toBe("discontinuation_path");
    expect(discontinued.rule_id).toBe("discontinuation-documented");
  });

  it("146. sin ciclo registrado no hay revisión; sin efectos temporales", () => {
    const e = mustOutcomeFor(P20, {
      "mpi.lifecycle.changes_reviewed": "yes",
      "mpi.lifecycle.determination": "continues",
    });
    expect(e.outcome_key).toBe("assessment_incomplete");
    for (const o of P20.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
  });
});

describe("batch D1: integridad del quinto batch", () => {
  it("147. veinte protocolos registrados, anteriores intactos", () => {
    const all = [
      P02, P03, P04, P09,
      P01, P08, P11, P15, P17, P18, P05, P06, P07, P12,
      P10, P13, P14, P16, P19, P20,
    ];
    expect(all).toHaveLength(20);
    for (const p of all) {
      expect(validateProtocolStructure(p), p.protocol_key).toEqual([]);
    }
    expect(getProtocolForActivity("dpo.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.formalize_adoption")?.mode).toBe("procedure");
    expect(
      getProtocolForActivity("dpo.initial_governance_validation")?.mode,
    ).toBe("checklist");
  });

  it("148. namespaces del batch disjuntos", () => {
    const shared = new Set(["dpo.designated", "mpi.lifecycle_status"]);
    const seen = new Map<string, string>();
    for (const p of [P10, P13, P14, P16, P19, P20]) {
      for (const f of protocolFactKeys(p)) {
        if (shared.has(f)) continue;
        if (seen.has(f)) {
          throw new Error(`colisión ${f} entre ${seen.get(f)} y ${p.protocol_key}`);
        }
        seen.set(f, p.protocol_key);
      }
    }
    const prefixes: Array<{ protocol: typeof P10; prefix: string; code: string }> = [
      { protocol: P10, prefix: "dpo.contact.", code: "D1.10" },
      { protocol: P13, prefix: "dpo.plan.", code: "D1.13" },
      { protocol: P14, prefix: "dpo.reporting.", code: "D1.14" },
      { protocol: P16, prefix: "dpo.revalidation.", code: "D1.16" },
      { protocol: P19, prefix: "mpi.certification.", code: "D1.19" },
      { protocol: P20, prefix: "mpi.lifecycle.", code: "D1.20" },
    ];
    for (const { protocol, prefix, code } of prefixes) {
      for (const f of protocolFactKeys(protocol)) {
        if (shared.has(f)) continue;
        expect(f.startsWith(prefix), `${code}: ${f}`).toBe(true);
      }
    }
  });

  it("149. D1.10 finalizado materializa doble efecto; resto sin efectos", () => {
    const company = newCompany("Contacto SpA");
    const facts: FactMap = {
      "dpo.designated": "yes",
      "dpo.contact.medium_defined": "yes",
      "dpo.contact.published": "yes",
      "dpo.contact.agency_notified": "yes",
      "dpo.contact.internal_notified": "yes",
      "dpo.contact.change_mechanism": "yes",
    };
    const validated = validateProcedureFinalization({
      protocol: P10,
      company,
      facts,
      outcomeKey: "communication_complete",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next, applied } = applyProcedureFinalization(
      company,
      P10,
      validated.effects,
    );
    expect(applied.sort()).toEqual(
      ["dpo.agency_notification_status", "dpo.contact_publication_status"].sort(),
    );
    expect(
      next.protocolAnswers[P10.protocol_key]?.["dpo.contact_publication_status"]?.value,
    ).toBe("published");
    expect(
      next.protocolAnswers[P10.protocol_key]?.["dpo.agency_notification_status"]?.value,
    ).toBe("notified");
    // Repetir es no-op.
    const twice = applyProcedureFinalization(next, P10, validated.effects);
    expect(twice.applied).toEqual([]);
    // Guía incompleta no escribe.
    const rejected = validateProcedureFinalization({
      protocol: P10,
      company,
      facts: { ...facts, "dpo.contact.published": "no" },
      outcomeKey: "communication_complete",
    });
    expect(rejected.ok).toBe(false);
  });
});

describe("batch D1: D1.12 procedure", () => {
  it("99. D1.12 tiene exactamente un protocolo activo mode procedure", () => {
    expect(getProtocolForActivity("dpo.confidentiality_duty")).toBe(P12);
    expect(P12.protocol_key).toBe("dpo.confidentiality_duty.v1");
    expect(P12.mode).toBe("procedure");
    expect(P12.entry_node_key).toBe("designation-gate");
    expect(getCanonicalActivity(P12.activity_key)?.human_code).toBe("D1.12");
  });

  it("100. compuerta, cuatro verificaciones y síntesis", () => {
    expect(P12.nodes.map((n) => n.node_key)).toEqual([
      "designation-gate",
      "verify-obligation",
      "formalize-instrument",
      "verify-scope",
      "verify-measures",
      "final-confirmation",
    ]);
    expect(P12.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["duty_formalized", "duty_in_progress", "prerequisite_missing"].sort(),
    );
  });

  it("101. estructura válida y siguiente paso resuelve", () => {
    expect(validateProtocolStructure(P12)).toEqual([]);
    expect(getCanonicalActivity("dpo.designate")).toBeDefined();
  });

  function fullDuty(over: FactMap = {}): FactMap {
    return {
      "dpo.designated": "yes",
      "dpo.confidentiality.obligation_verified": "yes",
      "dpo.confidentiality.formalized": "na",
      "dpo.confidentiality.scope_included": "yes",
      "dpo.confidentiality.measures_verified": "yes",
      ...over,
    };
  }

  it("102. sin designación deriva a D1.08", () => {
    const e = mustOutcomeFor(P12, { "dpo.designated": "no" });
    expect(e.outcome_key).toBe("prerequisite_missing");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("dpo.designate");
  });

  it("103. deber formalizado con efecto y sin declaración de cumplimiento", () => {
    const e = mustOutcomeFor(P12, fullDuty());
    expect(e.outcome_key).toBe("duty_formalized");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
    expect(e.outcome.canonical_fact_effects).toEqual([
      { fact_key: "dpo.confidentiality_status", value: "formalized" },
    ]);
    const text = JSON.stringify(P12);
    expect(text).not.toContain("Cumple");
    expect(e.outcome.detail ?? "").toContain("no constituye");
  });

  it("104. pendiente mantiene en formalización", () => {
    const e = mustOutcomeFor(
      P12,
      fullDuty({ "dpo.confidentiality.measures_verified": "no" }),
    );
    expect(e.outcome_key).toBe("duty_in_progress");
    const u = mustOutcomeFor(
      P12,
      fullDuty({ "dpo.confidentiality.scope_included": "unknown" }),
    );
    expect(u.outcome_key).toBe("duty_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });
});

describe("batch D1: integridad del cuarto batch", () => {
  it("105. catorce protocolos registrados, anteriores intactos", () => {
    for (const p of [P01, P08, P11, P15, P17, P18, P05, P06, P07, P12]) {
      expect(validateProtocolStructure(p), p.protocol_key).toEqual([]);
    }
    expect(getProtocolForActivity("dpo.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.need_assessment")?.mode).toBe("decision");
    expect(getProtocolForActivity("mpi.formalize_adoption")?.mode).toBe("procedure");
    expect(
      getProtocolForActivity("dpo.initial_governance_validation")?.mode,
    ).toBe("checklist");
    expect(getProtocolForActivity("mpi.assemble_program")?.mode).toBe("procedure");
  });

  it("106. namespaces propios y disjuntos", () => {
    const shared = new Set(["dpo.designated", "mpi.lifecycle_status"]);
    const seen = new Map<string, string>();
    for (const p of [P05, P06, P07, P12]) {
      for (const f of protocolFactKeys(p)) {
        if (shared.has(f)) continue;
        if (seen.has(f)) {
          throw new Error(`colisión ${f} entre ${seen.get(f)} y ${p.protocol_key}`);
        }
        seen.set(f, p.protocol_key);
      }
    }
    const byPrefix: Array<{ protocol: typeof P05; prefix: string; code: string }> = [
      { protocol: P05, prefix: "mpi.whistleblowing.", code: "D1.05" },
      { protocol: P06, prefix: "mpi.disciplinary.", code: "D1.06" },
      { protocol: P07, prefix: "mpi.regulation.", code: "D1.07" },
      { protocol: P12, prefix: "dpo.confidentiality.", code: "D1.12" },
    ];
    for (const { protocol, prefix, code } of byPrefix) {
      for (const f of protocolFactKeys(protocol)) {
        if (shared.has(f)) continue;
        expect(f.startsWith(prefix), `${code}: ${f}`).toBe(true);
      }
    }
  });

  it("107. los cuatro definitivos finalizan; incompletos no", () => {
    const cases: Array<{
      protocol: typeof P05;
      facts: FactMap;
      outcomeKey: string;
      effect: { fact_key: string; value: string };
    }> = [
      {
        protocol: P05,
        facts: {
          "mpi.lifecycle_status": "implementing",
          "mpi.whistleblowing.channel_defined": "yes",
          "mpi.whistleblowing.identity_reserve": "yes",
          "mpi.whistleblowing.non_retaliation": "yes",
          "mpi.whistleblowing.handling_defined": "yes",
          "mpi.whistleblowing.tested": "yes",
        },
        outcomeKey: "mechanism_implemented",
        effect: { fact_key: "mpi.whistleblowing_status", value: "implemented" },
      },
      {
        protocol: P06,
        facts: {
          "mpi.lifecycle_status": "implementing",
          "mpi.disciplinary.existing_mapped": "yes",
          "mpi.disciplinary.breaches_integrated": "yes",
          "mpi.disciplinary.procedure_defined": "yes",
          "mpi.disciplinary.coherence_verified": "yes",
          "mpi.disciplinary.approved": "yes",
        },
        outcomeKey: "framework_established",
        effect: { fact_key: "mpi.disciplinary_framework_status", value: "implemented" },
      },
      {
        protocol: P07,
        facts: {
          "mpi.lifecycle_status": "implementing",
          "mpi.regulation.subjects_identified": "yes",
          "mpi.regulation.instruments_identified": "yes",
          "mpi.regulation.obligations_incorporated": "yes",
          "mpi.regulation.bylaws_applicable": "applies",
          "mpi.regulation.bylaws_updated": "yes",
          "mpi.regulation.publicity_verified": "yes",
        },
        outcomeKey: "integration_complete",
        effect: { fact_key: "mpi.internal_regulation_status", value: "integrated" },
      },
      {
        protocol: P12,
        facts: {
          "dpo.designated": "yes",
          "dpo.confidentiality.obligation_verified": "yes",
          "dpo.confidentiality.formalized": "yes",
          "dpo.confidentiality.scope_included": "yes",
          "dpo.confidentiality.measures_verified": "yes",
        },
        outcomeKey: "duty_formalized",
        effect: { fact_key: "dpo.confidentiality_status", value: "formalized" },
      },
    ];
    for (const c of cases) {
      const company = newCompany(`Fin ${c.outcomeKey} SpA`);
      const validated = validateProcedureFinalization({
        protocol: c.protocol,
        company,
        facts: c.facts,
        outcomeKey: c.outcomeKey,
      });
      expect(validated.ok, c.outcomeKey).toBe(true);
      if (!validated.ok) continue;
      const { company: next, applied } = applyProcedureFinalization(
        company,
        c.protocol,
        validated.effects,
      );
      expect(applied).toEqual([c.effect.fact_key]);
      expect(
        next.protocolAnswers[c.protocol.protocol_key]?.[c.effect.fact_key]?.value,
      ).toBe(c.effect.value);
      // Repetir es no-op.
      const twice = applyProcedureFinalization(next, c.protocol, validated.effects);
      expect(twice.applied).toEqual([]);
      // Export/import conserva.
      const checked = validateCompanyState(JSON.parse(JSON.stringify(next)));
      expect(checked.ok).toBe(true);
      if (!checked.ok) continue;
      expect(
        checked.value.protocolAnswers[c.protocol.protocol_key]?.[c.effect.fact_key]?.value,
      ).toBe(c.effect.value);
    }
  });

  it("108. outcomes no definitivos sin efectos en el batch", () => {
    const nonDefinitive: Array<[typeof P05, string]> = [
      [P05, "mechanism_in_progress"],
      [P05, "not_started"],
      [P06, "framework_in_progress"],
      [P06, "not_started"],
      [P07, "integration_in_progress"],
      [P07, "not_started"],
      [P12, "duty_in_progress"],
      [P12, "prerequisite_missing"],
    ];
    for (const [p, key] of nonDefinitive) {
      expect(
        getFinalizableOutcome(p, key),
        `${p.protocol_key}/${key}`,
      ).toBeUndefined();
    }
  });
});

describe("reconciliación D1.02/D1.04/D1.09", () => {
  function fullGovernance(over: FactMap = {}): FactMap {
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

  it("150. D1.09 declara efectos singulares en definitivos", () => {
    const validated = getFinalizableOutcome(P09, "governance_validated");
    expect(validated?.canonical_fact_effects).toEqual([
      { fact_key: "dpo.governance_validation_status", value: "valid" },
    ]);
    const remediation = getFinalizableOutcome(P09, "remediation_required");
    expect(remediation?.canonical_fact_effects).toEqual([
      { fact_key: "dpo.governance_validation_status", value: "remediation_required" },
    ]);
    expect(getFinalizableOutcome(P09, "information_incomplete")).toBeUndefined();
    expect(getFinalizableOutcome(P09, "prerequisite_missing")).toBeUndefined();
  });

  it("151. D1.09 validado finaliza; repetir es no-op; incompleto no escribe", () => {
    const company = newCompany("Revalida SpA");
    const validated = validateProcedureFinalization({
      protocol: P09,
      company,
      facts: fullGovernance(),
      outcomeKey: "governance_validated",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next, applied } = applyProcedureFinalization(
      company,
      P09,
      validated.effects,
    );
    expect(applied).toEqual(["dpo.governance_validation_status"]);
    expect(
      next.protocolAnswers[P09.protocol_key]?.["dpo.governance_validation_status"]?.value,
    ).toBe("valid");
    const twice = applyProcedureFinalization(next, P09, validated.effects);
    expect(twice.applied).toEqual([]);
    const rejected = validateProcedureFinalization({
      protocol: P09,
      company,
      facts: fullGovernance({ "dpo.governance.access": "unknown" }),
      outcomeKey: "governance_validated",
    });
    expect(rejected.ok).toBe(false);
  });

  it("152. D1.09 con brecha materializa remediación", () => {
    const company = newCompany("Brecha SpA");
    const validated = validateProcedureFinalization({
      protocol: P09,
      company,
      facts: fullGovernance({ "dpo.governance.resources": "no" }),
      outcomeKey: "remediation_required",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const { company: next } = applyProcedureFinalization(
      company,
      P09,
      validated.effects,
    );
    expect(
      next.protocolAnswers[P09.protocol_key]?.["dpo.governance_validation_status"]?.value,
    ).toBe("remediation_required");
  });

  it("153. D1.02 sin efectos: vía decision sin materialización", () => {
    for (const o of P02.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
    // La vía genérica sigue rechazando decision (contrato congelado).
    const rejected = validateProcedureFinalization({
      protocol: P02,
      company: newCompany("D02 SpA"),
      facts: {},
      outcomeKey: "required_by_mpi",
    });
    expect(rejected.ok).toBe(false);
  });

  it("154. D1.04 sin efectos: bundle de adopción indivisible", () => {
    for (const o of P04.outcomes) {
      expect(o.canonical_fact_effects ?? []).toEqual([]);
    }
    const rejected = validateProcedureFinalization({
      protocol: P04,
      company: newCompany("D04 SpA"),
      facts: {},
      outcomeKey: "formalization_complete",
    });
    expect(rejected.ok).toBe(false);
  });
});

describe("batch D2: D2.01 procedure treatment-scoped", () => {
  it("155. D2.01 tiene protocolo treatment con derived prerequisites", () => {
    expect(getProtocolForActivity("treatment.inventory_create")).toBe(PD201);
    expect(PD201.mode).toBe("procedure");
    expect(PD201.execution_scope).toBe("treatment");
    expect(PD201.entry_node_key).toBe("identify-processes");
    expect(getCanonicalActivity(PD201.activity_key)?.human_code).toBe("D2.01");
  });

  it("156. nodos manuales + síntesis; sin preguntas estructurales", () => {
    expect(PD201.nodes.map((n) => n.node_key)).toEqual([
      "identify-processes",
      "review-relations",
      "assure-traceability",
      "final-confirmation",
    ]);
    for (const n of PD201.nodes) {
      if (n.node_type === "question" && n.fact_key) {
        expect(n.fact_key.startsWith("derived."), n.node_key).toBe(false);
      }
    }
    expect(validateProtocolStructure(PD201)).toEqual([]);
  });

  function fullInventory(over: FactMap = {}): FactMap {
    return {
      "derived.treatment.identified": "yes",
      "derived.treatment.actors_exist": "yes",
      "derived.treatment.purposes_exist": "yes",
      "derived.treatment.data_items_exist": "yes",
      "derived.treatment.sources_exist": "yes",
      "inventory.processes_identified": "yes",
      "inventory.relations_reviewed": "yes",
      "inventory.traceability_assured": "yes",
      ...over,
    };
  }

  it("157. estructura faltante deriva a workspace, no a yes/no", () => {
    const e = mustOutcomeFor(PD201, fullInventory({ "derived.treatment.sources_exist": "no" }));
    expect(e.outcome_key).toBe("inventory_incomplete");
    expect(e.rule_id).toBe("structural-missing");
  });

  it("158. todo verificado completa y enlaza D2.02", () => {
    const e = mustOutcomeFor(PD201, fullInventory());
    expect(e.outcome_key).toBe("inventory_complete");
    expect(e.rule_id).toBe("all-verified");
    expect(
      e.outcome.next_actions.find((a) => a.kind === "activity")?.activity_key,
    ).toBe("treatment.actor_roles");
  });

  it("159. pendiente profesional no completa; unknown bloquea", () => {
    const e = mustOutcomeFor(
      PD201,
      fullInventory({ "inventory.relations_reviewed": "no" }),
    );
    expect(e.outcome_key).toBe("inventory_in_progress");
    const u = mustOutcomeFor(
      PD201,
      fullInventory({ "inventory.processes_identified": "unknown" }),
    );
    expect(u.outcome_key).toBe("inventory_in_progress");
    expect(u.rule_id).toBe("pending-verification");
  });
});

describe("batch D2: D2.02 decision con juicio", () => {
  it("160. D2.02 decision treatment con conclusión profesional", () => {
    expect(getProtocolForActivity("treatment.actor_roles")).toBe(PD202);
    expect(PD202.mode).toBe("decision");
    expect(PD202.execution_scope).toBe("treatment");
    expect(PD202.entry_node_key).toBe("structural-gate");
    expect(getCanonicalActivity(PD202.activity_key)?.human_code).toBe("D2.02");
  });

  it("161. compuerta estructural + conclusión; estructura válida", () => {
    expect(PD202.nodes.map((n) => n.node_key)).toEqual([
      "structural-gate",
      "adopt-conclusion",
    ]);
    expect(PD202.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["actors_incomplete", "classification_sound", "remediation_needed"].sort(),
    );
    expect(validateProtocolStructure(PD202)).toEqual([]);
  });

  function actorFacts(over: FactMap = {}): FactMap {
    return {
      "derived.treatment.actors_exist": "yes",
      "derived.treatment.actors_roles_complete": "yes",
      ...over,
    };
  }

  it("162. estructura incompleta deriva a workspace sin juzgar", () => {
    const e = mustOutcomeFor(
      PD202,
      actorFacts({ "derived.treatment.actors_roles_complete": "no" }),
    );
    expect(e.outcome_key).toBe("actors_incomplete");
    expect(e.rule_id).toBe("structural-missing");
  });

  it("163. estructura completa habilita conclusión, no la deduce", () => {
    const e = evaluateProtocol(PD202, actorFacts());
    // La síntesis deriva al nodo de adopción, no a un outcome calculado.
    expect(e.status).toBe("awaiting_facts");
  });

  it("164. juicio válido registra conclusión sin efectos", () => {
    const company = newCompany("Actores SpA");
    const draft = {
      conclusion: "classification_sound",
      legal_question: "¿Clasificación correcta?",
      evidence_refs: ["Matriz v1"],
      rationale: "Cada actor con su evidencia contractual.",
      decided_by: "Abogada",
      reviewed_by: "",
      decided_at: new Date().toISOString(),
    };
    const result = finalizeJudgment({
      protocol: PD202,
      company,
      facts: actorFacts(),
      draft,
      legalBasis: [
        {
          source_id: "cl_ley_19628_2026",
          source_name: "Ley N° 19.628",
          article_or_provision: "Artículo 2",
          reference_text: "",
          source_url: "",
          basis_type: "law",
          regulatory_status: "transitional",
          last_verified_at: "2026-09-21",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.conclusion).toBe("classification_sound");
    expect(result.effects).toEqual([]);
  });
});

describe("batch D2: D2.03 procedure treatment-scoped", () => {
  it("165. D2.03 procedure treatment con derived de purposes", () => {
    expect(getProtocolForActivity("treatment.purpose_define")).toBe(PD203);
    expect(PD203.mode).toBe("procedure");
    expect(PD203.execution_scope).toBe("treatment");
    expect(getCanonicalActivity(PD203.activity_key)?.human_code).toBe("D2.03");
  });

  it("166. checks profesionales + síntesis; estructura válida", () => {
    expect(PD203.nodes.map((n) => n.node_key)).toEqual([
      "verify-specificity",
      "verify-data-relation",
      "final-confirmation",
    ]);
    expect(PD203.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["purposes_defined", "purposes_incomplete", "purposes_in_progress"].sort(),
    );
    expect(validateProtocolStructure(PD203)).toEqual([]);
  });

  function fullPurposes(over: FactMap = {}): FactMap {
    return {
      "derived.treatment.purposes_exist": "yes",
      "derived.treatment.purposes_described_complete": "yes",
      "purposes.specific_explicit": "yes",
      "purposes.data_related": "yes",
      ...over,
    };
  }

  it("167. sin finalidades deriva a workspace", () => {
    const e = mustOutcomeFor(
      PD203,
      fullPurposes({ "derived.treatment.purposes_exist": "no" }),
    );
    expect(e.outcome_key).toBe("purposes_incomplete");
    expect(e.rule_id).toBe("structural-missing");
  });

  it("168. todo verificado define y enlaza D2.05", () => {
    const e = mustOutcomeFor(PD203, fullPurposes());
    expect(e.outcome_key).toBe("purposes_defined");
    expect(e.rule_id).toBe("all-verified");
    expect(e.outcome.classification).toBe("legal_requirement");
  });

  it("169. existencia no equivale a validez jurídica", () => {
    const e = mustOutcomeFor(
      PD203,
      fullPurposes({ "purposes.specific_explicit": "no" }),
    );
    expect(e.outcome_key).toBe("purposes_in_progress");
  });
});

describe("batch D2: integridad sin redundancia manual", () => {
  it("170. ningún protocolo registrado pregunta por derived.*", () => {
    for (const p of listProtocols()) {
      for (const n of p.nodes) {
        if (n.node_type === "question" && n.fact_key) {
          expect(n.fact_key.startsWith("derived."), `${p.protocol_key}/${n.node_key}`).toBe(false);
        }
      }
      expect(validateProtocolStructure(p), p.protocol_key).toEqual([]);
    }
  });

  it("171. D2 usa scopes treatment; D1 intacto company", () => {
    for (const p of [PD201, PD202, PD203]) {
      expect(p.execution_scope).toBe("treatment");
    }
    expect(getProtocolForActivity("dpo.need_assessment")?.execution_scope ?? "company").toBe("company");
  });
});
