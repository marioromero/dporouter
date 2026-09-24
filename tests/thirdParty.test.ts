import { describe, expect, it } from "vitest";
import { newCompany } from "../src/workspace/types";
import type {
  CompanyState,
  ExecutionContext,
  ThirdPartyRelationshipRecord,
} from "../src/workspace/types";
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
  addActor,
  addDataItem,
  addThirdPartyRelationship,
  deleteActor,
  deleteDataItem,
  deleteThirdPartyRelationship,
  getThirdPartyRelationship,
  listThirdPartyRelationships,
  updateThirdPartyRelationship,
  type ThirdPartyRelationshipInput,
} from "../src/workspace/locals";
import {
  RELATIONSHIP_REF_PREFIX,
  extractRelationshipRefs,
  findUnknownRelationshipRefs,
  formatRelationshipRef,
  isRelationshipConsidered,
} from "../src/workspace/thirdParty";
import { deriveSessionFacts } from "../src/workspace/derived";

/**
 * Infraestructura local ThirdPartyRelationshipRecord (D6 Punto 0,
 * ADR-054): CRUD, invariantes tipo/assessments, refs, cadenas,
 * borrado, derivados, tokens de razonamiento, persistencia y
 * ausencia de escrituras canónicas. Funciones puras; sin UI ni
 * protocolos D6.
 */

function setup() {
  let c = newCompany("X SpA");
  const t = createTreatment(c, { name: "T" });
  if (!t) throw new Error("sin T");
  c = t.company;
  const tid = t.treatmentId;
  const a = addActor(c, tid, { kind: "organization", name: "Proveedor A" });
  if (!a) throw new Error("sin actor");
  c = a.company;
  const p1 = createPurpose(c, tid, "Finalidad 1");
  if (!p1) throw new Error("sin P1");
  c = p1.company;
  const p2 = createPurpose(c, tid, "Finalidad 2");
  if (!p2) throw new Error("sin P2");
  c = p2.company;
  const d = addDataItem(c, tid, { label: "RUT" });
  if (!d) throw new Error("sin dato");
  c = d.company;
  return { c, tid, actor: a.id, p1: p1.purposeId, p2: p2.purposeId, data: d.id };
}

function mustAdd(
  c: CompanyState,
  tid: string,
  input: Parameters<typeof addThirdPartyRelationship>[2],
) {
  const r = addThirdPartyRelationship(c, tid, input);
  if (!r) throw new Error(`add falló: ${JSON.stringify(input)}`);
  return r;
}

function tctx(company: CompanyState, treatmentId: string): ExecutionContext {
  return { scope: "treatment", companyId: company.id, treatmentId };
}

function pctx(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
): ExecutionContext {
  return { scope: "purpose", companyId: company.id, treatmentId, purposeId };
}

function facts(company: CompanyState, ctx: ExecutionContext): Record<string, string> {
  return deriveSessionFacts(company, ctx) as Record<string, string>;
}

describe("thirdParty: CRUD básico", () => {
  it("1. add 0/1/N relationships", () => {
    const s = setup();
    expect(listThirdPartyRelationships(s.c, s.tid)).toHaveLength(0);
    let r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R1" });
    expect(listThirdPartyRelationships(r.company, s.tid)).toHaveLength(1);
    r = mustAdd(r.company, s.tid, { actorId: s.actor, label: "R2" });
    expect(listThirdPartyRelationships(r.company, s.tid)).toHaveLength(2);
  });

  it("2. IDs locales únicos", () => {
    const s = setup();
    const r1 = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R1" });
    const r2 = mustAdd(r1.company, s.tid, { actorId: s.actor, label: "R2" });
    expect(r1.id).not.toBe(r2.id);
  });

  it("3. mismo actor, múltiples relationships", () => {
    const s = setup();
    let r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "Encargo", relationshipType: "processor",
    });
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "Cesión", relationshipType: "cession",
      purposeIds: [s.p1],
    });
    const all = listThirdPartyRelationships(r.company, s.tid);
    expect(all).toHaveLength(2);
    expect(all.filter((x) => x.actorId === s.actor)).toHaveLength(2);
  });

  it("4. update de label y lectura direccionada", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R1" });
    const next = updateThirdPartyRelationship(r.company, s.tid, r.id, {
      label: "R1 bis",
    });
    expect(next).not.toBeNull();
    expect(getThirdPartyRelationship(next!, s.tid, r.id)?.label).toBe("R1 bis");
  });

  it("5. hard-delete sin tombstone", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R1" });
    const next = deleteThirdPartyRelationship(r.company, s.tid, r.id);
    expect(next).not.toBeNull();
    expect(listThirdPartyRelationships(next!, s.tid)).toHaveLength(0);
    expect(getThirdPartyRelationship(next!, s.tid, r.id)).toBeUndefined();
  });

  it("6. aislamiento por treatment", () => {
    const s = setup();
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    const r = mustAdd(t2.company, s.tid, { actorId: s.actor, label: "R1" });
    expect(listThirdPartyRelationships(r.company, t2.treatmentId)).toHaveLength(0);
    expect(getThirdPartyRelationship(r.company, t2.treatmentId, r.id)).toBeUndefined();
  });
});

