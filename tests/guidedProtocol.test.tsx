import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DPO_NEED_ASSESSMENT_PROTOCOL as PROTOCOL } from "../content/protocols/dpo.need_assessment";
import {
  getProtocol,
  getProtocolForActivity,
  listProtocols,
  validateProtocolStructure,
} from "../content/protocols/registry";
import {
  buildOutcomeFactors,
  evaluateCondition,
  evaluateProtocol,
  firstProducerNodeKey,
  getFactState,
  getMissingDecisionFacts,
  getMissingRequiredFacts,
  resolveDecisionNode,
} from "../src/guidance/engine";
import type { ExecutionProtocol, FactMap } from "../content/protocols/types";
import { WorkspaceProvider } from "../src/workspace/context";
import { ProtocolNodeView, ProtocolOutcomeView } from "../src/components/ProtocolView";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getUnresolvedReferences,
} from "../content/registry";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { DEMO_ACTIVITY_KEY } from "../src/data/demoActivity";

const MPI = "mpi.lifecycle_status";
const HIGH = "dpo_assessment.high_impact_data";
const LARGE = "dpo_assessment.large_scale";
const AUTO = "dpo_assessment.automated_significant_effects";
const MONITOR = "dpo_assessment.systematic_public_monitoring";
const TRANSFERS = "dpo_assessment.international_transfers";
const PROCESSOR = "dpo_assessment.processor_complexity";
const MATURITY = "dpo_assessment.low_maturity";

const DECISION_FACTS = [HIGH, LARGE, AUTO, MONITOR, TRANSFERS, PROCESSOR, MATURITY];

function facts(overrides: FactMap = {}): FactMap {
  return {
    [MPI]: "not_adopted",
    [HIGH]: "no",
    [LARGE]: "no",
    [AUTO]: "no",
    [MONITOR]: "no",
    [TRANSFERS]: "no",
    [PROCESSOR]: "no",
    [MATURITY]: "no",
    ...overrides,
  };
}

function mustOutcome(f: FactMap) {
  const e = evaluateProtocol(PROTOCOL, f);
  if (e.status !== "outcome") {
    throw new Error(`se esperaba outcome, fue ${e.status}`);
  }
  return e;
}

