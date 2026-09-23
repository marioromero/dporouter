/**
 * Contratos canónicos de ejecución guiada (Stage 1).
 *
 * Sintaxis TypeScript de la ampliación de `docs/DATA_CONTRACTS.md`
 * (ExecutionProtocol y conceptos asociados).
 *
 * Separación estructural obligatoria:
 * - `ActivityDefinition` (universal, intacta en `src/types.ts`) describe
 *   QUÉ actividad existe.
 * - `ExecutionProtocol` define CÓMO el profesional es guiado a través de
 *   hechos, preguntas, reglas y resultados.
 *
 * Un protocolo NUNCA se hardcodea dentro de componentes React: vive como
 * contenido canónico bajo `/content/protocols` y la UI lo consume de forma
 * genérica. `unknown` nunca se coacciona a `false`.
 */

export type ProtocolMode = "decision" | "procedure" | "checklist";

/**
 * Namespace reservado de derived session facts: proyecciones
 * read-only de structured state, no persistibles, no escribibles
 * manualmente, no materializables. La validación estructural lo
 * impone; este módulo lo declara para no acoplar capas.
 */
export const DERIVED_FACT_PREFIX = "derived.";

export function isDerivedFactKey(factKey: string): boolean {
  return factKey.startsWith(DERIVED_FACT_PREFIX);
}

export type GuidanceNodeType = "question" | "decision" | "result";

export type GuidanceAnswerType =
  | "yes_no_unknown"
  | "single_select"
  | "none"
  | "text"
  | "date";

/** Procedencia de un protocolo, nodo o resultado. */
export type ProtocolProvenance = "legal_requirement" | "agency_standard";

/** Efecto de una respuesta sobre un hecho estable. */
export interface FactEffect {
  fact_key: string;
  value: string;
}

/** Opción de respuesta de un nodo pregunta. */
export interface AnswerOption {
  value: string;
  label: string;
  description?: string;
  fact_effect?: FactEffect;
  /** Destino directo; ausente cuando decide la regla o el flujo por defecto. */
  next_node_key?: string;
}

/**
 * Condición declarativa mínima y explicable. No es un lenguaje de
 * programación general: solo comparaciones de hechos, combinadores
 * booleanos y conteo de factores verdaderos.
 */
export type FactCondition =
  | { op: "all"; conditions: FactCondition[] }
  | { op: "any"; conditions: FactCondition[] }
  | { op: "not"; condition: FactCondition }
  | { op: "fact_equals"; fact_key: string; value: string }
  | { op: "fact_in"; fact_key: string; values: string[] }
  | { op: "fact_unresolved"; fact_key: string }
  | { op: "count_true"; facts: string[]; equals: string; at_least: number };

/** Regla determinística con destino y explicación textual. */
export interface DecisionRule {
  rule_id: string;
  description: string;
  when: FactCondition;
  goto_outcome_key?: string;
  goto_node_key?: string;
  explanation: string;
}

/** Nodo de guía: pregunta, decisión o resultado intermedio. */
export interface GuidanceNode {
  node_key: string;
  node_type: GuidanceNodeType;
  title: string;
  prompt?: string;
  why_it_matters?: string;
  fact_key?: string;
  answer_type: GuidanceAnswerType;
  options?: AnswerOption[];
  /**
   * Origen dinámico de opciones para un nodo pregunta `single_select`
   * cuyos valores dependen del workspace y no pueden enumerarse
   * estáticamente sin destruir semántica (p. ej. identificadores de
   * tratamientos de la misma empresa). La UI genérica construye las
   * opciones en tiempo de ejecución desde ese origen; las `options`
   * estáticas del nodo (si existen) se ofrecen junto a las dinámicas
   * (p. ej. una alternativa explícita de ausencia). El valor
   * seleccionado se registra como respuesta scopeada normal con el
   * `fact_key` del nodo. Unión cerrada; ausente = solo opciones
   * estáticas.
   */
  options_source?: "same_company_treatments";
  evidence_to_review?: string[];
  help_text?: string[];
  /**
   * Prerrequisitos semánticos: semantic fact keys que deben estar
   * resueltos para trabajar este nodo. El orden del array de nodos NO
   * define dependencias; solo presentación o recorrido sugerido. Un fact
   * puede provenir del protocolo actual, de `initialFacts`, de
   * Diagnóstico, de otro protocolo o de futura información persistida.
   */
  required_facts?: string[];
  /** Destino cuando ninguna transición ni opción directa aplica. */
  default_next_node_key?: string;
  /** Reglas evaluadas en orden; la primera coincidencia gana. */
  transitions?: DecisionRule[];
  related_activity_keys?: string[];
  provenance?: ProtocolProvenance;
}

/** Siguiente acción de un resultado. */
export interface NextAction {
  kind: "activity" | "node" | "restart" | "info";
  label: string;
  activity_key?: string;
  node_key?: string;
  note?: string;
  /** Condición declarativa de visibilidad; ausente = siempre visible. */
  show_when?: FactCondition;
}

/** Resultado explicable de un protocolo. */
export interface ProtocolOutcome {
  outcome_key: string;
  label: string;
  classification: "legal_requirement" | "agency_standard";
  explanation: string;
  detail?: string;
  provenance: ProtocolProvenance;
  next_actions: NextAction[];
  /**
   * Efectos canónicos al finalizar este outcome definitivo. Cada efecto
   * es solo {fact_key, value}: sin expresiones, condiciones ni lógica.
   * Reutiliza el shape de FactEffect con semántica explícita de efecto
   * canónico al finalizar. La materialización la hace el workspace con
   * el mecanismo existente de observaciones; un outcome de evaluación
   * (p. ej. incompleto) nunca lleva efectos.
   */
  canonical_fact_effects?: FactEffect[];
}

/** Protocolo de ejecución guiada de una actividad. */
export interface ExecutionProtocol {
  protocol_key: string;
  activity_key: string;
  version: number;
  mode: ProtocolMode;
  /**
   * Objeto jurídico principal analizado en la ejecución. Unión
   * cerrada; ausencia significa `company` (todos los protocolos D1
   * existentes continúan sin editarse).
   */
  execution_scope?: "company" | "treatment" | "purpose";
  title: string;
  description: string;
  entry_node_key: string;
  nodes: GuidanceNode[];
  outcomes: ProtocolOutcome[];
  /** Hechos que deben estar resueltos antes de una conclusión definitiva. */
  decision_fact_keys: string[];
  /**
   * Facts externos/injectables: keys válidas que ningún nodo del
   * protocolo produce (Diagnóstico, otro protocolo, `initialFacts`,
   * futura persistencia). Permite validar `required_facts` que
   * referencian hechos de fuera del protocolo.
   */
  external_fact_keys?: string[];
  /**
   * Requisitos de reasoning específicos del protocolo. Declara qué
   * campos del contrato canónico ReasoningRecord son obligatorios para
   * dar por válido un registro de este protocolo. Sin esta declaración
   * el runtime solo exige estructuralmente la conclusión. Nunca
   * convierte requisitos de un protocolo en regla global.
   */
  reasoning_requirements?: {
    required_fields: string[];
  };
  last_review: string;
  provenance: ProtocolProvenance;
}

/** Mapa transitorio de hechos de sesión: fact_key → valor respondido. */
export type FactMap = Record<string, string>;
