import { describe, expect, it } from "vitest";
import { newCompany } from "../src/workspace/types";
import type { CompanyState, PurposeScopedState, TreatmentScopedState } from "../src/workspace/types";
import { getFactStatus } from "../src/workspace/facts";
import { readWorkspaceOrientationSignals } from "../src/orientation/adapters/workspace";
import { WORKSPACE_SIGNAL_KEYS } from "../src/orientation/engine/rules";

function purpose(treatmentId: string, id: string, description: string): PurposeScopedState {
  return {
    purpose: { id, treatmentId, description },
    protocolAnswers: {},
    reasoningRecords: {},
    specialRegimeProfile: {
      biometricIdentificationUse: "unknown",
      involvesMinors: "unknown",
      researchPublicInterestCandidate: "unknown",
    },
  };
}

function treatment(companyId: string, id: string, name: string, purposeId: string): TreatmentScopedState {
  return {
    context: { id, companyId, canonicalTreatmentId: `canonical-${id}`, name },
    protocolAnswers: {},
    reasoningRecords: {},
    purposes: { [purposeId]: purpose(id, purposeId, `Finalidad ${purposeId}`) },
    actors: { actor1: { id: "actor1", kind: "organization", name: "Proveedor" } },
    dataItems: {
      data1: {
        id: "data1",
        label: "Dato declarado",
        sourceRefs: ["source1"],
        sensitive: "yes",
        health: "unknown",
        biologicalProfile: "unknown",
        geolocation: "no",
      },
    },
    sources: { source1: { id: "source1", kind: "other", description: "Fuente registrada" } },
    retentionRules: {
      rule1: { id: "rule1", dataItemIds: ["data1"], criterion: "Plazo documentado", owner: "Área" },
    },
    dataPurposeLinks: [{ dataId: "data1", purposeId }],
    automatedUses: [{
      id: "use1",
      name: "Uso automatizado registrado",
      profiling: "yes",
      article8bisCoverage: "covered",
      legalPath: "explicit_consent",
    }],
    thirdPartyRelationships: [],
  };
}

function withTreatment(company: CompanyState, item: TreatmentScopedState, purposeId: string): CompanyState {
  return {
    ...company,
    treatments: { ...(company.treatments ?? {}), [item.context.id]: item },
    activeTreatmentId: item.context.id,
    activePurposeId: purposeId,
  };
}

describe("adaptador readonly de workspace para orientación", () => {
  it("solo proyecta señales explícitas del tratamiento y finalidad activos", () => {
    const company = newCompany("Scope SpA");
    const t1 = treatment(company.id, "t1", "Nómina", "p1");
    t1.thirdPartyRelationships = [{
      id: "relation1",
      actorId: "actor1",
      label: "Relación declarada",
      relationshipType: "communication",
      purposeIds: ["p1"],
      dataItemIds: ["data1"],
      internationalDimension: "unknown",
    }];
    const t2 = treatment(company.id, "t2", "Clientes", "p2");
    const withT1 = withTreatment({ ...company, treatments: { t2 } }, t1, "p1");
    const withBoth = {
      ...withT1,
      treatments: { t1, t2 },
      activityStates: { "example.activity": { status: "reviewed" as const, updatedAt: "2026-01-01T00:00:00.000Z" } },
      protocolAnswers: { "example.protocol": { "example.fact": { value: "yes", source: "example.protocol", updatedAt: "2026-01-01T00:00:00.000Z" } } },
    };
    const before = JSON.stringify(withBoth);
    const signals = readWorkspaceOrientationSignals(withBoth);
    const keys = new Set(signals.map((signal) => signal.key));

    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentIdentified);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentActorsExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentPurposesExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentSourcesExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentLinkedDataExists);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.treatmentRetentionRulesExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.d4AutomatedUsesExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.d4CoveredAutomatedUsesExist);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.d5SensitiveCandidate);
    expect(keys).toContain(WORKSPACE_SIGNAL_KEYS.d6RelationshipExists);
    expect(signals.every((signal) => signal.scope !== "purpose" || signal.scopeLabel?.includes("Finalidad p1"))).toBe(true);
    expect(JSON.stringify(withBoth)).toBe(before);

    const noActivePurpose = readWorkspaceOrientationSignals({ ...withBoth, activePurposeId: undefined });
    expect(noActivePurpose.some((signal) => signal.scope === "purpose")).toBe(false);
    expect(noActivePurpose.some((signal) => signal.scope === "treatment" && signal.scopeLabel === "Tratamiento: Nómina")).toBe(true);
  });

  it("no mezcla relaciones del tratamiento inactivo con el activo", () => {
    const company = newCompany("Relaciones SpA");
    const processor = treatment(company.id, "processor-treatment", "Encargo", "processor-purpose");
    processor.thirdPartyRelationships = [{
      id: "processor-rel",
      actorId: "actor1",
      label: "Relación registrada",
      relationshipType: "processor",
      purposeIds: ["processor-purpose"],
      dataItemIds: ["data1"],
      internationalDimension: "unknown",
    }];
    const cession = treatment(company.id, "cession-treatment", "Cesión", "cession-purpose");
    cession.thirdPartyRelationships = [{
      id: "cession-rel",
      actorId: "actor1",
      label: "Otra relación",
      relationshipType: "cession",
      purposeIds: ["cession-purpose"],
      dataItemIds: ["data1"],
      internationalDimension: "unknown",
    }];

    const activeProcessor = withTreatment({ ...company, treatments: { [cession.context.id]: cession } }, processor, "processor-purpose");
    const processorKeys = readWorkspaceOrientationSignals(activeProcessor).map((signal) => signal.key);
    expect(processorKeys).toContain(WORKSPACE_SIGNAL_KEYS.d6ProcessorExists);
    expect(processorKeys).not.toContain(WORKSPACE_SIGNAL_KEYS.d6CessionExists);

    const activeCession = withTreatment({ ...company, treatments: { [processor.context.id]: processor } }, cession, "cession-purpose");
    const cessionSignals = readWorkspaceOrientationSignals(activeCession).filter((signal) => signal.key === WORKSPACE_SIGNAL_KEYS.d6CessionExists);
    expect(cessionSignals).toHaveLength(1);
    expect(cessionSignals[0].scopeLabel).toBe("Tratamiento: Cesión · Finalidad: Finalidad cession-purpose");
  });

  it("no utiliza MPI desconocido o conflictivo como antecedente azul", () => {
    const company = newCompany("MPI SpA");
    const unknown = readWorkspaceOrientationSignals(company);
    expect(unknown.some((signal) => signal.key === WORKSPACE_SIGNAL_KEYS.mpiActive)).toBe(false);

    const conflicted: CompanyState = {
      ...company,
      diagnosticFacts: {
        "mpi.lifecycle_status": { value: "implemented", source: "diagnostico", updatedAt: "2026-01-01T00:00:00.000Z" },
      },
      protocolAnswers: {
        "mpi.lifecycle_review.v1": {
          "mpi.lifecycle_status": { value: "discontinued", source: "mpi.lifecycle_review.v1", updatedAt: "2026-01-02T00:00:00.000Z" },
        },
      },
    };
    expect(getFactStatus(conflicted, "mpi.lifecycle_status").state).toBe("conflict");
    expect(readWorkspaceOrientationSignals(conflicted).some((signal) => signal.key === WORKSPACE_SIGNAL_KEYS.mpiActive)).toBe(false);
  });
});