describe("thirdParty: tipos y assessments", () => {
  it("7. combinaciones válidas por tipo", () => {
    const s = setup();
    let c = s.c;
    const mk = (
      label: string,
      extra: Omit<ThirdPartyRelationshipInput, "actorId" | "label">,
    ): CompanyState => {
      const r = addThirdPartyRelationship(c, s.tid, {
        actorId: s.actor, label, ...extra,
      });
      expect(r, label).not.toBeNull();
      c = r!.company;
      return c;
    };
    mk("comm", { relationshipType: "communication" });
    mk("ces", {
      relationshipType: "cession",
      cessionAssessment: { lawfulness: "supported", instrument: "validated" },
    });
    mk("proc", {
      relationshipType: "processor",
      processorAssessment: {
        contract: "validated", instructions: "controlled", operational: "controlled",
      },
    });
    // Subprocessor sin parent: draft válido (D6.06 lo verá incompleto).
    mk("sub", {
      relationshipType: "subprocessor",
      subprocessorAssessment: { authorization: "controlled" },
    });
    mk("unk", { relationshipType: "unknown" });
    expect(listThirdPartyRelationships(c, s.tid)).toHaveLength(5);
  });

  it("8. rechaza assessments incompatibles", () => {
    const s = setup();
    const bad: Array<[string, Omit<ThirdPartyRelationshipInput, "actorId" | "label">]> = [
      ["comm+cession", {
        relationshipType: "communication",
        cessionAssessment: { lawfulness: "supported", instrument: "validated" },
      }],
      ["comm+processor", {
        relationshipType: "communication",
        processorAssessment: { contract: "validated", instructions: "controlled", operational: "controlled" },
      }],
      ["cession+processor", {
        relationshipType: "cession",
        processorAssessment: { contract: "validated", instructions: "controlled", operational: "controlled" },
      }],
      ["processor+cession", {
        relationshipType: "processor",
        cessionAssessment: { lawfulness: "supported", instrument: "validated" },
      }],
      ["sub+cession", {
        relationshipType: "subprocessor",
        cessionAssessment: { lawfulness: "supported", instrument: "validated" },
      }],
      ["unknown+assessment", {
        relationshipType: "unknown",
        processorAssessment: { contract: "validated", instructions: "controlled", operational: "controlled" },
      }],
    ];
    for (const [label, extra] of bad) {
      expect(
        addThirdPartyRelationship(s.c, s.tid, { actorId: s.actor, label, ...extra }),
        label,
      ).toBeNull();
    }
  });

  it("9. cambio de tipo limpia assessments y parent", () => {
    const s = setup();
    // Processor padre + subprocessor hijo.
    let r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    const sub = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: r.id,
      subprocessorAssessment: { authorization: "controlled" },
    });
    // subprocessor → communication: pierde parent y assessment.
    const next = updateThirdPartyRelationship(sub.company, s.tid, sub.id, {
      relationshipType: "communication",
    });
    expect(next).not.toBeNull();
    const got = getThirdPartyRelationship(next!, s.tid, sub.id)!;
    expect(got.relationshipType).toBe("communication");
    expect(got.subprocessorAssessment).toBeUndefined();
    expect(got.parentRelationshipId).toBeUndefined();
    // cession → processor: pierde cessionAssessment; admite processorAssessment nueva.
    const ces = mustAdd(next!, s.tid, {
      actorId: s.actor, label: "C", relationshipType: "cession",
      cessionAssessment: { lawfulness: "supported", instrument: "validated" },
    });
    const conv = updateThirdPartyRelationship(ces.company, s.tid, ces.id, {
      relationshipType: "processor",
      processorAssessment: { contract: "validated", instructions: "unknown", operational: "unknown" },
    });
    expect(conv).not.toBeNull();
    const got2 = getThirdPartyRelationship(conv!, s.tid, ces.id)!;
    expect(got2.cessionAssessment).toBeUndefined();
    expect(got2.processorAssessment?.contract).toBe("validated");
  });
});

