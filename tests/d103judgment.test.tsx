import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MPI_NEED_ASSESSMENT_PROTOCOL as P03 } from "../content/protocols/mpi.need_assessment";
import {
  findConclusionNode,
  getProtocolForActivity,
  validateProtocolStructure,
} from "../content/protocols/registry";
import { evaluateProtocol } from "../src/guidance/engine";
import type { FactMap } from "../content/protocols/types";
import { getCanonicalActivity } from "../content/registry";
import { WorkspaceProvider } from "../src/workspace/context";
import { GuidanceSessionProvider } from "../src/guidance/session";
import { newCompany } from "../src/workspace/types";
import type {
  CompanyState,
  ProtocolReasoningRecord,
} from "../src/workspace/types";
import { STORAGE_KEY, validateCompanyState } from "../src/workspace/store";
import {
  blockingConflicts,
  getFactStatus,
} from "../src/workspace/facts";
import {
  canPersistRecord,
  gatePasses,
  getRecordedJudgment,
  resolveGuideResult,
  validateReasoningDraft,
} from "../src/workspace/reasoning";
import { JudgmentPanel } from "../src/components/JudgmentPanel";

const F = {
  voluntary: "mpi_assessment.voluntary",
  exposure: "mpi_assessment.exposure_reviewed",
  capacity: "mpi_assessment.capacity_reviewed",
  distinction: "mpi_assessment.convenience_distinguished",
  draft: "mpi_assessment.working_conclusion",
};

function fullFacts(over: FactMap = {}): FactMap {
  return {
    [F.voluntary]: "yes",
    [F.exposure]: "yes",
    [F.capacity]: "yes",
    [F.distinction]: "yes",
    ...over,
  };
}

function companyWith(over: Partial<CompanyState>): CompanyState {
  return { ...newCompany("Test SpA"), ...over };
}

function answersFor(
  protocolKey: string,
  entries: Record<string, string>,
  at = new Date().toISOString(),
): Record<string, Record<string, { value: string; source: string; updatedAt: string }>> {
  return {
    [protocolKey]: Object.fromEntries(
      Object.entries(entries).map(([k, v]) => [k, { value: v, source: protocolKey, updatedAt: at }]),
    ),
  };
}

function validDraft(over: Partial<Parameters<typeof validateReasoningDraft>[1]> = {}) {
  return {
    conclusion: "recommended",
    legal_question: "¿Conviene adoptar el MPI?",
    evidence_refs: ["Acta 2026-09-01"],
    rationale: "Exposición alta y capacidad suficiente justifican el programa.",
    decided_by: "Jefa de Compliance",
    reviewed_by: "",
    decided_at: "2026-09-22",
    ...over,
  };
}

function recordedEntry(
  conclusion = "recommended",
  at = new Date().toISOString(),
): ProtocolReasoningRecord {
  return {
    protocolKey: P03.protocol_key,
    activityKey: P03.activity_key,
    conclusion,
    legal_question: "¿Conviene adoptar el MPI?",
    facts_considered: [...P03.decision_fact_keys],
    legal_factors: ["Carácter voluntario"],
    evidence_refs: ["Acta 2026-09-01"],
    alternatives_considered: ["worth_considering", "not_priority"],
    rationale: "Exposición alta y capacidad suficiente.",
    decided_by: "Jefa de Compliance",
    reviewed_by: "",
    decided_at: "2026-09-22",
    legal_basis: [
      {
        source_id: "cl_ley_19628_2026",
        source_name: "Ley N° 19.628",
        article_or_provision: "Artículo 49",
        reference_text: "",
        source_url: "",
        basis_type: "law",
        regulatory_status: "transitional",
        last_verified_at: "2026-09-21",
      },
    ],
    updatedAt: at,
  };
}

function adoptedCompany(
  conclusion = "recommended",
  factOver: FactMap = {},
): CompanyState {
  return companyWith({
    protocolAnswers: answersFor(P03.protocol_key, fullFacts(factOver)),
    reasoningRecords: { [P03.protocol_key]: recordedEntry(conclusion) },
  });
}

