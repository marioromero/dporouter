import { describe, expect, it } from "vitest";
import { newCompany } from "../src/workspace/types";
import type { CompanyState } from "../src/workspace/types";
import {
  migrateWorkspaceData,
  validateCompanyState,
} from "../src/workspace/store";
import {
  createPurpose,
  createTreatment,
  deletePurpose,
} from "../src/workspace/scope";
import {
  addAutomatedUse,
  deleteAutomatedUse,
  getAutomatedUse,
  isValidCoveragePath,
  updateAutomatedUse,
} from "../src/workspace/locals";
import {
  AUTOMATED_USE_REF_PREFIX,
  extractAutomatedUseRefs,
  findUnknownAutomatedUseRefs,
  formatAutomatedUseRef,
  isAutomatedUseConsidered,
} from "../src/workspace/reasoning";
import { deriveSessionFacts } from "../src/workspace/derived";
import type { ExecutionContext } from "../src/workspace/types";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import { D04_ACTIVITIES } from "../content/domains/d04";
import {
  ALL_ACTIVITIES,
  getUnresolvedReferences,
} from "../content/registry";
import { getProtocolForActivity, listProtocols } from "../content/protocols/registry";

/**
 * Infraestructura local AutomatedUseRecord (D4.08/D4.09):
 * CRUD, invariantes coverage/legalPath, derived facts, referencias,
 * persistencia y regresión. Funciones puras; sin UI ni protocolos.
 */

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

function treatmentCtx(company: CompanyState, treatmentId: string): ExecutionContext {
  return { scope: "treatment", companyId: company.id, treatmentId };
}

function mustAdd(
  c: CompanyState,
  treatmentId: string,
  input: Parameters<typeof addAutomatedUse>[2],
) {
  const r = addAutomatedUse(c, treatmentId, input);
  if (!r) throw new Error("add falló");
  return r;
}

describe("automatedUses: estructura", () => {
  it("1. creación 0/1/N con estado inicial unknown y sin safeguards", () => {
    let { c, idA } = companyAB();
    expect(c.treatments?.[idA]?.automatedUses ?? []).toEqual([]);
    const r1 = mustAdd(c, idA, { name: "Scoring" });
    c = r1.company;
    const u1 = getAutomatedUse(c, idA, r1.id);
    expect(u1?.article8bisCoverage).toBe("unknown");
    expect(u1?.legalPath).toBe("unknown");
    expect(u1?.profiling).toBe("unknown");
    expect(u1?.safeguards).toBeUndefined();
    const r2 = mustAdd(c, idA, { name: "Priorización", profiling: "yes" });
    c = r2.company;
    expect(c.treatments?.[idA]?.automatedUses).toHaveLength(2);
    expect(r1.id === r2.id).toBe(false);
  });

  it("2. IDs locales independientes y aislamiento entre treatments", () => {
    let { c, idA, idB } = companyAB();
    const ra = mustAdd(c, idA, { name: "Mismo nombre" });
    c = ra.company;
    const rb = mustAdd(c, idB, { name: "Mismo nombre" });
    c = rb.company;
    expect(ra.id === rb.id).toBe(false);
    expect(getAutomatedUse(c, idA, rb.id)).toBeUndefined();
    expect(getAutomatedUse(c, idB, ra.id)).toBeUndefined();
  });

  it("3. add/update/delete con metadata y evidenceRef", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, {
      name: "Scoring",
      description: "d",
      processDescription: "p",
      mechanismDescription: "m",
      decisionDescription: "dec",
      evidenceRef: "doc-1",
    });
    c = r.company;
    const next = updateAutomatedUse(c, idA, r.id, {
      description: "d2",
      evidenceRef: null,
    });
    if (!next) throw new Error("update falló");
    c = next;
    const u = getAutomatedUse(c, idA, r.id);
    expect(u?.description).toBe("d2");
    expect(u?.evidenceRef).toBeUndefined();
    expect(updateAutomatedUse(c, idA, r.id, { name: "  " })).toBeNull();
    expect(updateAutomatedUse(c, idA, "inexistente", { name: "x" })).toBeNull();
    const del = deleteAutomatedUse(c, idA, r.id);
    if (!del) throw new Error("delete falló");
    c = del;
    expect(getAutomatedUse(c, idA, r.id)).toBeUndefined();
    expect(deleteAutomatedUse(c, idA, r.id)).toBeNull();
  });

  it("4. add rechaza nombre vacío y enums inválidos", () => {
    const { c, idA } = companyAB();
    expect(addAutomatedUse(c, idA, { name: "  " })).toBeNull();
    expect(
      addAutomatedUse(c, idA, {
        name: "x",
        profiling: "maybe" as unknown as "yes",
      }),
    ).toBeNull();
    expect(addAutomatedUse(c, "tratamiento-inexistente", { name: "x" })).toBeNull();
  });
});