describe("thirdParty: refs", () => {
  it("10. actor válido mismo-treatment; dangling y cross-treatment rechazados", () => {
    const s = setup();
    expect(
      addThirdPartyRelationship(s.c, s.tid, { actorId: "actor-x", label: "X" }),
    ).toBeNull();
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    const a2 = addActor(t2.company, t2.treatmentId, { kind: "person", name: "B" });
    if (!a2) throw new Error("sin A2");
    expect(
      addThirdPartyRelationship(a2.company, s.tid, { actorId: a2.id, label: "X" }),
    ).toBeNull();
  });

  it("11. purposes multi-ref, dedupe estricto, cross-treatment, strip al eliminar", () => {
    const s = setup();
    // Multi-ref válido.
    const r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "R", purposeIds: [s.p1, s.p2],
    });
    expect(getThirdPartyRelationship(r.company, s.tid, r.id)?.purposeIds).toEqual([s.p1, s.p2]);
    // Duplicados rechazan.
    expect(
      addThirdPartyRelationship(s.c, s.tid, {
        actorId: s.actor, label: "Dup", purposeIds: [s.p1, s.p1],
      }),
    ).toBeNull();
    // Cross-treatment rechaza.
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    const q = createPurpose(t2.company, t2.treatmentId, "Q");
    if (!q) throw new Error("sin Q");
    expect(
      addThirdPartyRelationship(q.company, s.tid, {
        actorId: s.actor, label: "X", purposeIds: [q.purposeId],
      }),
    ).toBeNull();
    // Delete purpose hace strip y preserva la relationship.
    const del = deletePurpose(r.company, s.tid, s.p1);
    expect(del).not.toBeNull();
    expect(getThirdPartyRelationship(del!, s.tid, r.id)?.purposeIds).toEqual([s.p2]);
  });

  it("12. data items multi-ref, dedupe, cross-treatment, strip al eliminar", () => {
    const s = setup();
    const d2 = addDataItem(s.c, s.tid, { label: "Email" });
    if (!d2) throw new Error("sin D2");
    const r = mustAdd(d2.company, s.tid, {
      actorId: s.actor, label: "R", dataItemIds: [s.data, d2.id],
    });
    expect(getThirdPartyRelationship(r.company, s.tid, r.id)?.dataItemIds).toEqual([s.data, d2.id]);
    expect(
      addThirdPartyRelationship(s.c, s.tid, {
        actorId: s.actor, label: "Dup", dataItemIds: [s.data, s.data],
      }),
    ).toBeNull();
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    const dx = addDataItem(t2.company, t2.treatmentId, { label: "Otro" });
    if (!dx) throw new Error("sin DX");
    expect(
      addThirdPartyRelationship(dx.company, s.tid, {
        actorId: s.actor, label: "X", dataItemIds: [dx.id],
      }),
    ).toBeNull();
    const del = deleteDataItem(r.company, s.tid, s.data);
    expect(del).not.toBeNull();
    const got = getThirdPartyRelationship(del!, s.tid, r.id)!;
    expect(got.dataItemIds).toEqual([d2.id]);
  });
});