describe("motor de ejecución guiada — piloto D1.02", () => {
  it("1. D1.02 tiene exactamente un protocolo activo", () => {
    expect(getProtocolForActivity("dpo.need_assessment")).toBe(PROTOCOL);
    expect(
      listProtocols().filter((p) => p.activity_key === "dpo.need_assessment"),
    ).toHaveLength(1);
    expect(
      listProtocols().map((p) => p.activity_key).sort(),
    ).toEqual(
      ["data.minimization_review", "data.quality_control", "dpo.annual_plan", "dpo.annual_report", "dpo.confidentiality_duty", "dpo.contact_and_agency_notification", "dpo.designate", "dpo.governance_revalidation", "dpo.infringement_escalation", "dpo.initial_governance_validation", "dpo.need_assessment", "dpo.operating_model", "dpo.terminate_or_replace", "governance.preventive_framework", "lawful_basis.assign", "legitimate_interest.assessment", "mpi.assemble_program", "mpi.certification_lifecycle", "mpi.formalize_adoption", "mpi.internal_disciplinary_framework", "mpi.internal_regulation_integrate", "mpi.internal_reporting_and_whistleblowing", "mpi.lifecycle_review", "mpi.need_assessment", "retention.schedule", "treatment.actor_roles", "treatment.inventory_create", "treatment.purpose_define", "treatment.source_traceability"].sort(),
    );
  });

  it("2. activity key coincide con la ActivityDefinition", () => {
    expect(PROTOCOL.activity_key).toBe("dpo.need_assessment");
    expect(getCanonicalActivity(PROTOCOL.activity_key)?.human_code).toBe("D1.02");
  });

  it("3. protocol key es estable con modo decision", () => {
    expect(PROTOCOL.protocol_key).toBe("dpo.need_assessment.v1");
    expect(PROTOCOL.version).toBe(1);
    expect(PROTOCOL.mode).toBe("decision");
    expect(getProtocol("dpo.need_assessment.v1")).toBe(PROTOCOL);
    expect(PROTOCOL.entry_node_key).toBe("mpi-status");
    expect(PROTOCOL.last_review).toBe("2026-09-22");
  });

  it("4. node keys son únicas (9 nodos, 5 outcomes)", () => {
    const keys = PROTOCOL.nodes.map((n) => n.node_key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(9);
    expect(PROTOCOL.outcomes.map((o) => o.outcome_key).sort()).toEqual(
      [
        "assessment_incomplete",
        "not_priority",
        "recommended",
        "required_by_mpi",
        "strongly_recommended",
      ].sort(),
    );
  });

  it("5. todas las transiciones y destinos resuelven", () => {
    expect(validateProtocolStructure(PROTOCOL)).toEqual([]);
  });

  it("6. next activity references resuelven o usan mecanismo pending", () => {
    const pending = new Set(getUnresolvedReferences());
    const refs = new Set<string>();
    for (const o of PROTOCOL.outcomes) {
      for (const a of o.next_actions) {
        if (a.kind === "activity" && a.activity_key) refs.add(a.activity_key);
      }
    }
    for (const n of PROTOCOL.nodes) {
      for (const k of n.related_activity_keys ?? []) refs.add(k);
    }
    expect(refs.size).toBeGreaterThan(0);
    for (const k of refs) {
      const resolves = getCanonicalActivity(k) !== undefined;
      expect(resolves || pending.has(k), k).toBe(true);
    }
  });

  it("7. unknown nunca se convierte en no", () => {
    expect(evaluateCondition({ op: "fact_equals", fact_key: LARGE, value: "no" }, { [LARGE]: "unknown" })).toBe(false);
    // Un solo unknown impide not_priority: el resultado es incompleto.
    const e = evaluateProtocol(PROTOCOL, facts({ [LARGE]: "unknown" }));
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") expect(e.outcome_key).toBe("assessment_incomplete");
    // Ausencia total tampoco concluye recomendación.
    const empty = evaluateProtocol(PROTOCOL, {});
    expect(empty.status).toBe("awaiting_facts");
  });

  it("8. MPI activo produce required_by_mpi", () => {
    for (const v of ["adoption_formalized", "implementing", "implemented"]) {
      const e = mustOutcome(facts({ [MPI]: v }));
      expect(e.outcome_key, v).toBe("required_by_mpi");
      expect(e.rule_id, v).toBe("mpi-active");
    }
  });

  it("9. MPI unknown produce assessment_incomplete", () => {
    const e = mustOutcome(facts({ [MPI]: "unknown" }));
    expect(e.outcome_key).toBe("assessment_incomplete");
    expect(e.rule_id).toBe("mpi-unknown");
  });

  it("10. A (alto impacto + escala) produce strongly_recommended", () => {
    const e = mustOutcome(facts({ [HIGH]: "yes", [LARGE]: "yes" }));
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-A");
  });

  it("11. automatización con efectos produce strongly_recommended", () => {
    const e = mustOutcome(facts({ [AUTO]: "yes" }));
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-B");
  });

  it("12. monitoreo sistemático produce strongly_recommended", () => {
    const e = mustOutcome(facts({ [MONITOR]: "yes" }));
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-C");
  });

  it("13. escala + transferencias produce strongly_recommended", () => {
    const e = mustOutcome(facts({ [LARGE]: "yes", [TRANSFERS]: "yes" }));
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-D");
  });

  it("14. escala + complejidad produce strongly_recommended", () => {
    const e = mustOutcome(facts({ [LARGE]: "yes", [PROCESSOR]: "yes" }));
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-E");
  });

  it("15. baja madurez + dos factores produce strongly_recommended", () => {
    const e = mustOutcome(
      facts({ [MATURITY]: "yes", [HIGH]: "yes", [TRANSFERS]: "yes" }),
    );
    expect(e.outcome_key).toBe("strongly_recommended");
    expect(e.rule_id).toBe("strong-F");
  });

  it("16. dos factores de soporte sin regla fuerte producen recommended", () => {
    const e = mustOutcome(facts({ [HIGH]: "yes", [TRANSFERS]: "yes" }));
    expect(e.outcome_key).toBe("recommended");
    expect(e.rule_id).toBe("recommended-two");
  });

  it("17. cero factores producen not_priority", () => {
    const e = mustOutcome(facts());
    expect(e.outcome_key).toBe("not_priority");
    expect(e.rule_id).toBe("fallback-not-priority");
  });

  it("18. un factor produce not_priority", () => {
    const e = mustOutcome(facts({ [TRANSFERS]: "yes" }));
    expect(e.outcome_key).toBe("not_priority");
  });

  it("19. cualquier fact obligatorio unknown produce assessment_incomplete", () => {
    for (const f of DECISION_FACTS) {
      const e = evaluateProtocol(PROTOCOL, facts({ [f]: "unknown" }));
      expect(e.status, f).toBe("outcome");
      if (e.status === "outcome") expect(e.outcome_key, f).toBe("assessment_incomplete");
      expect(getMissingDecisionFacts(PROTOCOL, facts({ [f]: "unknown" })), f).toContain(f);
    }
  });

  it("20. required_by_mpi no se etiqueta agency_standard", () => {
    const o = PROTOCOL.outcomes.find((x) => x.outcome_key === "required_by_mpi");
    expect(o?.classification).toBe("legal_requirement");
    expect(o?.provenance).not.toBe("agency_standard");
  });

  it("21. strongly/recommended/not_priority no se etiquetan legal_requirement", () => {
    for (const k of ["strongly_recommended", "recommended", "not_priority", "assessment_incomplete"]) {
      const o = PROTOCOL.outcomes.find((x) => x.outcome_key === k);
      expect(o?.classification, k).toBe("agency_standard");
    }
  });

  it("22. D1 y D2 no cambian semánticamente", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(ALL_ACTIVITIES).toHaveLength(32);
    expect(getUnresolvedReferences()).toEqual([
      "consent.mechanism_design",
      "financial.titleIII_scope",
      "mpi.diffusion",
      "risk.mpi_sync",
      "sensitive.lawfulness_assess",
    ]);
  });

  it("23. DEMO continúa aislado (sin protocolo)", () => {
    expect(getProtocolForActivity(DEMO_ACTIVITY_KEY)).toBeUndefined();
    expect(
      listProtocols().some((p) => p.activity_key === DEMO_ACTIVITY_KEY),
    ).toBe(false);
  });

  it("motor: combinadores y conteo son determinísticos", () => {
    const f = facts({ [HIGH]: "yes", [LARGE]: "yes" });
    expect(
      evaluateCondition({ op: "all", conditions: [{ op: "fact_equals", fact_key: HIGH, value: "yes" }] }, f),
    ).toBe(true);
    expect(
      evaluateCondition({ op: "not", condition: { op: "fact_equals", fact_key: HIGH, value: "no" } }, f),
    ).toBe(true);
    expect(
      evaluateCondition({ op: "count_true", facts: [HIGH, LARGE, AUTO], equals: "yes", at_least: 3 }, f),
    ).toBe(false);
    expect(buildOutcomeFactors(PROTOCOL, f)).toHaveLength(8);
  });
});