describe("automatedUses: invariantes coverage/legalPath", () => {
  it("5. matriz válida completa aceptada", () => {
    expect(isValidCoveragePath("covered", "contract_necessary")).toBe(true);
    expect(isValidCoveragePath("covered", "explicit_consent")).toBe(true);
    expect(isValidCoveragePath("covered", "legal_authorization")).toBe(true);
    expect(isValidCoveragePath("covered", "none")).toBe(true);
    expect(isValidCoveragePath("covered", "unknown")).toBe(true);
    expect(isValidCoveragePath("not_covered", "not_applicable")).toBe(true);
    expect(isValidCoveragePath("unknown", "unknown")).toBe(true);
  });

  it("6. combinaciones inválidas rechazadas en update", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    // unknown solo admite unknown.
    expect(
      updateAutomatedUse(c, idA, r.id, { legalPath: "none" }),
    ).toBeNull();
    // covered admite las tres excepciones + none + unknown.
    for (const p of ["contract_necessary", "explicit_consent", "legal_authorization", "none"] as const) {
      const ok = updateAutomatedUse(c, idA, r.id, {
        article8bisCoverage: "covered",
        legalPath: p,
      });
      if (!ok) throw new Error(`debió aceptar ${p}`);
      c = ok;
      // Volver a unknown para el siguiente ciclo.
      const back = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "unknown" });
      if (!back) throw new Error("debió volver a unknown");
      c = back;
    }
    // not_covered exige not_applicable explícito o normalizado.
    expect(
      updateAutomatedUse(c, idA, r.id, {
        article8bisCoverage: "not_covered",
        legalPath: "none",
      }),
    ).toBeNull();
  });

  it("7. normalización al cambiar cobertura (sin arrastrar vía)", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    let next = updateAutomatedUse(c, idA, r.id, {
      article8bisCoverage: "covered",
      legalPath: "explicit_consent",
    });
    if (!next) throw new Error("falló covered");
    c = next;
    // Reafirmar covered ya vigente conserva la vía (no es cambio de estado).
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló re-covered");
    c = next;
    expect(getAutomatedUse(c, idA, r.id)?.legalPath).toBe("explicit_consent");
    // Volver desde otro estado sí resetea a unknown.
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "not_covered" });
    if (!next) throw new Error("falló not_covered intermedio");
    c = next;
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered 2");
    c = next;
    expect(getAutomatedUse(c, idA, r.id)?.legalPath).toBe("unknown");
    // not_covered normaliza vía y retira safeguards.
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "not_covered" });
    if (!next) throw new Error("falló not_covered");
    c = next;
    const u = getAutomatedUse(c, idA, r.id);
    expect(u?.legalPath).toBe("not_applicable");
    expect(u?.safeguards).toBeUndefined();
    // unknown normaliza vía y retira safeguards.
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered 2");
    c = next;
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "unknown" });
    if (!next) throw new Error("falló unknown");
    c = next;
    expect(getAutomatedUse(c, idA, r.id)?.legalPath).toBe("unknown");
  });

  it("8. safeguards solo en covered; limpieza al salir de covered", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    // Safeguards en unknown → rechazo.
    expect(
      updateAutomatedUse(c, idA, r.id, {
        safeguards: { explanation: "yes" },
      }),
    ).toBeNull();
    let next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered");
    c = next;
    // Safeguards parciales permitidas en covered.
    next = updateAutomatedUse(c, idA, r.id, {
      safeguards: { explanation: "yes", humanIntervention: "no" },
    });
    if (!next) throw new Error("falló safeguards parciales");
    c = next;
    expect(getAutomatedUse(c, idA, r.id)?.safeguards?.explanation).toBe("yes");
    // Check inválido y canal vacío → rechazo.
    expect(
      updateAutomatedUse(c, idA, r.id, {
        safeguards: { explanation: "maybe" as unknown as "yes" },
      }),
    ).toBeNull();
    expect(
      updateAutomatedUse(c, idA, r.id, {
        safeguards: { review: "yes", reviewChannel: "  " },
      }),
    ).toBeNull();
    // Salir de covered limpia safeguards aunque se intente conservar.
    expect(
      updateAutomatedUse(c, idA, r.id, {
        article8bisCoverage: "not_covered",
        safeguards: { explanation: "yes" },
      }),
    ).toBeNull();
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "not_covered" });
    if (!next) throw new Error("falló not_covered");
    c = next;
    expect(getAutomatedUse(c, idA, r.id)?.safeguards).toBeUndefined();
    // null explícito retira safeguards en covered.
    next = updateAutomatedUse(c, idA, r.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered 2");
    c = next;
    next = updateAutomatedUse(c, idA, r.id, {
      safeguards: { review: "yes", reviewChannel: "canal-x" },
    });
    if (!next) throw new Error("falló safeguards 2");
    c = next;
    next = updateAutomatedUse(c, idA, r.id, { safeguards: null });
    if (!next) throw new Error("falló retirar safeguards");
    expect(getAutomatedUse(next, idA, r.id)?.safeguards).toBeUndefined();
  });
});

