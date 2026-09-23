import type { ExecutionProtocol, GuidanceNode } from "./types";
import { DPO_NEED_ASSESSMENT_PROTOCOL } from "./dpo.need_assessment";
import { MPI_FORMALIZE_ADOPTION_PROTOCOL } from "./mpi.formalize_adoption";
import { DPO_GOVERNANCE_VALIDATION_PROTOCOL } from "./dpo.initial_governance_validation";
import { MPI_NEED_ASSESSMENT_PROTOCOL } from "./mpi.need_assessment";
import { GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL } from "./governance.preventive_framework";
import { DPO_DESIGNATE_PROTOCOL } from "./dpo.designate";
import { DPO_OPERATING_MODEL_PROTOCOL } from "./dpo.operating_model";
import { DPO_INFRINGEMENT_ESCALATION_PROTOCOL } from "./dpo.infringement_escalation";
import { DPO_TERMINATE_OR_REPLACE_PROTOCOL } from "./dpo.terminate_or_replace";
import { MPI_ASSEMBLE_PROGRAM_PROTOCOL } from "./mpi.assemble_program";
import {
  getCanonicalActivity,
  getUnresolvedReferences,
} from "../registry";

/**
 * Registry reutilizable de protocolos de ejecución guiada.
 *
 * Resuelve `activity_key → ExecutionProtocol`. Una actividad tiene cero o
 * un protocolo activo en Stage 1. La relación vive aquí; `ActivityDefinition`
 * permanece intacta y no conoce los protocolos.
 */

const PROTOCOLS: ExecutionProtocol[] = [
  DPO_NEED_ASSESSMENT_PROTOCOL,
  MPI_FORMALIZE_ADOPTION_PROTOCOL,
  DPO_GOVERNANCE_VALIDATION_PROTOCOL,
  MPI_NEED_ASSESSMENT_PROTOCOL,
  GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL,
  DPO_DESIGNATE_PROTOCOL,
  DPO_OPERATING_MODEL_PROTOCOL,
  DPO_INFRINGEMENT_ESCALATION_PROTOCOL,
  DPO_TERMINATE_OR_REPLACE_PROTOCOL,
  MPI_ASSEMBLE_PROGRAM_PROTOCOL,
];

const BY_ACTIVITY = new Map<string, ExecutionProtocol>(
  PROTOCOLS.map((p) => [p.activity_key, p]),
);

const BY_KEY = new Map<string, ExecutionProtocol>(
  PROTOCOLS.map((p) => [p.protocol_key, p]),
);

export function listProtocols(): ExecutionProtocol[] {
  return [...PROTOCOLS];
}

export function getProtocolForActivity(
  activityKey: string,
): ExecutionProtocol | undefined {
  return BY_ACTIVITY.get(activityKey);
}

export function getProtocol(protocolKey: string): ExecutionProtocol | undefined {
  return BY_KEY.get(protocolKey);
}

export function getProtocolNode(
  protocol: ExecutionProtocol,
  nodeKey: string,
): ExecutionProtocol["nodes"][number] | undefined {
  return protocol.nodes.find((n) => n.node_key === nodeKey);
}

export function getProtocolOutcome(
  protocol: ExecutionProtocol,
  outcomeKey: string,
): ExecutionProtocol["outcomes"][number] | undefined {
  return protocol.outcomes.find((o) => o.outcome_key === outcomeKey);
}

/**
 * Validación estructural de un protocolo. Devuelve la lista de errores;
 * vacía cuando el protocolo es íntegro. No silencia referencias rotas.
 */