describe("thirdParty: cadena processor/subprocessor", () => {
  function procSub(s: ReturnType<typeof setup>) {
    const p = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    return { c: p.company, pid: p.id };
  }

  it("13. processor → subprocessor válido; sub → sub válido", () => {
    const s = setup();
    const { c, pid } = procSub(s);
    const sub = mustAdd(c, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: pid,
    });
    expect(
      getThirdPartyRelationship(sub.company, s.tid, sub.id)?.parentRelationshipId,
    ).toBe(pid);
    const sub2 = mustAdd(sub.company, s.tid, {
      actorId: s.actor, label: "S2", relationshipType: "subprocessor",
      parentRelationshipId: sub.id,
    });
    expect(sub2.id).toBeTruthy();
  });

  it("14. parent en communication/cession rechazado", () => {
    const s = setup();
    const { c, pid } = procSub(s);
    expect(
      addThirdPartyRelationship(c, s.tid, {
        actorId: s.actor, label: "C", relationshipType: "communication",
        parentRelationshipId: pid,
      }),
    ).toBeNull();
    expect(
      addThirdPartyRelationship(c, s.tid, {
        actorId: s.actor, label: "C2", relationshipType: "cession",
        parentRelationshipId: pid,
      }),
    ).toBeNull();
  });

  it("15. self-parent y ciclos de 2 y N rechazados", () => {
    const s = setup();
    const { c, pid } = procSub(s);
    const a = mustAdd(c, s.tid, {
      actorId: s.actor, label: "A", relationshipType: "subprocessor",
      parentRelationshipId: pid,
    });
    const b = mustAdd(a.company, s.tid, {
      actorId: s.actor, label: "B", relationshipType: "subprocessor",
      parentRelationshipId: a.id,
    });
    // 2-ciclo: A → B con B → A vigente.
    expect(
      updateThirdPartyRelationship(b.company, s.tid, a.id, { parentRelationshipId: b.id }),
    ).toBeNull();
    // N-ciclo: C → B, luego intento P…: pid es processor (sin parent posible);
    // se construye A2 → B → A2 vía update de B a un hijo nuevo.
    const k = mustAdd(b.company, s.tid, {
      actorId: s.actor, label: "K", relationshipType: "subprocessor",
      parentRelationshipId: b.id,
    });
    // K → … → B → A → P; cerrar B → K crearía ciclo B→K→B.
    expect(
      updateThirdPartyRelationship(k.company, s.tid, b.id, { parentRelationshipId: k.id }),
    ).toBeNull();
    // Self-parent directo en update.
    expect(
      updateThirdPartyRelationship(k.company, s.tid, k.id, { parentRelationshipId: k.id }),
    ).toBeNull();
  });

  it("16. subprocessor sin parent: draft válido", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "S", relationshipType: "subprocessor" });
    expect(getThirdPartyRelationship(r.company, s.tid, r.id)?.parentRelationshipId).toBeUndefined();
    const f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_subprocessors_parents_complete"]).toBe("no");
  });

  it("16b. re-tipar un padre con hijos se rechaza (no corrompe la colección)", () => {
    const s = setup();
    const p = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    const sub = mustAdd(p.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: p.id,
    });
    // processor → cession dejaría a S con padre de tipo incompatible.
    expect(
      updateThirdPartyRelationship(sub.company, s.tid, p.id, { relationshipType: "cession" }),
    ).toBeNull();
    // processor → communication igual.
    expect(
      updateThirdPartyRelationship(sub.company, s.tid, p.id, { relationshipType: "communication" }),
    ).toBeNull();
    // processor → unknown igual.
    expect(
      updateThirdPartyRelationship(sub.company, s.tid, p.id, { relationshipType: "unknown" }),
    ).toBeNull();
    // La re-validación no bloquea cambios inocuos (label).
    expect(
      updateThirdPartyRelationship(sub.company, s.tid, p.id, { label: "P2" }),
    ).not.toBeNull();
    // Un hijo sin hijos propios puede re-tiparse: la normalización le
    // retira su propio parent y no afecta a nadie más.
    expect(
      updateThirdPartyRelationship(sub.company, s.tid, sub.id, { relationshipType: "communication" }),
    ).not.toBeNull();
  });
});

describe("thirdParty: borrado", () => {
  it("17. actor sin relationships se elimina; referenciado se rechaza", () => {
    const s = setup();
    const a2 = addActor(s.c, s.tid, { kind: "person", name: "Libre" });
    if (!a2) throw new Error("sin A2");
    expect(deleteActor(a2.company, s.tid, a2.id)).not.toBeNull();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R" });
    expect(deleteActor(r.company, s.tid, s.actor)).toBeNull();
    // Tras eliminar la relationship, el actor vuelve a ser eliminable.
    const del = deleteThirdPartyRelationship(r.company, s.tid, r.id);
    expect(deleteActor(del!, s.tid, s.actor)).not.toBeNull();
  });

  it("18. relationship con hijos se rechaza; sin hijos se elimina", () => {
    const s = setup();
    const p = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    const sub = mustAdd(p.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: p.id,
    });
    expect(deleteThirdPartyRelationship(sub.company, s.tid, p.id)).toBeNull();
    const noChild = deleteThirdPartyRelationship(sub.company, s.tid, sub.id);
    expect(noChild).not.toBeNull();
    expect(deleteThirdPartyRelationship(noChild!, s.tid, p.id)).not.toBeNull();
  });
});

