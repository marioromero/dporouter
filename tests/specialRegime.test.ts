import { describe, expect, it } from "vitest";
import { LAWFUL_BASIS_ASSIGN_PROTOCOL } from "../content/protocols/lawful_basis.assign";
import { newCompany } from "../src/workspace/types";
import type { ExecutionContext } from "../src/workspace/types";
import {
  createPurpose,
  createTreatment,
  saveScopedProtocolAnswer,
  setSpecialRegimeProfile,
} from "../src/workspace/scope";
import {
  addDataItem,
  addDataPurposeLink,
  deleteDataItem,
  removeDataPurposeLink,
  updateDataItem,
} from "../src/workspace/locals";
import { deriveSessionFacts } from "../src/workspace/derived";
import {
  D5_CANDIDATE_KEYS,
  dataItemRef,
  deriveD5CandidatesForPurpose,
  extractDataItemRefs,
  findUnknownDataItemRefs,
  hasDataItemRef,
  linkedItems,
  readLawfulnessRoute,
  resolveItemSignal,
  resolveProfile,
  validateSpecialRegimeCoherence,
} from "../src/workspace/specialRegime";
import {
  migrateWorkspaceData,
  validateCompanyState,
} from "../src/workspace/store";

/**
 * Punto 0 D5 (ADR-053): captura híbrida mínima — señales tri-estado
 * en DataItem, perfil contextual en purpose, candidaturas derivadas
 * read-only, warnings no mutantes y refs `data_item:<id>`.
 * Estructura ≠ conclusión; candidate ≠ result; unknown ≠ false.
 */

const LAWFUL_KEY = LAWFUL_BASIS_ASSIGN_PROTOCOL.protocol_key;

function setup() {
  let c = newCompany("X SpA");
  const t = createTreatment(c, { name: "T" });
  if (!t) throw new Error("sin T");
  c = t.company;
  const p1 = createPurpose(c, t.treatmentId, "Finalidad 1");
  if (!p1) throw new Error("sin P1");
  c = p1.company;
  const p2 = createPurpose(c, t.treatmentId, "Finalidad 2");
  if (!p2) throw new Error("sin P2");
  c = p2.company;
  return { c, t: t.treatmentId, p1: p1.purposeId, p2: p2.purposeId };
}

function ctxOf(c: ReturnType<typeof setup>, purposeId: string): ExecutionContext {
  const company = c.c;
  return { scope: "purpose", companyId: company.id, treatmentId: c.t, purposeId };
}

function addItem(c: ReturnType<typeof setup>, label: string, patch: Record<string, string> = {}) {
  const r = addDataItem(c.c, c.t, { label, ...patch });
  if (!r) throw new Error(`sin item ${label}`);
  c.c = r.company;
  return r.id;
}

function link(c: ReturnType<typeof setup>, dataId: string, purposeId: string) {
  const next = addDataPurposeLink(c.c, c.t, { dataId, purposeId });
  if (!next) throw new Error("sin link");
  c.c = next;
}

