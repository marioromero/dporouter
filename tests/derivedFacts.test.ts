import { describe, expect, it } from "vitest";
import type { ExecutionProtocol } from "../content/protocols/types";
import { listProtocols, validateProtocolStructure } from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import { newCompany } from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";
import { blockingScopedConflicts } from "../src/workspace/scope";
import { createPurpose, createTreatment } from "../src/workspace/scope";
import { saveScopedProtocolAnswer } from "../src/workspace/scope";
import { addDataItem, addDataPurposeLink, addRetentionRule, deleteDataItem } from "../src/workspace/locals";
import { addActor, addSource, updateActor } from "../src/workspace/locals";
import { deriveSessionFacts } from "../src/workspace/derived";

/**
 * Derived session facts: proyecciones read-only sin persistencia,
 * conflicto ni namespace manual. Fixtures sintéticos; sin D2.
 */

const CONSUMER: ExecutionProtocol = {
  protocol_key: "fixture.derived_consumer.v1",
  activity_key: "fixture.derived_consumer",
  version: 1,
  mode: "procedure",
  title: "Fixture",
  description: "Fixture.",
  entry_node_key: "gate",
  nodes: [
    {
      node_key: "gate",
      node_type: "question",
      title: "Puerta",
      fact_key: "fixture.gate",
      answer_type: "single_select",
      options: [
        { value: "yes", label: "Sí", fact_effect: { fact_key: "fixture.gate", value: "yes" } },
      ],
      required_facts: ["derived.treatment.actors_roles_complete"],
      default_next_node_key: "final",
    },
    {
      node_key: "final",
      node_type: "decision",
      title: "Síntesis",
      answer_type: "none",
      required_facts: ["fixture.gate", "derived.treatment.actors_roles_complete"],
      transitions: [
        {
          rule_id: "ok",
          description: "d",
          when: { op: "fact_equals", fact_key: "derived.treatment.actors_roles_complete", value: "yes" },
          goto_outcome_key: "done",
          explanation: "e",
        },
        {
          rule_id: "fallback",
          description: "d",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "pending",
          explanation: "e",
        },
      ],
    },
  ],
  outcomes: [
    {
      outcome_key: "done",
      label: "Listo",
      classification: "agency_standard",
      explanation: "e",
      provenance: "agency_standard",
      next_actions: [{ kind: "restart", label: "R" }],
    },
    {
      outcome_key: "pending",
      label: "Pendiente",
      classification: "agency_standard",
      explanation: "e",
      provenance: "agency_standard",
      next_actions: [{ kind: "restart", label: "R" }],
    },
  ],
  decision_fact_keys: ["fixture.gate"],
  external_fact_keys: ["derived.treatment.actors_roles_complete"],
  last_review: "2026-09-23",
  provenance: "agency_standard",
};

function companyAB() {
  let c = newCompany("X SpA");
  const a = createTreatment(c, { name: "A" });
  if (!a) throw new Error("sin A");
  c = a.company;
  const b = createTreatment(c, { name: "B" });
  if (!b) throw new Error("sin B");
  c = b.company;
  return { c, idA: a.treatmentId, idB: b.treatmentId };
}

function ctxT(companyId: string, treatmentId: string) {
  return { scope: "treatment", companyId, treatmentId } as const;
}

/** Colección D6 vacía: los 23 agregados estructurales en "no". */
const D6_TREATMENT_EMPTY: Record<string, string> = {
  "derived.treatment.d6_relationships_exist": "no",
  "derived.treatment.d6_map_complete": "no",
  "derived.treatment.d6_map_unknown_exist": "no",
  "derived.treatment.d6_international_exist": "no",
  "derived.treatment.d6_processors_exist": "no",
  "derived.treatment.d6_processors_contract_known": "no",
  "derived.treatment.d6_processors_contract_validated": "no",
  "derived.treatment.d6_processors_contract_remediation": "no",
  "derived.treatment.d6_processors_contract_unknown": "no",
  "derived.treatment.d6_processors_instructions_known": "no",
  "derived.treatment.d6_processors_instructions_controlled": "no",
  "derived.treatment.d6_processors_instructions_remediation": "no",
  "derived.treatment.d6_processors_instructions_unknown": "no",
  "derived.treatment.d6_processors_operational_known": "no",
  "derived.treatment.d6_processors_operational_controlled": "no",
  "derived.treatment.d6_processors_operational_remediation": "no",
  "derived.treatment.d6_processors_operational_unknown": "no",
  "derived.treatment.d6_subprocessors_exist": "no",
  "derived.treatment.d6_subprocessors_parents_complete": "no",
  "derived.treatment.d6_subprocessors_authorization_known": "no",
  "derived.treatment.d6_subprocessors_authorization_controlled": "no",
  "derived.treatment.d6_subprocessors_authorization_remediation": "no",
  "derived.treatment.d6_subprocessors_authorization_unknown": "no",
};