describe("D1.03 contenido y estructura", () => {
  it("protocolo único mode decision provisional, D1.03 intacto", () => {
    expect(getProtocolForActivity("mpi.need_assessment")).toBe(P03);
    expect(P03.protocol_key).toBe("mpi.need_assessment.v1");
    expect(P03.mode).toBe("decision");
    expect(P03.entry_node_key).toBe("factor-voluntariness");
    expect(getCanonicalActivity(P03.activity_key)?.human_code).toBe("D1.03");
    expect(validateProtocolStructure(P03)).toEqual([]);
  });

  it("nodos de consideración desde pasos canónicos, sin árbol artificial", () => {
    expect(P03.nodes.map((n) => n.node_key)).toEqual([
      "factor-voluntariness",
      "factor-exposure",
      "factor-capacity",
      "factor-convenience",
      "sufficiency-gate",
      "adopt-conclusion",
    ]);
    // Sin scoring, umbrales ni conteos en todo el protocolo.
    expect(JSON.stringify(P03)).not.toMatch(/count_true|score|threshold|peso/i);
  });

  it("outcomes son los tres canónicos más el estado de evaluación", () => {
    expect(P03.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      ["assessment_incomplete", "not_priority", "recommended", "worth_considering"].sort(),
    );
    for (const o of P03.outcomes) {
      expect(o.classification).toBe("agency_standard");
    }
  });

  it("nodo conclusión detectable por estructura, sin literales", () => {
    const node = findConclusionNode(P03);
    expect(node?.node_key).toBe("adopt-conclusion");
    expect(node?.options?.map((o) => o.value).sort()).toEqual(
      ["not_priority", "recommended", "worth_considering"].sort(),
    );
  });

  it("ningún protocolo anterior tiene nodo conclusión", () => {
    for (const key of ["dpo.need_assessment", "mpi.formalize_adoption", "dpo.initial_governance_validation"]) {
      const p = getProtocolForActivity(key);
      expect(p && findConclusionNode(p)).toBeUndefined();
    }
  });
});

describe("D1.03 gate de suficiencia", () => {
  it("factor material unknown bloquea conclusión definitiva", () => {
    expect(gatePasses(P03, companyWith({}), fullFacts({ [F.exposure]: "unknown" }))).toBe(false);
    const e = evaluateProtocol(P03, fullFacts({ [F.exposure]: "unknown" }));
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") expect(e.outcome_key).toBe("assessment_incomplete");
  });

  it("factor material absent bloquea conclusión definitiva", () => {
    const partial = fullFacts();
    delete partial[F.capacity];
    expect(gatePasses(P03, companyWith({}), partial)).toBe(false);
  });

  it("factor material en conflicto bloquea conclusión definitiva", () => {
    const at = new Date().toISOString();
    const c = companyWith({
      diagnosticFacts: {
        [F.exposure]: { value: "no", source: "diagnostico", updatedAt: at },
      },
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
    });
    expect(getFactStatus(c, F.exposure).state).toBe("conflict");
    expect(blockingConflicts(P03, c)).toContain(F.exposure);
    expect(gatePasses(P03, c, fullFacts())).toBe(false);
  });

  it("factores suficientes habilitan, sin decidir la conclusión", () => {
    expect(gatePasses(P03, companyWith({}), fullFacts())).toBe(true);
    // El gate no contiene ninguna conclusión: solo suficiencia.
    const gate = P03.nodes.find((n) => n.node_key === "sufficiency-gate");
    const text = JSON.stringify(gate?.transitions);
    expect(text).not.toContain("recommended");
    expect(text).not.toContain("worth_considering");
    expect(text).not.toContain("not_priority");
  });

  it("evaluación incompleta no escribe mpi.recommendation_outcome", () => {
    const c = adoptedCompany();
    const json = JSON.stringify(c);
    expect(json).not.toContain("mpi.recommendation_outcome");
    expect(json).not.toContain("assessment_incomplete");
    // ...salvo como outcome_key del protocolo en contenido, nunca en estado.
    expect(Object.keys(c)).not.toContain("mpiRecommendation");
  });
});

