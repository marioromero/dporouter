import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ContextNav } from "../src/components/ContextNav";
import { WorkspaceProvider, useWorkspace } from "../src/workspace/context";
import { newCompany } from "../src/workspace/types";
import type { CompanyState, TreatmentScopedState } from "../src/workspace/types";
import { STORAGE_KEY } from "../src/workspace/store";
import { useOrientationIndicators } from "../src/orientation/state/useOrientationIndicators";
import { QUESTION_IDS } from "../src/orientation/catalog/questions";
import { ORIENTATION_STORAGE_KEY } from "../src/orientation/state/types";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function makeTreatment(companyId: string, id: string, sensitive: "yes" | "no"): TreatmentScopedState {
  return {
    context: { id, companyId, name: `Tratamiento ${id}` },
    protocolAnswers: {},
    reasoningRecords: {},
    purposes: {
      [`purpose-${id}`]: {
        purpose: { id: `purpose-${id}`, treatmentId: id, description: `Finalidad ${id}` },
        protocolAnswers: {},
        reasoningRecords: {},
        specialRegimeProfile: {
          biometricIdentificationUse: "unknown",
          involvesMinors: "unknown",
          researchPublicInterestCandidate: "unknown",
        },
      },
    },
    dataItems: {
      [`data-${id}`]: {
        id: `data-${id}`,
        label: "Dato estructural",
        sourceRefs: [],
        sensitive,
        health: "unknown",
        biologicalProfile: "unknown",
        geolocation: "unknown",
      },
    },
    dataPurposeLinks: [{ dataId: `data-${id}`, purposeId: `purpose-${id}` }],
  };
}

function ScopeProbe() {
  const { company, selectTreatment, selectPurpose } = useWorkspace();
  const orientation = useOrientationIndicators();
  const sensitiveLevel = orientation.activities["sensitive.lawfulness_assess"].level;
  const protocolAnswerCount = company ? Object.keys(company.protocolAnswers).length : 0;
  const activityStateCount = company ? Object.keys(company.activityStates).length : 0;
  return (
    <>
      <span data-testid="sensitive-level">{sensitiveLevel}</span>
      <span data-testid="protocol-answer-count">{protocolAnswerCount}</span>
      <span data-testid="activity-state-count">{activityStateCount}</span>
      <ContextNav domainKey="d5" activityKey="sensitive.lawfulness_assess" />
      <button type="button" onClick={() => selectTreatment("treatment-one")}>Elegir tratamiento uno</button>
      <button type="button" onClick={() => selectPurpose("treatment-one", "purpose-treatment-one")}>Elegir finalidad uno</button>
      <button type="button" onClick={() => selectTreatment("treatment-two")}>Elegir tratamiento dos</button>
      <button type="button" onClick={() => selectPurpose("treatment-two", "purpose-treatment-two")}>Elegir finalidad dos</button>
    </>
  );
}

function seedScopedWorkspace() {
  const company = newCompany("Contextos SpA", "asesor-pablo");
  const t1 = makeTreatment(company.id, "treatment-one", "yes");
  const t2 = makeTreatment(company.id, "treatment-two", "no");
  const storedCompany: CompanyState = {
    ...company,
    treatments: { [t1.context.id]: t1, [t2.context.id]: t2 },
  };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      profiles: [{
        id: "asesor-pablo",
        name: "Pablo",
        username: "pablo",
        createdAt: company.createdAt,
        companyIds: [company.id],
        activeCompanyId: company.id,
      }],
      activeProfileId: "asesor-pablo",
      companies: { [company.id]: storedCompany },
    }),
  );
  localStorage.setItem(
    ORIENTATION_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      entries: {
        [`asesor-pablo::${company.id}`]: {
          questionnaireVersion: "1",
          updatedAt: new Date().toISOString(),
          responses: { [QUESTION_IDS.size]: "medium" },
        },
      },
    }),
  );
}

describe("reactividad y scopes de los indicadores", () => {
  it("muestra azul solo en la finalidad del tratamiento activo y no escribe estados ni respuestas", () => {
    seedScopedWorkspace();
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ScopeProbe />
        </WorkspaceProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("sensitive-level")).toHaveTextContent("gray");
    const sensitiveLink = () => screen.getByTestId("contextnav-activities").querySelector<HTMLAnchorElement>('a[href="/actividad/sensitive.lawfulness_assess"]');
    expect(sensitiveLink()).toHaveClass("ctx", "current", "orientation-nav-level--gray");
    fireEvent.click(screen.getByRole("button", { name: "Elegir tratamiento uno" }));
    fireEvent.click(screen.getByRole("button", { name: "Elegir finalidad uno" }));
    expect(screen.getByTestId("sensitive-level")).toHaveTextContent("blue");
    expect(sensitiveLink()).toHaveClass("ctx", "current", "orientation-nav-level--blue");
    expect(screen.getByTestId("contextnav-activities").querySelector('a[href="/actividad/sensitive.health_biological_assess"]')).toHaveClass("orientation-nav-level--gray");
    fireEvent.click(screen.getByRole("button", { name: "Elegir tratamiento dos" }));
    fireEvent.click(screen.getByRole("button", { name: "Elegir finalidad dos" }));
    expect(screen.getByTestId("sensitive-level")).toHaveTextContent("gray");
    expect(sensitiveLink()).toHaveClass("ctx", "current", "orientation-nav-level--gray");
    expect(screen.getByTestId("protocol-answer-count")).toHaveTextContent("0");
    expect(screen.getByTestId("activity-state-count")).toHaveTextContent("0");
  });
});