describe("Punto 0: señales DataItem", () => {
  it("nuevo item: unknown ×4; cada señal yes/no/unknown; overlap", () => {
    const s = setup();
    const id = addItem(s, "Ficha");
    const item = s.c.treatments?.[s.t]?.dataItems?.[id];
    expect(item?.sensitive).toBe("unknown");
    expect(item?.health).toBe("unknown");
    expect(item?.biologicalProfile).toBe("unknown");
    expect(item?.geolocation).toBe("unknown");
    for (const v of ["yes", "no", "unknown"] as const) {
      const u = updateDataItem(s.c, s.t, id, {
        sensitive: v,
        health: v,
        biologicalProfile: v,
        geolocation: v,
      });
      if (!u) throw new Error("sin update");
      s.c = u;
      const cur = s.c.treatments?.[s.t]?.dataItems?.[id];
      expect(cur?.sensitive).toBe(v);
      expect(cur?.health).toBe(v);
      expect(cur?.biologicalProfile).toBe(v);
      expect(cur?.geolocation).toBe(v);
    }
    // Overlap permitido: todo yes simultáneo.
    const all = updateDataItem(s.c, s.t, id, {
      sensitive: "yes",
      health: "yes",
      biologicalProfile: "yes",
      geolocation: "yes",
    });
    if (!all) throw new Error("sin overlap");
    const cur = all.treatments?.[s.t]?.dataItems?.[id];
    expect([cur?.sensitive, cur?.health, cur?.biologicalProfile, cur?.geolocation]).toEqual([
      "yes", "yes", "yes", "yes",
    ]);
  });

  it("sin inferencia: health/biological + sensitive=no se preservan", () => {
    const s = setup();
    const id = addItem(s, "Ficha", { health: "yes", sensitive: "no" });
    const item = s.c.treatments?.[s.t]?.dataItems?.[id];
    expect(item?.health).toBe("yes");
    expect(item?.sensitive).toBe("no");
    const u = updateDataItem(s.c, s.t, id, { biologicalProfile: "yes" });
    if (!u) throw new Error("sin update");
    const cur = u.treatments?.[s.t]?.dataItems?.[id];
    expect(cur?.biologicalProfile).toBe("yes");
    expect(cur?.sensitive).toBe("no");
    expect(cur?.health).toBe("yes");
  });

  it("category libre intacta; update preserva ajenos; inválido rechazado", () => {
    const s = setup();
    const id = addItem(s, "Email", { category: "contacto" });
    const u = updateDataItem(s.c, s.t, id, { health: "yes" });
    if (!u) throw new Error("sin update");
    const cur = u.treatments?.[s.t]?.dataItems?.[id];
    expect(cur?.category).toBe("contacto");
    expect(cur?.label).toBe("Email");
    expect(cur?.health).toBe("yes");
    expect(updateDataItem(u, s.t, id, { sensitive: "quizas" as never })).toBeNull();
    expect(addDataItem(u, s.t, { label: "X", health: "quizas" as never })).toBeNull();
  });

  it("aislamiento por treatment", () => {
    const s = setup();
    const t2 = createTreatment(s.c, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    s.c = t2.company;
    const id = addItem(s, "Ficha");
    const u = updateDataItem(s.c, s.t, id, { health: "yes" });
    if (!u) throw new Error("sin update");
    // El item vive solo en T: T2 no lo contiene (sin fuga entre treatments).
    expect(u.treatments?.[t2.treatmentId]?.dataItems?.[id]).toBeUndefined();
    expect(u.treatments?.[s.t]?.dataItems?.[id]?.health).toBe("yes");
  });
});

describe("Punto 0: purpose profile", () => {
  it("ausente = unknown; default unknown ×3; yes/no/unknown", () => {
    const s = setup();
    const t = s.c.treatments?.[s.t];
    if (!t) throw new Error("sin T");
    expect(t.purposes[s.p1]?.specialRegimeProfile).toBeUndefined();
    expect(resolveProfile(undefined)).toEqual({
      biometricIdentificationUse: "unknown",
      involvesMinors: "unknown",
      researchPublicInterestCandidate: "unknown",
    });
    const created = setSpecialRegimeProfile(s.c, s.t, s.p1, {});
    if (!created) throw new Error("sin profile");
    expect(created.treatments?.[s.t]?.purposes[s.p1]?.specialRegimeProfile).toEqual({
      biometricIdentificationUse: "unknown",
      involvesMinors: "unknown",
      researchPublicInterestCandidate: "unknown",
    });
    for (const v of ["yes", "no", "unknown"] as const) {
      const u = setSpecialRegimeProfile(created, s.t, s.p1, {
        biometricIdentificationUse: v,
        involvesMinors: v,
        researchPublicInterestCandidate: v,
      });
      if (!u) throw new Error("sin patch");
      expect(u.treatments?.[s.t]?.purposes[s.p1]?.specialRegimeProfile).toEqual({
        biometricIdentificationUse: v,
        involvesMinors: v,
        researchPublicInterestCandidate: v,
      });
    }
  });

  it("purposes independientes; cross-treatment nulo; inválido nulo; sin IDs", () => {
    const s = setup();
    const a = setSpecialRegimeProfile(s.c, s.t, s.p1, { involvesMinors: "yes" });
    if (!a) throw new Error("sin A");
    expect(a.treatments?.[s.t]?.purposes[s.p2]?.specialRegimeProfile).toBeUndefined();
    const t2 = createTreatment(a, { name: "T2" });
    if (!t2) throw new Error("sin T2");
    // Purpose de otro treatment: null.
    expect(setSpecialRegimeProfile(t2.company, t2.treatmentId, s.p1, { involvesMinors: "yes" })).toBeNull();
    expect(setSpecialRegimeProfile(t2.company, "inexistente", s.p1, {})).toBeNull();
    expect(
      setSpecialRegimeProfile(t2.company, s.t, s.p1, { involvesMinors: "quizas" as never }),
    ).toBeNull();
    const prof = t2.company.treatments?.[s.t]?.purposes[s.p1]?.specialRegimeProfile;
    expect(prof && Object.keys(prof)).toEqual([
      "biometricIdentificationUse",
      "involvesMinors",
      "researchPublicInterestCandidate",
    ]);
  });
});

describe("Punto 0: candidaturas derivadas D5.01–D5.06", () => {
  it("D5.01: yes/no/unknown; cero links; un unknown; mixto; unlink/delete recomputan", () => {
    const s = setup();
    const facts0 = deriveSessionFacts(s.c, ctxOf(s, s.p1));
    expect(facts0[D5_CANDIDATE_KEYS.sensitive]).toBeUndefined();
    const a = addItem(s, "A", { sensitive: "no" });
    link(s, a, s.p1);
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.sensitive]).toBe("no");
    const b = addItem(s, "B", { sensitive: "unknown" });
    link(s, b, s.p1);
    // Un unknown sin yes → unknown (ausencia).
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.sensitive]).toBeUndefined();
    const u = updateDataItem(s.c, s.t, b, { sensitive: "yes" });
    if (!u) throw new Error("sin update");
    s.c = u;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.sensitive]).toBe("yes");
    // Unlink del yes → vuelve a no (A=no, B desvinculado).
    const un = removeDataPurposeLink(s.c, s.t, { dataId: b, purposeId: s.p1 });
    if (!un) throw new Error("sin unlink");
    s.c = un;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.sensitive]).toBe("no");
    // Delete del restante → cero links → unknown.
    const del = deleteDataItem(s.c, s.t, a);
    if (!del) throw new Error("sin delete");
    s.c = del;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.sensitive]).toBeUndefined();
  });

  it("D5.01 no infiere: sensitive=no explícito → candidate no + warning en paralelo", () => {
    const s = setup();
    const id = addItem(s, "Ficha clínica", { health: "yes", sensitive: "no" });
    link(s, id, s.p1);
    const facts = deriveSessionFacts(s.c, ctxOf(s, s.p1));
    // Lectura mecánica del campo declarado (todos no → no); health no
    // altera la candidatura: no inferimos sensitive desde health.
    expect(facts[D5_CANDIDATE_KEYS.sensitive]).toBe("no");
    expect(facts[D5_CANDIDATE_KEYS.healthBiological]).toBe("yes");
    const issues = validateSpecialRegimeCoherence(s.c, s.t, s.p1);
    expect(issues.map((i) => i.code)).toContain("health_sensitive_mismatch");
    expect(issues[0]?.dataItemId).toBe(id);
  });

  it("D5.02: OR health/biological; no solo con ambos no", () => {
    const s = setup();
    const a = addItem(s, "A", { health: "no", biologicalProfile: "no" });
    link(s, a, s.p1);
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.healthBiological]).toBe("no");
    const u = updateDataItem(s.c, s.t, a, { biologicalProfile: "yes" });
    if (!u) throw new Error("sin update");
    s.c = u;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.healthBiological]).toBe("yes");
    // health=yes con sensitive=no: candidate yes igual (D5.02 independiente).
    const u2 = updateDataItem(s.c, s.t, a, { health: "yes", sensitive: "no" });
    if (!u2) throw new Error("sin update2");
    s.c = u2;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.healthBiological]).toBe("yes");
    // Sin inferir desde sensitive=yes solo.
    const b = addItem(s, "B", { sensitive: "yes" });
    link(s, b, s.p2);
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p2))[D5_CANDIDATE_KEYS.healthBiological]).toBeUndefined();
  });

  it("D5.03/D5.04/D5.05 siguen profile; items no mandan", () => {
    const s = setup();
    const id = addItem(s, "Huella descrita", { sensitive: "yes", health: "yes" });
    link(s, id, s.p1);
    const f0 = deriveSessionFacts(s.c, ctxOf(s, s.p1));
    expect(f0[D5_CANDIDATE_KEYS.biometric]).toBeUndefined();
    expect(f0[D5_CANDIDATE_KEYS.minors]).toBeUndefined();
    expect(f0[D5_CANDIDATE_KEYS.research]).toBeUndefined();
    const p = setSpecialRegimeProfile(s.c, s.t, s.p1, {
      biometricIdentificationUse: "yes",
      involvesMinors: "no",
      researchPublicInterestCandidate: "yes",
    });
    if (!p) throw new Error("sin profile");
    s.c = p;
    const f1 = deriveSessionFacts(s.c, ctxOf(s, s.p1));
    expect(f1[D5_CANDIDATE_KEYS.biometric]).toBe("yes");
    expect(f1[D5_CANDIDATE_KEYS.minors]).toBe("no");
    expect(f1[D5_CANDIDATE_KEYS.research]).toBe("yes");
    // P2 independiente.
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p2))[D5_CANDIDATE_KEYS.biometric]).toBeUndefined();
  });

  it("D5.06: geolocation yes/no/unknown; items no linkeados no contribuyen", () => {
    const s = setup();
    const ghost = addItem(s, "GPS suelto", { geolocation: "yes" });
    void ghost;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.geolocation]).toBeUndefined();
    const a = addItem(s, "A", { geolocation: "no" });
    link(s, a, s.p1);
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.geolocation]).toBe("no");
    const u = updateDataItem(s.c, s.t, a, { geolocation: "yes" });
    if (!u) throw new Error("sin update");
    s.c = u;
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.geolocation]).toBe("yes");
  });
});

