import { describe, expect, it } from "vitest";
import { TRANSPARENCY_POLICY_ASSEMBLE_PROTOCOL as P301 } from "../content/protocols/transparency.policy_assemble";
import { TRANSPARENCY_PUBLICATION_VALIDATE_PROTOCOL as P302 } from "../content/protocols/transparency.publication_validate";
import type { FactMap } from "../content/protocols/types";
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

function mustOutcome(protocol: typeof P301, facts: FactMap) {
  const e = evaluateProtocol(protocol, facts);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

function fullPolicy(over: FactMap = {}): FactMap {
  return {
    "transparency.policy.adoption_recorded": "yes",
    "transparency.policy.identity_contact_covered": "yes",
    "transparency.policy.prevention_officer_covered": "yes",
    "transparency.policy.data_subjects_covered": "yes",
    "transparency.policy.recipients_purposes_bases_covered": "yes",
    "transparency.policy.security_rights_covered": "yes",
    "transparency.policy.transfers_covered": "yes",
    "transparency.policy.retention_sources_covered": "yes",
    "transparency.policy.withdrawal_covered": "yes",
    "transparency.policy.automated_covered": "yes",
    ...over,
  };
}

function fullPublication(over: FactMap = {}): FactMap {
  return {
    "transparency.policy_status": "assembled",
    "transparency.publication.medium_exists": "yes",
    "transparency.publication.permanent_available": "yes",
    "transparency.publication.effective_access": "yes",
    "transparency.publication.gratuity": "yes",
    "transparency.publication.presentation_clear": "yes",
    "transparency.publication.contact_channel": "yes",
    "transparency.publication.version_match": "yes",
    ...over,
  };
}

describe("D3.01 transparency.policy_assemble (procedure, company)", () => {
  it("1. protocolo registrado con modo y scope canónicos", () => {
    expect(getProtocolForActivity("transparency.policy_assemble")).toBe(P301);
    expect(P301.protocol_key).toBe("transparency.policy_assemble.v1");
    expect(P301.mode).toBe("procedure");
    expect(P301.execution_scope).toBe("company");
    expect(P301.version).toBe(1);
    expect(getCanonicalActivity(P301.activity_key)?.human_code).toBe("D3.01");
  });

  it("2. estructura válida y cobertura total de bloques", () => {
    expect(validateProtocolStructure(P301)).toEqual([]);
    expect(P301.nodes.map((n) => n.node_key)).toEqual([
      "check-adoption",
      "check-identity-contact",
      "check-prevention-officer",
      "check-data-subjects",
      "check-recipients-purposes-bases",
      "check-security-rights",
      "check-transfers",
      "check-retention-sources",
      "check-withdrawal",
      "check-automated",
      "synthesis",
    ]);
    expect(P301.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["policy_assembled", "remediation_required", "assessment_incomplete"].sort(),
    );
    expect(P301.decision_fact_keys).toHaveLength(10);
  });

  it("3. condicionales con No aplica no producen falso incumplimiento", () => {
    const e = mustOutcome(
      P301,
      fullPolicy({
        "transparency.policy.prevention_officer_covered": "na",
        "transparency.policy.transfers_covered": "na",
        "transparency.policy.withdrawal_covered": "na",
        "transparency.policy.automated_covered": "na",
      }),
    );
    expect(e.outcome_key).toBe("policy_assembled");
  });

  it("4. sin segunda fuente de verdad ni blob documental", () => {
    const blob = JSON.stringify(P301).toLowerCase();
    for (const forbidden of [
      "policy entity",
      "policyversion",
      "document content",
    ]) {
      expect(blob).not.toContain(forbidden);
    }
    // El disclaimer honesto está presente: describir no es certificar.
    expect(blob).toContain("no certifica que sean jurídicamente correctas");
    expect(blob).toContain("sin certificar la corrección material");
    // Facts propios del namespace; ningún fact afirma finalidades/bases.
    for (const n of P301.nodes) {
      if (n.node_type === "question" && n.fact_key) {
        expect(n.fact_key.startsWith("transparency.policy.")).toBe(true);
      }
      expect(n.answer_type === "text" || n.answer_type === "date").toBe(false);
    }
    // Referencias D2 como contexto, nunca como exigencia de dominio futuro.
    const related = P301.nodes.flatMap((n) => n.related_activity_keys ?? []);
    expect(related.sort()).toEqual(
      [
        "lawful_basis.assign",
        "retention.schedule",
        "treatment.purpose_define",
        "treatment.source_traceability",
      ].sort(),
    );
  });

  it("5. outcomes completo/remediación/incompleto", () => {
    expect(mustOutcome(P301, fullPolicy()).outcome_key).toBe("policy_assembled");
    expect(
      mustOutcome(P301, fullPolicy({ "transparency.policy.data_subjects_covered": "no" }))
        .outcome_key,
    ).toBe("remediation_required");
    expect(
      mustOutcome(P301, fullPolicy({ "transparency.policy.data_subjects_covered": "unknown" }))
        .outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("6. efecto policy_status=assembled con finalización explícita e idempotente", () => {
    const company = newCompany("Transparente SpA");
    expect(
      getFinalizableOutcome(P301, "policy_assembled")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "transparency.policy_status", value: "assembled" }]);
    expect(getFinalizableOutcome(P301, "remediation_required")).toBeUndefined();
    expect(getFinalizableOutcome(P301, "assessment_incomplete")).toBeUndefined();
    const validated = validateProcedureFinalization({
      protocol: P301,
      company,
      facts: fullPolicy(),
      outcomeKey: "policy_assembled",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const once = applyProcedureFinalization(company, P301, validated.effects);
    expect(once.applied).toEqual(["transparency.policy_status"]);
    const twice = applyProcedureFinalization(once.company, P301, validated.effects);
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["transparency.policy_status"]);
  });

  it("7. export/import conserva el efecto", () => {
    const company = newCompany("Export SpA");
    const validated = validateProcedureFinalization({
      protocol: P301,
      company,
      facts: fullPolicy(),
      outcomeKey: "policy_assembled",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const next = applyProcedureFinalization(company, P301, validated.effects);
    const roundTrip = validateCompanyState(JSON.parse(JSON.stringify(next.company)));
    expect(roundTrip.ok).toBe(true);
  });

  it("8. provenance: obligación legal en definitivo, método en el resto", () => {
    expect(P301.provenance).toBe("legal_requirement");
    const byKey = Object.fromEntries(P301.outcomes.map((o) => [o.outcome_key, o]));
    expect(byKey["policy_assembled"].classification).toBe("legal_requirement");
    expect(byKey["remediation_required"].classification).toBe("agency_standard");
    expect(byKey["assessment_incomplete"].classification).toBe("agency_standard");
    // Sin ReasoningRecord en protocolo sin juicio.
    expect(P301.reasoning_requirements).toBeUndefined();
  });
});

describe("D3.02 transparency.publication_validate (checklist, company)", () => {
  it("9. protocolo registrado con modo y scope canónicos", () => {
    expect(getProtocolForActivity("transparency.publication_validate")).toBe(P302);
    expect(P302.protocol_key).toBe("transparency.publication_validate.v1");
    expect(P302.mode).toBe("checklist");
    expect(P302.execution_scope).toBe("company");
    expect(getCanonicalActivity(P302.activity_key)?.human_code).toBe("D3.02");
  });

  it("10. estructura válida y checks de publicación sin inventos", () => {
    expect(validateProtocolStructure(P302)).toEqual([]);
    expect(P302.nodes.map((n) => n.node_key)).toEqual([
      "check-medium",
      "check-permanence",
      "check-access",
      "check-gratuity",
      "check-presentation",
      "check-contact",
      "check-version",
      "synthesis",
    ]);
    const blob = JSON.stringify(P302).toLowerCase();
    for (const forbidden of ["wcag", " sla", "seo", "performance", "threshold", "score"]) {
      expect(blob).not.toContain(forbidden);
    }
  });

  it("11. evidence basis agency_standard en actividad, protocolo y outcomes", () => {
    expect(getCanonicalActivity("transparency.publication_validate")?.evidence_basis).toBe(
      "agency_standard",
    );
    expect(P302.provenance).toBe("agency_standard");
    for (const o of P302.outcomes) {
      expect(o.classification).toBe("agency_standard");
    }
  });

  it("12. can-start libre, can-complete exige D3.01", () => {
    // Navegación e inspección preliminar sin bloqueo: sin hechos, pide datos.
    const fresh = evaluateProtocol(P302, {});
    expect(fresh.status).toBe("awaiting_facts");
    // Checks propios completos pero sin política estructurada: pendiente, sin efectos.
    const pending = mustOutcome(
      P302,
      fullPublication({ "transparency.policy_status": "unknown" } as FactMap),
    );
    expect(pending.outcome_key).toBe("policy_assembly_pending");
    expect(getFinalizableOutcome(P302, "policy_assembly_pending")).toBeUndefined();
    const { "transparency.policy_status": _drop, ...withoutPolicy } = fullPublication();
    expect(mustOutcome(P302, withoutPolicy).outcome_key).toBe(
      "policy_assembly_pending",
    );
    // Valor distinto de assembled tampoco completa.
    expect(
      mustOutcome(P302, fullPublication({ "transparency.policy_status": "draft" }))
        .outcome_key,
    ).toBe("policy_assembly_pending");
  });

  it("13. validación definitiva solo con política estructurada", () => {
    expect(mustOutcome(P302, fullPublication()).outcome_key).toBe(
      "publication_validated",
    );
    expect(
      mustOutcome(P302, fullPublication({ "transparency.publication.gratuity": "no" }))
        .outcome_key,
    ).toBe("remediation_required");
    expect(
      mustOutcome(
        P302,
        fullPublication({ "transparency.publication.gratuity": "unknown" }),
      ).outcome_key,
    ).toBe("assessment_incomplete");
  });

  it("14. finalizar validado sin D3.01 es rechazado", () => {
    const company = newCompany("Preliminar SpA");
    const validated = validateProcedureFinalization({
      protocol: P302,
      company,
      facts: fullPublication({ "transparency.policy_status": "unknown" } as FactMap),
      outcomeKey: "publication_validated",
    });
    expect(validated.ok).toBe(false);
  });

  it("15. efecto publication_status=validated con finalización explícita e idempotente", () => {
    const company = newCompany("Publicada SpA");
    expect(
      getFinalizableOutcome(P302, "publication_validated")?.canonical_fact_effects,
    ).toEqual([{ fact_key: "transparency.publication_status", value: "validated" }]);
    const validated = validateProcedureFinalization({
      protocol: P302,
      company,
      facts: fullPublication(),
      outcomeKey: "publication_validated",
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const once = applyProcedureFinalization(company, P302, validated.effects);
    expect(once.applied).toEqual(["transparency.publication_status"]);
    const twice = applyProcedureFinalization(once.company, P302, validated.effects);
    expect(twice.applied).toEqual([]);
    expect(twice.skipped).toEqual(["transparency.publication_status"]);
    const roundTrip = validateCompanyState(JSON.parse(JSON.stringify(twice.company)));
    expect(roundTrip.ok).toBe(true);
  });
});

describe("regresión D3 guides", () => {
  it("16. D1/D2 intactos, 38 actividades, 4 pendings, D3.03–06 sin protocolo", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(ALL_ACTIVITIES).toHaveLength(38);
    expect(listProtocols()).toHaveLength(34);
    for (const k of [
      "consent.mechanism_design",
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getProtocolForActivity(k), k).toBeUndefined();
    }
  });
});
