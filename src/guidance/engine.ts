import type {
  AnswerOption,
  DecisionRule,
  ExecutionProtocol,
  FactCondition,
  FactMap,
  GuidanceNode,
  ProtocolOutcome,
} from "../../content/protocols/types";
import {
  getProtocolNode,
  getProtocolOutcome,
} from "../../content/protocols/registry";

/**
 * Motor determinístico de ejecución guiada (Stage 1).
 *
 * Puro, auditable y explicable: evalúa hechos contra reglas canónicas
 * declarativas. Sin LLM, sin heurística opaca, sin puntajes inventados.
 *
 * Semántica de desconocido: `unknown` (o ausencia de respuesta) nunca se
 * convierte en `no`. Las comparaciones son estrictas; un hecho sin resolver
 * solo satisface `fact_unresolved`.
 */

/** Un hecho está resuelto solo con un valor conocido distinto de unknown. */
export function isFactResolved(value: string | undefined): boolean {
  return value !== undefined && value !== "unknown";
}

export function evaluateCondition(
  condition: FactCondition,
  facts: FactMap,
): boolean {
  switch (condition.op) {
    case "all":
      return condition.conditions.every((c) => evaluateCondition(c, facts));
    case "any":
      return condition.conditions.some((c) => evaluateCondition(c, facts));
    case "not":
      return !evaluateCondition(condition.condition, facts);
    case "fact_equals":
      return facts[condition.fact_key] === condition.value;
    case "fact_in": {
      const v = facts[condition.fact_key];
      return v !== undefined && condition.values.includes(v);
    }
    case "fact_unresolved":
      return !isFactResolved(facts[condition.fact_key]);
    case "count_true": {
      let n = 0;
      for (const f of condition.facts) {
        if (facts[f] === condition.equals) n += 1;
      }
      return n >= condition.at_least;
    }
  }
}

export type NodeRoute =
  | { kind: "node"; node_key: string }
  | { kind: "outcome"; outcome_key: string; rule: DecisionRule };

/**
 * Resuelve el destino de un nodo pregunta ya respondido con los hechos
 * actualizados: transiciones por regla primero, luego opción directa,
 * luego flujo por defecto.
 */
export function resolveNodeWithFacts(
  node: GuidanceNode,
  facts: FactMap,
  answeredOption?: AnswerOption,
): NodeRoute | null {
  for (const t of node.transitions ?? []) {
    if (
      (t.goto_outcome_key ?? t.goto_node_key) &&
      evaluateCondition(t.when, facts)
    ) {
      if (t.goto_outcome_key) {
        return { kind: "outcome", outcome_key: t.goto_outcome_key, rule: t };
      }
      return { kind: "node", node_key: t.goto_node_key as string };
    }
  }
  if (answeredOption?.next_node_key) {
    return { kind: "node", node_key: answeredOption.next_node_key };
  }
  if (node.default_next_node_key) {
    return { kind: "node", node_key: node.default_next_node_key };
  }
  return null;
}

export type ProtocolEvaluation =
  | {
      status: "awaiting_facts";
      current_node_key: string;
      missing_fact_keys: string[];
    }
  | {
      status: "outcome";
      outcome_key: string;
      outcome: ProtocolOutcome;
      rule_id: string;
      explanation: string;
    }
  | { status: "misconfigured"; detail: string };

/** Hechos de decisión sin resolver (ausentes o unknown). */
export function getMissingDecisionFacts(
  protocol: ExecutionProtocol,
  facts: FactMap,
): string[] {
  return protocol.decision_fact_keys.filter((f) => !isFactResolved(facts[f]));
}

/**
 * Evalúa el protocolo completo desde la entrada con los hechos dados.
 * Camina pregunta por pregunta; ante un hecho sin resolver se detiene en
 * ese nodo; ante reglas coincidentes emite el resultado con su explicación.
 */