describe("Punto 0: puente D5.07", () => {
  function answer(s: ReturnType<typeof setup>, consent: string, source: string) {
    const ctx = ctxOf(s, s.p1);
    const a = saveScopedProtocolAnswer(s.c, ctx, LAWFUL_KEY, "lawful.consent_applies", consent, LAWFUL_KEY);
    if (!a) throw new Error("sin consent");
    s.c = a;
    const b = saveScopedProtocolAnswer(s.c, ctx, LAWFUL_KEY, "lawful.art13_source", source, LAWFUL_KEY);
    if (!b) throw new Error("sin source");
    s.c = b;
  }

  it("sin truth → unknown; ruta 13(a) afirmada → yes", () => {
    const s = setup();
    expect(readLawfulnessRoute(s.c, s.t, s.p1)).toEqual({});
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.titleIII]).toBeUndefined();
    answer(s, "consent_no", "financial_titleIII");
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.titleIII]).toBe("yes");
  });

  it("ruta distinta afirmada o consentimiento → no; resto → unknown", () => {
    const s = setup();
    answer(s, "consent_no", "legal_obligation");
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p1))[D5_CANDIDATE_KEYS.titleIII]).toBe("no");
    const s2 = setup();
    answer(s2, "consent_yes", "financial_titleIII");
    expect(deriveSessionFacts(s2.c, ctxOf(s2, s2.p1))[D5_CANDIDATE_KEYS.titleIII]).toBe("no");
    const s3 = setup();
    answer(s3, "consent_no", "none_identified");
    expect(deriveSessionFacts(s3.c, ctxOf(s3, s3.p1))[D5_CANDIDATE_KEYS.titleIII]).toBeUndefined();
    const s4 = setup();
    answer(s4, "unknown", "financial_titleIII");
    expect(deriveSessionFacts(s4.c, ctxOf(s4, s4.p1))[D5_CANDIDATE_KEYS.titleIII]).toBeUndefined();
  });

  it("D2.05 intacto: el bridge solo lee (una sola purpose afectada)", () => {
    const s = setup();
    answer(s, "consent_no", "financial_titleIII");
    expect(deriveSessionFacts(s.c, ctxOf(s, s.p2))[D5_CANDIDATE_KEYS.titleIII]).toBeUndefined();
    // Sin materializar purpose.lawful_basis en ningún lado.
    expect(JSON.stringify(s.c)).not.toContain("purpose.lawful_basis");
  });
});

