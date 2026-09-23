import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { act } from "react";
import type { ExecutionProtocol } from "../content/protocols/types";
import { DPO_NEED_ASSESSMENT_PROTOCOL as P02 } from "../content/protocols/dpo.need_assessment";
import {
  evaluateProtocol,
  getProtocolProgress,
} from "../src/guidance/engine";
import { newCompany } from "../src/workspace/types";
import { STORAGE_KEY, validateCompanyState } from "../src/workspace/store";
import { WorkspaceProvider, useWorkspace } from "../src/workspace/context";
import {
  GuidanceSessionProvider,
  useGuidanceProtocol,
} from "../src/guidance/session";
import {
  activeExecutionContext,
  blockingScopedConflicts,
  buildScopedFactMap,
  createPurpose,
  createTreatment,
  deletePurpose,
  deleteTreatment,
  getScopedFactState,
  getScopedProtocolAnswers,
  resolveExecutionContext,
  saveScopedProtocolAnswer,
  selectPurpose,
  selectTreatment,
} from "../src/workspace/scope";

/**
 * Aislamiento Stage 1 Company → Treatment → Purpose.
 *
 * Usa protocolos fixture sintéticos (nunca contenido D2 productivo ni
 * registry): solo demuestran addressing, vistas y aislamiento.
 */