export function evaluateProtocol(
  protocol: ExecutionProtocol,
  facts: FactMap,
): ProtocolEvaluation {
  const missing = getMissingDecisionFacts(protocol, facts);
  let key: string | null = protocol.entry_node_key;
  const visited = new Set<string>();
  while (key !== null) {
    if (visited.has(key)) {
      return { status: "misconfigured", detail: `ciclo en nodo ${key}` };
    }
    visited.add(key);
    const node = getProtocolNode(protocol, key);
    if (!node) {
      return { status: "misconfigured", detail: `nodo inexistente ${key}` };
    }
    if (node.node_type === "decision") {
      let advanced = false;
      for (const t of node.transitions ?? []) {
        if (evaluateCondition(t.when, facts)) {
          if (t.goto_outcome_key) {
            const outcome = getProtocolOutcome(protocol, t.goto_outcome_key);
            if (!outcome) {
              return {
                status: "misconfigured",
                detail: `outcome inexistente ${t.goto_outcome_key}`,
              };
            }
            return {
              status: "outcome",
              outcome_key: outcome.outcome_key,
              outcome,
              rule_id: t.rule_id,
              explanation: t.explanation,
            };
          }
          if (!t.goto_node_key) {
            return {
              status: "misconfigured",
              detail: `regla ${t.rule_id} sin destino`,
            };
          }
          key = t.goto_node_key;
          advanced = true;
          break;
        }
      }
      if (advanced) {
        if (key !== null && visited.has(key)) {
          return { status: "misconfigured", detail: `ciclo en nodo ${key}` };
        }
        continue;
      }
      // Ninguna transición coincidió: no se inventa conclusión; el
      // protocolo queda a la espera de los hechos faltantes.
      return {
        status: "awaiting_facts",
        current_node_key: node.node_key,
        missing_fact_keys: missing,
      };
    }
    const value = node.fact_key ? facts[node.fact_key] : undefined;
    if (value === undefined) {
      // Nunca respondido: detenerse aquí sin inventar la respuesta.
      return {
        status: "awaiting_facts",
        current_node_key: node.node_key,
        missing_fact_keys: missing,
      };
    }
    // Respondido (incluso `unknown`): el hecho queda registrado y el flujo
    // continúa; `unknown` sigue sin resolver para conclusiones y faltantes.
    // La opción respondida se propaga para que el walk coincida con la
    // navegación de la UI ante transiciones directas por opción.
    const selected = node.options?.find((o) => o.value === value);
    const route = resolveNodeWithFacts(node, facts, selected);
    if (!route) {
      return {
        status: "misconfigured",
        detail: `nodo ${node.node_key} sin destino resoluble`,
      };
    }
    if (route.kind === "outcome") {
      const outcome = getProtocolOutcome(protocol, route.outcome_key);
      if (!outcome) {
        return {
          status: "misconfigured",
          detail: `outcome inexistente ${route.outcome_key}`,
        };
      }
      return {
        status: "outcome",
        outcome_key: outcome.outcome_key,
        outcome,
        rule_id: route.rule.rule_id,
        explanation: route.rule.explanation,
      };
    }
    key = route.node_key;
  }
  // Inalcanzable con protocolos validados (todas las ramas retornan o
  // avanzan); se conserva por exhaustividad del análisis de flujo.
  return {
    status: "awaiting_facts",
    current_node_key: protocol.entry_node_key,
    missing_fact_keys: missing,
  };
}

/** Estado de un fact: ausente, presente con unknown, o resuelto. */
export type FactState = "absent" | "unknown" | "resolved";

export function getFactState(facts: FactMap, factKey: string): FactState {
  const v = facts[factKey];
  if (v === undefined) return "absent";
  if (v === "unknown") return "unknown";
  return "resolved";
}

/** Facts referenciados por una condición (para awaits genéricos). */
export function collectConditionFacts(condition: FactCondition): string[] {
  switch (condition.op) {
    case "all":
    case "any":
      return condition.conditions.flatMap(collectConditionFacts);
    case "not":
      return collectConditionFacts(condition.condition);
    case "fact_equals":
    case "fact_unresolved":
      return [condition.fact_key];
    case "fact_in":
      return [condition.fact_key];
    case "count_true":
      return [...condition.facts];
  }
}

/** Nodo pregunta que produce un fact, si existe dentro del protocolo. */
export function findProducerNode(
  protocol: ExecutionProtocol,
  factKey: string,
): GuidanceNode | undefined {
  return protocol.nodes.find(
    (n) => n.node_type === "question" && n.fact_key === factKey,
  );
}

export interface MissingRequiredFact {
  fact_key: string;
  state: "absent" | "unknown";
  producer?: GuidanceNode;
}

/**
 * Prerrequisitos semánticos sin resolver de un nodo, en orden de
 * declaración. Solo evalúa `required_facts[]`; la posición del nodo en
 * el array nunca define dependencias.
 */