const MINI_BRANCH: ExecutionProtocol = {
  protocol_key: "test.branch.v1",
  activity_key: "test.activity",
  version: 1,
  mode: "decision",
  title: "Mini ramificado",
  description: "Protocolo sintético de regresión.",
  entry_node_key: "q1",
  decision_fact_keys: ["test.f1"],
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "q1",
      node_type: "question",
      title: "Q1",
      fact_key: "test.f1",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          fact_effect: { fact_key: "test.f1", value: "yes" },
          next_node_key: "dec-yes",
        },
        {
          value: "no",
          label: "No",
          fact_effect: { fact_key: "test.f1", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          fact_effect: { fact_key: "test.f1", value: "unknown" },
        },
      ],
      default_next_node_key: "dec-no",
    },
    {
      node_key: "dec-yes",
      node_type: "decision",
      title: "DecYes",
      answer_type: "none",
      transitions: [
        {
          rule_id: "only-yes",
          description: "d",
          when: { op: "fact_equals", fact_key: "test.f1", value: "yes" },
          goto_outcome_key: "out-yes",
          explanation: "e",
        },
      ],
    },
    {
      node_key: "dec-no",
      node_type: "decision",
      title: "DecNo",
      answer_type: "none",
      transitions: [
        {
          rule_id: "only-yes-unreachable",
          description: "d",
          when: { op: "fact_equals", fact_key: "test.f1", value: "yes" },
          goto_outcome_key: "out-yes",
          explanation: "e",
        },
      ],
    },
  ],
  outcomes: [
    {
      outcome_key: "out-yes",
      label: "Yes",
      classification: "agency_standard",
      explanation: "e",
      provenance: "agency_standard",
      next_actions: [{ kind: "restart", label: "R" }],
    },
  ],
};