describe("thirdParty: derivados D6.01", () => {
  it("19. colección vacía nunca completa", () => {
    const s = setup();
    const f = facts(s.c, tctx(s.c, s.tid));
    expect(f["derived.treatment.d6_relationships_exist"]).toBe("no");
    expect(f["derived.treatment.d6_map_complete"]).toBe("no");
    expect(f["derived.treatment.d6_map_unknown_exist"]).toBe("no");
    expect(f["derived.treatment.d6_international_exist"]).toBe("no");
  });

  it("20. unknown type / unknown international bloquean completitud", () => {
    const s = setup();
    let r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "R", relationshipType: "unknown",
      internationalDimension: "no",
    });
    let f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_relationships_exist"]).toBe("yes");
    expect(f["derived.treatment.d6_map_complete"]).toBe("no");
    expect(f["derived.treatment.d6_map_unknown_exist"]).toBe("yes");
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "R2", relationshipType: "processor",
      internationalDimension: "unknown",
    });
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_map_complete"]).toBe("no");
  });

  it("21. mapa estructuralmente completo e internacional detectado", () => {
    const s = setup();
    let r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "P", relationshipType: "processor",
      internationalDimension: "no",
    });
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      internationalDimension: "yes", parentRelationshipId: r.id,
    });
    const f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_map_complete"]).toBe("yes");
    expect(f["derived.treatment.d6_map_unknown_exist"]).toBe("no");
    expect(f["derived.treatment.d6_international_exist"]).toBe("yes");
  });

  it("22. subprocessor sin parent rompe completitud", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      internationalDimension: "no",
    });
    expect(facts(r.company, tctx(r.company, s.tid))["derived.treatment.d6_map_complete"]).toBe("no");
  });
});