describe("automatedUses: derived facts", () => {
  function facts(c: CompanyState, treatmentId: string) {
    return deriveSessionFacts(c, treatmentCtx(c, treatmentId));
  }

  it("9. lista vacía: existe=no, completos=no, nunca habilitado", () => {
    const { c, idA } = companyAB();
    const f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_exist"]).toBe("no");
    expect(f["derived.treatment.automated_uses_coverage_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_coverage_pending"]).toBe("no");
    expect(f["derived.treatment.automated_uses_covered_exist"]).toBe("no");
    expect(f["derived.treatment.automated_uses_legal_path_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_unpathed_covered_exist"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_enabled"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_deficient"]).toBe("no");
  });

  it("10. todos unknown: pendiente=yes, cubiertos=no", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    const f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_exist"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_coverage_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_coverage_pending"]).toBe("yes");
    // unknown no deduce cubiertos.
    expect(f["derived.treatment.automated_uses_covered_exist"]).toBe("no");
  });

  it("11. mezcla covered/not_covered con vía positiva", () => {
    let { c, idA } = companyAB();
    const r1 = mustAdd(c, idA, { name: "U1" });
    c = r1.company;
    const r2 = mustAdd(c, idA, { name: "U2" });
    c = r2.company;
    let next = updateAutomatedUse(c, idA, r1.id, {
      article8bisCoverage: "covered",
      legalPath: "contract_necessary",
    });
    if (!next) throw new Error("falló U1");
    c = next;
    next = updateAutomatedUse(c, idA, r2.id, { article8bisCoverage: "not_covered" });
    if (!next) throw new Error("falló U2");
    c = next;
    const f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_coverage_complete"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_coverage_pending"]).toBe("no");
    expect(f["derived.treatment.automated_uses_covered_exist"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_legal_path_complete"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_unpathed_covered_exist"]).toBe("no");
    // not_covered excluido de D4.09: safeguards sobre vacío de cubiertos… U1 sin safeguards.
    expect(f["derived.treatment.automated_uses_safeguards_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_enabled"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_deficient"]).toBe("no");
  });

  it("12. covered con none vs unknown: none≠unknown", () => {
    let { c, idA } = companyAB();
    const r1 = mustAdd(c, idA, { name: "U1" });
    c = r1.company;
    let next = updateAutomatedUse(c, idA, r1.id, {
      article8bisCoverage: "covered",
      legalPath: "none",
    });
    if (!next) throw new Error("falló none");
    c = next;
    let f = facts(c, idA);
    // none es ausencia determinada: vía completa, pero sin vía positiva.
    expect(f["derived.treatment.automated_uses_legal_path_complete"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_unpathed_covered_exist"]).toBe("yes");
    const r2 = mustAdd(c, idA, { name: "U2" });
    c = r2.company;
    next = updateAutomatedUse(c, idA, r2.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered");
    c = next;
    f = facts(c, idA);
    // unknown pendiente: vía incompleta, pero no es ausencia determinada.
    expect(f["derived.treatment.automated_uses_legal_path_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_unpathed_covered_exist"]).toBe("yes");
  });

  it("13. safeguards: completas, deficiencia e incompleta", () => {
    let { c, idA } = companyAB();
    const r1 = mustAdd(c, idA, { name: "U1" });
    c = r1.company;
    const full = {
      informationTransparency: "yes",
      explanation: "yes",
      humanIntervention: "yes",
      pointOfView: "yes",
      review: "yes",
    } as const;
    let next = updateAutomatedUse(c, idA, r1.id, { article8bisCoverage: "covered" });
    if (!next) throw new Error("falló covered");
    c = next;
    next = updateAutomatedUse(c, idA, r1.id, { safeguards: { ...full } });
    if (!next) throw new Error("falló safeguards");
    c = next;
    let f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_safeguards_complete"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_safeguards_enabled"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_safeguards_deficient"]).toBe("no");
    // Una deficiencia.
    next = updateAutomatedUse(c, idA, r1.id, {
      safeguards: { ...full, review: "no" },
    });
    if (!next) throw new Error("falló deficiencia");
    c = next;
    f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_safeguards_complete"]).toBe("yes");
    expect(f["derived.treatment.automated_uses_safeguards_enabled"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_deficient"]).toBe("yes");
    // Verificación incompleta (unknown).
    next = updateAutomatedUse(c, idA, r1.id, {
      safeguards: { ...full, review: "unknown" },
    });
    if (!next) throw new Error("falló incompleta");
    c = next;
    f = facts(c, idA);
    expect(f["derived.treatment.automated_uses_safeguards_complete"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_enabled"]).toBe("no");
    expect(f["derived.treatment.automated_uses_safeguards_deficient"]).toBe("no");
  });
});

describe("automatedUses: referencias", () => {
  it("14. purpose del mismo treatment; cross-parent rechazado", () => {
    let { c, idA, idB } = companyAB();
    const p = createPurpose(c, idA, "Finalidad F");
    if (!p) throw new Error("sin purpose");
    c = p.company;
    const r = mustAdd(c, idA, { name: "U", purposeId: p.purposeId });
    c = r.company;
    expect(getAutomatedUse(c, idA, r.id)?.purposeId).toBe(p.purposeId);
    // Purpose de otro treatment → rechazo.
    const q = createPurpose(c, idB, "Otra");
    if (!q) throw new Error("sin purpose B");
    c = q.company;
    expect(addAutomatedUse(c, idA, { name: "X", purposeId: q.purposeId })).toBeNull();
    expect(
      updateAutomatedUse(c, idA, r.id, { purposeId: q.purposeId }),
    ).toBeNull();
  });

  it("15. purpose deletion limpia referencia y conserva el uso", () => {
    let { c, idA } = companyAB();
    const p = createPurpose(c, idA, "Finalidad F");
    if (!p) throw new Error("sin purpose");
    c = p.company;
    const r = mustAdd(c, idA, { name: "U", purposeId: p.purposeId });
    c = r.company;
    const del = deletePurpose(c, idA, p.purposeId);
    if (!del) throw new Error("delete purpose falló");
    c = del;
    const u = getAutomatedUse(c, idA, r.id);
    expect(u).toBeDefined();
    expect(u?.purposeId).toBeUndefined();
    expect(validateCompanyState(JSON.parse(JSON.stringify(c))).ok).toBe(true);
  });

  it("16. refs explícitas a IDs en facts_considered: formato, extracción y validación", () => {
    expect(AUTOMATED_USE_REF_PREFIX).toBe("automated_use:");
    expect(formatAutomatedUseRef("abc")).toBe("automated_use:abc");
    const entries = [
      "derived.treatment.automated_uses_exist",
      formatAutomatedUseRef("u1"),
      formatAutomatedUseRef("u1"),
      formatAutomatedUseRef("u2"),
    ];
    expect(extractAutomatedUseRefs(entries)).toEqual(["u1", "u2"]);
    expect(extractAutomatedUseRefs(["sin referencias"])).toEqual([]);
    // Nombres similares no confunden: el ID exacto manda.
    expect(
      findUnknownAutomatedUseRefs(entries, new Set(["u1", "u2"])),
    ).toEqual([]);
    expect(
      findUnknownAutomatedUseRefs(entries, ["u1"]),
    ).toEqual(["u2"]);
    expect(isAutomatedUseConsidered(entries, "u1")).toBe(true);
    expect(isAutomatedUseConsidered(entries, "u9")).toBe(false);
  });

  it("16b. rationale con token es ignorado; mismo ID local en treatments distintos", () => {
    // Texto libre nunca parseado: el token en rationale no es referencia.
    const rationale = `Se evaluó ${formatAutomatedUseRef("u1")} en detalle.`;
    expect(extractAutomatedUseRefs([rationale])).toEqual([]);
    expect(isAutomatedUseConsidered([rationale], "u1")).toBe(false);
    // Mismo ID local en treatments distintos, sin colisión: cada
    // validación usa el conjunto del treatment direccionado.
    expect(findUnknownAutomatedUseRefs([formatAutomatedUseRef("u1")], ["u1"])).toEqual([]);
    expect(findUnknownAutomatedUseRefs([formatAutomatedUseRef("u1")], [])).toEqual(["u1"]);
  });

  it("16c. round-trip preserva tokens en facts_considered sin nueva estructura", () => {
    let { c, idA } = companyAB();
    const t = c.treatments?.[idA];
    if (!t) throw new Error("sin treatment");
    const record = {
      protocolKey: "automated_decision.scope_assess.v1",
      activityKey: "automated_decision.scope_assess",
      conclusion: "covered_uses_with_legal_path",
      legal_question: "q",
      facts_considered: [formatAutomatedUseRef("u1"), "otro hecho"],
      legal_factors: [],
      evidence_refs: [],
      alternatives_considered: [],
      rationale: `Narrativa libre que menciona ${formatAutomatedUseRef("u1")} sin crear referencia.`,
      decided_by: "profesional",
      reviewed_by: "",
      decided_at: "2026-09-24",
      legal_basis: [],
      updatedAt: "2026-09-24T00:00:00.000Z",
    };
    const withRecord: CompanyState = {
      ...c,
      treatments: {
        ...c.treatments,
        [idA]: {
          ...t,
          reasoningRecords: { [record.protocolKey]: record },
        },
      },
    };
    const v = validateCompanyState(JSON.parse(JSON.stringify(withRecord)));
    if (!v.ok) throw new Error("import falló");
    const back = v.value.treatments?.[idA]?.reasoningRecords?.[record.protocolKey];
    expect(back?.facts_considered).toEqual([formatAutomatedUseRef("u1"), "otro hecho"]);
    expect(extractAutomatedUseRefs(back?.facts_considered ?? [])).toEqual(["u1"]);
    expect(back?.rationale).toContain(formatAutomatedUseRef("u1"));
  });
});

describe("automatedUses: persistencia", () => {
  function roundTrip(c: CompanyState): CompanyState {
    const json = JSON.parse(JSON.stringify(c));
    // Derived facts nunca en JSON exportado.
    expect(JSON.stringify(json)).not.toContain("derived.treatment.automated_uses_");
    const v = validateCompanyState(json);
    if (!v.ok) throw new Error(`import falló: ${(v as { error: string }).error}`);
    return v.value;
  }

  it("17. export/import round-trip conserva usos, determinaciones y safeguards", () => {
    let { c, idA } = companyAB();
    const p = createPurpose(c, idA, "F");
    if (!p) throw new Error("sin purpose");
    c = p.company;
    const r = mustAdd(c, idA, {
      name: "Scoring",
      purposeId: p.purposeId,
      profiling: "yes",
      evidenceRef: "doc-1",
    });
    c = r.company;
    let next = updateAutomatedUse(c, idA, r.id, {
      article8bisCoverage: "covered",
      legalPath: "explicit_consent",
    });
    if (!next) throw new Error("falló coverage");
    c = next;
    next = updateAutomatedUse(c, idA, r.id, {
      safeguards: { explanation: "yes", reviewChannel: "canal-r" },
    });
    if (!next) throw new Error("falló safeguards");
    c = next;
    const back = roundTrip(c);
    const u = getAutomatedUse(back, idA, r.id);
    expect(u?.name).toBe("Scoring");
    expect(u?.purposeId).toBe(p.purposeId);
    expect(u?.article8bisCoverage).toBe("covered");
    expect(u?.legalPath).toBe("explicit_consent");
    expect(u?.safeguards?.explanation).toBe("yes");
    expect(u?.safeguards?.reviewChannel).toBe("canal-r");
  });

  it("18. legacy sin automatedUses válido; duplicados/enums/refs inválidas rechazan", () => {
    const { c, idA } = companyAB();
    // Legacy: colección ausente válida.
    expect(validateCompanyState(JSON.parse(JSON.stringify(c))).ok).toBe(true);
    const base = JSON.parse(JSON.stringify(c));
    const good = {
      id: "u1",
      name: "U",
      profiling: "unknown",
      article8bisCoverage: "unknown",
      legalPath: "unknown",
    };
    // Duplicados.
    const dup = structuredClone(base);
    dup.treatments[idA].automatedUses = [good, { ...good }];
    expect(validateCompanyState(dup).ok).toBe(false);
    // Enum inválido.
    const badEnum = structuredClone(base);
    badEnum.treatments[idA].automatedUses = [{ ...good, profiling: "maybe" }];
    expect(validateCompanyState(badEnum).ok).toBe(false);
    // Coverage/legalPath incoherente.
    const badMatrix = structuredClone(base);
    badMatrix.treatments[idA].automatedUses = [
      { ...good, article8bisCoverage: "not_covered", legalPath: "none" },
    ];
    expect(validateCompanyState(badMatrix).ok).toBe(false);
    // Safeguards en uso no cubierto.
    const badSg = structuredClone(base);
    badSg.treatments[idA].automatedUses = [
      { ...good, safeguards: { explanation: "yes" } },
    ];
    expect(validateCompanyState(badSg).ok).toBe(false);
    // Safeguards con check inválido.
    const badCheck = structuredClone(base);
    badCheck.treatments[idA].automatedUses = [
      {
        ...good,
        article8bisCoverage: "covered",
        legalPath: "unknown",
        safeguards: { explanation: "maybe" },
      },
    ];
    expect(validateCompanyState(badCheck).ok).toBe(false);
    // purposeId colgante.
    const dangling = structuredClone(base);
    dangling.treatments[idA].automatedUses = [{ ...good, purposeId: "fin-x" }];
    expect(validateCompanyState(dangling).ok).toBe(false);
    // No array.
    const notArray = structuredClone(base);
    notArray.treatments[idA].automatedUses = { u1: good };
    expect(validateCompanyState(notArray).ok).toBe(false);
  });

  it("19. migración conserva usos válidos y rechaza treatment corrupto sin podar", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    const stored = JSON.parse(JSON.stringify({ version: 1, profiles: [], companies: { [c.id]: c } }));
    const migrated = migrateWorkspaceData(stored);
    const back = Object.values(migrated.companies)[0];
    expect(getAutomatedUse(back, idA, r.id)?.name).toBe("U");
    // Corrupto en migración: treatment descartado completo, no podado.
    const bad = structuredClone(stored);
    bad.companies[c.id].treatments[idA].automatedUses = [
      { id: "u9", name: "X", profiling: "unknown", article8bisCoverage: "covered", legalPath: "bogus" },
    ];
    const migratedBad = migrateWorkspaceData(bad);
    expect(Object.values(migratedBad.companies)[0].treatments?.[idA]).toBeUndefined();
  });
});

describe("automatedUses: regresión", () => {
  it("20. D1/D2/D3/D4 canon intactos; 61 actividades; 54 protocolos; 2 pendings", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(D04_ACTIVITIES).toHaveLength(9);
    expect(ALL_ACTIVITIES).toHaveLength(61);
    expect(listProtocols()).toHaveLength(54);
    expect(getUnresolvedReferences()).toEqual([
      "mpi.diffusion",
      "risk.mpi_sync",
    ]);
    expect(getProtocolForActivity("automated_decision.scope_assess")).toBeTruthy();
    expect(getProtocolForActivity("automated_decision.safeguards_enable")).toBeTruthy();
  });

  it("21. editar/usar automatedUses no escribe canonical facts", () => {
    let { c, idA } = companyAB();
    const r = mustAdd(c, idA, { name: "U" });
    c = r.company;
    const next = updateAutomatedUse(c, idA, r.id, {
      article8bisCoverage: "covered",
      legalPath: "none",
      safeguards: { review: "no" },
    });
    if (!next) throw new Error("falló update");
    c = next;
    const del = deleteAutomatedUse(c, idA, r.id);
    if (!del) throw new Error("falló delete");
    c = del;
    const answers = c.treatments?.[idA]?.protocolAnswers ?? {};
    expect(JSON.stringify(answers)).not.toContain("automated_decision.");
    expect(Object.keys(c.treatments?.[idA]?.reasoningRecords ?? [])).toEqual([]);
  });
});