describe("regresión del motor (hallazgos de revisión)", () => {
  it("el walk honra next_node_key directa de la opción", () => {
    expect(validateProtocolStructure(MINI_BRANCH)).toEqual([]);
    const e = evaluateProtocol(MINI_BRANCH, { "test.f1": "yes" });
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") expect(e.outcome_key).toBe("out-yes");
  });

  it("decisión sin regla coincidente espera hechos, no reporta ciclo", () => {
    const e = evaluateProtocol(MINI_BRANCH, { "test.f1": "no" });
    expect(e.status).toBe("awaiting_facts");
    if (e.status === "awaiting_facts") {
      expect(e.current_node_key).toBe("dec-no");
    }
  });

  it("validación estructural detecta destinos y actividades rotas", () => {
    const broken: ExecutionProtocol = {
      ...PROTOCOL,
      entry_node_key: "inexistente",
      outcomes: PROTOCOL.outcomes.map((o) => ({
        ...o,
        next_actions: [
          ...o.next_actions,
          { kind: "activity" as const, label: "Rota", activity_key: "no.existe" },
        ],
      })),
    };
    const errors = validateProtocolStructure(broken);
    expect(errors.some((m) => m.includes("entry_node_key"))).toBe(true);
    expect(errors.some((m) => m.includes("no.existe"))).toBe(true);
  });

  it("required_by_mpi no exige resolver factores de recomendación", () => {
    const outcome = PROTOCOL.outcomes.find((o) => o.outcome_key === "required_by_mpi");
    if (!outcome) throw new Error("outcome ausente");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolOutcomeView
          protocol={PROTOCOL}
          activity={{ activityKey: "dpo.need_assessment", humanCode: "D1.02", name: "x" }}
          session={{
            facts: { [MPI]: "implementing" },
            started: true,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          outcome={outcome}
          ruleDescription="Regla de prueba"
          explanation="e"
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Antecedentes pendientes/)).toBeNull();
    expect(screen.getByTestId("guia-outcome-label")).toBeTruthy();
  });

  it("assessment_incomplete enumera el pendiente marcado unknown", () => {
    const outcome = PROTOCOL.outcomes.find(
      (o) => o.outcome_key === "assessment_incomplete",
    );
    if (!outcome) throw new Error("outcome ausente");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolOutcomeView
          protocol={PROTOCOL}
          activity={{ activityKey: "dpo.need_assessment", humanCode: "D1.02", name: "x" }}
          session={{
            facts: facts({ [LARGE]: "unknown" }),
            started: true,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          outcome={outcome}
          ruleDescription="Regla de prueba"
          explanation="e"
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Antecedentes pendientes (1)")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Resolver siguiente antecedente" }),
    ).toBeTruthy();
  });
});