describe("derived session facts", () => {
  it("determinismo: mismo estado + contexto → mismo mapa", () => {
    const { c, idA } = companyAB();
    const ctx = ctxT(c.id, idA);
    expect(deriveSessionFacts(c, ctx)).toEqual(deriveSessionFacts(c, ctx));
    expect(deriveSessionFacts(c, { scope: "company", companyId: c.id })).toEqual({
      "derived.company.treatments_exist": "yes",
    });
  });

  it("aislamiento treatment: A completo, B con rol faltante", () => {
    let { c, idA, idB } = companyAB();
    const a1 = addActor(c, idA, { kind: "organization", name: "E", role: "responsible" });
    if (!a1) throw new Error("sin actor");
    c = a1.company;
    const b1 = addActor(c, idB, { kind: "person", name: "P" });
    if (!b1) throw new Error("sin actor B");
    c = b1.company;
    expect(deriveSessionFacts(c, ctxT(c.id, idA))["derived.treatment.actors_roles_complete"]).toBe("yes");
    expect(deriveSessionFacts(c, ctxT(c.id, idB))["derived.treatment.actors_roles_complete"]).toBe("no");
  });

  it("aislamiento purpose: A1 descrita, A2 vacía", () => {
    let { c, idA } = companyAB();
    const p1 = createPurpose(c, idA, "Facturación real");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    // Estado límite solo construible por edición directa (la API exige
    // descripción no vacía): la proyección debe leerlo como no descrito.
    const t = c.treatments?.[idA];
    if (!t) throw new Error("sin T");
    c = {
      ...c,
      treatments: {
        ...c.treatments,
        [idA]: {
          ...t,
          purposes: {
            ...t.purposes,
            ["fin-vacia"]: {
              purpose: { id: "fin-vacia", treatmentId: idA, description: "   " },
              protocolAnswers: {},
              reasoningRecords: {},
            },
          },
        },
      },
    };
    const c1 = { scope: "purpose", companyId: c.id, treatmentId: idA, purposeId: p1.purposeId } as const;
    const c2 = { scope: "purpose", companyId: c.id, treatmentId: idA, purposeId: "fin-vacia" } as const;
    expect(deriveSessionFacts(c, c1)["derived.purpose.described"]).toBe("yes");
    expect(deriveSessionFacts(c, c2)["derived.purpose.described"]).toBe("no");
    // La vista purpose incluye derivados del padre sin leer siblings.
    expect(deriveSessionFacts(c, c1)["derived.treatment.purposes_exist"]).toBe("yes");
  });

  it("vacío nunca es completo (no vacuous truth)", () => {
    const { c, idA } = companyAB();
    const facts = deriveSessionFacts(c, ctxT(c.id, idA));
    expect(facts).toEqual({
      "derived.treatment.actors_exist": "no",
      "derived.treatment.actors_roles_complete": "no",
      "derived.treatment.purposes_exist": "no",
      "derived.treatment.purposes_described_complete": "no",
      "derived.treatment.identified": "no",
      "derived.treatment.data_items_exist": "no",
      "derived.treatment.sources_exist": "no",
      "derived.treatment.links_exist": "no",
      "derived.treatment.retention_rules_exist": "no",
      "derived.treatment.retention_rules_linked": "no",
      "derived.treatment.automated_uses_exist": "no",
      "derived.treatment.automated_uses_coverage_complete": "no",
      "derived.treatment.automated_uses_coverage_pending": "no",
      "derived.treatment.automated_uses_covered_exist": "no",
      "derived.treatment.automated_uses_legal_path_complete": "no",
      "derived.treatment.automated_uses_unpathed_covered_exist": "no",
      "derived.treatment.automated_uses_safeguards_complete": "no",
      "derived.treatment.automated_uses_safeguards_enabled": "no",
      "derived.treatment.automated_uses_safeguards_deficient": "no",
      ...D6_TREATMENT_EMPTY,
    });
  });

  it("reactividad: asignar role cambia la proyección sin escribir facts", () => {
    let { c, idA } = companyAB();
    const a1 = addActor(c, idA, { kind: "person", name: "P" });
    if (!a1) throw new Error("sin actor");
    c = a1.company;
    const ctx = ctxT(c.id, idA);
    expect(deriveSessionFacts(c, ctx)["derived.treatment.actors_roles_complete"]).toBe("no");
    const upd = updateActor(c, idA, a1.id, { role: "processor" });
    if (!upd) throw new Error("sin update");
    expect(deriveSessionFacts(upd, ctx)["derived.treatment.actors_roles_complete"]).toBe("yes");
    // Ningún fact persistido en el camino.
    expect(upd.protocolAnswers).toEqual({});
    expect(upd.treatments?.[idA]?.protocolAnswers).toEqual({});
  });

  it("no persistencia: export sin derived.*; import + recompute igual", () => {
    let { c, idA } = companyAB();
    const s = addSource(c, idA, { kind: "other", description: "S" });
    if (!s) throw new Error("sin source");
    c = s.company;
    const d = addDataItem(c, idA, { label: "X", sourceRefs: [s.id] });
    if (!d) throw new Error("sin data");
    c = d.company;
    const json = JSON.stringify(c);
    expect(json).not.toContain("derived.");
    const checked = validateCompanyState(JSON.parse(json));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(deriveSessionFacts(checked.value, ctxT(c.id, idA))).toEqual(
      deriveSessionFacts(c, ctxT(c.id, idA)),
    );
    expect(deriveSessionFacts(checked.value, ctxT(c.id, idA))).toEqual({
      "derived.treatment.actors_exist": "no",
      "derived.treatment.actors_roles_complete": "no",
      "derived.treatment.purposes_exist": "no",
      "derived.treatment.purposes_described_complete": "no",
      "derived.treatment.identified": "no",
      "derived.treatment.data_items_exist": "yes",
      "derived.treatment.sources_exist": "yes",
      "derived.treatment.links_exist": "no",
      "derived.treatment.retention_rules_exist": "no",
      "derived.treatment.retention_rules_linked": "no",
      "derived.treatment.automated_uses_exist": "no",
      "derived.treatment.automated_uses_coverage_complete": "no",
      "derived.treatment.automated_uses_coverage_pending": "no",
      "derived.treatment.automated_uses_covered_exist": "no",
      "derived.treatment.automated_uses_legal_path_complete": "no",
      "derived.treatment.automated_uses_unpathed_covered_exist": "no",
      "derived.treatment.automated_uses_safeguards_complete": "no",
      "derived.treatment.automated_uses_safeguards_enabled": "no",
      "derived.treatment.automated_uses_safeguards_deficient": "no",
      ...D6_TREATMENT_EMPTY,
    });
  });

  it("sin conflicto: proyecciones no crean observations ni resolutions", () => {
    let { c, idA, idB } = companyAB();
    const a1 = addActor(c, idA, { kind: "person", name: "A" });
    if (!a1) throw new Error("sin actor");
    c = a1.company;
    expect(c.factResolutions).toEqual({});
    // Valores distintos por scope no son conflicto (versión scopeada).
    expect(
      blockingScopedConflicts(
        ["derived.treatment.actors_roles_complete"],
        c,
        { scope: "treatment", companyId: c.id, treatmentId: idA },
      ),
    ).toEqual([]);
    expect(deriveSessionFacts(c, ctxT(c.id, idA))["derived.treatment.actors_roles_complete"]).toBe("no");
    expect(deriveSessionFacts(c, ctxT(c.id, idB))["derived.treatment.actors_roles_complete"]).toBe("no");
  });

  it("namespace reservado: producción y efectos hacia derived.* fallan", () => {
    const badQuestion: ExecutionProtocol = {
      ...CONSUMER,
      protocol_key: "fixture.bad_q.v1",
      nodes: [
        {
          node_key: "q",
          node_type: "question",
          title: "Mala",
          fact_key: "derived.treatment.purposes_exist",
          answer_type: "single_select",
          options: [
            { value: "yes", label: "Sí", fact_effect: { fact_key: "derived.treatment.purposes_exist", value: "yes" } },
          ],
          required_facts: [],
        },
      ],
      decision_fact_keys: [],
    };
    const errorsQ = validateProtocolStructure(badQuestion);
    expect(errorsQ.some((e) => e.includes("produce fact derivado"))).toBe(true);
    const badEffect: ExecutionProtocol = {
      ...CONSUMER,
      protocol_key: "fixture.bad_e.v1",
      outcomes: [
        {
          outcome_key: "done",
          label: "D",
          classification: "agency_standard",
          explanation: "e",
          provenance: "agency_standard",
          canonical_fact_effects: [
            { fact_key: "derived.treatment.purposes_exist", value: "yes" },
          ],
          next_actions: [{ kind: "restart", label: "R" }],
        },
      ],
    };
    const errorsE = validateProtocolStructure(badEffect);
    expect(errorsE.some((e) => e.includes("materializa fact derivado"))).toBe(true);
    // required derived sin declarar en external también falla.
    const badReq: ExecutionProtocol = {
      ...CONSUMER,
      protocol_key: "fixture.bad_r.v1",
      external_fact_keys: [],
    };
    const errorsR = validateProtocolStructure(badReq);
    expect(errorsR.some((e) => e.includes("sin declarar"))).toBe(true);
  });

  it("consumo external: fixture evalúa con derived inyectados", () => {
    expect(validateProtocolStructure(CONSUMER)).toEqual([]);
    let { c, idA } = companyAB();
    const a1 = addActor(c, idA, { kind: "organization", name: "E", role: "responsible" });
    if (!a1) throw new Error("sin actor");
    c = a1.company;
    const facts = {
      "fixture.gate": "yes",
      ...deriveSessionFacts(c, ctxT(c.id, idA)),
    };
    const e = evaluateProtocol(CONSUMER, facts);
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") {
      expect(e.outcome_key).toBe("done");
      expect(e.rule_id).toBe("ok");
    }
    // Sin estructura completa deriva a pendiente.
    const { c: c2, idA: idA2 } = companyAB();
    const e2 = evaluateProtocol(CONSUMER, {
      "fixture.gate": "yes",
      ...deriveSessionFacts(c2, ctxT(c2.id, idA2)),
    });
    expect(e2.status).toBe("outcome");
    if (e2.status === "outcome") expect(e2.outcome_key).toBe("pending");
  });

  it("company proyecta existencia de inventario; D1 no consume derived.*", () => {
    const c = newCompany("D1 SpA");
    expect(deriveSessionFacts(c, { scope: "company", companyId: c.id })).toEqual({
      "derived.company.treatments_exist": "no",
    });
    for (const p of listProtocols()) {
      expect(validateProtocolStructure(p)).toEqual([]);
      const usesDerived = JSON.stringify(p).includes("derived.");
      const isD1 = /^(dpo\.|mpi\.|governance\.)/.test(p.protocol_key);
      if (isD1) {
        expect(usesDerived, p.protocol_key).toBe(false);
      }
      // Company-scope solo consume el derivado de inventario (D2.12).
      if ((p.execution_scope ?? "company") === "company" && usesDerived) {
        expect(p.protocol_key).toBe("inventory.periodic_revalidation.v1");
      }
    }
  });

  it("hardening: escritura directa de derived.* se rechaza", () => {
    const c = newCompany("H SpA");
    const made = createTreatment(c, { name: "T" });
    if (!made) throw new Error("sin treatment");
    const ctx = {
      scope: "treatment",
      companyId: made.company.id,
      treatmentId: made.treatmentId,
    } as const;
    expect(
      saveScopedProtocolAnswer(
        made.company,
        ctx,
        "fixture.x.v1",
        "derived.treatment.actors_exist",
        "yes",
        "fixture.x.v1",
      ),
    ).toBeNull();
  });

  it("links y reglas: semántica mecánica sin juicios", () => {
    let { c, idA } = companyAB();
    const ctx = ctxT(c.id, idA);
    expect(deriveSessionFacts(c, ctx)["derived.treatment.links_exist"]).toBe("no");
    expect(deriveSessionFacts(c, ctx)["derived.treatment.retention_rules_exist"]).toBe("no");
    expect(deriveSessionFacts(c, ctx)["derived.treatment.retention_rules_linked"]).toBe("no");
    const d = addDataItem(c, idA, { label: "RUT" });
    if (!d) throw new Error("sin data");
    c = d.company;
    const p1 = createPurpose(c, idA, "Facturación");
    if (!p1) throw new Error("sin purpose");
    c = p1.company;
    const l = addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId });
    if (!l) throw new Error("sin link");
    c = l;
    expect(deriveSessionFacts(c, ctx)["derived.treatment.links_exist"]).toBe("yes");
    const r = addRetentionRule(c, idA, {
      dataItemIds: [d.id],
      criterion: "2 años",
      owner: "TI",
    });
    if (!r) throw new Error("sin regla");
    c = r.company;
    expect(deriveSessionFacts(c, ctx)["derived.treatment.retention_rules_exist"]).toBe("yes");
    expect(deriveSessionFacts(c, ctx)["derived.treatment.retention_rules_linked"]).toBe("yes");
    // Regla vaciada por strip conserva existencia pero pierde vínculo.
    const stripped = deleteDataItem(c, idA, d.id);
    if (!stripped) throw new Error("sin strip");
    expect(deriveSessionFacts(stripped, ctx)["derived.treatment.retention_rules_exist"]).toBe("yes");
    expect(deriveSessionFacts(stripped, ctx)["derived.treatment.retention_rules_linked"]).toBe("no");
  });
});