describe("Punto 0: warnings de coherencia", () => {
  it("mismatches con refs; sin mutación; recalculan tras edición", () => {
    const s = setup();
    const a = addItem(s, "A", { health: "yes", sensitive: "no" });
    const b = addItem(s, "B", { biologicalProfile: "yes", sensitive: "no" });
    link(s, a, s.p1);
    link(s, b, s.p1);
    const before = JSON.stringify(s.c);
    const issues = validateSpecialRegimeCoherence(s.c, s.t, s.p1);
    expect(JSON.stringify(s.c)).toBe(before);
    expect(issues.map((i) => i.code).sort()).toEqual([
      "biological_sensitive_mismatch",
      "health_sensitive_mismatch",
    ]);
    expect(issues[0]).toMatchObject({ treatmentId: s.t, purposeId: s.p1 });
    expect(issues.every((i) => typeof i.reason === "string" && i.reason.length > 0)).toBe(true);
    // Corregir A → warnings restantes solo B.
    const u = updateDataItem(s.c, s.t, a, { sensitive: "yes" });
    if (!u) throw new Error("sin update");
    s.c = u;
    expect(validateSpecialRegimeCoherence(s.c, s.t, s.p1).map((i) => i.code)).toEqual([
      "biological_sensitive_mismatch",
    ]);
  });

  it("biométrico: warning solo con información suficiente", () => {
    const s = setup();
    const p = setSpecialRegimeProfile(s.c, s.t, s.p1, { biometricIdentificationUse: "yes" });
    if (!p) throw new Error("sin profile");
    s.c = p;
    // Cero links → sin warning de contradicción.
    expect(validateSpecialRegimeCoherence(s.c, s.t, s.p1)).toEqual([]);
    const a = addItem(s, "A", { sensitive: "unknown" });
    link(s, a, s.p1);
    // Unknowns → información insuficiente → sin warning.
    expect(validateSpecialRegimeCoherence(s.c, s.t, s.p1)).toEqual([]);
    const u = updateDataItem(s.c, s.t, a, { sensitive: "no" });
    if (!u) throw new Error("sin update");
    s.c = u;
    const issues = validateSpecialRegimeCoherence(s.c, s.t, s.p1);
    expect(issues.map((i) => i.code)).toEqual(["biometric_context_mismatch"]);
    expect(issues[0]?.purposeId).toBe(s.p1);
    expect(issues[0]?.dataItemId).toBeUndefined();
  });

  it("warning no escribe canonical ni cambia candidate", () => {
    const s = setup();
    const a = addItem(s, "A", { health: "yes", sensitive: "no" });
    link(s, a, s.p1);
    validateSpecialRegimeCoherence(s.c, s.t, s.p1);
    const t = s.c.treatments?.[s.t];
    expect(t?.protocolAnswers).toEqual({});
    expect(t?.reasoningRecords).toEqual({});
    const facts = deriveSessionFacts(s.c, ctxOf(s, s.p1));
    // El warning no cambia la lectura mecánica (sensitive=no → no).
    expect(facts[D5_CANDIDATE_KEYS.sensitive]).toBe("no");
    expect(facts[D5_CANDIDATE_KEYS.healthBiological]).toBe("yes");
    expect(JSON.stringify(s.c)).not.toContain("derived.");
  });
});

