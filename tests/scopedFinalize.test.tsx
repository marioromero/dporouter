import { describe, expect, it, vi } from "vitest";

// El entry point de contexto (`finalizeProtocolOutcome`) resuelve el
// protocolo por registry. Para ejercitar la cadena real con fixtures
// sintéticos se expone solo la key fixture, delegando el resto.
vi.mock("../content/protocols/registry", async (importOriginal) => {
  const orig =
    await importOriginal<typeof import("../content/protocols/registry")>();
  return {
    ...orig,
    getProtocol: (key: string) =>
      key === "fixture.tx.v1" ? TX_FIXTURE : orig.getProtocol(key),
  };
});
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { act } from "react";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import type { CompanyState, ExecutionContext } from "../src/workspace/types";
import { GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL as P01 } from "../content/protocols/governance.preventive_framework";
import { TRANSPARENCY_POLICY_ASSEMBLE_PROTOCOL as P301 } from "../content/protocols/transparency.policy_assemble";
import { TRANSPARENCY_PUBLICATION_VALIDATE_PROTOCOL as P302 } from "../content/protocols/transparency.publication_validate";
import {
  applyScopedProcedureFinalization,
  validateScopedProcedureFinalization,
} from "../src/workspace/finalize";
import {
  applyProcedureFinalization,
  validateProcedureFinalization,
} from "../src/workspace/finalize";
import { newCompany } from "../src/workspace/types";
import { validateCompanyState } from "../src/workspace/store";
import { WorkspaceProvider, useWorkspace } from "../src/workspace/context";
import {
  GuidanceSessionProvider,
  useGuidanceProtocol,
} from "../src/guidance/session";
import { STORAGE_KEY } from "../src/workspace/store";
import {
  createPurpose,
  createTreatment,
  getScopedProtocolAnswers,
  saveScopedProtocolAnswer,
} from "../src/workspace/scope";

/**
 * Finalización procedure/checklist scope-aware.
 *
 * Usa protocolos fixture sintéticos (nunca contenido canónico) para
 * demostrar la infraestructura en treatment/purpose. La regresión
 * company usa protocolos productivos existentes sin modificarlos.
 */

function fixtureProtocol(
  key: string,
  scope: "treatment" | "purpose",
  checkFact: string,
  effectFact: string,
): ExecutionProtocol {
  return {
    protocol_key: key,
    activity_key: `fixture.${key}`,
    version: 1,
    mode: scope === "treatment" ? "checklist" : "procedure",
    execution_scope: scope,
    title: "Fixture",
    description: "Fixture.",
    entry_node_key: "check",
    nodes: [
      {
        node_key: "check",
        node_type: "question",
        title: "Verificación",
        fact_key: checkFact,
        answer_type: "yes_no_unknown",
        options: [
          { value: "yes", label: "Sí", fact_effect: { fact_key: checkFact, value: "yes" } },
          { value: "no", label: "No", fact_effect: { fact_key: checkFact, value: "no" } },
          { value: "unknown", label: "Sin info", fact_effect: { fact_key: checkFact, value: "unknown" } },
        ],
        required_facts: [],
        default_next_node_key: "synthesis",
      },
      {
        node_key: "synthesis",
        node_type: "decision",
        title: "Síntesis",
        answer_type: "none",
        required_facts: [checkFact],
        transitions: [
          {
            rule_id: "bad",
            description: "d",
            when: { op: "fact_equals", fact_key: checkFact, value: "no" },
            goto_outcome_key: "remediation",
            explanation: "e",
          },
          {
            rule_id: "ok",
            description: "d",
            when: { op: "fact_equals", fact_key: checkFact, value: "yes" },
            goto_outcome_key: "done",
            explanation: "e",
          },
          {
            rule_id: "fallback",
            description: "d",
            when: { op: "all", conditions: [] },
            goto_outcome_key: "incomplete",
            explanation: "e",
          },
        ],
      },
    ],
    outcomes: [
      {
        outcome_key: "done",
        label: "Hecho",
        classification: "agency_standard",
        explanation: "e",
        provenance: "agency_standard",
        canonical_fact_effects: [{ fact_key: effectFact, value: "complete" }],
        next_actions: [{ kind: "info", label: "Archivar", note: "n" }],
      },
      {
        outcome_key: "remediation",
        label: "Remediar",
        classification: "agency_standard",
        explanation: "e",
        provenance: "agency_standard",
        next_actions: [{ kind: "restart", label: "Reiniciar" }],
      },
      {
        outcome_key: "incomplete",
        label: "Incompleto",
        classification: "agency_standard",
        explanation: "e",
        provenance: "agency_standard",
        next_actions: [{ kind: "restart", label: "Reiniciar" }],
      },
    ],
    decision_fact_keys: [checkFact],
    last_review: "2026-09-23",
    provenance: "agency_standard",
  };
}

