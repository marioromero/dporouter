import { describe, expect, it } from "vitest";
import { newCompany } from "../src/workspace/types";
import {
  migrateWorkspaceData,
  validateCompanyState,
} from "../src/workspace/store";
import { createPurpose, createTreatment, deletePurpose } from "../src/workspace/scope";
import {
  addActor,
  addDataItem,
  addDataPurposeLink,
  addRetentionRule,
  addSource,
  deleteDataItem,
  deleteSource,
  removeDataPurposeLink,
  updateActor,
  updateDataItem,
  updateRetentionRule,
} from "../src/workspace/locals";

/**
 * Value objects locales D2: CRUD, integridad referencial y aislamiento.
 * Funciones puras sobre CompanyState; sin UI ni protocolos.
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

describe("estructuras locales D2", () => {
  it("isolation: mismos IDs locales en A y B sin colisión", () => {
    let { c, idA, idB } = companyAB();
    const sa = addSource(c, idA, { kind: "data_subject", description: "Titular" });
    if (!sa) throw new Error("sin source A");
    c = sa.company;
    const sb = addSource(c, idB, { kind: "data_subject", description: "Titular" });
    if (!sb) throw new Error("sin source B");
    c = sb.company;
    // IDs aleatorios difieren; forzar mismo ID manual es imposible vía API:
    // cada colección vive en su treatment.
    expect(c.treatments?.[idA]?.sources?.[sa.id]).toBeDefined();
    expect(c.treatments?.[idB]?.sources?.[sb.id]).toBeDefined();
    expect(sa.id === sb.id).toBe(false);
    // Misma descripción, objetos distintos.
    expect(
      c.treatments?.[idA]?.sources?.[sb.id],
    ).toBeUndefined();
  });

  it("actors: roles distintos por actor, rol ausente permitido", () => {
    let { c, idA } = companyAB();
    const r1 = addActor(c, idA, { kind: "organization", name: "Empresa", role: "responsible" });
    if (!r1) throw new Error("sin actor 1");
    c = r1.company;
    const r2 = addActor(c, idA, { kind: "organization", name: "Proveedor P", role: "processor" });
    if (!r2) throw new Error("sin actor 2");
    c = r2.company;
    const r3 = addActor(c, idA, { kind: "person", name: "Tercero Q" });
    if (!r3) throw new Error("sin actor 3");
    c = r3.company;
    const actors = c.treatments?.[idA]?.actors ?? {};
    expect(actors[r1.id]?.role).toBe("responsible");
    expect(actors[r2.id]?.role).toBe("processor");
    expect(actors[r3.id]?.role).toBeUndefined();
    // Vocabulario cerrado: rol inventado rechazado.
    expect(
      addActor(c, idA, {
        kind: "person",
        name: "X",
        role: "auditor" as unknown as "responsible",
      }),
    ).toBeNull();
    // Update cambia rol; delete lo remueve con la entrada.
    const upd = updateActor(c, idA, r3.id, { role: "processor" });
    if (!upd) throw new Error("sin update");
    expect(upd.treatments?.[idA]?.actors?.[r3.id]?.role).toBe("processor");
  });

  it("data/source: delete source limpia refs sin eliminar data", () => {
    let { c, idA } = companyAB();
    const s = addSource(c, idA, { kind: "public_source", description: "Web" });
    if (!s) throw new Error("sin source");
    c = s.company;
    const d = addDataItem(c, idA, {
      label: "Email",
      category: "contacto",
      sourceRefs: [s.id],
    });
    if (!d) throw new Error("sin data");
    c = d.company;
    // sourceRef inexistente rechazada al crear y al actualizar.
    expect(
      addDataItem(c, idA, { label: "X", sourceRefs: ["inexistente"] }),
    ).toBeNull();
    const del = deleteSource(c, idA, s.id);
    if (!del) throw new Error("sin delete");
    expect(del.treatments?.[idA]?.sources?.[s.id]).toBeUndefined();
    expect(del.treatments?.[idA]?.dataItems?.[d.id]?.sourceRefs).toEqual([]);
    expect(del.treatments?.[idA]?.dataItems?.[d.id]?.label).toBe("Email");
  });

  it("links: A1/A2 independientes, duplicados y cross-treatment rechazados", () => {
    let { c, idA, idB } = companyAB();
    const d = addDataItem(c, idA, { label: "RUT" });
    if (!d) throw new Error("sin data");
    c = d.company;
    const p1 = createPurpose(c, idA, "Facturación");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    const p2 = createPurpose(c, idA, "Marketing");
    if (!p2) throw new Error("sin A2");
    c = p2.company;
    const l1 = addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId });
    if (!l1) throw new Error("sin link 1");
    c = l1;
    const l2 = addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p2.purposeId });
    if (!l2) throw new Error("sin link 2");
    c = l2;
    expect(c.treatments?.[idA]?.dataPurposeLinks).toHaveLength(2);
    // Duplicado exacto rechazado.
    expect(
      addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId }),
    ).toBeNull();
    // Cross-treatment imposible: purpose de B con data de A.
    const pb = createPurpose(c, idB, "Otro");
    if (!pb) throw new Error("sin PB");
    c = pb.company;
    expect(
      addDataPurposeLink(c, idA, { dataId: d.id, purposeId: pb.purposeId }),
    ).toBeNull();
    // Remove quita uno.
    const rm = removeDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId });
    if (!rm) throw new Error("sin remove");
    expect(rm.treatments?.[idA]?.dataPurposeLinks).toHaveLength(1);
  });

  it("retention: multi-id válida, refs inexistentes rechazadas", () => {
    let { c, idA } = companyAB();
    const d1 = addDataItem(c, idA, { label: "Nombre" });
    if (!d1) throw new Error("sin d1");
    c = d1.company;
    const d2 = addDataItem(c, idA, { label: "Dirección" });
    if (!d2) throw new Error("sin d2");
    c = d2.company;
    const r = addRetentionRule(c, idA, {
      dataItemIds: [d1.id, d2.id],
      criterion: "2 años tras término del servicio",
      owner: "TI",
    });
    if (!r) throw new Error("sin regla");
    c = r.company;
    expect(c.treatments?.[idA]?.retentionRules?.[r.id]?.dataItemIds).toEqual(
      [d1.id, d2.id],
    );
    expect(
      addRetentionRule(c, idA, {
        dataItemIds: ["inexistente"],
        criterion: "x",
        owner: "y",
      }),
    ).toBeNull();
    expect(
      addRetentionRule(c, idA, { dataItemIds: [], criterion: "x", owner: "y" }),
    ).toBeNull();
    const upd = updateRetentionRule(c, idA, r.id, { dataItemIds: [d1.id] });
    if (!upd) throw new Error("sin update");
    expect(upd.treatments?.[idA]?.retentionRules?.[r.id]?.dataItemIds).toEqual([d1.id]);
    expect(updateRetentionRule(upd, idA, r.id, { dataItemIds: ["x"] })).toBeNull();
  });

  it("cascade: delete data purga links y reglas; delete purpose purga links", () => {
    let { c, idA } = companyAB();
    const d = addDataItem(c, idA, { label: "Teléfono" });
    if (!d) throw new Error("sin data");
    c = d.company;
    const p1 = createPurpose(c, idA, "Soporte");
    if (!p1) throw new Error("sin purpose");
    c = p1.company;
    const r = addRetentionRule(c, idA, {
      dataItemIds: [d.id],
      criterion: "1 año",
      owner: "Ops",
    });
    if (!r) throw new Error("sin regla");
    c = r.company;
    const l = addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId });
    if (!l) throw new Error("sin link");
    c = l;
    const del = deleteDataItem(c, idA, d.id);
    if (!del) throw new Error("sin delete data");
    expect(del.treatments?.[idA]?.dataItems?.[d.id]).toBeUndefined();
    expect(del.treatments?.[idA]?.dataPurposeLinks).toEqual([]);
    // Regla conservada con lista vaciada (decisión del profesional).
    expect(del.treatments?.[idA]?.retentionRules?.[r.id]?.dataItemIds).toEqual([]);
    const delP = deletePurpose(c, idA, p1.purposeId);
    if (!delP) throw new Error("sin delete purpose");
    expect(delP.treatments?.[idA]?.dataPurposeLinks).toEqual([]);
  });

  it("export/import conserva estructuras; corrupto rechaza", () => {
    let { c, idA } = companyAB();
    const s = addSource(c, idA, { kind: "data_subject", description: "Titular" });
    if (!s) throw new Error("sin source");
    c = s.company;
    const d = addDataItem(c, idA, { label: "Nombre", sourceRefs: [s.id] });
    if (!d) throw new Error("sin data");
    c = d.company;
    const p1 = createPurpose(c, idA, "Gestión");
    if (!p1) throw new Error("sin purpose");
    c = p1.company;
    const l = addDataPurposeLink(c, idA, { dataId: d.id, purposeId: p1.purposeId });
    if (!l) throw new Error("sin link");
    c = l;
    const r = addRetentionRule(c, idA, {
      dataItemIds: [d.id],
      criterion: "vigencia + 1 año",
      owner: "Legal",
    });
    if (!r) throw new Error("sin regla");
    c = r.company;
    const checked = validateCompanyState(JSON.parse(JSON.stringify(c)));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const t = checked.value.treatments?.[idA];
    expect(t?.sources?.[s.id]?.kind).toBe("data_subject");
    expect(t?.dataItems?.[d.id]?.sourceRefs).toEqual([s.id]);
    expect(t?.retentionRules?.[r.id]?.owner).toBe("Legal");
    expect(t?.dataPurposeLinks).toHaveLength(1);
    // Corruptos: cada uno rechazado.
    const corrupt = (mutate: (t: Record<string, unknown>) => void) => {
      const bad = JSON.parse(JSON.stringify(c)) as Record<string, unknown>;
      const ts = (bad.treatments as Record<string, Record<string, unknown>>)[idA];
      mutate(ts);
      return validateCompanyState(bad).ok;
    };
    expect(
      corrupt((t) => {
        ((t.dataItems as Record<string, Record<string, unknown>>)[d.id].sourceRefs as string[]).push("fantasma");
      }),
    ).toBe(false);
    expect(
      corrupt((t) => {
        ((t.retentionRules as Record<string, Record<string, unknown>>)[r.id].dataItemIds as string[]).push("fantasma");
      }),
    ).toBe(false);
    expect(
      corrupt((t) => {
        (t.dataPurposeLinks as Array<Record<string, string>>).push({ dataId: "fantasma", purposeId: p1.purposeId });
      }),
    ).toBe(false);
    expect(
      corrupt((t) => {
        (t.dataPurposeLinks as Array<Record<string, string>>).push({ dataId: d.id, purposeId: p1.purposeId });
      }),
    ).toBe(false);
    expect(
      corrupt((t) => {
        (t.sources as Record<string, Record<string, unknown>>)[s.id].kind = "carrier_pigeon";
      }),
    ).toBe(false);
  });

  it("legacy sin colecciones sigue válido", () => {
    const c = newCompany("Vieja SpA");
    const migrated = migrateWorkspaceData({
      version: 1,
      profiles: [],
      activeProfileId: undefined,
      companies: { [c.id]: { ...c } },
    });
    expect(migrated.companies[c.id].treatments).toBeUndefined();
    expect(validateCompanyState(JSON.parse(JSON.stringify(c))).ok).toBe(true);
    // Lecturas con defaults vacíos.
    expect(c.treatments?.["x"]?.actors).toBeUndefined();
  });
});

describe("higiene de operaciones locales", () => {
  it("remove de link ausente es no-op puro", () => {
    let { c, idA } = companyAB();
    const before = JSON.stringify(c);
    const d = addDataItem(c, idA, { label: "X" });
    if (!d) throw new Error("sin data");
    expect(
      removeDataPurposeLink(d.company, idA, { dataId: d.id, purposeId: "x" }),
    ).toBeNull();
    // updatedAt intacto: sin escritura.
    expect(d.company.updatedAt).toBe(JSON.parse(before).updatedAt);
  });

  it("sourceRefs duplicadas o no-string se rechazan", () => {
    let { c, idA } = companyAB();
    const s = addSource(c, idA, { kind: "other", description: "S" });
    if (!s) throw new Error("sin source");
    c = s.company;
    expect(addDataItem(c, idA, { label: "X", sourceRefs: [s.id, s.id] })).toBeNull();
    expect(
      addDataItem(c, idA, { label: "X", sourceRefs: [42 as unknown as string] }),
    ).toBeNull();
  });

  it("texto vacío en patch opcional se rechaza (null limpia)", () => {
    let { c, idA } = companyAB();
    const d = addDataItem(c, idA, { label: "X", note: "n" });
    if (!d) throw new Error("sin data");
    c = d.company;
    expect(updateDataItem(c, idA, d.id, { note: "" })).toBeNull();
    const cleared = updateDataItem(c, idA, d.id, { note: null });
    if (!cleared) throw new Error("sin clear");
    expect(cleared.treatments?.[idA]?.dataItems?.[d.id]?.note).toBeUndefined();
  });
});