const TX_PROTOCOL: ExecutionProtocol = {
  protocol_key: "fixture.scope_tx.v1",
  activity_key: "fixture.scope_tx",
  version: 1,
  mode: "procedure",
  title: "Fixture treatment",
  description: "Fixture.",
  entry_node_key: "q",
  nodes: [
    {
      node_key: "q",
      node_type: "question",
      title: "Compartido",
      fact_key: "fact.shared",
      answer_type: "single_select",
      options: [
        { value: "yes", label: "Sí", fact_effect: { fact_key: "fact.shared", value: "yes" } },
        { value: "no", label: "No", fact_effect: { fact_key: "fact.shared", value: "no" } },
      ],
      required_facts: [],
      default_next_node_key: "done",
    },
    {
      node_key: "done",
      node_type: "decision",
      title: "Síntesis",
      answer_type: "none",
      required_facts: ["fact.shared"],
      transitions: [
        {
          rule_id: "r",
          description: "d",
          when: { op: "fact_equals", fact_key: "fact.shared", value: "yes" },
          goto_outcome_key: "ok",
          explanation: "e",
        },
        {
          rule_id: "f",
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
      outcome_key: "ok",
      label: "Ok",
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
  decision_fact_keys: ["fact.shared"],
  last_review: "2026-09-23",
  provenance: "agency_standard",
};

const PX_PROTOCOL: ExecutionProtocol = {
  ...TX_PROTOCOL,
  protocol_key: "fixture.scope_px.v1",
  activity_key: "fixture.scope_px",
  title: "Fixture purpose",
  nodes: TX_PROTOCOL.nodes.map((n) =>
    n.fact_key === "fact.shared"
      ? { ...n, fact_key: "lawful_basis" }
      : n.node_key === "done"
        ? {
            ...n,
            required_facts: ["lawful_basis"],
            transitions: (n.transitions ?? []).map((t) =>
              t.rule_id === "r"
                ? {
                    ...t,
                    when: { op: "fact_equals", fact_key: "lawful_basis", value: "basis_x" } as const,
                  }
                : t,
            ),
          }
        : n,
  ),
  decision_fact_keys: ["lawful_basis"],
};

function companyAB() {
  let c = newCompany("X SpA");
  const a = createTreatment(c, { name: "Tratamiento A" });
  if (!a) throw new Error("sin A");
  c = a.company;
  const b = createTreatment(c, { name: "Tratamiento B" });
  if (!b) throw new Error("sin B");
  c = b.company;
  return { company: c, idA: a.treatmentId, idB: b.treatmentId };
}

describe("aislamiento Company → Treatment → Purpose", () => {
  it("Caso 1: mismo fact en A y B coexiste sin overwrite ni conflicto", () => {
    let { company: c, idA, idB } = companyAB();
    const ctxA = { scope: "treatment", companyId: c.id, treatmentId: idA } as const;
    const ctxB = { scope: "treatment", companyId: c.id, treatmentId: idB } as const;
    c = saveScopedProtocolAnswer(c, ctxA, TX_PROTOCOL.protocol_key, "fact.shared", "X", TX_PROTOCOL.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, TX_PROTOCOL.protocol_key, "fact.shared", "Y", TX_PROTOCOL.protocol_key) ?? c;
    // Ambos persisten en sus direcciones.
    expect(getScopedProtocolAnswers(c, ctxA, TX_PROTOCOL.protocol_key)["fact.shared"]?.value).toBe("X");
    expect(getScopedProtocolAnswers(c, ctxB, TX_PROTOCOL.protocol_key)["fact.shared"]?.value).toBe("Y");
    // Vistas separadas, sin conflicto artificial.
    expect(buildScopedFactMap(c, ctxA)["fact.shared"]).toBe("X");
    expect(buildScopedFactMap(c, ctxB)["fact.shared"]).toBe("Y");
    expect(blockingScopedConflicts(["fact.shared"], c, ctxA)).toEqual([]);
    expect(blockingScopedConflicts(["fact.shared"], c, ctxB)).toEqual([]);
    // Progreso independiente.
    expect(getProtocolProgress(TX_PROTOCOL, buildScopedFactMap(c, ctxA))).toEqual({ resolved: 1, total: 1 });
    const c2 = saveScopedProtocolAnswer(c, ctxB, TX_PROTOCOL.protocol_key, "fact.shared", "unknown", TX_PROTOCOL.protocol_key) ?? c;
    expect(getProtocolProgress(TX_PROTOCOL, buildScopedFactMap(c2, ctxA))).toEqual({ resolved: 1, total: 1 });
    expect(getProtocolProgress(TX_PROTOCOL, buildScopedFactMap(c2, ctxB)).resolved).toBe(0);
    // Outcomes independientes.
    const cYes = saveScopedProtocolAnswer(c, ctxA, TX_PROTOCOL.protocol_key, "fact.shared", "yes", TX_PROTOCOL.protocol_key) ?? c;
    const eA = evaluateProtocol(TX_PROTOCOL, buildScopedFactMap(cYes, ctxA));
    expect(eA.status).toBe("outcome");
    if (eA.status === "outcome") expect(eA.outcome_key).toBe("ok");
    const eB = evaluateProtocol(TX_PROTOCOL, buildScopedFactMap(c, ctxB));
    expect(eB.status).toBe("outcome");
    if (eB.status === "outcome") expect(eB.outcome_key).toBe("pending");
  });

  it("Caso 2: lawful basis por purpose + reasoning coexistente", () => {
    let { company: c, idA } = companyAB();
    const p1 = createPurpose(c, idA, "Finalidad A1");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    const p2 = createPurpose(c, idA, "Finalidad A2");
    if (!p2) throw new Error("sin A2");
    c = p2.company;
    const ctx1 = { scope: "purpose", companyId: c.id, treatmentId: idA, purposeId: p1.purposeId } as const;
    const ctx2 = { scope: "purpose", companyId: c.id, treatmentId: idA, purposeId: p2.purposeId } as const;
    c = saveScopedProtocolAnswer(c, ctx1, PX_PROTOCOL.protocol_key, "lawful_basis", "basis_x", PX_PROTOCOL.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctx2, PX_PROTOCOL.protocol_key, "lawful_basis", "basis_y", PX_PROTOCOL.protocol_key) ?? c;
    expect(buildScopedFactMap(c, ctx1)["lawful_basis"]).toBe("basis_x");
    expect(buildScopedFactMap(c, ctx2)["lawful_basis"]).toBe("basis_y");
    expect(blockingScopedConflicts(["lawful_basis"], c, ctx1)).toEqual([]);
    // Reasoning records coexistentes por purpose (reemplazo intra-dirección).
    const at = new Date().toISOString();
    const t = c.treatments?.[idA];
    if (!t) throw new Error("sin T");
    const rec = (conclusion: string) => ({
      protocolKey: PX_PROTOCOL.protocol_key,
      activityKey: PX_PROTOCOL.activity_key,
      conclusion,
      legal_question: "q",
      facts_considered: [],
      legal_factors: [],
      evidence_refs: [],
      alternatives_considered: [],
      rationale: "r",
      decided_by: "d",
      reviewed_by: "",
      decided_at: at,
      legal_basis: [],
      updatedAt: at,
    });
    c = {
      ...c,
      treatments: {
        ...c.treatments,
        [idA]: {
          ...t,
          purposes: {
            ...t.purposes,
            [p1.purposeId]: {
              ...t.purposes[p1.purposeId],
              reasoningRecords: { [PX_PROTOCOL.protocol_key]: rec("basis_x") },
            },
            [p2.purposeId]: {
              ...t.purposes[p2.purposeId],
              reasoningRecords: { [PX_PROTOCOL.protocol_key]: rec("basis_y") },
            },
          },
        },
      },
    };
    expect(
      c.treatments?.[idA]?.purposes[p1.purposeId]?.reasoningRecords[PX_PROTOCOL.protocol_key]?.conclusion,
    ).toBe("basis_x");
    expect(
      c.treatments?.[idA]?.purposes[p2.purposeId]?.reasoningRecords[PX_PROTOCOL.protocol_key]?.conclusion,
    ).toBe("basis_y");
  });

  it("Caso 3: ancestry inválida se rechaza; selección se normaliza", () => {
    let { company: c, idA, idB } = companyAB();
    const p1 = createPurpose(c, idA, "A1");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    // Purpose A1 bajo Treatment B: rechazado.
    expect(
      resolveExecutionContext(c, {
        scope: "purpose",
        companyId: c.id,
        treatmentId: idB,
        purposeId: p1.purposeId,
      }),
    ).toBe(false);
    expect(selectPurpose(c, idB, p1.purposeId)).toBeNull();
    // Treatment de otra company: rechazado.
    expect(
      resolveExecutionContext(c, {
        scope: "treatment",
        companyId: "otra",
        treatmentId: idA,
      }),
    ).toBe(false);
    // activePurpose sin treatment compatible se limpia al cambiar.
    const sel = selectPurpose(c, idA, p1.purposeId);
    if (!sel) throw new Error("sin selección");
    const switched = selectTreatment(sel, idB);
    if (!switched) throw new Error("sin cambio");
    expect(switched.activeTreatmentId).toBe(idB);
    expect(switched.activePurposeId).toBeUndefined();
    // Delete purga navegación.
    const withSel = selectPurpose(c, idA, p1.purposeId);
    if (!withSel) throw new Error("sin selección 2");
    const deleted = deleteTreatment(withSel, idA);
    if (!deleted) throw new Error("sin borrado");
    expect(deleted.treatments?.[idA]).toBeUndefined();
    expect(deleted.activeTreatmentId).toBeUndefined();
    expect(deleted.activePurposeId).toBeUndefined();
    const delP = deletePurpose(c, idA, p1.purposeId);
    if (!delP) throw new Error("sin borrado P");
    expect(delP.treatments?.[idA]?.purposes[p1.purposeId]).toBeUndefined();
  });

  it("Caso 4: herencia company sin copiar al child", () => {
    const at = new Date().toISOString();
    let { company: c, idA } = companyAB();
    c = {
      ...c,
      diagnosticFacts: { "company.flag": { value: "yes", source: "diagnostico", updatedAt: at } },
    };
    const ctxA = { scope: "treatment", companyId: c.id, treatmentId: idA } as const;
    // Visible en la vista del treatment...
    expect(buildScopedFactMap(c, ctxA)["company.flag"]).toBe("yes");
    // ...sin copiarse al scope hijo.
    expect(getScopedProtocolAnswers(c, ctxA, "cualquiera")).toEqual({});
    expect(c.treatments?.[idA]?.protocolAnswers).toEqual({});
  });

  it("Caso 5: D1 company no cambia con treatments/purposes", () => {
    let { company: c, idA } = companyAB();
    const companyCtx = { scope: "company", companyId: c.id } as const;
    const before = buildScopedFactMap(c, companyCtx);
    // Responder en treatments y seleccionar no toca la vista company.
    const ctxA = { scope: "treatment", companyId: c.id, treatmentId: idA } as const;
    c = saveScopedProtocolAnswer(c, ctxA, TX_PROTOCOL.protocol_key, "fact.shared", "X", TX_PROTOCOL.protocol_key) ?? c;
    const p1 = createPurpose(c, idA, "A1");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    const sel = selectPurpose(c, idA, p1.purposeId);
    if (!sel) throw new Error("sin selección");
    expect(buildScopedFactMap(sel, companyCtx)).toEqual(before);
    // D1.02 evalúa igual antes y después.
    const d1Facts = { "mpi.lifecycle_status": "implemented" };
    const e1 = evaluateProtocol(P02, { ...before, ...d1Facts });
    const e2 = evaluateProtocol(P02, { ...buildScopedFactMap(sel, companyCtx), ...d1Facts });
    expect(JSON.stringify(e1)).toBe(JSON.stringify(e2));
    // Sin treatments (legado) la vista company es el merge actual.
    const legacy = newCompany("Legada SpA");
    expect(activeExecutionContext(legacy, "treatment")).toBeNull();
    expect(buildScopedFactMap(legacy, { scope: "company", companyId: legacy.id })).toEqual({});
  });

  it("Export/import conserva subárbol y rechaza parentage inválido", () => {

    let { company: c, idA } = companyAB();
    const p1 = createPurpose(c, idA, "A1");
    if (!p1) throw new Error("sin A1");
    c = p1.company;
    const ctx1 = { scope: "purpose", companyId: c.id, treatmentId: idA, purposeId: p1.purposeId } as const;
    c = saveScopedProtocolAnswer(c, ctx1, PX_PROTOCOL.protocol_key, "lawful_basis", "basis_x", PX_PROTOCOL.protocol_key) ?? c;
    const sel = selectPurpose(c, idA, p1.purposeId);
    if (!sel) throw new Error("sin selección");
    const checked = validateCompanyState(JSON.parse(JSON.stringify(sel)));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.value.treatments?.[idA]?.purposes[p1.purposeId]).toBeDefined();
    expect(
      checked.value.treatments?.[idA]?.purposes[p1.purposeId]?.protocolAnswers[PX_PROTOCOL.protocol_key]?.["lawful_basis"]?.value,
    ).toBe("basis_x");
    expect(checked.value.activeTreatmentId).toBe(idA);
    expect(checked.value.activePurposeId).toBe(p1.purposeId);
    // Purpose con treatment inexistente: rechazado.
    const bad = JSON.parse(JSON.stringify(checked.value)) as Record<string, unknown>;
    const treatments = bad.treatments as Record<string, Record<string, unknown>>;
    const first = treatments[idA] as Record<string, unknown>;
    (first.purposes as Record<string, unknown>)["huerfano"] = {
      purpose: { id: "huerfano", treatmentId: "inexistente", description: "x" },
      protocolAnswers: {},
      reasoningRecords: {},
    };
    expect(validateCompanyState(bad).ok).toBe(false);
    // Treatment de otra company: rechazado.
    const bad2 = JSON.parse(JSON.stringify(checked.value)) as Record<string, unknown>;
    ((bad2.treatments as Record<string, Record<string, unknown>>)[idA].context as Record<string, unknown>).companyId = "otra";
    expect(validateCompanyState(bad2).ok).toBe(false);
    // Selección obsoleta: normalizada, no rechazada.
    const bad3 = JSON.parse(JSON.stringify(checked.value)) as Record<string, unknown>;
    bad3.activePurposeId = "inexistente";
    const norm = validateCompanyState(bad3);
    expect(norm.ok).toBe(true);
    if (norm.ok) expect(norm.value.activePurposeId).toBeUndefined();
  });
});

describe("sesión scope-aware", () => {
  function Consumer({
    protocolKey,
    scope,
    switchTo,
    answerValue,
    showActive,
  }: {
    protocolKey: string;
    scope: "company" | "treatment";
    switchTo?: string | null;
    answerValue?: string;
    showActive?: boolean;
  }) {
    const session = useGuidanceProtocol(protocolKey, scope);
    const { company, selectTreatment } = useWorkspace();
    return (
      <>
        <span data-testid={`facts-${scope}`}>{JSON.stringify(session.facts)}</span>
        {showActive ? (
          <span data-testid="active">{company?.activeTreatmentId ?? ""}</span>
        ) : null}
        {switchTo !== undefined ? (
          <button type="button" onClick={() => selectTreatment(switchTo)}>
            switch
          </button>
        ) : null}
        {answerValue !== undefined ? (
          <button
            type="button"
            onClick={() => session.answer("fact.shared", answerValue)}
          >
            answer
          </button>
        ) : null}
      </>
    );
  }

  function seedCompany() {
    const at = new Date().toISOString();
    let { company: c, idA, idB } = companyAB();
    const ctxA = { scope: "treatment", companyId: c.id, treatmentId: idA } as const;
    const ctxB = { scope: "treatment", companyId: c.id, treatmentId: idB } as const;
    c = saveScopedProtocolAnswer(c, ctxA, TX_PROTOCOL.protocol_key, "fact.shared", "X", TX_PROTOCOL.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, TX_PROTOCOL.protocol_key, "fact.shared", "Y", TX_PROTOCOL.protocol_key) ?? c;
    c = {
      ...c,
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "implemented", source: "diagnostico", updatedAt: at },
      },
      activeTreatmentId: idA,
    };
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p1",
            name: "P",
            createdAt: at,
            companyIds: [c.id],
            activeCompanyId: c.id,
          },
        ],
        activeProfileId: "p1",
        companies: { [c.id]: c },
      }),
    );
    return { idA, idB };
  }

  it("vista cambia con treatment activo; D1 company intacto", () => {
    const { idB } = seedCompany();
    try {
      render(
        <MemoryRouter>
          <WorkspaceProvider>
            <GuidanceSessionProvider>
              <Consumer protocolKey={TX_PROTOCOL.protocol_key} scope="treatment" switchTo={idB} showActive />
              <Consumer protocolKey={P02.protocol_key} scope="company" />
            </GuidanceSessionProvider>
          </WorkspaceProvider>
        </MemoryRouter>,
      );
      // Treatment A ve X; D1 ve el fact company.
      expect(JSON.parse(screen.getByTestId("facts-treatment").textContent ?? "{}")["fact.shared"]).toBe("X");
      expect(
        JSON.parse(screen.getByTestId("facts-company").textContent ?? "{}")["mpi.lifecycle_status"],
      ).toBe("implemented");
      // Cambiar a B cambia la vista treatment; D1 no se mueve.
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "switch" }));
      });
      expect(screen.getByTestId("active").textContent).toBe(idB);
      expect(JSON.parse(screen.getByTestId("facts-treatment").textContent ?? "{}")["fact.shared"]).toBe("Y");
      expect(
        JSON.parse(screen.getByTestId("facts-company").textContent ?? "{}")["mpi.lifecycle_status"],
      ).toBe("implemented");
    } finally {
      localStorage.clear();
    }
  });

  it("answer escribe en el scope activo sin tocar siblings", () => {
    const { idB } = seedCompany();
    try {
      render(
        <MemoryRouter>
          <WorkspaceProvider>
            <GuidanceSessionProvider>
              <Consumer
                protocolKey={TX_PROTOCOL.protocol_key}
                scope="treatment"
                switchTo={idB}
                answerValue="yes"
              />
            </GuidanceSessionProvider>
          </WorkspaceProvider>
        </MemoryRouter>,
      );
      // Vista A con X; escribir "yes" responde en A.
      expect(JSON.parse(screen.getByTestId("facts-treatment").textContent ?? "{}")["fact.shared"]).toBe("X");
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "answer" }));
      });
      expect(JSON.parse(screen.getByTestId("facts-treatment").textContent ?? "{}")["fact.shared"]).toBe("yes");
      // Cambiar a B muestra Y intacto: sin overwrite entre siblings.
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "switch" }));
      });
      expect(JSON.parse(screen.getByTestId("facts-treatment").textContent ?? "{}")["fact.shared"]).toBe("Y");
    } finally {
      localStorage.clear();
    }
  });
});