describe("thirdParty: derivados D6.02 por purpose", () => {
  function cession(
    c: CompanyState, tid: string, actor: string, label: string, purposeId: string,
    lawfulness: "supported" | "not_supported" | "unknown",
  ) {
    return mustAdd(c, tid, {
      actorId: actor, label, relationshipType: "cession", purposeIds: [purposeId],
      cessionAssessment: { lawfulness, instrument: "validated" },
    });
  }

  it("23. cero, una y múltiples cesiones; propósito ajeno ignorado", () => {
    const s = setup();
    let f = facts(s.c, pctx(s.c, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_exist"]).toBe("no");
    let r = cession(s.c, s.tid, s.actor, "C1", s.p1, "supported");
    f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_exist"]).toBe("yes");
    expect(f["derived.purpose.d6_cessions_lawfulness_supported"]).toBe("yes");
    // Cesión ligada a otra purpose no contamina P1.
    r = cession(r.company, s.tid, s.actor, "C2", s.p2, "not_supported");
    f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_lawfulness_supported"]).toBe("yes");
    expect(f["derived.purpose.d6_cessions_lawfulness_blocked"]).toBe("no");
    const f2 = facts(r.company, pctx(r.company, s.tid, s.p2));
    expect(f2["derived.purpose.d6_cessions_lawfulness_blocked"]).toBe("yes");
  });

  it("24. unknown y cambio de membresía recomputan", () => {
    const s = setup();
    let r = cession(s.c, s.tid, s.actor, "C1", s.p1, "unknown");
    let f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_lawfulness_unknown"]).toBe("yes");
    expect(f["derived.purpose.d6_cessions_lawfulness_known"]).toBe("no");
    const next = updateThirdPartyRelationship(r.company, s.tid, r.id, { purposeIds: [] });
    expect(next).not.toBeNull();
    f = facts(next!, pctx(next!, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_exist"]).toBe("no");
  });
});

describe("thirdParty: precisión D6.03", () => {
  function mk(
    c: CompanyState, tid: string, actor: string, label: string, purposeId: string,
    lawfulness: "supported" | "not_supported" | "unknown",
    instrument: "validated" | "remediation_required" | "unknown",
  ) {
    return mustAdd(c, tid, {
      actorId: actor, label, relationshipType: "cession", purposeIds: [purposeId],
      cessionAssessment: { lawfulness, instrument },
    });
  }

  it("25. Caso A: todo supported + todo validated → positive", () => {
    const s = setup();
    const r = mk(s.c, s.tid, s.actor, "C", s.p1, "supported", "validated");
    const f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cession_ready_positive"]).toBe("yes");
    expect(f["derived.purpose.d6_cession_blocked_by_lawfulness"]).toBe("no");
  });

  it("26. Caso B: instrumento en remediación → remediation", () => {
    const s = setup();
    let r = mk(s.c, s.tid, s.actor, "C1", s.p1, "supported", "validated");
    r = mk(r.company, s.tid, s.actor, "C2", s.p1, "supported", "remediation_required");
    const f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_instrument_remediation"]).toBe("yes");
    expect(f["derived.purpose.d6_cession_ready_positive"]).toBe("no");
  });

  it("27. Caso C: instrumento ok + licitud fallida → bloqueado, NO remediation", () => {
    const s = setup();
    const r = mk(s.c, s.tid, s.actor, "C", s.p1, "not_supported", "validated");
    const f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cession_blocked_by_lawfulness"]).toBe("yes");
    expect(f["derived.purpose.d6_cessions_instrument_remediation"]).toBe("no");
    expect(f["derived.purpose.d6_cession_ready_positive"]).toBe("no");
  });

  it("28. Caso D: instrumento unknown → incomplete", () => {
    const s = setup();
    const r = mk(s.c, s.tid, s.actor, "C", s.p1, "supported", "unknown");
    const f = facts(r.company, pctx(r.company, s.tid, s.p1));
    expect(f["derived.purpose.d6_cessions_instrument_unknown"]).toBe("yes");
    expect(f["derived.purpose.d6_cessions_instrument_known"]).toBe("no");
    expect(f["derived.purpose.d6_cession_ready_positive"]).toBe("no");
  });
});

describe("thirdParty: agregados processor y subprocessor", () => {
  function proc(
    c: CompanyState, tid: string, actor: string, label: string,
    contract: "validated" | "remediation_required" | "unknown",
    instructions: "controlled" | "remediation_required" | "unknown" = "controlled",
    operational: "controlled" | "remediation_required" | "unknown" = "controlled",
  ) {
    return mustAdd(c, tid, {
      actorId: actor, label, relationshipType: "processor",
      processorAssessment: { contract, instructions, operational },
    });
  }

  it("29. D6.04/D6.05/D6.07: todo ok, remediación, unknown, cero ≠ positivo", () => {
    const s = setup();
    let f = facts(s.c, tctx(s.c, s.tid));
    expect(f["derived.treatment.d6_processors_exist"]).toBe("no");
    expect(f["derived.treatment.d6_processors_contract_validated"]).toBe("no");
    expect(f["derived.treatment.d6_processors_instructions_controlled"]).toBe("no");
    expect(f["derived.treatment.d6_processors_operational_controlled"]).toBe("no");
    let r = proc(s.c, s.tid, s.actor, "P1", "validated");
    r = proc(r.company, s.tid, s.actor, "P2", "validated");
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_processors_contract_validated"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_contract_known"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_instructions_controlled"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_operational_controlled"]).toBe("yes");
    r = proc(r.company, s.tid, s.actor, "P3", "remediation_required", "remediation_required", "unknown");
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_processors_contract_remediation"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_contract_validated"]).toBe("no");
    expect(f["derived.treatment.d6_processors_instructions_remediation"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_operational_unknown"]).toBe("yes");
    expect(f["derived.treatment.d6_processors_operational_known"]).toBe("no");
  });

  it("30. D6.06: cero, ≥1, controlled, remediation, unknown, parent, sin vacuidad", () => {
    const s = setup();
    let f = facts(s.c, tctx(s.c, s.tid));
    expect(f["derived.treatment.d6_subprocessors_exist"]).toBe("no");
    expect(f["derived.treatment.d6_subprocessors_authorization_controlled"]).toBe("no");
    const p = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    let r = mustAdd(p.company, s.tid, {
      actorId: s.actor, label: "S1", relationshipType: "subprocessor",
      parentRelationshipId: p.id,
      subprocessorAssessment: { authorization: "controlled" },
    });
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_subprocessors_exist"]).toBe("yes");
    expect(f["derived.treatment.d6_subprocessors_parents_complete"]).toBe("yes");
    expect(f["derived.treatment.d6_subprocessors_authorization_controlled"]).toBe("yes");
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S2", relationshipType: "subprocessor",
      subprocessorAssessment: { authorization: "unknown" },
    });
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_subprocessors_parents_complete"]).toBe("no");
    expect(f["derived.treatment.d6_subprocessors_authorization_unknown"]).toBe("yes");
    expect(f["derived.treatment.d6_subprocessors_authorization_controlled"]).toBe("no");
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S3", relationshipType: "subprocessor",
      parentRelationshipId: p.id,
      subprocessorAssessment: { authorization: "remediation_required" },
    });
    f = facts(r.company, tctx(r.company, s.tid));
    expect(f["derived.treatment.d6_subprocessors_authorization_remediation"]).toBe("yes");
  });
});