describe("Punto 0: refs data_item:<id>", () => {
  it("formato, extracción exacta, has, unknowns y no-colisión", () => {
    const s = setup();
    const a = addItem(s, "Misma etiqueta");
    const b = addItem(s, "Misma etiqueta");
    expect(dataItemRef(a)).toBe(`data_item:${a}`);
    expect(dataItemRef(a)).not.toBe(dataItemRef(b));
    const considered = [dataItemRef(a), "nota libre", `data_item:`, `prefijo ${dataItemRef(b)} sufijo`];
    // Solo tokens exactos con id no vacío.
    expect(extractDataItemRefs(considered)).toEqual([a]);
    expect(hasDataItemRef(considered, a)).toBe(true);
    expect(hasDataItemRef(considered, b)).toBe(false);
    // rationale/evidence se ignoran por diseño: el llamante solo pasa facts_considered.
    const t = s.c.treatments?.[s.t];
    if (!t) throw new Error("sin T");
    expect(findUnknownDataItemRefs([dataItemRef(a), dataItemRef("inexistente")], t)).toEqual([
      "inexistente",
    ]);
    // Tras delete, el ref queda stale-detectable sin mutar records.
    const del = deleteDataItem(s.c, s.t, a);
    if (!del) throw new Error("sin delete");
    const t2 = del.treatments?.[s.t];
    if (!t2) throw new Error("sin T2");
    expect(findUnknownDataItemRefs([dataItemRef(a)], t2)).toEqual([a]);
    // Mismo ID local en otro treatment no colisiona: la pertenencia es por treatment.
    expect(linkedItems(t2, s.p1).map((i) => i.id)).not.toContain(a);
  });
});