describe("D1.03 conclusión y ReasoningRecord", () => {
  it("facts suficientes sin conclusión humana no concluyen", () => {
    const c = companyWith({
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
    });
    expect(getRecordedJudgment(P03, c, fullFacts()).status).toBe("none");
  });

  it("conclusión sin ReasoningRecord válido no es definitiva", () => {
    const bad = recordedEntry();
    bad.rationale = "  ";
    const c = companyWith({
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
      reasoningRecords: { [P03.protocol_key]: bad },
    });
    const r = getRecordedJudgment(P03, c, fullFacts());
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") {
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it("validez mínima exige coherencia completa", () => {
    expect(validateReasoningDraft(P03, validDraft())).toEqual([]);
    expect(validateReasoningDraft(P03, validDraft({ conclusion: "invented" })).length).toBeGreaterThan(0);
    expect(validateReasoningDraft(P03, validDraft({ rationale: " " })).length).toBeGreaterThan(0);
    expect(validateReasoningDraft(P03, validDraft({ decided_by: "" })).length).toBeGreaterThan(0);
    expect(validateReasoningDraft(P03, validDraft({ decided_at: "no-fecha" })).length).toBeGreaterThan(0);
    expect(validateReasoningDraft(P03, validDraft({ evidence_refs: [] })).length).toBeGreaterThan(0);
    expect(validateReasoningDraft(P03, validDraft({ legal_question: "" })).length).toBeGreaterThan(0);
  });

  it("mismos hechos con dos conclusiones distintas en ejecuciones separadas", () => {
    const a = adoptedCompany("recommended");
    const b = adoptedCompany("not_priority");
    const ra = getRecordedJudgment(P03, a, fullFacts());
    const rb = getRecordedJudgment(P03, b, fullFacts());
    expect(ra.status).toBe("valid");
    expect(rb.status).toBe("valid");
    // El motor no sustituye el juicio: la evaluación es idéntica en ambas.
    const ea = evaluateProtocol(P03, fullFacts());
    const eb = evaluateProtocol(P03, fullFacts());
    expect(JSON.stringify(ea)).toBe(JSON.stringify(eb));
    if (ra.status === "valid" && rb.status === "valid") {
      expect(ra.record.conclusion).toBe("recommended");
      expect(rb.record.conclusion).toBe("not_priority");
    }
  });

  it("conclusión y registro no divergen; cambio material fuerza reevaluación", () => {
    const c = adoptedCompany("recommended");
    const before = getRecordedJudgment(P03, c, fullFacts());
    expect(before.status).toBe("valid");
    const changed = fullFacts({ [F.capacity]: "unknown" });
    const after = getRecordedJudgment(P03, c, changed);
    expect(after.status).toBe("stale");
    if (after.status === "stale") {
      expect(after.reasons.length).toBeGreaterThan(0);
      // El registro persiste intacto (no se borra en silencio).
      expect(c.reasoningRecords[P03.protocol_key].conclusion).toBe("recommended");
    }
    // Un "no" posterior también invalida: la base exige consideración vigente.
    const flipped = fullFacts({ [F.capacity]: "no" });
    expect(getRecordedJudgment(P03, c, flipped).status).toBe("stale");
  });
});

describe("D1.03 persistencia por empresa", () => {
  it("aislamiento por empresa", () => {
    const a = adoptedCompany("recommended");
    const b = companyWith({
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
    });
    expect(getRecordedJudgment(P03, a, fullFacts()).status).toBe("valid");
    expect(getRecordedJudgment(P03, b, fullFacts()).status).toBe("none");
  });

  it("export/import conserva evaluación, conclusión y registro", () => {
    const c = adoptedCompany("worth_considering");
    const json = JSON.stringify(c);
    const checked = validateCompanyState(JSON.parse(json));
    expect(checked.ok).toBe(true);
    if (checked.ok) {
      const r = getRecordedJudgment(P03, checked.value, fullFacts());
      expect(r.status).toBe("valid");
      if (r.status === "valid") {
        expect(r.record.conclusion).toBe("worth_considering");
        expect(r.record.rationale).toContain("Exposición");
        expect(r.outcome.outcome_key).toBe("worth_considering");
      }
    }
  });

  it("import rechaza registro de razonamiento inválido", () => {
    const c = adoptedCompany();
    const bad = JSON.parse(JSON.stringify(c)) as CompanyState;
    bad.reasoningRecords[P03.protocol_key].rationale = 42 as unknown as string;
    expect(validateCompanyState(bad).ok).toBe(false);
  });
});

describe("D1.03 resolución de ruta de guía", () => {
  it("conflicto tiene prioridad sobre conclusión registrada", () => {
    const at = new Date().toISOString();
    const c = companyWith({
      diagnosticFacts: {
        [F.exposure]: { value: "no", source: "diagnostico", updatedAt: at },
      },
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
      reasoningRecords: { [P03.protocol_key]: recordedEntry("recommended") },
    });
    const r = resolveGuideResult(P03, c, fullFacts());
    expect(r.kind).toBe("conflict");
    if (r.kind === "conflict") expect(r.facts).toContain(F.exposure);
  });

  it("conclusión válida precede a la evaluación del motor", () => {
    const c = adoptedCompany("not_priority");
    const r = resolveGuideResult(P03, c, fullFacts());
    expect(r.kind).toBe("recorded");
    if (r.kind === "recorded") {
      expect(r.outcome.outcome_key).toBe("not_priority");
      expect(r.record.conclusion).toBe("not_priority");
    }
  });

  it("base suficiente sin registro continúa al nodo conclusión", () => {
    const c = companyWith({
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
    });
    const r = resolveGuideResult(P03, c, fullFacts());
    expect(r.kind).toBe("continue");
    if (r.kind === "continue") expect(r.nodeKey).toBe("adopt-conclusion");
  });

  it("sin base cae a la evaluación determinística", () => {
    const r = resolveGuideResult(P03, companyWith({}), {});
    expect(r.kind).toBe("evaluation");
  });
});

describe("D1.03 navegación y UI sin IDs", () => {  it("deep link al nodo conclusión con prerrequisitos declarados", () => {
    const node = findConclusionNode(P03);
    expect(node?.required_facts?.sort()).toEqual(
      [
        "mpi_assessment.voluntary",
        "mpi_assessment.exposure_reviewed",
        "mpi_assessment.capacity_reviewed",
        "mpi_assessment.convenience_distinguished",
      ].sort(),
    );
  });

  it("el orden del array no crea dependencias semánticas", () => {
    for (const n of P03.nodes.filter((x) => x.node_type === "question")) {
      expect(Array.isArray(n.required_facts), n.node_key).toBe(true);
    }
  });

  it("panel de juicio sin claves técnicas visibles", () => {
    const node = findConclusionNode(P03);
    if (!node) throw new Error("sin nodo conclusión");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <GuidanceSessionProvider>
            <JudgmentPanel
              protocol={P03}
              activityDef={getCanonicalActivity("mpi.need_assessment")!}
              activity={{
                activityKey: "mpi.need_assessment",
                humanCode: "D1.03",
                name: "Evaluar conveniencia de adoptar MPI",
              }}
              session={{
                facts: fullFacts(),
                started: true,
                answer: () => {},
                reset: () => {},
                isProvided: () => false,
                providedSource: () => null,
              }}
              node={node}
            />
          </GuidanceSessionProvider>
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("juicio-conclusion")).toBeTruthy();
    expect(screen.getByText("Lo que sabemos")).toBeTruthy();
    expect(screen.getByText("Lo que falta resolver")).toBeTruthy();
    expect(screen.getByText("Evaluación profesional")).toBeTruthy();
    expect(screen.getByText("Conclusión documentada")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Adoptar conclusión profesional" })).toBeTruthy();
    const body = document.body.textContent ?? "";
    for (const token of [
      "mpi_assessment.",
      "mpi.need_assessment",
      "mpi.recommendation_outcome",
      "rule_id",
      "fact_key",
      "node_key",
      "activity_key",
      "factors-pending",
      "ready-for-conclusion",
    ]) {
      expect(body, token).not.toContain(token);
    }
    expect(body).not.toContain("el sistema determinó");
    expect(body).not.toContain("algoritmo recomienda");
    expect(body).not.toContain("puntaje");
  });
});

describe("D1.03 revisión: hallazgos de reviewer", () => {
  function panelSession(facts: FactMap) {
    return {
      facts,
      started: true,
      answer: () => {},
      reset: () => {},
      isProvided: () => false,
      providedSource: () => null,
    };
  }

  function panelNode() {
    const node = findConclusionNode(P03);
    if (!node) throw new Error("sin nodo conclusión");
    return node;
  }

  function renderPanel(facts: FactMap) {
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <GuidanceSessionProvider>
            <JudgmentPanel
              protocol={P03}
              activityDef={getCanonicalActivity("mpi.need_assessment")!}
              activity={{
                activityKey: "mpi.need_assessment",
                humanCode: "D1.03",
                name: "Evaluar conveniencia de adoptar MPI",
              }}
              session={panelSession(facts)}
              node={panelNode()}
            />
          </GuidanceSessionProvider>
        </WorkspaceProvider>
      </MemoryRouter>,
    );
  }

  it("un no explícito se informa como pendiente de considerar, no como base", () => {
    renderPanel(fullFacts({ [F.capacity]: "no" }));
    expect(
      screen.getByText("marcado como no considerado: debe considerarse con respaldo para concluir", { exact: false }),
    ).toBeTruthy();
    expect(screen.queryByText("existe base suficiente para concluir")).toBeNull();
  });

  it("alternativa importada desconocida usa mensaje genérico", () => {
    localStorage.clear();
    const at = new Date().toISOString();
    const company = companyWith({
      protocolAnswers: answersFor(P03.protocol_key, fullFacts()),
      reasoningRecords: {
        [P03.protocol_key]: {
          ...recordedEntry("recommended"),
          alternatives_considered: ["worth_considering", "clave_inventada"],
        },
      },
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p1",
            name: "P",
            createdAt: at,
            companyIds: [company.id],
            activeCompanyId: company.id,
          },
        ],
        activeProfileId: "p1",
        companies: { [company.id]: company },
      }),
    );
    renderPanel(fullFacts());
    expect(screen.getByText("Alternativa registrada")).toBeTruthy();
    const body = document.body.textContent ?? "";
    expect(body).not.toContain("clave_inventada");
    localStorage.clear();
  });

  it("canPersistRecord autoriza lo válido y rechaza lo inválido", () => {
    expect(canPersistRecord(P03, validDraft())).toBe(true);
    expect(canPersistRecord(undefined, validDraft())).toBe(false);
    expect(
      canPersistRecord(P03, validDraft({ conclusion: "invented" })),
    ).toBe(false);
    expect(canPersistRecord(P03, validDraft({ rationale: "" }))).toBe(false);
  });
});