describe("thirdParty: tokens de razonamiento", () => {
  it("31. formato, extracción exacta, unknowns", () => {
    expect(RELATIONSHIP_REF_PREFIX).toBe("third_party_relationship:");
    expect(formatRelationshipRef("rel-abc")).toBe("third_party_relationship:rel-abc");
    const entries = [
      "third_party_relationship:rel-1",
      "third_party_relationship:rel-2",
      "third_party_relationship:rel-1",
      "nota libre",
    ];
    expect(extractRelationshipRefs(entries)).toEqual(["rel-1", "rel-2"]);
    expect(isRelationshipConsidered(entries, "rel-2")).toBe(true);
    expect(isRelationshipConsidered(entries, "rel-9")).toBe(false);
    expect(findUnknownRelationshipRefs(entries, new Set(["rel-1"]))).toEqual(["rel-2"]);
    expect(findUnknownRelationshipRefs(entries, ["rel-1", "rel-2"])).toEqual([]);
  });

  it("32. rationale/evidencia con token embebido se ignoran; IDs repetidos entre treatments no colisionan", () => {
    expect(extractRelationshipRefs(["ver third_party_relationship:rel-1 en texto"])).toEqual([]);
    expect(extractRelationshipRefs(["doc third_party_relationship:rel-1"])).toEqual([]);
    const s = setup();
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    // Mismo actor en T1 con dos relationships: tokens distintos.
    let r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R1" });
    r = mustAdd(r.company, s.tid, { actorId: s.actor, label: "R2" });
    const ids = listThirdPartyRelationships(r.company, s.tid).map((x) => x.id);
    expect(
      extractRelationshipRefs(ids.map(formatRelationshipRef)),
    ).toEqual(ids);
    // El conjunto conocido es por treatment: T2 no conoce los IDs de T1.
    expect(
      findUnknownRelationshipRefs(ids.map(formatRelationshipRef), new Set<string>()),
    ).toEqual(ids);
    void t2;
  });
});