export function validateProtocolStructure(protocol: ExecutionProtocol): string[] {
  const errors: string[] = [];
  const nodeKeys = new Set(protocol.nodes.map((n) => n.node_key));
  const outcomeKeys = new Set(protocol.outcomes.map((o) => o.outcome_key));
  // Referencias de actividad: resuelven o usan el mecanismo pending
  // canónico; nada se ignora en silencio.
  const pendingActivityKeys = new Set(getUnresolvedReferences());

  if (protocol.nodes.length === 0) {
    errors.push(`${protocol.protocol_key}: sin nodos`);
  }
  if (nodeKeys.size !== protocol.nodes.length) {
    errors.push(`${protocol.protocol_key}: node keys duplicadas`);
  }
  if (outcomeKeys.size !== protocol.outcomes.length) {
    errors.push(`${protocol.protocol_key}: outcome keys duplicadas`);
  }
  if (!nodeKeys.has(protocol.entry_node_key)) {
    errors.push(
      `${protocol.protocol_key}: entry_node_key ${protocol.entry_node_key} no existe`,
    );
  }
  for (const o of protocol.outcomes) {
    if (o.next_actions.length === 0) {
      errors.push(`${protocol.protocol_key}: outcome ${o.outcome_key} sin next actions`);
    }
  }
  for (const n of protocol.nodes) {
    if (n.node_key === "resultado") {
      errors.push(
        `${protocol.protocol_key}: node key reservada "resultado" en nodo`,
      );
    }
    for (const k of n.related_activity_keys ?? []) {
      if (!getCanonicalActivity(k) && !pendingActivityKeys.has(k)) {
        errors.push(
          `${protocol.protocol_key}: nodo ${n.node_key} referencia actividad inexistente ${k}`,
        );
      }
    }
    if (n.node_type === "question") {
      if (!n.fact_key) {
        errors.push(`${protocol.protocol_key}: nodo ${n.node_key} sin fact_key`);
      }
      if (!n.options || n.options.length === 0) {
        errors.push(`${protocol.protocol_key}: nodo ${n.node_key} sin opciones`);
      }
      for (const o of n.options ?? []) {
        if (o.next_node_key && !nodeKeys.has(o.next_node_key)) {
          errors.push(
            `${protocol.protocol_key}: opción ${n.node_key}/${o.value} apunta a nodo inexistente ${o.next_node_key}`,
          );
        }
        if (o.fact_effect && n.fact_key && o.fact_effect.fact_key !== n.fact_key) {
          errors.push(
            `${protocol.protocol_key}: opción ${n.node_key}/${o.value} escribe un fact de otro nodo`,
          );
        }
      }
    }
    if (n.node_type === "decision" && (!n.transitions || n.transitions.length === 0)) {
      errors.push(`${protocol.protocol_key}: nodo ${n.node_key} sin transiciones`);
    }
    if (n.default_next_node_key && !nodeKeys.has(n.default_next_node_key)) {
      errors.push(
        `${protocol.protocol_key}: nodo ${n.node_key} con default_next inexistente ${n.default_next_node_key}`,
      );
    }
    for (const t of n.transitions ?? []) {
      if (t.goto_outcome_key && !outcomeKeys.has(t.goto_outcome_key)) {
        errors.push(
          `${protocol.protocol_key}: regla ${t.rule_id} apunta a outcome inexistente ${t.goto_outcome_key}`,
        );
      }
      if (t.goto_node_key && !nodeKeys.has(t.goto_node_key)) {
        errors.push(
          `${protocol.protocol_key}: regla ${t.rule_id} apunta a nodo inexistente ${t.goto_node_key}`,
        );
      }
      if (!t.goto_outcome_key && !t.goto_node_key) {
        errors.push(`${protocol.protocol_key}: regla ${t.rule_id} sin destino`);
      }
    }
  }
  for (const a of protocol.outcomes) {
    for (const na of a.next_actions) {      if (na.kind === "node" && na.node_key && !nodeKeys.has(na.node_key)) {
        errors.push(
          `${protocol.protocol_key}: next action de ${a.outcome_key} apunta a nodo inexistente ${na.node_key}`,
        );
      }
      if (
        na.kind === "activity" &&
        na.activity_key &&
        !getCanonicalActivity(na.activity_key) &&
        !pendingActivityKeys.has(na.activity_key)
      ) {
        errors.push(
          `${protocol.protocol_key}: next action de ${a.outcome_key} referencia actividad inexistente ${na.activity_key}`,
        );
      }
    }
  }
  // Efectos canónicos: solo pares {fact_key, value} no vacíos.
  // Sin expresiones, condiciones ni lógica.
  for (const o of protocol.outcomes) {
    for (const e of o.canonical_fact_effects ?? []) {
      if (e.fact_key.trim() === "" || e.value.trim() === "") {
        errors.push(
          `${protocol.protocol_key}: outcome ${o.outcome_key} con canonical fact effect vacío`,
        );
      }
    }
  }
  // Requisitos de reasoning: solo nombres de campo del contrato
  // canónico ReasoningRecord (DATA_CONTRACTS §10).
  const reasoningFields = new Set([
    "conclusion",
    "legal_question",
    "facts_considered",
    "legal_factors",
    "evidence_refs",
    "alternatives_considered",
    "rationale",
    "decided_by",
    "reviewed_by",
    "decided_at",
    "legal_basis",
  ]);
  for (const f of protocol.reasoning_requirements?.required_fields ?? []) {
    if (!reasoningFields.has(f)) {
      errors.push(
        `${protocol.protocol_key}: reasoning requirement desconocido ${f}`,
      );
    }
  }
  for (const f of protocol.decision_fact_keys) {
    const producer = protocol.nodes.find(
      (n) => n.node_type === "question" && n.fact_key === f,
    );
    if (!producer) {
      errors.push(
        `${protocol.protocol_key}: decision fact ${f} sin nodo pregunta que lo produzca`,
      );
    }
  }
  // Prerrequisitos semánticos: cada required fact debe ser producido por
  // un nodo del protocolo o estar declarado como externo/injectable.
  const producedFacts = new Set(
    protocol.nodes
      .filter((n) => n.node_type === "question" && n.fact_key)
      .map((n) => n.fact_key as string),
  );
  const externalFacts = new Set(protocol.external_fact_keys ?? []);
  for (const n of protocol.nodes) {
    for (const f of n.required_facts ?? []) {
      if (!producedFacts.has(f) && !externalFacts.has(f)) {
        errors.push(
          `${protocol.protocol_key}: nodo ${n.node_key} requiere fact desconocido ${f}`,
        );
      }
    }
  }
  // Navegación acíclica: el grafo de destinos (opciones, defecto,
  // goto_node) no debe contener ciclos infinitos.
  errors.push(...detectNavigationCycles(protocol, nodeKeys));
  // Nodo conclusión (juicio profesional): como máximo uno por protocolo.
  // Es el nodo pregunta cuyas opciones coinciden todas con outcome keys;
  // sus efectos escriben un único fact de trabajo que ningún otro nodo
  // escribe y que no pertenece a decision_fact_keys.
  const conclusionNodes = protocol.nodes.filter(
    (n) =>
      n.node_type === "question" &&
      (n.options?.length ?? 0) > 0 &&
      (n.options ?? []).every((o) =>
        outcomeKeys.has(o.value),
      ),
  );
  if (conclusionNodes.length > 1) {
    errors.push(
      `${protocol.protocol_key}: múltiples nodos conclusión (${conclusionNodes.map((n) => n.node_key).join(", ")})`,
    );
  }
  for (const n of conclusionNodes) {
    const written = new Set(
      (n.options ?? [])
        .map((o) => o.fact_effect?.fact_key)
        .filter((f): f is string => f !== undefined),
    );
    if (written.size !== 1) {
      errors.push(
        `${protocol.protocol_key}: nodo conclusión ${n.node_key} debe escribir un único fact de trabajo`,
      );
    }
    const draft = [...written][0];
    if (draft && protocol.decision_fact_keys.includes(draft)) {
      errors.push(
        `${protocol.protocol_key}: fact de trabajo ${draft} no pertenece a decision_fact_keys`,
      );
    }
    if (draft) {
      for (const m of protocol.nodes) {
        if (m === n) continue;
        for (const o of m.options ?? []) {
          if (o.fact_effect?.fact_key === draft) {
            errors.push(
              `${protocol.protocol_key}: fact de trabajo ${draft} escrito también por ${m.node_key}`,
            );
          }
        }
      }
    }
  }
  return errors;
}