export function getMissingRequiredFacts(
  protocol: ExecutionProtocol,
  node: GuidanceNode,
  facts: FactMap,
): MissingRequiredFact[] {
  const out: MissingRequiredFact[] = [];
  for (const f of node.required_facts ?? []) {
    if (!isFactResolved(facts[f])) {
      out.push({
        fact_key: f,
        state: facts[f] === undefined ? "absent" : "unknown",
        producer: findProducerNode(protocol, f),
      });
    }
  }
  return out;
}

/** Primer nodo capaz de producir alguno de los facts indicados. */
export function firstProducerNodeKey(
  protocol: ExecutionProtocol,
  factKeys: string[],
): string | null {
  for (const f of factKeys) {
    const producer = findProducerNode(protocol, f);
    if (producer) return producer.node_key;
  }
  return null;
}

export type DecisionResolution =
  | { kind: "node"; node_key: string }
  | { kind: "outcome"; outcome_key: string; rule: DecisionRule }
  | { kind: "awaiting"; missing_fact_keys: string[] }
  | { kind: "misconfigured"; detail: string };

/**
 * Resuelve UN nodo de decisión con los hechos dados: primera transición
 * coincidente (a nodo o a outcome). Sin coincidencia no se inventa
 * conclusión: queda a la espera con los facts referenciados sin resolver.
 * Una regla coincidente sin destino es configuración inválida y se
 * reporta como tal (nunca se silencia).
 */
export function resolveDecisionNode(
  node: GuidanceNode,
  facts: FactMap,
): DecisionResolution {
  for (const t of node.transitions ?? []) {
    if (!evaluateCondition(t.when, facts)) continue;
    if (!t.goto_outcome_key && !t.goto_node_key) {
      return { kind: "misconfigured", detail: `regla ${t.rule_id} sin destino` };
    }
    if (t.goto_outcome_key) {
      return { kind: "outcome", outcome_key: t.goto_outcome_key, rule: t };
    }
    if (t.goto_node_key) {
      return { kind: "node", node_key: t.goto_node_key };
    }
  }
  for (const t of node.transitions ?? []) {
    if (!evaluateCondition(t.when, facts)) continue;
    if (t.goto_outcome_key) {
      return { kind: "outcome", outcome_key: t.goto_outcome_key, rule: t };
    }
    if (t.goto_node_key) {
      return { kind: "node", node_key: t.goto_node_key };
    }
  }
  const referenced = (node.transitions ?? []).flatMap((t) =>
    collectConditionFacts(t.when),
  );
  return {
    kind: "awaiting",
    missing_fact_keys: [...new Set(referenced)].filter(
      (f) => !isFactResolved(facts[f]),
    ),
  };
}

/** Fila explicable de factores para la pantalla de resultado. */
export interface OutcomeFactor {
  node_key: string;
  title: string;
  fact_key: string;
  answer: string;
  resolved: boolean;
  effect: string;
}

/** Etiqueta visible de una respuesta sin inventar contenido. */
export function answerLabel(
  node: GuidanceNode,
  answer: string | undefined,
): string {
  if (answer === undefined) return "Sin responder";
  if (answer === "unknown") return "Desconocido";
  const opt = node.options?.find((o) => o.value === answer);
  return opt?.label ?? answer;
}

/** Factores considerados en orden canónico de nodos. */
export function buildOutcomeFactors(
  protocol: ExecutionProtocol,
  facts: FactMap,
): OutcomeFactor[] {
  return protocol.nodes
    .filter((n) => n.node_type === "question" && n.fact_key)
    .map((n) => {
      const factKey = n.fact_key as string;
      const answer = facts[factKey];
      const resolved = isFactResolved(answer);
      let effect: string;
      if (!resolved) {
        effect = "Pendiente";
      } else if (n.answer_type === "single_select") {
        effect = "Valor registrado";
      } else if (answer === "yes") {
        effect = "Factor positivo";
      } else {
        effect = "Sin aporte positivo";
      }
      return {
        node_key: n.node_key,
        title: n.title,
        fact_key: factKey,
        answer: answerLabel(n, answer),
        resolved,
        effect,
      };
    });
}

/** Progreso de antecedentes: resueltos / totales (nodos pregunta). */
export function getProtocolProgress(
  protocol: ExecutionProtocol,
  facts: FactMap,
): { resolved: number; total: number } {
  const questions = protocol.nodes.filter(
    (n) => n.node_type === "question" && n.fact_key,
  );
  return {
    resolved: questions.filter((n) =>
      isFactResolved(facts[n.fact_key as string]),
    ).length,
    total: questions.length,
  };
}