describe("Punto 0: persistencia", () => {
  it("round-trip campos + profile; legacy válido como unknown", () => {
    const s = setup();
    const id = addItem(s, "Ficha", { health: "yes", sensitive: "no" });
    link(s, id, s.p1);
    const p = setSpecialRegimeProfile(s.c, s.t, s.p1, { involvesMinors: "yes" });
    if (!p) throw new Error("sin profile");
    s.c = p;
    const rt = validateCompanyState(JSON.parse(JSON.stringify(s.c)));
    expect(rt.ok).toBe(true);
    if (!rt.ok) throw new Error("round-trip inválido");
    expect(rt.value.treatments?.[s.t]?.dataItems?.[id]?.health).toBe("yes");
    expect(rt.value.treatments?.[s.t]?.purposes[s.p1]?.specialRegimeProfile).toEqual({
      biometricIdentificationUse: "unknown",
      involvesMinors: "yes",
      researchPublicInterestCandidate: "unknown",
    });
    // Legacy: sin campos nuevos sigue válido y resuelve unknown.
    const legacy = JSON.parse(JSON.stringify(s.c)) as Record<string, unknown>;
    const lt = (legacy.treatments as Record<string, Record<string, unknown>>)[s.t];
    const li = lt.dataItems as Record<string, Record<string, unknown>>;
    for (const k of ["sensitive", "health", "biologicalProfile", "geolocation"]) delete li[id][k];
    const lp = lt.purposes as Record<string, Record<string, unknown>>;
    delete (lp[s.p1] as Record<string, unknown>).specialRegimeProfile;
    const lv = validateCompanyState(legacy);
    expect(lv.ok).toBe(true);
    if (!lv.ok) throw new Error("legacy inválido");
    const migrated = migrateWorkspaceData({ version: 1, profiles: [], companies: { [s.c.id]: legacy } });
    const mc = migrated.companies[s.c.id];
    expect(resolveItemSignal(mc.treatments?.[s.t]?.dataItems?.[id], "health")).toBe("unknown");
    expect(resolveProfile(mc.treatments?.[s.t]?.purposes[s.p1]?.specialRegimeProfile)).toEqual({
      biometricIdentificationUse: "unknown",
      involvesMinors: "unknown",
      researchPublicInterestCandidate: "unknown",
    });
  });

  it("enum inválido rechazado; sospechoso válido preservado; derivados fuera del JSON", () => {
    const s = setup();
    const id = addItem(s, "Ficha", { health: "yes", sensitive: "no" });
    link(s, id, s.p1);
    const bad = JSON.parse(JSON.stringify(s.c)) as Record<string, unknown>;
    const bi = (bad.treatments as Record<string, Record<string, unknown>>)[s.t]
      .dataItems as Record<string, Record<string, unknown>>;
    bi[id].health = "a veces";
    expect(validateCompanyState(bad).ok).toBe(false);
    const badP = JSON.parse(JSON.stringify(s.c)) as Record<string, unknown>;
    const bp = (badP.treatments as Record<string, Record<string, unknown>>)[s.t]
      .purposes as Record<string, Record<string, unknown>>;
    (bp[s.p1] as Record<string, unknown>).specialRegimeProfile = { involvesMinors: "yes" };
    expect(validateCompanyState(badP).ok).toBe(false);
    // Sospechoso pero enum-válido: se acepta sin corregir.
    const ok = validateCompanyState(JSON.parse(JSON.stringify(s.c)));
    expect(ok.ok).toBe(true);
    if (!ok.ok) throw new Error("sospechoso rechazado");
    expect(ok.value.treatments?.[s.t]?.dataItems?.[id]?.sensitive).toBe("no");
    const json = JSON.stringify(s.c);
    expect(json).not.toContain("derived.");
    expect(json).not.toContain("mismatch");
  });
});

