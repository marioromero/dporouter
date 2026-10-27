import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL } from "../content/protocols/governance.preventive_framework";
import { DPO_NEED_ASSESSMENT_PROTOCOL } from "../content/protocols/dpo.need_assessment";
import { MPI_NEED_ASSESSMENT_PROTOCOL } from "../content/protocols/mpi.need_assessment";
import { validateProtocolStructure } from "../content/protocols/registry";
import { ProtocolNodeView } from "../src/components/ProtocolView";
import { WorkspaceProvider } from "../src/workspace/context";
import type { GuidanceNode } from "../content/protocols/types";

/**
 * Ayudas desplegables de revisión (`evidence_review_help`) de los nodos de
 * D1.01 con ayudas (role-gate, identify-actions, determine-gaps): contenido
 * canónico, validación estructural y acordeón exclusivo en la vista de nodo.
 */

const P01 = GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL;
const ROLE_GATE_ITEMS = [
  "inventario de tratamientos",
  "evaluación de roles por tratamiento",
];

function node(key: string): GuidanceNode {
  const n = P01.nodes.find((x) => x.node_key === key);
  if (!n) throw new Error(`nodo ausente: ${key}`);
  return n;
}

function renderNode(n: GuidanceNode) {
  return render(
    <MemoryRouter>
      <WorkspaceProvider>
        <ProtocolNodeView
          protocol={P01}
          activity={{
            activityKey: P01.activity_key,
            humanCode: "D1.01",
            name: "Establecer marco general de prevención",
          }}
          session={{
            facts: {},
            started: false,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          node={n}
        />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

const P02 = DPO_NEED_ASSESSMENT_PROTOCOL;
const MPI_STATUS_ITEMS = [
  "acuerdo, acta o evidencia de adopción",
  "registro interno del lifecycle MPI",
  "programa MPI existente",
  "evidencia de implementación",
];

function renderNode02(n: GuidanceNode) {
  return render(
    <MemoryRouter>
      <WorkspaceProvider>
        <ProtocolNodeView
          protocol={P02}
          activity={{
            activityKey: P02.activity_key,
            humanCode: "D1.02",
            name: "Evaluar necesidad y recomendación de DPO",
          }}
          session={{
            facts: {},
            started: false,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          node={n}
        />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

function node02(key: string): GuidanceNode {
  const n = P02.nodes.find((x) => x.node_key === key);
  if (!n) throw new Error(`nodo ausente: ${key}`);
  return n;
}

const P03 = MPI_NEED_ASSESSMENT_PROTOCOL;

function renderNode03(n: GuidanceNode) {
  return render(
    <MemoryRouter>
      <WorkspaceProvider>
        <ProtocolNodeView
          protocol={P03}
          activity={{
            activityKey: P03.activity_key,
            humanCode: "D1.03",
            name: "Evaluar conveniencia de adoptar MPI",
          }}
          session={{
            facts: {},
            started: false,
            answer: () => {},
            reset: () => {},
            isProvided: () => false,
            providedSource: () => null,
          }}
          node={n}
        />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

function node03(key: string): GuidanceNode {
  const n = P03.nodes.find((x) => x.node_key === key);
  if (!n) throw new Error(`nodo ausente: ${key}`);
  return n;
}

describe("evidence_review_help D1.02 high-impact-data: contenido canónico", () => {
  const HIGH_IMPACT_ITEMS = [
    "inventario de tratamientos",
    "categorías de datos",
    "formularios",
    "sistemas",
    "contratos o procesos relevantes",
  ];

  it("las cinco ayudas referencian exactamente los elementos canónicos", () => {
    const highImpact = node02("high-impact-data");
    expect(highImpact.evidence_to_review).toEqual(HIGH_IMPACT_ITEMS);
    expect(
      (highImpact.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(HIGH_IMPACT_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("high-impact-data").evidence_review_help ?? [];
    expect(helps).toHaveLength(5);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("los datos sensibles, menores y económicos Título III se distinguen, no se equiparan", () => {
    const helps = node02("high-impact-data").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "Distinguir las categorías según su naturaleza y fundamento jurídico",
    );
    expect(helps[4].no_evidence_guidance).toContain(
      "Distinguir entre una referencia contractual, una actividad prevista y un tratamiento efectivamente realizado.",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 high-impact-data: vista de nodo", () => {
  const HIGH_IMPACT_ITEMS = [
    "inventario de tratamientos",
    "categorías de datos",
    "formularios",
    "sistemas",
    "contratos o procesos relevantes",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("high-impact-data"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(5);
    helps.forEach((help, i) => {
      expect(within(help).getByText(HIGH_IMPACT_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("high-impact-data"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[1]).getByText("categorías de datos"));
    expect(helps[1].hasAttribute("open")).toBe(true);
    expect(helps[4].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[4]).getByText("contratos o procesos relevantes"));
    expect(helps[1].hasAttribute("open")).toBe(false);
    expect(helps[4].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[4]).getByText("contratos o procesos relevantes"));
    expect(helps[1].hasAttribute("open")).toBe(false);
    expect(helps[4].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("high-impact-data"));
    const [first, , , fourth, fifth] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, fourth, fifth]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar el inventario para identificar los tratamientos en los que la organización actúa como responsable y comprobar qué categorías de datos se recogen, utilizan, conservan, comunican o de otro modo se tratan. Identificar al menos un tratamiento concreto que pueda incluir alguna de las categorías consideradas por este criterio metodológico. Comprobar la finalidad, las personas afectadas y las fuentes de información disponibles, y contrastar el inventario con otras evidencias cuando existan dudas sobre su actualidad o cobertura.",
      ),
    ).toBeTruthy();
    expect(
      within(fourth).getByText(
        "Indicar qué sistemas o fuentes no pudieron revisarse y qué categorías no pudieron verificarse. Distinguir entre una capacidad técnica que permitiría tratar determinados datos y evidencia de que efectivamente se tratan. Si no se dispone de acceso directo, identificar la documentación o confirmación de los responsables del sistema que permitiría aclarar la situación.",
      ),
    ).toBeTruthy();
    expect(
      within(fifth).getByText(
        "Una valoración de los contratos y procesos examinados que identifique las categorías de impacto especial respaldadas por evidencia, los tratamientos relacionados y las cuestiones pendientes de confirmar.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 mpi-status: contenido canónico", () => {
  it("las cuatro ayudas referencian exactamente los elementos canónicos", () => {
    const mpiStatus = node02("mpi-status");
    expect(mpiStatus.evidence_to_review).toEqual(MPI_STATUS_ITEMS);
    expect((mpiStatus.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual(
      MPI_STATUS_ITEMS,
    );
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("mpi-status").evidence_review_help ?? [];
    expect(helps).toHaveLength(4);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("los textos de ayuda conservan los apartados acordados", () => {
    const helps = node02("mpi-status").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "Distinguir la decisión formal de estudiar o preparar un modelo de la decisión de adoptarlo.",
    );
    expect(helps[1].review_guide).toContain(
      "Diferenciar las etapas de evaluación, preparación, adopción e implementación",
    );
    expect(helps[2].review_guide).toContain(
      "artículo 49 de la Ley N.º 19.628, según la modificación de la Ley N.º 21.719, y el Decreto N.º 662 de 2026",
    );
    expect(helps[3].expected_result).toContain(
      "las brechas entre el estado declarado y el estado observado",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 mpi-status: vista de nodo", () => {
  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("mpi-status"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(4);
    helps.forEach((help, i) => {
      expect(within(help).getByText(MPI_STATUS_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("mpi-status"));
    const [first, , third] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(MPI_STATUS_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(third.hasAttribute("open")).toBe(false);
    fireEvent.click(within(third).getByText(MPI_STATUS_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(true);
    fireEvent.click(within(third).getByText(MPI_STATUS_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("mpi-status"));
    const [first, second, , fourth] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second, fourth]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar los acuerdos, actas, decisiones de la autoridad competente u otros antecedentes que permitan determinar si la organización adoptó formalmente un Modelo de Prevención de Infracciones. Comprobar quién tomó la decisión, su fecha, el alcance de la adopción y si los antecedentes se refieren expresamente a un programa de cumplimiento identificable. Distinguir la decisión formal de estudiar o preparar un modelo de la decisión de adoptarlo.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Registrar que no se encontró evidencia suficiente para confirmar la adopción formal y señalar qué antecedentes permitirían verificarla, por ejemplo, actas, acuerdos de dirección o documentación del programa. No concluir automáticamente que el MPI no existe por la ausencia de un acta específica: considerar otras evidencias verificables y dejar constancia de las limitaciones de la revisión.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Una descripción verificable del estado del MPI según los antecedentes disponibles, con sus principales hitos, fechas, cambios de estado y brechas de información, sin atribuirle etapas que no estén respaldadas.",
      ),
    ).toBeTruthy();
    expect(
      within(fourth).getByText(
        "Una valoración del grado de implementación que pueda sostenerse con la evidencia disponible, indicando las actividades verificadas, las que están pendientes o no pudieron comprobarse y las brechas entre el estado declarado y el estado observado.",
      ),
    ).toBeTruthy();
  });

  it("un nodo sin ayudas conserva la lista simple de Qué revisar", () => {
    renderNode02(node02("final-decision"));
    expect(screen.queryAllByTestId("guia-evidence-help")).toEqual([]);
  });
});

describe("evidence_review_help D1.02 privacy-maturity: contenido canónico", () => {
  const MATURITY_ITEMS = [
    "inventario",
    "política",
    "atención de derechos",
    "contratos con encargados",
    "gestión de incidentes",
    "capacitación",
    "EIPD",
  ];

  it("las siete ayudas referencian exactamente los elementos canónicos", () => {
    const maturity = node02("privacy-maturity");
    expect(maturity.evidence_to_review).toEqual(MATURITY_ITEMS);
    expect((maturity.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual(
      MATURITY_ITEMS,
    );
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("privacy-maturity").evidence_review_help ?? [];
    expect(helps).toHaveLength(7);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("declara expresamente la regla metodológica interna 3 de 7 sin atribuirla a la ley", () => {
    const helps = node02("privacy-maturity").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "se considera baja madurez operacional cuando al menos 3 de las 7 áreas revisadas están inexistentes o son informales",
    );
    expect(helps[0].review_guide).toContain(
      "esa regla es un estándar metodológico interno de la agencia y no una clasificación ni un umbral establecido por la ley",
    );
    expect(helps[0].review_guide).toContain(
      "no exige que las siete áreas estén en la misma condición",
    );
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/el ?(artículo|reglamento) (15 bis|\S+ \S*) exige/);
    expect(all).not.toMatch(/\bLey N\.º 21\.719\b[^.]*obliga/);
  });

  it("distinguen formalizado, informal e inexistente sin imponer documentos ni frecuencias", () => {
    const helps = node02("privacy-maturity").evidence_review_help ?? [];
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).toContain("inexistente, informal o formalizado");
    expect(all).not.toMatch(/plazo legal de \d+/);
    expect(all).not.toMatch(/cada \d+ meses/);
    expect(helps[6].review_guide).toContain(
      "Distinguir una evaluación de impacto efectivamente realizada de una plantilla, borrador o intención de realizarla.",
    );
  });

  it("la falta de documentos no se presenta como prueba de inexistencia", () => {
    const helps = node02("privacy-maturity").evidence_review_help ?? [];
    for (const h of helps) {
      expect(h.no_evidence_guidance).toMatch(/contrastar|No conclus/i);
    }
    expect(helps[0].no_evidence_guidance).toContain(
      "No localizar documentación no demuestra automáticamente que la práctica sea inexistente",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 privacy-maturity: vista de nodo", () => {
  const MATURITY_ITEMS = [
    "inventario",
    "política",
    "atención de derechos",
    "contratos con encargados",
    "gestión de incidentes",
    "capacitación",
    "EIPD",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("privacy-maturity"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(7);
    helps.forEach((help, i) => {
      expect(within(help).getByText(MATURITY_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("privacy-maturity"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("inventario"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[6].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[6]).getByText("EIPD"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[6].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[6]).getByText("EIPD"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[6].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("privacy-maturity"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    for (const help of helps) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(helps[1]).getByText(
        "Revisar si existen políticas o reglas internas de protección de datos, si están aprobadas o comunicadas cuando corresponda y si guían efectivamente las prácticas. No asumir que una política es eficaz solo porque exista un documento.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[2]).getByText(
        "Revisar si existe un procedimiento para recibir, derivar, responder y hacer seguimiento a solicitudes de los titulares, con evidencia proporcional a la actividad de la organización. Distinguir un proceso definido y operativo de una atención improvisada o informal. No inventar plazos legales ni requisitos adicionales.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 processor-complexity: contenido canónico", () => {
  const COMPLEXITY_ITEMS = [
    "inventario de encargados",
    "contratos",
    "subencargados",
    "diagramas de flujo",
  ];

  it("las cuatro ayudas referencian exactamente los elementos canónicos", () => {
    const complexity = node02("processor-complexity");
    expect(complexity.evidence_to_review).toEqual(COMPLEXITY_ITEMS);
    expect((complexity.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual(
      COMPLEXITY_ITEMS,
    );
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("processor-complexity").evidence_review_help ?? [];
    expect(helps).toHaveLength(4);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("conservan el umbral metodológico interno sin atribuirlo a la ley", () => {
    const helps = node02("processor-complexity").evidence_review_help ?? [];
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).toContain(
      "responder Sí cuando existan al menos dos encargados activos relevantes o una cadena de subencargamiento",
    );
    expect(all).not.toMatch(/el ?\s*ley (exige|establece)|obligación legal de (nombrar|designar)/);
    expect(all).not.toMatch(/artículo 15 bis/);
  });

  it("distinguen contrato vigente, servicio activo y tratamiento comprobado", () => {
    const helps = node02("processor-complexity").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "La falta de un contrato localizado no demuestra que no exista relación operativa.",
    );
    expect(helps[2].review_guide).toContain(
      "No asumir que toda cadena está autorizada solo porque el proveedor la mencione.",
    );
    expect(helps[3].review_guide).toContain(
      "Un diagrama desactualizado o meramente ilustrativo no confirma por sí solo una relación activa.",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 processor-complexity: vista de nodo", () => {
  const COMPLEXITY_ITEMS = [
    "inventario de encargados",
    "contratos",
    "subencargados",
    "diagramas de flujo",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("processor-complexity"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(4);
    helps.forEach((help, i) => {
      expect(within(help).getByText(COMPLEXITY_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("processor-complexity"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("inventario de encargados"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[3].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[3]).getByText("diagramas de flujo"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[3].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[3]).getByText("diagramas de flujo"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[3].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("processor-complexity"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    for (const help of helps) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(helps[0]).getByText(
        "Revisar qué personas o entidades externas tratan datos personales por cuenta de la organización, qué servicios prestan y si la relación sigue activa. Identificar los encargados relevantes para los tratamientos evaluados. No contar automáticamente a proveedores sin acceso o tratamiento de datos personales como encargados. Para aplicar la regla metodológica interna, contar los encargados activos relevantes y registrar las cadenas de subencargamiento que existan.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[2]).getByText(
        "Una descripción de las cadenas de subencargamiento confirmadas, sus niveles y las delegaciones pendientes de verificación.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[3]).getByText(
        "Una representación de la estructura de encargados respaldada por evidencia, con las relaciones confirmadas y las fuentes pendientes de contrastar.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 international-transfers: contenido canónico", () => {
  const TRANSFERS_ITEMS = [
    "proveedores cloud",
    "matrices o filiales",
    "plataformas",
    "encargados extranjeros",
    "almacenamiento o acceso desde otro país",
  ];

  it("las cinco ayudas referencian exactamente los elementos canónicos", () => {
    const transfers = node02("international-transfers");
    expect(transfers.evidence_to_review).toEqual(TRANSFERS_ITEMS);
    expect((transfers.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual(
      TRANSFERS_ITEMS,
    );
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("international-transfers").evidence_review_help ?? [];
    expect(helps).toHaveLength(5);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("no infieren el flujo internacional desde nacionalidad, relación societaria o capacidad", () => {
    const helps = node02("international-transfers").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "No inferir la ubicación de los datos únicamente a partir de la nacionalidad o del domicilio comercial del proveedor.",
    );
    expect(helps[1].review_guide).toContain(
      "Diferenciar la existencia de una relación societaria de la evidencia de un flujo real de datos: pertenecer al mismo grupo no demuestra por sí solo que exista esa transferencia.",
    );
    expect(helps[3].review_guide).toContain(
      "No dar por probado un flujo internacional solo porque el proveedor o encargado esté constituido en el extranjero.",
    );
    expect(helps[4].review_guide).toContain(
      "Distinguir entre una ubicación confirmada, un acceso posible y una hipótesis aún no verificada.",
    );
  });

  it("la falta de evidencia no se presenta como prueba de inexistencia", () => {
    const helps = node02("international-transfers").evidence_review_help ?? [];
    expect(helps[0].no_evidence_guidance).toContain(
      "no concluir que no existen transferencias",
    );
    expect(helps[4].no_evidence_guidance).toContain(
      "sin concluir que el flujo existe o no existe",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 international-transfers: vista de nodo", () => {
  const TRANSFERS_ITEMS = [
    "proveedores cloud",
    "matrices o filiales",
    "plataformas",
    "encargados extranjeros",
    "almacenamiento o acceso desde otro país",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("international-transfers"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(5);
    helps.forEach((help, i) => {
      expect(within(help).getByText(TRANSFERS_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("international-transfers"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("proveedores cloud"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[4].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[4]).getByText("almacenamiento o acceso desde otro país"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[4].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[4]).getByText("almacenamiento o acceso desde otro país"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[4].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("international-transfers"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    for (const help of helps) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(helps[0]).getByText(
        "Revisar los proveedores que almacenan, alojan o procesan datos personales: la entidad contratante, las ubicaciones de almacenamiento y procesamiento disponibles y la documentación contractual o técnica que permita identificar los países involucrados. No inferir la ubicación de los datos únicamente a partir de la nacionalidad o del domicilio comercial del proveedor.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[1]).getByText(
        "Una identificación de las entidades del grupo pertinentes, los flujos de datos respaldados por evidencia y las relaciones que permanecen sin confirmar.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[4]).getByText(
        "Una valoración de las ubicaciones y accesos transfronterizos respaldados por registros, diferenciando lo confirmado de lo posible y de lo no verificado.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 systematic-public-monitoring: contenido canónico", () => {
  const MONITORING_ITEMS = [
    "videovigilancia",
    "seguimiento sistemático",
    "analítica asociada",
    "tecnologías equivalentes",
  ];

  it("las cuatro ayudas referencian exactamente los elementos canónicos", () => {
    const monitoring = node02("systematic-public-monitoring");
    expect(monitoring.evidence_to_review).toEqual(MONITORING_ITEMS);
    expect(
      (monitoring.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(MONITORING_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("systematic-public-monitoring").evidence_review_help ?? [];
    expect(helps).toHaveLength(4);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("distinguen las cuatro evidencias entre sí", () => {
    const helps = node02("systematic-public-monitoring").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "Distinguir la videovigilancia de espacios de acceso público del monitoreo limitado a espacios privados",
    );
    expect(helps[1].review_guide).toContain(
      "Distinguir un seguimiento estructurado de una observación ocasional o de una actuación puntual ante un incidente.",
    );
    expect(helps[3].review_guide).toContain(
      "tecnologías distintas de las cámaras convencionales",
    );
  });

  it("no equiparan capacidad técnica con monitoreo sistemático efectivo", () => {
    const helps = node02("systematic-public-monitoring").evidence_review_help ?? [];
    expect(helps[1].no_evidence_guidance).toContain(
      "No inferir monitoreo sistemático únicamente porque exista personal de seguridad, una cámara instalada o una herramienta capaz de registrar actividad.",
    );
    expect(helps[2].review_guide).toContain(
      "Distinguir entre una capacidad técnica que el sistema ofrece y una función que realmente está habilitada y se utiliza.",
    );
    expect(helps[2].no_evidence_guidance).toContain(
      "No presumir que existe reconocimiento facial, identificación individual o elaboración de perfiles por el solo hecho de utilizar cámaras o software de analítica.",
    );
    expect(helps[3].no_evidence_guidance).toContain(
      "No inferir que existe monitoreo por la mera presencia de sensores, redes inalámbricas o equipos capaces de recoger datos.",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 systematic-public-monitoring: vista de nodo", () => {
  const MONITORING_ITEMS = [
    "videovigilancia",
    "seguimiento sistemático",
    "analítica asociada",
    "tecnologías equivalentes",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("systematic-public-monitoring"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(4);
    helps.forEach((help, i) => {
      expect(within(help).getByText(MONITORING_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("systematic-public-monitoring"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("videovigilancia"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[3].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[3]).getByText("tecnologías equivalentes"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[3].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[3]).getByText("tecnologías equivalentes"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[3].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("systematic-public-monitoring"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    for (const help of helps) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(helps[0]).getByText(
        "Revisar si la organización utiliza cámaras u otros sistemas de captación de imágenes para observar zonas a las que puede acceder el público, como entradas, salas de atención, establecimientos, estacionamientos o espacios exteriores. Identificar qué zonas se observan, la finalidad del sistema, su cobertura, la frecuencia de captación y si las imágenes se graban, conservan, consultan o comunican a terceros. Comprobar si el sistema funciona de forma continua, periódica o solo ante eventos concretos, y quién tiene acceso a las imágenes. Distinguir la videovigilancia de espacios de acceso público del monitoreo limitado a espacios privados, sin asumir que la ubicación de una cámara demuestra por sí sola el alcance real del tratamiento.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[1]).getByText(
        "Una caracterización respaldada del seguimiento detectado, su regularidad, duración, cobertura, finalidad y relación con una zona de acceso público, diferenciando la observación ocasional del monitoreo sistemático.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[2]).getByText(
        "Una identificación de las funciones analíticas efectivamente utilizadas, los datos procesados, los resultados generados y sus finalidades, distinguiendo las capacidades técnicas de las funciones comprobadas y señalando las cuestiones pendientes.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[3]).getByText(
        "Una relación de las tecnologías pertinentes identificadas, sus ubicaciones, datos recogidos, finalidades y funcionamiento real, junto con la evidencia disponible y las verificaciones pendientes.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 automated-significant-effects: contenido canónico", () => {
  const AUTOMATED_ITEMS = [
    "scoring",
    "perfiles",
    "decisiones automatizadas",
    "elegibilidad",
    "rechazo automático",
    "decisiones laborales",
    "acceso a productos o servicios",
  ];

  it("las siete ayudas referencian exactamente los elementos canónicos", () => {
    const automated = node02("automated-significant-effects");
    expect(automated.evidence_to_review).toEqual(AUTOMATED_ITEMS);
    expect(
      (automated.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(AUTOMATED_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("automated-significant-effects").evidence_review_help ?? [];
    expect(helps).toHaveLength(7);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("distinguen la existencia de automatización de sus efectos sobre las personas", () => {
    const helps = node02("automated-significant-effects").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "No asumir que una puntuación produce efectos significativos por el mero hecho de existir.",
    );
    expect(helps[1].review_guide).toContain(
      "No asumir que toda segmentación estadística constituye automáticamente un perfil individual con efectos significativos.",
    );
    expect(helps[2].review_guide).toContain(
      "No considerar que la mera participación de una herramienta automatizada convierte todo el proceso en una decisión automatizada con efectos significativos.",
    );
    expect(helps[4].review_guide).toContain(
      "Distinguir entre un rechazo definitivo, una alerta, un filtro preliminar o una recomendación que debe ser valorada por una persona.",
    );
  });

  it("la intervención humana se valora por su realidad, no por su mera formalidad", () => {
    const helps = node02("automated-significant-effects").evidence_review_help ?? [];
    expect(helps[2].no_evidence_guidance).toContain(
      "No presumir que existe revisión humana efectiva solo porque el procedimiento incluya formalmente una etapa de aprobación.",
    );
    expect(helps[2].review_guide).toContain(
      "Distinguir entre la automatización de tareas auxiliares, una recomendación que revisa una persona y una decisión que se ejecuta sin intervención humana efectiva.",
    );
  });

  it("no inventa umbrales numéricos ni criterios jurídicos propios", () => {
    const helps = node02("automated-significant-effects").evidence_review_help ?? [];
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/\bse exige\b|\bes obligatorio\b|\bcontraviene la ley\b/);
    expect(all).not.toMatch(/\d+\s*(%|reglas|campos)/);
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 automated-significant-effects: vista de nodo", () => {
  const AUTOMATED_ITEMS = [
    "scoring",
    "perfiles",
    "decisiones automatizadas",
    "elegibilidad",
    "rechazo automático",
    "decisiones laborales",
    "acceso a productos o servicios",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("automated-significant-effects"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(7);
    helps.forEach((help, i) => {
      expect(within(help).getByText(AUTOMATED_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("automated-significant-effects"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("scoring"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[6].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[6]).getByText("acceso a productos o servicios"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[6].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[6]).getByText("acceso a productos o servicios"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[6].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("automated-significant-effects"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    for (const help of helps) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(helps[0]).getByText(
        "Indicar si no se ha podido confirmar que existan puntuaciones, si se desconoce cómo se calculan o si no se ha determinado cómo se utilizan. Identificar qué documentación o confirmación del responsable del proceso permitiría aclararlo. No inferir la existencia de scoring por el simple uso de software, inteligencia artificial o herramientas analíticas.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[2]).getByText(
        "Una descripción del proceso decisorio, el grado real de automatización, la intervención humana existente y las consecuencias que puede producir sobre las personas, distinguiendo los hechos confirmados de las cuestiones pendientes.",
      ),
    ).toBeTruthy();
    expect(
      within(helps[6]).getByText(
        "Indicar si no se ha podido confirmar el uso de automatización para determinar el acceso, si se desconocen los criterios aplicados o si no está claro el impacto de los resultados. Identificar qué reglas comerciales, procedimientos, registros de solicitudes o documentación del sistema permitirían aclararlo. No inferir que existe una decisión automatizada significativa únicamente porque una organización venda productos o preste servicios por canales digitales.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.02 large-scale: contenido canónico", () => {
  const LARGE_SCALE_ITEMS = [
    "número aproximado de titulares",
    "volumen de datos",
    "duración",
    "extensión geográfica",
    "continuidad del tratamiento",
    "clasificación de escala documentada",
  ];

  it("las seis ayudas referencian exactamente los elementos canónicos", () => {
    const largeScale = node02("large-scale");
    expect(largeScale.evidence_to_review).toEqual(LARGE_SCALE_ITEMS);
    expect(
      (largeScale.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(LARGE_SCALE_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node02("large-scale").evidence_review_help ?? [];
    expect(helps).toHaveLength(6);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la valoración conjunta se mantiene y no se usa una dimensión aislada como regla automática", () => {
    const helps = node02("large-scale").evidence_review_help ?? [];
    for (const h of helps) {
      expect(h.no_evidence_guidance).not.toMatch(/debe responder\s*(Sí|No)/);
    }
  });

  it("la ayuda de clasificación documentada registra la ausencia sin forzar conclusión", () => {
    const helps = node02("large-scale").evidence_review_help ?? [];
    expect(helps[5].no_evidence_guidance).toContain(
      "dejar constancia de esa limitación",
    );
    expect(helps[5].expected_result).toContain(
      "o una descripción clara de su ausencia, insuficiencia o falta de vigencia",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.02", () => {
    expect(validateProtocolStructure(P02)).toEqual([]);
  });
});

describe("evidence_review_help D1.02 large-scale: vista de nodo", () => {
  const LARGE_SCALE_ITEMS = [
    "número aproximado de titulares",
    "volumen de datos",
    "duración",
    "extensión geográfica",
    "continuidad del tratamiento",
    "clasificación de escala documentada",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode02(node02("large-scale"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(6);
    helps.forEach((help, i) => {
      expect(within(help).getByText(LARGE_SCALE_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode02(node02("large-scale"));
    const helps = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(helps[0]).getByText("número aproximado de titulares"));
    expect(helps[0].hasAttribute("open")).toBe(true);
    expect(helps[5].hasAttribute("open")).toBe(false);
    fireEvent.click(within(helps[5]).getByText("clasificación de escala documentada"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[5].hasAttribute("open")).toBe(true);
    fireEvent.click(within(helps[5]).getByText("clasificación de escala documentada"));
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[5].hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode02(node02("large-scale"));
    const [first, , third, , fifth, sixth] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, third, fifth, sixth]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar las fuentes disponibles para estimar cuántas personas son titulares de los datos en el tratamiento evaluado. Utilizar cifras, rangos o estimaciones respaldadas por registros, informes, métricas del sistema u otras fuentes verificables. Identificar el período al que corresponde la cifra y comprobar que se refiere a personas titulares, sin confundirlas automáticamente con el número de registros, transacciones o interacciones. Valorar esta dimensión junto con el volumen, la duración, la extensión geográfica y la continuidad del tratamiento.",
      ),
    ).toBeTruthy();
    expect(
      within(third).getByText(
        "Indicar si no está definida la duración, si solo se dispone de plazos parciales o si no puede confirmarse el período real de actividad o conservación. Identificar qué documentación o confirmación permitiría aclararlo. No asumir que un tratamiento es breve porque una operación sea puntual, ni que es prolongado únicamente porque los datos puedan conservarse técnicamente.",
      ),
    ).toBeTruthy();
    expect(
      within(fifth).getByText(
        "Indicar si no existen registros suficientes para establecer la frecuencia o regularidad, o si la documentación disponible solo describe el proceso previsto. Identificar qué información operativa permitiría confirmar cómo se realiza realmente el tratamiento. No considerar que un sistema permanentemente disponible demuestra por sí solo que el tratamiento sea continuo.",
      ),
    ).toBeTruthy();
    expect(
      within(sixth).getByText(
        "Precisar si no existe una clasificación documentada, si la clasificación encontrada carece de justificación suficiente o si está desactualizada o corresponde a otro tratamiento. Cuando no exista una clasificación utilizable, dejar constancia de esa limitación y valorar las dimensiones de escala a partir de las evidencias disponibles, sin inventar umbrales numéricos ni presentar una estimación no respaldada como una clasificación formal.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.01 role-gate: contenido canónico", () => {
  it("las dos ayudas referencian exactamente los elementos canónicos en minúscula", () => {
    const roleGate = node("role-gate");
    expect(roleGate.evidence_to_review).toEqual(ROLE_GATE_ITEMS);
    expect(
      (roleGate.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(ROLE_GATE_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node("role-gate").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("validateProtocolStructure sigue sin errores para D1.01", () => {
    expect(validateProtocolStructure(P01)).toEqual([]);
  });

  it("una ayuda que referencia un elemento inexistente es error de configuración", () => {
    const broken = {
      ...P01,
      nodes: P01.nodes.map((n) =>
        n.node_key === "role-gate"
          ? {
              ...n,
              evidence_review_help: [
                ...(n.evidence_review_help ?? []),
                { evidence_item: "elemento fantasma", review_guide: "x" },
              ],
            }
          : n,
      ),
    };
    const errors = validateProtocolStructure(broken);
    expect(
      errors.some(
        (e) =>
          e.includes("role-gate") && e.includes("elemento fantasma") && e.includes("inexistente"),
      ),
    ).toBe(true);
  });

  it("dos ayudas para el mismo elemento son error de configuración", () => {
    const first = (node("role-gate").evidence_review_help ?? [])[0];
    const duplicated = {
      ...P01,
      nodes: P01.nodes.map((n) =>
        n.node_key === "role-gate"
          ? {
              ...n,
              evidence_review_help: [...(n.evidence_review_help ?? []), first],
            }
          : n,
      ),
    };
    const errors = validateProtocolStructure(duplicated);
    expect(
      errors.some((e) => e.includes("duplicada") && e.includes(first.evidence_item)),
    ).toBe(true);
  });
});

describe("evidence_review_help D1.01 role-gate: vista de nodo", () => {
  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode(node("role-gate"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    expect(within(helps[0]).getByText(ROLE_GATE_ITEMS[0])).toBeTruthy();
    expect(within(helps[1]).getByText(ROLE_GATE_ITEMS[1])).toBeTruthy();
    expect(helps[0].hasAttribute("open")).toBe(false);
    expect(helps[1].hasAttribute("open")).toBe(false);
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode(node("role-gate"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(ROLE_GATE_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(ROLE_GATE_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(ROLE_GATE_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode(node("role-gate"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar las fuentes disponibles para identificar las actividades en las que la organización utiliza datos personales. Examinar procesos, documentos y sistemas, como los de clientes, trabajadores o proveedores. La información puede estar distribuida en distintas fuentes y no tiene que existir en un único inventario.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Ampliar la revisión a otras fuentes disponibles y registrar qué información falta. No disponer de un inventario formal no demuestra que no existan tratamientos.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Una relación inicial de los tratamientos identificados y de las cuestiones pendientes de confirmar.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Para cada tratamiento identificado, analizar qué papel desempeña la organización y quién decide cómo y para qué se utilizan los datos personales. Contrastar la operativa real con los contratos y demás antecedentes disponibles, sin basarse únicamente en las denominaciones utilizadas por las partes.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Registrar qué información falta y mantener el rol pendiente de confirmación cuando no existan antecedentes suficientes.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Una determinación fundamentada del rol de la organización en cada tratamiento, o la identificación expresa de los casos pendientes.",
      ),
    ).toBeTruthy();
  });

  it("un nodo sin ayudas conserva la lista simple de Qué revisar", () => {
    const stripped = {
      ...P01,
      nodes: P01.nodes.map((n) =>
        n.node_key === "followup-mechanism"
          ? { ...n, evidence_review_help: undefined }
          : n,
      ),
    };
    render(
      <MemoryRouter>
        <WorkspaceProvider>
          <ProtocolNodeView
            protocol={stripped}
            activity={{
              activityKey: P01.activity_key,
              humanCode: "D1.01",
              name: "Establecer marco general de prevención",
            }}
            session={{
              facts: {},
              started: false,
              answer: () => {},
              reset: () => {},
              isProvided: () => false,
              providedSource: () => null,
            }}
            node={stripped.nodes.find((x) => x.node_key === "followup-mechanism")!}
          />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    expect(screen.queryAllByTestId("guia-evidence-help")).toEqual([]);
    expect(
      screen.getByText("matriz o registro de acciones preventivas"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "evidencia de aprobación o comunicación interna cuando corresponda",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.01 followup-mechanism: contenido canónico", () => {
  const FOLLOWUP_ITEMS = [
    "matriz o registro de acciones preventivas",
    "evidencia de aprobación o comunicación interna cuando corresponda",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const followup = node("followup-mechanism");
    expect(followup.evidence_to_review).toEqual(FOLLOWUP_ITEMS);
    expect((followup.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual(
      FOLLOWUP_ITEMS,
    );
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node("followup-mechanism").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("validateProtocolStructure sigue sin errores para D1.01", () => {
    expect(validateProtocolStructure(P01)).toEqual([]);
  });
});

describe("evidence_review_help D1.01 followup-mechanism: vista de nodo", () => {
  const FOLLOWUP_ITEMS = [
    "matriz o registro de acciones preventivas",
    "evidencia de aprobación o comunicación interna cuando corresponda",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode(node("followup-mechanism"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(FOLLOWUP_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode(node("followup-mechanism"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(FOLLOWUP_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(FOLLOWUP_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(FOLLOWUP_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda conserva los textos proporcionados", () => {
    renderNode(node("followup-mechanism"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    expect(
      within(first).getByText(
        "Examinar la matriz o el registro para comprobar si permite identificar cada acción preventiva, la persona responsable de darle seguimiento, la cadencia o los hitos de revisión y el estado de avance. Verificar qué información se actualiza, quién la mantiene y qué antecedentes permiten respaldar los cambios de estado, los retrasos y el cierre de las acciones. Si el seguimiento se distribuye entre varios registros o herramientas, evaluar el conjunto y comprobar si la información puede relacionarse de forma consistente.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Precisar qué elementos del seguimiento no pudieron verificarse: las acciones incluidas, sus responsables, la cadencia de revisión, el registro de avances o la evidencia de cierre. Distinguir entre la inexistencia de un mecanismo identificable, el uso de un mecanismo informal y la falta de acceso a registros que permitan comprobar su funcionamiento. No concluir que el seguimiento no existe únicamente porque no se haya encontrado una matriz con un formato específico.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Comprobar, cuando corresponda según la naturaleza del mecanismo y los procedimientos de la organización, si existen antecedentes que permitan verificar su aprobación, validación o comunicación interna. Revisar el alcance, la fecha y los destinatarios de esos antecedentes, y contrastarlos con el mecanismo que efectivamente se utiliza para el seguimiento. Diferenciar el respaldo del mecanismo, su comunicación a las personas involucradas y la evidencia de que se aplica en la práctica.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Una conclusión sobre el respaldo y la comunicación interna del mecanismo de seguimiento, cuando corresponda, vinculada con los antecedentes disponibles y con las comprobaciones pendientes claramente identificadas.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.01 determine-gaps: contenido canónico", () => {
  const DETERMINE_GAPS_ITEMS = [
    "matriz o registro de acciones preventivas",
    "revisión de controles existentes",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const determineGaps = node("determine-gaps");
    expect(determineGaps.evidence_to_review).toEqual(DETERMINE_GAPS_ITEMS);
    expect(
      (determineGaps.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(DETERMINE_GAPS_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node("determine-gaps").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("evidence_review_help D1.01 determine-gaps: vista de nodo", () => {
  const DETERMINE_GAPS_ITEMS = [
    "matriz o registro de acciones preventivas",
    "revisión de controles existentes",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode(node("determine-gaps"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(DETERMINE_GAPS_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode(node("determine-gaps"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(DETERMINE_GAPS_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(DETERMINE_GAPS_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(DETERMINE_GAPS_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados genéricos y el texto acordado", () => {
    renderNode(node("determine-gaps"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(
        within(help).getByText("Si no se encuentra evidencia"),
      ).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Contrastar las acciones preventivas registradas con las necesidades de gobierno, documentación y coordinación del tratamiento. Comprobar si cada acción cuenta con una definición suficiente de su finalidad, los antecedentes que la respaldan y su relación con otras funciones o medidas, según corresponda. Distinguir las carencias comprobadas de los aspectos que aún requieren información.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Dejar constancia de qué aspecto no pudo comprobarse y qué información falta para determinar si existe una brecha. Diferenciar un control inexistente de uno cuya documentación es insuficiente o cuya aplicación no pudo verificarse.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.01 define-framework: contenido canónico", () => {
  const DEFINE_FRAMEWORK_ITEMS = [
    "marco o política interna de prevención",
    "asignación de responsables",
    "evidencia de aprobación o comunicación interna cuando corresponda",
  ];

  it("las tres ayudas referencian exactamente los elementos canónicos", () => {
    const defineFramework = node("define-framework");
    expect(defineFramework.evidence_to_review).toEqual(DEFINE_FRAMEWORK_ITEMS);
    expect(
      (defineFramework.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(DEFINE_FRAMEWORK_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node("define-framework").evidence_review_help ?? [];
    expect(helps).toHaveLength(3);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("evidence_review_help D1.01 define-framework: vista de nodo", () => {
  const DEFINE_FRAMEWORK_ITEMS = [
    "marco o política interna de prevención",
    "asignación de responsables",
    "evidencia de aprobación o comunicación interna cuando corresponda",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode(node("define-framework"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(3);
    helps.forEach((help, i) => {
      expect(within(help).getByText(DEFINE_FRAMEWORK_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode(node("define-framework"));
    const [first, second, third] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(DEFINE_FRAMEWORK_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(DEFINE_FRAMEWORK_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(third).getByText(DEFINE_FRAMEWORK_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(true);
    fireEvent.click(within(third).getByText(DEFINE_FRAMEWORK_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados genéricos y el texto acordado", () => {
    renderNode(node("define-framework"));
    const [first, second, third] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second, third]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Examinar el marco, la política y los demás antecedentes internos que describan cómo se organiza la prevención. Comprobar qué objetivos cubren, cómo se distribuyen las responsabilidades y cómo se relacionan los controles especializados de los distintos dominios. Si la información está repartida entre varios documentos o mecanismos, valorar el conjunto antes de concluir que falta un marco preventivo.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Registrar qué aspecto del marco preventivo no pudo verificarse y qué documentos o antecedentes sería necesario consultar. Distinguir entre la inexistencia de un marco identificable, la falta de documentación formal y la falta de acceso a la evidencia. La ausencia de una política con un nombre específico no demuestra, por sí sola, un incumplimiento legal.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Precisar qué responsabilidad o función no pudo atribuirse y qué antecedentes permitirían aclararla. Diferenciar entre una responsabilidad que aparentemente no está asignada, una asignación informal y una asignación cuya documentación o aplicación no pudo verificarse. No concluir automáticamente que existe un incumplimiento por la ausencia de un organigrama o de un documento específico.",
      ),
    ).toBeTruthy();
    expect(
      within(third).getByText(
        "Comprobar, cuando corresponda según la naturaleza del marco y los procedimientos de la organización, si existen antecedentes que acrediten su aprobación, validación o comunicación interna. Revisar la fecha, el alcance y los destinatarios de esos antecedentes para determinar qué versión del marco fue respaldada y cómo se dio a conocer a las personas involucradas. Distinguir la aprobación formal de la comunicación efectiva y de la mera existencia del documento.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.01 identify-actions: contenido canónico", () => {
  const IDENTIFY_ACTIONS_ITEMS = [
    "matriz o registro de acciones preventivas",
    "asignación de responsables",
    "revisión de controles existentes",
  ];

  it("las tres ayudas referencian exactamente los elementos canónicos", () => {
    const identifyActions = node("identify-actions");
    expect(identifyActions.evidence_to_review).toEqual(IDENTIFY_ACTIONS_ITEMS);
    expect(
      (identifyActions.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(IDENTIFY_ACTIONS_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node("identify-actions").evidence_review_help ?? [];
    expect(helps).toHaveLength(3);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});

describe("evidence_review_help D1.01 identify-actions: vista de nodo", () => {
  const IDENTIFY_ACTIONS_ITEMS = [
    "matriz o registro de acciones preventivas",
    "asignación de responsables",
    "revisión de controles existentes",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode(node("identify-actions"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(3);
    helps.forEach((help, i) => {
      expect(within(help).getByText(IDENTIFY_ACTIONS_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra las demás dentro del mismo nodo", () => {
    renderNode(node("identify-actions"));
    const [first, second, third] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(IDENTIFY_ACTIONS_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(false);
    fireEvent.click(within(third).getByText(IDENTIFY_ACTIONS_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(true);
    fireEvent.click(within(third).getByText(IDENTIFY_ACTIONS_ITEMS[2]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
    expect(third.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados genéricos y el texto acordado", () => {
    renderNode(node("identify-actions"));
    const [first, , third] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, third]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar los registros, procedimientos y documentos disponibles para identificar las medidas que la organización ya aplica para proteger los datos personales. Considerar acciones organizativas, técnicas y operativas, sin exigir que estén reunidas en una única matriz formal.",
      ),
    ).toBeTruthy();
    expect(
      within(third).getByText(
        "Distinguir entre un control que no existe, uno cuya aplicación no pudo comprobarse y uno para el que faltan antecedentes. Registrar la limitación sin concluir automáticamente que el control no se aplica.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.03 factor-voluntariness: contenido canónico", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const voluntary = node03("factor-voluntariness");
    expect(voluntary.evidence_to_review).toEqual(VOLUNTARY_ITEMS);
    expect(
      (voluntary.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(VOLUNTARY_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node03("factor-voluntariness").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la evaluación distingue conclusión respaldada, preliminar y pendiente, sin valer por sí sola", () => {
    const helps = node03("factor-voluntariness").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "Distinguir una conclusión respaldada por fuentes, una conclusión preliminar y una evaluación pendiente",
    );
    expect(helps[0].review_guide).toContain(
      "La existencia de una evaluación no respalda la conclusión por sí sola",
    );
    expect(helps[0].expected_result).toContain(
      "no exige un documento independiente del DPO",
    );
  });

  it("los factores distinguen deberes generales y regla general de adopción voluntaria sin atribuir obligaciones", () => {
    const helps = node03("factor-voluntariness").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "instrucciones o resoluciones de autoridad y condiciones regulatorias o contractuales vinculantes",
    );
    expect(helps[1].review_guide).toContain(
      "revisión proporcional a la naturaleza de la organización y sus actividades",
    );
    expect(helps[1].review_guide).toContain(
      "artículo 49 de la Ley N.º 19.628, según la modificación de la Ley N.º 21.719",
    );
    expect(helps[1].review_guide).not.toMatch(/\bLey N\.º 21\.719\b[^.]*exige\b/);
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/todas las organizaciones (deben|estás|estan)|ninguna organización puede estar obligada/);
    expect(all).not.toMatch(/el MPI es obligatorio para|el MPI es siempre (obligatorio|voluntario)/);
  });

  it("la ausencia de evidencia y el marco no confirmable dejan la voluntariedad sin confirmar", () => {
    const helps = node03("factor-voluntariness").evidence_review_help ?? [];
    expect(helps[0].no_evidence_guidance).toContain(
      "con información insuficiente, la voluntariedad queda sin confirmar",
    );
    expect(helps[1].no_evidence_guidance).toContain(
      "sin dar por existente una obligación específica ni por descartada una posible obligación",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.03", () => {
    expect(validateProtocolStructure(P03)).toEqual([]);
  });

  it("una ayuda que referencia un elemento inexistente es error de configuración", () => {
    const broken = {
      ...P03,
      nodes: P03.nodes.map((n) =>
        n.node_key === "factor-voluntariness"
          ? {
              ...n,
              evidence_review_help: [
                ...(n.evidence_review_help ?? []),
                { evidence_item: "elemento fantasma", review_guide: "x" },
              ],
            }
          : n,
      ),
    };
    const errors = validateProtocolStructure(broken);
    expect(
      errors.some(
        (e) =>
          e.includes("factor-voluntariness") &&
          e.includes("elemento fantasma") &&
          e.includes("inexistente"),
      ),
    ).toBe(true);
  });
});

describe("evidence_review_help D1.03 factor-voluntariness: vista de nodo", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode03(node03("factor-voluntariness"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(VOLUNTARY_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode03(node03("factor-voluntariness"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(VOLUNTARY_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode03(node03("factor-voluntariness"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "Revisar el análisis de conveniencia del caso concreto y comprobar si documenta por qué se considera voluntaria la adopción del MPI. Verificar qué tipo de responsable es la organización, qué tratamientos realiza, en qué sector opera y qué normas o condiciones particulares podrían afectarla. La existencia de una evaluación no respalda la conclusión por sí sola. Distinguir una conclusión respaldada por fuentes, una conclusión preliminar y una evaluación pendiente.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Una conclusión sobre el carácter voluntario de la adopción, con las fuentes revisadas, su vigencia, su aplicabilidad y las incertidumbres pendientes, distinguiendo lo respaldado de lo preliminar y lo pendiente. Esta actividad respalda una decisión metodológica y no exige un documento independiente del DPO.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Un registro del carácter voluntario con las fuentes consultadas, su vigencia, su aplicabilidad al caso y las incertidumbres pendientes, como respaldo de una decisión metodológica sobre la revisión.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.03 factor-exposure: contenido canónico", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const exposure = node03("factor-exposure");
    expect(exposure.evidence_to_review).toEqual(VOLUNTARY_ITEMS);
    expect(
      (exposure.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(VOLUNTARY_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node03("factor-exposure").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la evaluación relaciona características con riesgos y prácticas y declara las limitaciones de la recomendación", () => {
    const helps = node03("factor-exposure").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "La evaluación debe relacionar las características de la operación y los tratamientos con los riesgos y las prácticas de protección existentes",
    );
    expect(helps[0].review_guide).toContain(
      "identificando las limitaciones que puedan afectar la recomendación",
    );
    expect(helps[0].expected_result).toContain(
      "que fundamente la recomendación profesional",
    );
  });

  it("los factores distinguen riesgos observados de supuestos sin usar tamaño ni políticas como prueba suficiente", () => {
    const helps = node03("factor-exposure").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "distinguir los riesgos observados de los supuestos",
    );
    expect(helps[1].review_guide).toContain(
      "sin considerar el tamaño de la organización ni la existencia de políticas como prueba suficiente del nivel de riesgo o madurez",
    );
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/\bLey N\.º 21\.719\b|\bDecreto N\.º 662\b/);
    expect(all).not.toMatch(/clasificación legal|obligación (legal|automática) de adoptar/);
    expect(all).not.toMatch(/\d+\s*(puntos|ptos|trabajadores|empleados)|umbral de( \d+)*\s*(riesgo|madurez)?/);
    expect(all).not.toMatch(/exige\b.*\bperfil\b/);
  });

  it("la falta de documentación no prueba inexistencia en ninguna ayuda", () => {
    const helps = node03("factor-exposure").evidence_review_help ?? [];
    expect(helps[0].no_evidence_guidance).toContain(
      "La falta de documentación localizada no demuestra por sí sola que la práctica no exista",
    );
    expect(helps[0].no_evidence_guidance).toContain(
      "consultar las áreas que podrían confirmarla",
    );
    expect(helps[1].no_evidence_guidance).toContain(
      "No suplir la evidencia faltante con supuestos generales",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.03", () => {
    expect(validateProtocolStructure(P03)).toEqual([]);
  });
});

describe("evidence_review_help D1.03 factor-exposure: vista de nodo", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode03(node03("factor-exposure"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(VOLUNTARY_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode03(node03("factor-exposure"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(VOLUNTARY_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode03(node03("factor-exposure"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "La evaluación debe relacionar las características de la operación y los tratamientos con los riesgos y las prácticas de protección existentes. Las conclusiones deben sustentarse en antecedentes concretos que fundamenten la conveniencia de adoptar o no un MPI, identificando las limitaciones que puedan afectar la recomendación.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Un perfil de exposición y madurez consolidado con los antecedentes disponibles y las brechas identificadas, que fundamente la recomendación profesional de adoptar o no un MPI.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Los factores analizados deben contar con respaldo identificable y permitir comprender su influencia en la conveniencia de adoptar un MPI. La evaluación debe distinguir los riesgos observados de los supuestos, sin considerar el tamaño de la organización ni la existencia de políticas como prueba suficiente del nivel de riesgo o madurez.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Un registro de los factores considerados con su respaldo y sus incertidumbres, base para evaluar la conveniencia profesional de adoptar un MPI.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.03 factor-capacity: contenido canónico", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const capacity = node03("factor-capacity");
    expect(capacity.evidence_to_review).toEqual(VOLUNTARY_ITEMS);
    expect(
      (capacity.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(VOLUNTARY_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node03("factor-capacity").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la evaluación de capacidad exige condiciones realistas y continuidad, no conveniencia teórica", () => {
    const helps = node03("factor-capacity").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "condiciones realistas para implementar y mantener el programa",
    );
    expect(helps[0].review_guide).toContain(
      "recursos, responsabilidades y mecanismos de gobierno interno",
    );
    expect(helps[0].review_guide).toContain(
      "no limitarse a la conveniencia teórica de adoptar el MPI",
    );
    expect(helps[0].expected_result).toContain(
      "con las limitaciones relevantes para la recomendación profesional",
    );
  });

  it("los factores distinguen capacidades existentes de previstas y no presumen continuidad automática", () => {
    const helps = node03("factor-capacity").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "recursos disponibles, la asignación de responsabilidades, el apoyo del gobierno interno y la capacidad de mantener las actividades en el tiempo",
    );
    expect(helps[1].review_guide).toContain(
      "Deben distinguirse las capacidades existentes de las previstas o aún no confirmadas",
    );
    expect(helps[1].review_guide).toContain(
      "sin asumir que la disponibilidad inicial garantiza la continuidad del programa",
    );
    expect(helps[1].no_evidence_guidance).toContain(
      "No deben darse por disponibles recursos, responsables o apoyos internos sin respaldo suficiente",
    );
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/\bobligación (legal|general vigente)\b|\bexige\b/);
    expect(all).not.toMatch(/\d+\s*(puntos|ptos|trabajadores|empleados)|umbral|plazo legal/);
  });

  it("la falta de documentación no prueba inexistencia de capacidades", () => {
    const helps = node03("factor-capacity").evidence_review_help ?? [];
    expect(helps[0].no_evidence_guidance).toContain(
      "La falta de documentación localizada no demuestra por sí sola que los recursos, responsables o prácticas no existan",
    );
  });

  it("validateProtocolStructure sigue sin errores para D1.03", () => {
    expect(validateProtocolStructure(P03)).toEqual([]);
  });
});

describe("evidence_review_help D1.03 factor-capacity: vista de nodo", () => {
  const VOLUNTARY_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Factores considerados",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode03(node03("factor-capacity"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(VOLUNTARY_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode03(node03("factor-capacity"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(VOLUNTARY_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(VOLUNTARY_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode03(node03("factor-capacity"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "La evaluación debe determinar si la organización dispone de condiciones realistas para implementar y mantener el programa, considerando recursos, responsabilidades y mecanismos de gobierno interno. La recomendación debe tener en cuenta la continuidad de estas capacidades y no limitarse a la conveniencia teórica de adoptar el MPI.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Una evaluación fundamentada de la capacidad organizacional para implementar y mantener el MPI, con las limitaciones relevantes para la recomendación profesional.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Los factores deben contar con respaldo identificable sobre los recursos disponibles, la asignación de responsabilidades, el apoyo del gobierno interno y la capacidad de mantener las actividades en el tiempo. Deben distinguirse las capacidades existentes de las previstas o aún no confirmadas, sin asumir que la disponibilidad inicial garantiza la continuidad del programa.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Un registro de las capacidades disponibles, las brechas y las incertidumbres que puedan afectar la implementación y continuidad del MPI.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.03 factor-convenience: contenido canónico", () => {
  const CONVENIENCE_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Recomendación documentada",
  ];

  it("las dos ayudas referencian exactamente los elementos canónicos", () => {
    const convenience = node03("factor-convenience");
    expect(convenience.evidence_to_review).toEqual(CONVENIENCE_ITEMS);
    expect(
      (convenience.evidence_review_help ?? []).map((h) => h.evidence_item),
    ).toEqual(CONVENIENCE_ITEMS);
  });

  it("cada ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node03("factor-convenience").evidence_review_help ?? [];
    expect(helps).toHaveLength(2);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la evaluación distingue motivos profesionales de obligaciones y rechaza presentar recomendación como exigencia", () => {
    const helps = node03("factor-convenience").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "La evaluación debe diferenciar los motivos profesionales que sustentan la conveniencia de adoptar un MPI de las obligaciones jurídicas aplicables a la organización",
    );
    expect(helps[0].review_guide).toContain(
      "evitar presentar una recomendación metodológica como una exigencia legal",
    );
    expect(helps[0].review_guide).toContain(
      "También deben explicitarse las condiciones o antecedentes que podrían modificar esa conclusión",
    );
    expect(helps[0].no_evidence_guidance).toContain(
      "La ausencia de una explicación documentada no demuestra por sí sola que la organización haya confundido ambos conceptos",
    );
    expect(helps[0].no_evidence_guidance).toContain(
      "corresponde identificar qué aspecto requiere confirmación",
    );
    expect(helps[0].expected_result).toContain(
      "distinga claramente la conveniencia profesional de adoptar un MPI de las obligaciones jurídicas que correspondan al caso",
    );
    expect(helps[0].expected_result).toContain(
      "con fundamentos suficientes para comprender la diferencia",
    );
  });

  it("la recomendación exige fundamento jurídico para obligatoriedad sin convertir criterios en requisitos legales", () => {
    const helps = node03("factor-convenience").evidence_review_help ?? [];
    expect(helps[1].review_guide).toContain(
      "diferenciar esa conclusión de cualquier obligación legal que resulte aplicable",
    );
    expect(helps[1].review_guide).toContain(
      "sin convertir los criterios metodológicos de la evaluación en requisitos legales",
    );
    expect(helps[1].review_guide).toContain(
      "La redacción debe permitir reconocer qué parte corresponde a una recomendación y cuál a una obligación, si existe",
    );
    expect(helps[1].no_evidence_guidance).toContain(
      "Las dudas deben quedar identificadas sin atribuir incumplimientos no verificados",
    );
    expect(helps[1].expected_result).toContain(
      "distinga las obligaciones jurídicas que, en su caso, resulten aplicables",
    );
    expect(helps[1].expected_result).toContain(
      "de modo que la conclusión no induzca a interpretar la recomendación como una exigencia legal",
    );
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/obligatorys|obligación de adoptar un MPI\b/);
    expect(all).not.toMatch(/todas las organizaciones (deben|estás|estan)/);
  });

  it("validateProtocolStructure sigue sin errores para D1.03", () => {
    expect(validateProtocolStructure(P03)).toEqual([]);
  });
});

describe("evidence_review_help D1.03 factor-convenience: vista de nodo", () => {
  const CONVENIENCE_ITEMS = [
    "Evaluación de conveniencia MPI",
    "Recomendación documentada",
  ];

  it("muestra los títulos canónicos exactos con las ayudas colapsadas", () => {
    renderNode03(node03("factor-convenience"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(2);
    helps.forEach((help, i) => {
      expect(within(help).getByText(CONVENIENCE_ITEMS[i])).toBeTruthy();
      expect(help.hasAttribute("open")).toBe(false);
    });
  });

  it("abrir una ayuda cierra la otra dentro del mismo nodo", () => {
    renderNode03(node03("factor-convenience"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    fireEvent.click(within(first).getByText(CONVENIENCE_ITEMS[0]));
    expect(first.hasAttribute("open")).toBe(true);
    expect(second.hasAttribute("open")).toBe(false);
    fireEvent.click(within(second).getByText(CONVENIENCE_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(true);
    fireEvent.click(within(second).getByText(CONVENIENCE_ITEMS[1]));
    expect(first.hasAttribute("open")).toBe(false);
    expect(second.hasAttribute("open")).toBe(false);
  });

  it("cada ayuda contiene los encabezados y textos acordados", () => {
    renderNode03(node03("factor-convenience"));
    const [first, second] = screen.getAllByTestId("guia-evidence-help");
    for (const help of [first, second]) {
      expect(within(help).getByText("Guía de revisión")).toBeTruthy();
      expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
      expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    }
    expect(
      within(first).getByText(
        "La evaluación debe diferenciar los motivos profesionales que sustentan la conveniencia de adoptar un MPI de las obligaciones jurídicas aplicables a la organización. Las conclusiones deben identificar la base de cada afirmación y evitar presentar una recomendación metodológica como una exigencia legal. También deben explicitarse las condiciones o antecedentes que podrían modificar esa conclusión.",
      ),
    ).toBeTruthy();
    expect(
      within(first).getByText(
        "Una evaluación que distinga claramente la conveniencia profesional de adoptar un MPI de las obligaciones jurídicas que correspondan al caso, con fundamentos suficientes para comprender la diferencia.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "La recomendación debe expresar si la adopción del MPI se aconseja por razones profesionales y diferenciar esa conclusión de cualquier obligación legal que resulte aplicable. Toda afirmación de obligatoriedad debe contar con fundamento jurídico pertinente, sin convertir los criterios metodológicos de la evaluación en requisitos legales. La redacción debe permitir reconocer qué parte corresponde a una recomendación y cuál a una obligación, si existe.",
      ),
    ).toBeTruthy();
    expect(
      within(second).getByText(
        "Una recomendación documentada que explicite sus fundamentos profesionales y distinga las obligaciones jurídicas que, en su caso, resulten aplicables, de modo que la conclusión no induzca a interpretar la recomendación como una exigencia legal.",
      ),
    ).toBeTruthy();
  });
});

describe("evidence_review_help D1.03 adopt-conclusion: contenido canónico", () => {
  it("la única ayuda referencia exactamente el elemento canónico", () => {
    const adopt = node03("adopt-conclusion");
    expect(adopt.evidence_to_review).toEqual(["Recomendación documentada"]);
    expect((adopt.evidence_review_help ?? []).map((h) => h.evidence_item)).toEqual([
      "Recomendación documentada",
    ]);
  });

  it("la ayuda declara los tres apartados con contenido no vacío", () => {
    const helps = node03("adopt-conclusion").evidence_review_help ?? [];
    expect(helps).toHaveLength(1);
    for (const h of helps) {
      expect(h.review_guide.trim().length).toBeGreaterThan(0);
      expect((h.no_evidence_guidance ?? "").trim().length).toBeGreaterThan(0);
      expect((h.expected_result ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  it("la conclusión es juicio profesional coherente con los cuatro antecedentes, no cálculo del sistema", () => {
    const helps = node03("adopt-conclusion").evidence_review_help ?? [];
    expect(helps[0].review_guide).toContain(
      "considerando el carácter voluntario del MPI, el perfil de exposición y madurez, la capacidad organizacional y la distinción entre conveniencia y obligación jurídica",
    );
    expect(helps[0].review_guide).toContain(
      "sin tratar la selección como un cálculo automático del sistema",
    );
    expect(helps[0].expected_result).toContain(
      "razonamiento que explique cómo los antecedentes sustentan la recomendación",
    );
  });

  it("antecedentes insuficientes o contradicciones impiden la recomendación definitiva sin inventar incumplimiento", () => {
    const helps = node03("adopt-conclusion").evidence_review_help ?? [];
    expect(helps[0].no_evidence_guidance).toContain(
      "No debe adoptarse una recomendación definitiva mientras falten elementos relevantes para el juicio profesional",
    );
    expect(helps[0].no_evidence_guidance).toContain(
      "la ausencia de documentación no demuestra por sí sola que una práctica no exista",
    );
    const all = helps
      .map((h) => `${h.review_guide} ${h.no_evidence_guidance} ${h.expected_result}`)
      .join(" ");
    expect(all).not.toMatch(/ley (exige|establece la obligación)|obligación general para todas/);
    expect(all).not.toMatch(/\bLey N\.º 21\.719\b|\bDecreto N\.º 662\b/);
    expect(all).not.toMatch(/\d+\s*(puntos|ptos)|umbral/);
  });

  it("validateProtocolStructure sigue sin errores para D1.03", () => {
    expect(validateProtocolStructure(P03)).toEqual([]);
  });
});

describe("evidence_review_help D1.03 adopt-conclusion: vista de nodo", () => {
  it("muestra el título canónico exacto con la ayuda colapsada", () => {
    renderNode03(node03("adopt-conclusion"));
    expect(screen.getByText("Qué revisar")).toBeTruthy();
    const helps = screen.getAllByTestId("guia-evidence-help");
    expect(helps).toHaveLength(1);
    expect(within(helps[0]).getByText("Recomendación documentada")).toBeTruthy();
    expect(helps[0].hasAttribute("open")).toBe(false);
  });

  it("la ayuda contiene los encabezados y textos acordados", () => {
    renderNode03(node03("adopt-conclusion"));
    const [help] = screen.getAllByTestId("guia-evidence-help");
    expect(within(help).getByText("Guía de revisión")).toBeTruthy();
    expect(within(help).getByText("Si no se encuentra evidencia")).toBeTruthy();
    expect(within(help).getByText("Resultado esperado")).toBeTruthy();
    expect(
      within(help).getByText(
        "La conclusión debe reflejar el juicio profesional derivado de los antecedentes revisados, considerando el carácter voluntario del MPI, el perfil de exposición y madurez, la capacidad organizacional y la distinción entre conveniencia y obligación jurídica. La alternativa seleccionada debe ser coherente con esos antecedentes y contar con un razonamiento explícito, sin tratar la selección como un cálculo automático del sistema.",
      ),
    ).toBeTruthy();
    expect(
      within(help).getByText(
        "Se deben identificar los antecedentes previos insuficientes o las contradicciones que impiden fundamentar la conclusión. No debe adoptarse una recomendación definitiva mientras falten elementos relevantes para el juicio profesional; la ausencia de documentación no demuestra por sí sola que una práctica no exista.",
      ),
    ).toBeTruthy();
    expect(
      within(help).getByText(
        "Una conclusión profesional adoptada y acompañada de un razonamiento que explique cómo los antecedentes sustentan la recomendación de adoptar o no un MPI, incluyendo las limitaciones relevantes.",
      ),
    ).toBeTruthy();
  });
});