/**
 * Nodo conclusión de juicio profesional, si existe: el nodo pregunta
 * cuyas opciones coinciden todas con outcome keys del protocolo. Deriva
 * de la estructura canónica (sin literales de actividad); como máximo
 * uno por protocolo (ver validación).
 */
export function findConclusionNode(
  protocol: ExecutionProtocol,
): GuidanceNode | undefined {
  return protocol.nodes.find(
    (n) =>
      n.node_type === "question" &&
      (n.options?.length ?? 0) > 0 &&
      (n.options ?? []).every((o) =>
        protocol.outcomes.some((out) => out.outcome_key === o.value),
      ),
  );
}

/** Aristas de navegación salientes de un nodo. */
function outgoingEdges(
  protocol: ExecutionProtocol,
  nodeKey: string,
): string[] {
  const node = protocol.nodes.find((n) => n.node_key === nodeKey);
  if (!node) return [];
  const edges = new Set<string>();
  for (const o of node.options ?? []) {
    if (o.next_node_key) edges.add(o.next_node_key);
  }
  if (node.default_next_node_key) edges.add(node.default_next_node_key);
  for (const t of node.transitions ?? []) {
    if (t.goto_node_key) edges.add(t.goto_node_key);
  }
  return [...edges];
}

function detectNavigationCycles(
  protocol: ExecutionProtocol,
  nodeKeys: Set<string>,
): string[] {
  const errors: string[] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  function visit(key: string): void {
    if (stack.includes(key)) {
      errors.push(
        `${protocol.protocol_key}: ciclo de navegación ${[...stack, key].join(" → ")}`,
      );
      return;
    }
    if (visited.has(key)) return;
    visited.add(key);
    stack.push(key);
    for (const next of outgoingEdges(protocol, key)) {
      if (nodeKeys.has(next)) visit(next);
    }
    stack.pop();
  }
  visit(protocol.entry_node_key);
  // Nodos no alcanzables desde la entrada también se revisan.
  for (const k of nodeKeys) {
    if (!visited.has(k)) visit(k);
  }
  return errors;
}