const MINI_YES_NO = (fact: string) => [
  {
    value: "yes",
    label: "Sí",
    fact_effect: { fact_key: fact, value: "yes" },
  },
  {
    value: "no",
    label: "No",
    fact_effect: { fact_key: fact, value: "no" },
  },
  {
    value: "unknown",
    label: "Desconocido",
    fact_effect: { fact_key: fact, value: "unknown" },
  },
];

function miniOutcome(key: string) {
  return {
    outcome_key: key,
    label: key,
    classification: "agency_standard" as const,
    explanation: "e",
    provenance: "agency_standard" as const,
    next_actions: [{ kind: "restart" as const, label: "R" }],
  };
}

const MINI_CHAIN: ExecutionProtocol = {
  protocol_key: "test.chain.v1",
  activity_key: "test.chain_activity",
  version: 1,
  mode: "decision",
  title: "Mini cadena",
  description: "Protocolo sintético con decisión hacia nodo.",
  entry_node_key: "q1",
  decision_fact_keys: ["test.f1", "test.f2"],
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "q1",
      node_type: "question",
      title: "Q1 productora",
      fact_key: "test.f1",
      answer_type: "yes_no_unknown",
      options: MINI_YES_NO("test.f1"),
      required_facts: [],
      default_next_node_key: "dec1",
    },
    {
      node_key: "dec1",
      node_type: "decision",
      title: "Decisión ramificada",
      answer_type: "none",
      transitions: [
        {
          rule_id: "to-q2",
          description: "d",
          when: { op: "fact_equals", fact_key: "test.f1", value: "yes" },
          goto_node_key: "q2",
          explanation: "continúa en q2",
        },
        {
          rule_id: "to-early",
          description: "d",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "out-early",
          explanation: "e",
        },
      ],
    },
    {
      node_key: "q2",
      node_type: "question",
      title: "Q2 dependiente",
      fact_key: "test.f2",
      answer_type: "yes_no_unknown",
      options: MINI_YES_NO("test.f2"),
      required_facts: ["test.f1"],
      default_next_node_key: "dec2",
    },
    {
      node_key: "dec2",
      node_type: "decision",
      title: "Decisión final",
      answer_type: "none",
      transitions: [
        {
          rule_id: "yes-end",
          description: "d",
          when: { op: "fact_equals", fact_key: "test.f2", value: "yes" },
          goto_outcome_key: "out-yes",
          explanation: "e",
        },
        {
          rule_id: "fallback",
          description: "d",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "out-no",
          explanation: "e",
        },
      ],
    },
  ],
  outcomes: [miniOutcome("out-early"), miniOutcome("out-yes"), miniOutcome("out-no")],
};