const TX_FIXTURE = fixtureProtocol("fixture.tx.v1", "treatment", "fx.tx.check", "fx.tx.status");
const PX = fixtureProtocol("fixture.px.v1", "purpose", "fx.px.check", "fx.px.status");

function companyCtx(id: string): ExecutionContext {
  return { scope: "company", companyId: id };
}

function mustTreatment(c: CompanyState, name: string): { company: CompanyState; id: string } {
  const r = createTreatment(c, { name });
  if (!r) throw new Error(`no se pudo crear tratamiento ${name}`);
  return { company: r.company, id: r.treatmentId };
}

function mustPurpose(c: CompanyState, treatmentId: string, description: string): { company: CompanyState; id: string } {
  const r = createPurpose(c, treatmentId, description);
  if (!r) throw new Error(`no se pudo crear finalidad ${description}`);
  return { company: r.company, id: r.purposeId };
}

function fullP01(): FactMap {
  return {
    "governance.client_is_responsible": "yes",
    "governance.actions_identified": "yes",
    "governance.gaps_determined": "yes",
    "governance.framework_defined": "yes",
    "governance.followup_established": "yes",
  };
}

describe("scoped procedure/checklist finalization", () => {
  it("1. company delega al camino histórico idéntico (D1 + D3.01/D3.02)", () => {
    const company = newCompany("Histórica SpA");
    const ctx = companyCtx(company.id);
    for (const [protocol, facts, outcome, effect] of [
      [P01, fullP01(), "framework_established", "governance.prevention_framework_status"],
    ] as const) {
      const historic = validateProcedureFinalization({ protocol, company, facts, outcomeKey: outcome });
      const scoped = validateScopedProcedureFinalization({ protocol, company, facts, outcomeKey: outcome }, ctx);
      expect(scoped).toEqual(historic);
      expect(scoped.ok).toBe(true);
      if (!scoped.ok || !historic.ok) return;
      const appliedHistoric = applyProcedureFinalization(company, protocol, historic.effects);
      const appliedScoped = applyScopedProcedureFinalization(company, protocol, ctx, scoped.effects);
      expect(appliedScoped).toEqual({ ...appliedHistoric, company: expect.anything() });
      expect(appliedScoped?.applied).toEqual([effect]);
      expect(appliedScoped?.company.protocolAnswers[protocol.protocol_key]?.[effect]?.value).toBe(
        outcome === "framework_established" ? "established" : effect,
      );
    }
    // D3.01/D3.02 por vía scoped-company: mismos efectos que el camino histórico.
    const d301facts: FactMap = Object.fromEntries(
      P301.decision_fact_keys.map((k) => [k, "yes"]),
    );
    const d301 = validateScopedProcedureFinalization(
      { protocol: P301, company, facts: d301facts, outcomeKey: "policy_assembled" },
      ctx,
    );
    expect(d301.ok).toBe(true);
    if (!d301.ok) return;
    expect(d301.effects).toEqual([{ fact_key: "transparency.policy_status", value: "assembled" }]);
    const d302facts: FactMap = {
      "transparency.policy_status": "assembled",
      ...Object.fromEntries(P302.decision_fact_keys.map((k) => [k, "yes"])),
    };
    const d302 = validateScopedProcedureFinalization(
      { protocol: P302, company, facts: d302facts, outcomeKey: "publication_validated" },
      ctx,
    );
    expect(d302.ok).toBe(true);
  });

  it("2. treatment A/B independientes con mismo protocol y fact key", () => {
    let c = newCompany("Aislada SpA");
    const tA = mustTreatment(c, "A");
    c = tA.company;
    const tB = mustTreatment(c, "B");
    c = tB.company;
    const idA = tA.id;
    const idB = tB.id;
    const ctxA: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: idA };
    const ctxB: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: idB };
    c = saveScopedProtocolAnswer(c, ctxA, TX_FIXTURE.protocol_key, "fx.tx.check", "yes", TX_FIXTURE.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, TX_FIXTURE.protocol_key, "fx.tx.check", "yes", TX_FIXTURE.protocol_key) ?? c;
    const vA = validateScopedProcedureFinalization(
      { protocol: TX_FIXTURE, company: c, facts: { "fx.tx.check": "yes" }, outcomeKey: "done" },
      ctxA,
    );
    expect(vA.ok).toBe(true);
    if (!vA.ok) return;
    const applied = applyScopedProcedureFinalization(c, TX_FIXTURE, ctxA, vA.effects);
    expect(applied?.applied).toEqual(["fx.tx.status"]);
    // A escrito; B y company intactos (same-scope only).
    expect(getScopedProtocolAnswers(applied!.company, ctxA, TX_FIXTURE.protocol_key)["fx.tx.status"]?.value).toBe("complete");
    expect(getScopedProtocolAnswers(applied!.company, ctxB, TX_FIXTURE.protocol_key)["fx.tx.status"]).toBeUndefined();
    expect(applied!.company.protocolAnswers[TX_FIXTURE.protocol_key]).toBeUndefined();
    // Idempotencia por address: repetir no reescribe.
    const stamp = getScopedProtocolAnswers(applied!.company, ctxA, TX_FIXTURE.protocol_key)["fx.tx.status"]?.updatedAt;
    const twice = applyScopedProcedureFinalization(applied!.company, TX_FIXTURE, ctxA, vA.effects);
    expect(twice?.applied).toEqual([]);
    expect(twice?.skipped).toEqual(["fx.tx.status"]);
    expect(getScopedProtocolAnswers(twice!.company, ctxA, TX_FIXTURE.protocol_key)["fx.tx.status"]?.updatedAt).toBe(stamp);
  });

  it("3. purposes A1/A2 independientes (mismo y distinto treatment)", () => {
    let c = newCompany("Purposes SpA");
    const tA = mustTreatment(c, "TA");
    c = tA.company;
    const tB = mustTreatment(c, "TB");
    c = tB.company;
    const pA1 = mustPurpose(c, tA.id, "A1");
    c = pA1.company;
    const pA2 = mustPurpose(c, tA.id, "A2");
    c = pA2.company;
    const pB1 = mustPurpose(c, tB.id, "B1");
    c = pB1.company;
    const ctxA1: ExecutionContext = { scope: "purpose", companyId: c.id, treatmentId: tA.id, purposeId: pA1.id };
    const ctxA2: ExecutionContext = { scope: "purpose", companyId: c.id, treatmentId: tA.id, purposeId: pA2.id };
    const ctxB1: ExecutionContext = { scope: "purpose", companyId: c.id, treatmentId: tB.id, purposeId: pB1.id };
    for (const ctx of [ctxA1, ctxA2, ctxB1]) {
      c = saveScopedProtocolAnswer(c, ctx, PX.protocol_key, "fx.px.check", "yes", PX.protocol_key) ?? c;
    }
    const v = validateScopedProcedureFinalization(
      { protocol: PX, company: c, facts: { "fx.px.check": "yes" }, outcomeKey: "done" },
      ctxA1,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(c, PX, ctxA1, v.effects);
    expect(getScopedProtocolAnswers(applied!.company, ctxA1, PX.protocol_key)["fx.px.status"]?.value).toBe("complete");
    expect(getScopedProtocolAnswers(applied!.company, ctxA2, PX.protocol_key)["fx.px.status"]).toBeUndefined();
    expect(getScopedProtocolAnswers(applied!.company, ctxB1, PX.protocol_key)["fx.px.status"]).toBeUndefined();
  });

  it("4. ancestry cruzada rechazada (validate + apply null)", () => {
    let c = newCompany("Ancestry SpA");
    const tA = mustTreatment(c, "TA");
    c = tA.company;
    const tB = mustTreatment(c, "TB");
    c = tB.company;
    const p = mustPurpose(c, tB.id, "P-de-B");
    c = p.company;
    const crossed: ExecutionContext = {
      scope: "purpose",
      companyId: c.id,
      treatmentId: tA.id,
      purposeId: p.id,
    };
    const v = validateScopedProcedureFinalization(
      { protocol: PX, company: c, facts: { "fx.px.check": "yes" }, outcomeKey: "done" },
      crossed,
    );
    expect(v.ok).toBe(false);
    expect(
      applyScopedProcedureFinalization(c, PX, crossed, [{ fact_key: "fx.px.status", value: "complete" }]),
    ).toBeNull();
  });

  it("5. conflictos: sibling jamás bloquea; ancestor sí", () => {
    let c = newCompany("Conflictos SpA");
    const tA = mustTreatment(c, "TA");
    c = tA.company;
    const tB = mustTreatment(c, "TB");
    c = tB.company;
    const ctxA: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: tA.id };
    const ctxB: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: tB.id };
    // Conflicto en B (dos fuentes = dos maps, valores distintos) sobre el fact necesario.
    c = saveScopedProtocolAnswer(c, ctxB, TX_FIXTURE.protocol_key, "fx.tx.check", "yes", TX_FIXTURE.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, "other.v1", "fx.tx.check", "no", "other.v1") ?? c;
    c = saveScopedProtocolAnswer(c, ctxA, TX_FIXTURE.protocol_key, "fx.tx.check", "yes", TX_FIXTURE.protocol_key) ?? c;
    const vA = validateScopedProcedureFinalization(
      { protocol: TX_FIXTURE, company: c, facts: { "fx.tx.check": "yes" }, outcomeKey: "done" },
      ctxA,
    );
    expect(vA.ok).toBe(true);
    // Conflicto ancestor (company: diagnóstico vs protocolo) sobre el fact
    // necesario bloquea al scoped que NO tiene valor propio: el ancestor
    // solo rellena ausentes.
    const tC = mustTreatment(c, "TC");
    c = tC.company;
    const ctxC: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: tC.id };
    c = {
      ...c,
      diagnosticFacts: {
        "fx.tx.check": { value: "no", source: "diagnostico", updatedAt: "2026-09-23T00:00:00.000Z" },
      },
      protocolAnswers: {
        ...c.protocolAnswers,
        [TX_FIXTURE.protocol_key]: {
          "fx.tx.check": { value: "yes", source: TX_FIXTURE.protocol_key, updatedAt: "2026-09-23T00:00:00.000Z" },
        },
      },
    };
    const blocked = validateScopedProcedureFinalization(
      { protocol: TX_FIXTURE, company: c, facts: { "fx.tx.check": "yes" }, outcomeKey: "done" },
      ctxC,
    );
    expect(blocked.ok).toBe(false);
    // Con valor propio resuelto, el ancestor no impone ni bloquea.
    const ownWins = validateScopedProcedureFinalization(
      { protocol: TX_FIXTURE, company: c, facts: { "fx.tx.check": "yes" }, outcomeKey: "done" },
      ctxA,
    );
    expect(ownWins.ok).toBe(true);
  });

  it("6. export/import conserva finalizaciones scopeadas con ancestry", () => {
    let c = newCompany("Roundtrip SpA");
    const t = mustTreatment(c, "T");
    c = t.company;
    const p = mustPurpose(c, t.id, "P");
    c = p.company;
    const ctx: ExecutionContext = { scope: "purpose", companyId: c.id, treatmentId: t.id, purposeId: p.id };
    c = saveScopedProtocolAnswer(c, ctx, PX.protocol_key, "fx.px.check", "yes", PX.protocol_key) ?? c;
    const v = validateScopedProcedureFinalization(
      { protocol: PX, company: c, facts: { "fx.px.check": "yes" }, outcomeKey: "done" },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const applied = applyScopedProcedureFinalization(c, PX, ctx, v.effects);
    const roundTrip = validateCompanyState(JSON.parse(JSON.stringify(applied!.company)));
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    expect(
      getScopedProtocolAnswers(roundTrip.value, ctx, PX.protocol_key)["fx.px.status"]?.value,
    ).toBe("complete");
  });
});