describe("thirdParty: persistencia", () => {
  it("33. round-trip preserva colección, assessments, refs, parent e internacional", () => {
    const s = setup();
    let r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "P", relationshipType: "processor",
      purposeIds: [s.p1], dataItemIds: [s.data], internationalDimension: "yes",
      evidenceRef: "contrato-1",
      processorAssessment: { contract: "validated", instructions: "controlled", operational: "unknown" },
    });
    const pid = r.id;
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: pid, internationalDimension: "no",
      subprocessorAssessment: { authorization: "controlled" },
    });
    const json = JSON.parse(JSON.stringify(r.company)) as unknown;
    const v = validateCompanyState(json);
    expect(v.ok).toBe(true);
    if (!v.ok) throw new Error("import falló");
    const back = listThirdPartyRelationships(v.value, s.tid);
    expect(back).toHaveLength(2);
    const p = back.find((x) => x.id === pid)!;
    expect(p.purposeIds).toEqual([s.p1]);
    expect(p.dataItemIds).toEqual([s.data]);
    expect(p.internationalDimension).toBe("yes");
    expect(p.evidenceRef).toBe("contrato-1");
    expect(p.processorAssessment?.operational).toBe("unknown");
    const sub = back.find((x) => x.relationshipType === "subprocessor")!;
    expect(sub.parentRelationshipId).toBe(pid);
  });

  it("34. legacy sin colección válido; derivados fuera del JSON", () => {
    const s = setup();
    const json = JSON.parse(JSON.stringify(s.c)) as unknown;
    expect(validateCompanyState(json).ok).toBe(true);
    expect(JSON.stringify(s.c)).not.toContain("thirdPartyRelationships");
    expect(JSON.stringify(s.c)).not.toContain("derived.treatment.d6_");
    expect(JSON.stringify(json)).not.toContain("derived.");
  });

  it("35. import rechaza enums, refs, duplicados y ciclos", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R" });
    const base = JSON.parse(JSON.stringify(r.company)) as {
      treatments: Record<string, Record<string, unknown>>;
    };
    const t = base.treatments[s.tid];
    const mutate = (
      fn: (rels: Record<string, unknown>[]) => void,
    ): boolean => {
      const rels = JSON.parse(
        JSON.stringify(t.thirdPartyRelationships),
      ) as Record<string, unknown>[];
      fn(rels);
      const trial = JSON.parse(JSON.stringify(r.company)) as {
        treatments: Record<string, Record<string, unknown>>;
      };
      trial.treatments[s.tid] = { ...t, thirdPartyRelationships: rels };
      return validateCompanyState(trial).ok;
    };
    // Enum inválido.
    expect(mutate((rels) => { rels[0].relationshipType = "partner"; })).toBe(false);
    // Actor colgado.
    expect(mutate((rels) => { rels[0].actorId = "actor-x"; })).toBe(false);
    // Purpose colgada.
    expect(mutate((rels) => { rels[0].purposeIds = ["fin-x"]; })).toBe(false);
    // Data colgado.
    expect(mutate((rels) => { rels[0].dataItemIds = ["data-x"]; })).toBe(false);
    // Assessment incompatible.
    expect(mutate((rels) => {
      rels[0].relationshipType = "communication";
      rels[0].processorAssessment = { contract: "validated", instructions: "controlled", operational: "controlled" };
    })).toBe(false);
    // IDs duplicados.
    expect(mutate((rels) => { rels.push({ ...rels[0] }); })).toBe(false);
    // No-array rechaza.
    const trialArr = JSON.parse(JSON.stringify(r.company)) as {
      treatments: Record<string, Record<string, unknown>>;
    };
    trialArr.treatments[s.tid] = { ...t, thirdPartyRelationships: { x: 1 } };
    expect(validateCompanyState(trialArr).ok).toBe(false);
  });

  it("36. import rechaza parent colgado, self-parent y ciclos", () => {
    const s = setup();
    let r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "P", relationshipType: "processor" });
    r = mustAdd(r.company, s.tid, {
      actorId: s.actor, label: "S", relationshipType: "subprocessor",
      parentRelationshipId: r.id,
    });
    const rels = listThirdPartyRelationships(r.company, s.tid);
    const sub = rels.find((x) => x.relationshipType === "subprocessor")!;
    const trial = (parent: string | undefined, extra?: Partial<ThirdPartyRelationshipRecord>): boolean => {
      const json = JSON.parse(JSON.stringify(r.company)) as {
        treatments: Record<string, Record<string, unknown>>;
      };
      const arr = (json.treatments[s.tid].thirdPartyRelationships ?? []) as Record<string, unknown>[];
      const idx = arr.findIndex((x) => x.id === sub.id);
      arr[idx] = { ...arr[idx], ...extra, parentRelationshipId: parent };
      if (parent === undefined) delete (arr[idx] as Record<string, unknown>).parentRelationshipId;
      return validateCompanyState(json).ok;
    };
    // Parent colgado.
    expect(trial("rel-x")).toBe(false);
    // Self-parent (subprocessor con parent propio).
    expect(trial(sub.id)).toBe(false);
    // Ciclo: processor no admite parent (invariante), así que el ciclo
    // se prueba haciendo al padre subprocessor con parent al hijo.
    const back = updateThirdPartyRelationship(r.company, s.tid, r.id, {
      relationshipType: "subprocessor", parentRelationshipId: sub.id,
    });
    expect(back).toBeNull();
  });

  it("37. migrate preserva colección válida y omite ausente", () => {
    const s = setup();
    const r = mustAdd(s.c, s.tid, { actorId: s.actor, label: "R" });
    const ws = (c: CompanyState): unknown => ({
      version: 1, profiles: [], activeProfileId: undefined, companies: { [c.id]: c },
    });
    const m = migrateWorkspaceData(JSON.parse(JSON.stringify(ws(r.company))));
    const companies = Object.values(m.companies);
    expect(companies).toHaveLength(1);
    expect(listThirdPartyRelationships(companies[0], s.tid)).toHaveLength(1);
    const legacy = migrateWorkspaceData(JSON.parse(JSON.stringify(ws(s.c))));
    const lc = Object.values(legacy.companies)[0];
    expect(lc.treatments?.[s.tid]?.thirdPartyRelationships).toBeUndefined();
  });
});

describe("thirdParty: sin escrituras canónicas", () => {
  it("38. crear/editar/eliminar no tocan protocolAnswers, reasoning ni estados", () => {
    const s = setup();
    const snap = (c: CompanyState): string =>
      JSON.stringify({
        a: c.protocolAnswers, r: c.reasoningRecords, s: c.activityStates,
        ta: c.treatments?.[s.tid]?.protocolAnswers,
        tr: c.treatments?.[s.tid]?.reasoningRecords,
      });
    const before = snap(s.c);
    let r = mustAdd(s.c, s.tid, {
      actorId: s.actor, label: "R", relationshipType: "processor",
      processorAssessment: { contract: "validated", instructions: "controlled", operational: "controlled" },
    });
    expect(snap(r.company)).toBe(before);
    const upd = updateThirdPartyRelationship(r.company, s.tid, r.id, {
      processorAssessment: { contract: "remediation_required" },
    });
    expect(upd && snap(upd)).toBe(before);
    const del = deleteThirdPartyRelationship(upd!, s.tid, r.id);
    expect(del && snap(del)).toBe(before);
    // Derivados tampoco persisten.
    expect(JSON.stringify(del)).not.toContain("derived.");
  });
});