describe("protocolos no lineales (refactor)", () => {
  it("1. decision → node navega preservando hechos", () => {
    expect(validateProtocolStructure(MINI_CHAIN)).toEqual([]);
    const dec1 = MINI_CHAIN.nodes.find((n) => n.node_key === "dec1");
    if (!dec1) throw new Error("nodo ausente");
    const r = resolveDecisionNode(dec1, { "test.f1": "yes" });
    expect(r).toEqual({ kind: "node", node_key: "q2" });
    // El walk completo atraviesa el nodo intermedio.
    const e = evaluateProtocol(MINI_CHAIN, { "test.f1": "yes", "test.f2": "yes" });
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") expect(e.outcome_key).toBe("out-yes");
  });

  it("2. decision → outcome sigue funcionando", () => {
    const dec1 = MINI_CHAIN.nodes.find((n) => n.node_key === "dec1");
    if (!dec1) throw new Error("nodo ausente");
    const r = resolveDecisionNode(dec1, { "test.f1": "no" });
    expect(r.kind).toBe("outcome");
    const e = evaluateProtocol(MINI_CHAIN, { "test.f1": "no", "test.f2": "no" });
    expect(e.status).toBe("outcome");
    if (e.status === "outcome") expect(e.outcome_key).toBe("out-early");
  });

  it("3. deep link con required facts inyectados abre sin aviso", () => {
    const q2 = MINI_CHAIN.nodes.find((n) => n.node_key === "q2");
    if (!q2 || q2.node_type !== "question") throw new Error("nodo ausente");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolNodeView
          protocol={MINI_CHAIN}
          activity={{ activityKey: "test.chain_activity", humanCode: "T-01", name: "x" }}
          session={{
            facts: { "test.f1": "yes", "test.f2": "no" },
            started: true,
            answer: () => {},
            reset: () => {},
            isProvided: (f) => f === "test.f2",
            providedSource: (f) => (f === "test.f2" ? "Diagnóstico" : null),
          }}
          node={q2}
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("guia-prerequisites")).toBeNull();
    expect(screen.getByTestId("guia-provided")).toBeTruthy();
    expect(screen.getByTestId("guia-option-no").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("4. deep link con fact faltante lista productor y ofrece nodo", () => {
    const q2 = MINI_CHAIN.nodes.find((n) => n.node_key === "q2");
    if (!q2 || q2.node_type !== "question") throw new Error("nodo ausente");
    const missing = getMissingRequiredFacts(MINI_CHAIN, q2, {});
    expect(missing).toHaveLength(1);
    expect(missing[0].fact_key).toBe("test.f1");
    expect(missing[0].state).toBe("absent");
    expect(missing[0].producer?.node_key).toBe("q1");
    expect(firstProducerNodeKey(MINI_CHAIN, ["test.f1"])).toBe("q1");
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolNodeView
          protocol={MINI_CHAIN}
          activity={{ activityKey: "test.chain_activity", humanCode: "T-01", name: "x" }}
          session={{
            facts: {},
            started: false,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          node={q2}
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Para resolver este punto faltan antecedentes previos."),
    ).toBeTruthy();
    expect(screen.getByText("Q1 productora")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Ir al nodo que produce/ })
        .getAttribute("href"),
    ).toContain("/q1");
  });

  it("5. fact unknown se distingue de ausente y de resuelto", () => {
    expect(getFactState({}, "test.f1")).toBe("absent");
    expect(getFactState({ "test.f1": "unknown" }, "test.f1")).toBe("unknown");
    expect(getFactState({ "test.f1": "yes" }, "test.f1")).toBe("resolved");
    const q2 = MINI_CHAIN.nodes.find((n) => n.node_key === "q2");
    if (!q2 || q2.node_type !== "question") throw new Error("nodo ausente");
    const missing = getMissingRequiredFacts(MINI_CHAIN, q2, { "test.f1": "unknown" });
    expect(missing).toHaveLength(1);
    expect(missing[0].state).toBe("unknown");
    // unknown no se convierte en false: la decisión no concluye por esa vía.
    const dec1 = MINI_CHAIN.nodes.find((n) => n.node_key === "dec1");
    if (!dec1) throw new Error("nodo ausente");
    const r = resolveDecisionNode(dec1, { "test.f1": "unknown" });
    expect(r.kind).toBe("outcome");
    if (r.kind === "outcome") expect(r.rule.rule_id).toBe("to-early");
  });

  it("6. nodo posterior accesible sin responder no-dependencias", () => {
    const q1 = MINI_CHAIN.nodes.find((n) => n.node_key === "q1");
    if (!q1 || q1.node_type !== "question") throw new Error("nodo ausente");
    expect(getMissingRequiredFacts(MINI_CHAIN, q1, {})).toEqual([]);
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolNodeView
          protocol={MINI_CHAIN}
          activity={{ activityKey: "test.chain_activity", humanCode: "T-01", name: "x" }}
          session={{
            facts: {},
            started: false,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          node={q1}
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("guia-prerequisites")).toBeNull();
    expect(screen.getByTestId("guia-option-yes")).toBeTruthy();
  });

  it("7. referencias inválidas y ciclos se detectan en validación", () => {
    const ghost = MINI_CHAIN.nodes.map((n) =>
      n.node_key === "dec1"
        ? {
            ...n,
            transitions: [
              {
                rule_id: "x",
                description: "d",
                when: { op: "all" as const, conditions: [] },
                goto_node_key: "fantasma",
                explanation: "e",
              },
            ],
          }
        : n,
    );
    expect(
      validateProtocolStructure({ ...MINI_CHAIN, nodes: ghost }).some((m) =>
        m.includes("fantasma"),
      ),
    ).toBe(true);
    const badFact = MINI_CHAIN.nodes.map((n) =>
      n.node_key === "q2" ? { ...n, required_facts: ["test.fantasma"] } : n,
    );
    expect(
      validateProtocolStructure({ ...MINI_CHAIN, nodes: badFact }).some((m) =>
        m.includes("test.fantasma"),
      ),
    ).toBe(true);
    const loop = MINI_CHAIN.nodes.map((n) =>
      n.node_key === "q1" ? { ...n, default_next_node_key: "q1" } : n,
    );
    expect(
      validateProtocolStructure({ ...MINI_CHAIN, nodes: loop }).some((m) =>
        m.includes("ciclo"),
      ),
    ).toBe(true);
    // Facts externos declarados son válidos.
    const external = MINI_CHAIN.nodes.map((n) =>
      n.node_key === "q2" ? { ...n, required_facts: ["ext.f"] } : n,
    );
    expect(
      validateProtocolStructure({
        ...MINI_CHAIN,
        nodes: external,
        external_fact_keys: ["ext.f"],
      }).filter((m) => m.includes("ext.f")),
    ).toEqual([]);
  });

  it("regla coincidente sin destino se reporta misconfigured", () => {
    const bad = {
      node_key: "dec-bad",
      node_type: "decision" as const,
      title: "Bad",
      answer_type: "none" as const,
      transitions: [
        {
          rule_id: "x",
          description: "d",
          when: { op: "all" as const, conditions: [] },
          explanation: "e",
        },
      ],
    };
    expect(resolveDecisionNode(bad, {})).toEqual({
      kind: "misconfigured",
      detail: "regla x sin destino",
    });
  });

  it("D1.02 declara required_facts sin cambiar reglas ni outcomes", () => {
    for (const n of PROTOCOL.nodes) {
      expect(Array.isArray(n.required_facts), n.node_key).toBe(true);
    }
    const final = PROTOCOL.nodes.find((n) => n.node_key === "final-decision");
    expect(final?.required_facts).toHaveLength(8);
    expect(validateProtocolStructure(PROTOCOL)).toEqual([]);
    // Los 5 outcomes se siguen produciendo idénticos.
    expect(mustOutcome(facts({ [MPI]: "implementing" })).outcome_key).toBe(
      "required_by_mpi",
    );
    expect(
      mustOutcome(facts({ [HIGH]: "yes", [LARGE]: "yes" })).outcome_key,
    ).toBe("strongly_recommended");
    expect(
      mustOutcome(facts({ [HIGH]: "yes", [TRANSFERS]: "yes" })).outcome_key,
    ).toBe("recommended");
    expect(mustOutcome(facts()).outcome_key).toBe("not_priority");
    expect(
      mustOutcome(facts({ [LARGE]: "unknown" })).outcome_key,
    ).toBe("assessment_incomplete");
  });
});