describe("Punto 0: cero efectos canónicos por edición", () => {
  it("editar señales/profile/links no toca answers, reasoning, work status ni facts", () => {
    const s = setup();
    const id = addItem(s, "Ficha");
    link(s, id, s.p1);
    const snap = JSON.stringify({
      companyAnswers: s.c.protocolAnswers,
      companyReasoning: s.c.reasoningRecords,
      work: s.c.activityStates,
      tAnswers: s.c.treatments?.[s.t]?.protocolAnswers,
      tReasoning: s.c.treatments?.[s.t]?.reasoningRecords,
      pAnswers: s.c.treatments?.[s.t]?.purposes[s.p1]?.protocolAnswers,
      pReasoning: s.c.treatments?.[s.t]?.purposes[s.p1]?.reasoningRecords,
    });
    const u = updateDataItem(s.c, s.t, id, { sensitive: "yes", health: "yes" });
    if (!u) throw new Error("sin update");
    s.c = u;
    const p = setSpecialRegimeProfile(s.c, s.t, s.p1, { involvesMinors: "yes" });
    if (!p) throw new Error("sin profile");
    s.c = p;
    const un = removeDataPurposeLink(s.c, s.t, { dataId: id, purposeId: s.p1 });
    if (!un) throw new Error("sin unlink");
    s.c = un;
    expect(JSON.stringify({
      companyAnswers: s.c.protocolAnswers,
      companyReasoning: s.c.reasoningRecords,
      work: s.c.activityStates,
      tAnswers: s.c.treatments?.[s.t]?.protocolAnswers,
      tReasoning: s.c.treatments?.[s.t]?.reasoningRecords,
      pAnswers: s.c.treatments?.[s.t]?.purposes[s.p1]?.protocolAnswers,
      pReasoning: s.c.treatments?.[s.t]?.reasoningRecords,
    })).toBe(snap);
    // Candidatura sí cambió (read-only, en vista): era yes, ahora unknown.
    expect(deriveD5CandidatesForPurpose(s.c, s.t, s.p1)?.[D5_CANDIDATE_KEYS.sensitive]).toBeUndefined();
  });
});