describe("addressed guide context (A1 → selección A2 → finaliza A1)", () => {
  function seedAB() {
    const at = new Date().toISOString();
    let c = newCompany("Addressed SpA");
    const tA = mustTreatment(c, "TA");
    c = tA.company;
    const tB = mustTreatment(c, "TB");
    c = tB.company;
    const idA = tA.id;
    const idB = tB.id;
    const ctxA: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: idA };
    const ctxB: ExecutionContext = { scope: "treatment", companyId: c.id, treatmentId: idB };
    // Seeds divergentes: solo A satisface el outcome; si la evaluación
    // usara los facts activos (B), la finalización sería rechazada.
    c = saveScopedProtocolAnswer(c, ctxA, TX_FIXTURE.protocol_key, "fx.tx.check", "yes", TX_FIXTURE.protocol_key) ?? c;
    c = saveScopedProtocolAnswer(c, ctxB, TX_FIXTURE.protocol_key, "fx.tx.check", "no", TX_FIXTURE.protocol_key) ?? c;
    c = { ...c, activeTreatmentId: idA };
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profiles: [{ id: "asesor-pablo", name: "Pablo", username: "pablo", createdAt: at, companyIds: [c.id], activeCompanyId: c.id }],
        activeProfileId: "asesor-pablo",
        companies: { [c.id]: c },
      }),
    );
    return { idA, idB };
  }

  function Probe({ idA, idB }: { idA: string; idB: string }) {
    const session = useGuidanceProtocol(TX_FIXTURE.protocol_key, "treatment");
    const { company, selectTreatment, finalizeProtocolOutcome } = useWorkspace();
    const addr = session.ctx;
    const statusOf = (treatmentId: string) =>
      company
        ? (getScopedProtocolAnswers(
            company,
            { scope: "treatment", companyId: company.id, treatmentId },
            TX_FIXTURE.protocol_key,
          )["fx.tx.status"]?.value ?? "")
        : "";
    return (
      <>
        <span data-testid="addr">
          {addr == null ? "null" : `${addr.scope}:${addr.scope === "company" ? "" : addr.treatmentId}`}
        </span>
        <span data-testid="addr-facts">{JSON.stringify(session.addressedFacts)}</span>
        <button type="button" onClick={() => selectTreatment(idB)}>
          switch
        </button>
        <button
          type="button"
          onClick={() =>
            finalizeProtocolOutcome(
              TX_FIXTURE.protocol_key,
              "done",
              session.addressedFacts,
              session.ctx,
            )
          }
        >
          finalize
        </button>
        <span data-testid="applied-a">{statusOf(idA)}</span>
        <span data-testid="applied-b">{statusOf(idB)}</span>
      </>
    );
  }

  it("7. la guía conserva su contexto addressed ante cambio de selección", () => {
    const { idA, idB } = seedAB();
    try {
      render(
        <MemoryRouter>
          <WorkspaceProvider>
            <GuidanceSessionProvider>
              <Probe idA={idA} idB={idB} />
            </GuidanceSessionProvider>
          </WorkspaceProvider>
        </MemoryRouter>,
      );
      // Direccionada a A1 al abrir.
      expect(screen.getByTestId("addr").textContent).toBe(`treatment:${idA}`);
      // Cambia la selección activa a B: la guía sigue direccionada a A1,
      // y su vista evaluable conserva los facts de A1 (no los de B).
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "switch" }));
      });
      expect(screen.getByTestId("addr").textContent).toBe(`treatment:${idA}`);
      expect(
        JSON.parse(screen.getByTestId("addr-facts").textContent ?? "{}")["fx.tx.check"],
      ).toBe("yes");
      // Finaliza la sesión de A1: evaluado y escrito en A1, B intacto.
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "finalize" }));
      });
      expect(screen.getByTestId("applied-a").textContent).toBe("complete");
      expect(screen.getByTestId("applied-b").textContent).toBe("");
    } finally {
      localStorage.clear();
    }
  });
});
