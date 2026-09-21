/**
 * Único fixture DEMO no canónico de la iteración.
 * Existe solo para validar la ficha reutilizable de actividad.
 * No pertenece al registro canónico y no aparece en mapa,
 * dominios, búsquedas ni conteos.
 */

export interface DemoActivityView {
  activity_key: string;
  human_code: string;
  name: string;
  objective: string;
  applies_when: string;
  trigger_question: string;
  professional_duty: string;
  steps_operational: string[];
  interlocutors: string[];
  data_collection_methods: string[];
  evidence_required: string[];
  deliverable: string;
  estimated_time: string;
  complexity: string;
  legal_ground: string;
  expected_result: string;
  isCanonical: false;
}

export const DEMO_ACTIVITY_KEY = "demo.activity_view";

export const DEMO_ACTIVITY: DemoActivityView = {
  activity_key: DEMO_ACTIVITY_KEY,
  human_code: "DEMO-01",
  name: "Actividad de demostración",
  objective:
    "Validar la estructura visual y la navegación de una ficha de actividad antes de importar contenido jurídico.",
  applies_when: "Solo durante la validación de la interfaz de Stage 1.",
  trigger_question:
    "¿La ficha permite entender con claridad qué hacer, qué evidencia obtener y qué resultado esperar?",
  professional_duty:
    "Revisar la estructura, jerarquía, navegación y legibilidad de la ficha sin interpretar este contenido como una obligación jurídica.",
  steps_operational: [
    "Revisar la jerarquía de información.",
    "Comprobar que la evidencia y el entregable sean fáciles de localizar.",
    "Comprobar la navegación, el deep link y la trazabilidad técnica.",
  ],
  interlocutors: ["Equipo de producto"],
  data_collection_methods: ["Revisión de interfaz"],
  evidence_required: ["Resultado de la revisión visual y funcional"],
  deliverable: "Validación de la ficha reutilizable",
  estimated_time: "15 min",
  complexity: "Baja",
  legal_ground: "Sin fundamento jurídico: contenido exclusivamente demostrativo.",
  expected_result: "Ficha de actividad preparada para recibir definiciones canónicas.",
  isCanonical: false,
};

export function getDemoActivity(activityKey: string): DemoActivityView | undefined {
  return activityKey === DEMO_ACTIVITY_KEY ? DEMO_ACTIVITY : undefined;
}