describe("resolución scopeada", () => {
  // Posterior a toda observación: una resolución anterior a una
  // contradicción la reabre por diseño.
  const at = new Date(Date.now() + 60_000).toISOString();

  function conflictedAB() {
    let { company: c, idA, idB } = companyAB();
    const ctxA = { scope: "treatment", companyId: c.id, treatmentId: idA } as const;
    const ctxB = { scope: "treatment", companyId: c.id, treatmentId: idB } as const;
    // Conflicto intra-dirección en A (dos fuentes, valores distintos).
    c = saveScopedProtocolAnswer(c, ctxA, "proto.one.v1", "fact.shared", "X", "proto.one.v1") ?? c;
    c = saveScopedProtocolAnswer(c, ctxA, "proto.two.v1", "fact.shared", "Z", "proto.two.v1") ?? c;
    // Conflicto independiente en B.
    c = saveScopedProtocolAnswer(c, ctxB, "proto.one.v1", "fact.shared", "Y", "proto.one.v1") ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, "proto.two.v1", "fact.shared", "W", "proto.two.v1") ?? c;
    return { c, idA, idB, ctxA, ctxB };
  }

  it("resolución en A no fuga a B; company legacy no rige scopes", () => {
    const { c: base, idA, ctxA, ctxB } = conflictedAB();
    expect(getScopedFactState(base, ctxA, "fact.shared").state).toBe("conflict");
    expect(getScopedFactState(base, ctxB, "fact.shared").state).toBe("conflict");
    // Resolución scopeada a A: A resuelve, B sigue en conflicto.
    const resolved = {
      ...base,
      factResolutions: {
        [ "fact.shared"]: {
          factKey: "fact.shared",
          value: "X",
          resolvedAt: at,
          decidedBy: "professional" as const,
          alternatives: [],
          scope: "treatment" as const,
          treatmentId: idA,
        },
      },
    };
    expect(getScopedFactState(resolved, ctxA, "fact.shared")).toEqual({
      state: "resolved",
      value: "X",
    });
    expect(getScopedFactState(resolved, ctxB, "fact.shared").state).toBe("conflict");
    expect(blockingScopedConflicts(["fact.shared"], resolved, ctxA)).toEqual([]);
    expect(blockingScopedConflicts(["fact.shared"], resolved, ctxB)).toEqual(["fact.shared"]);
    // Resolución company legacy rige company pero no scopes hijos.
    const legacy = {
      ...base,
      factResolutions: {
        ["fact.shared"]: {
          factKey: "fact.shared",
          value: "X",
          resolvedAt: at,
          decidedBy: "professional" as const,
          alternatives: [],
        },
      },
    };
    expect(getScopedFactState(legacy, ctxA, "fact.shared").state).toBe("conflict");
    expect(getScopedFactState(legacy, ctxB, "fact.shared").state).toBe("conflict");
  });
});
