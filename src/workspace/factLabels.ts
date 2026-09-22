import { listProtocols } from "../../content/protocols/registry";

/**
 * Etiquetas humanas para facts persistidos, derivadas de los protocolos
 * canónicos (títulos de nodos y opciones). Sin literales de contenido:
 * todo se resuelve dinámicamente desde el registry.
 */

export function describeFactKey(factKey: string): string {
  for (const p of listProtocols()) {
    const node = p.nodes.find(
      (n) => n.node_type === "question" && n.fact_key === factKey,
    );
    if (node) return node.title;
  }
  return factKey;
}

export function describeFactValue(factKey: string, value: string): string {
  if (value === "unknown") return "Desconocido";
  for (const p of listProtocols()) {
    const node = p.nodes.find(
      (n) => n.node_type === "question" && n.fact_key === factKey,
    );
    const label = node?.options?.find((o) => o.value === value)?.label;
    if (label) return label;
  }
  return value;
}

/** Opciones del nodo productor de un fact, si existe. */
export function producerOptions(
  factKey: string,
): Array<{ value: string; label: string }> {
  for (const p of listProtocols()) {
    const node = p.nodes.find(
      (n) => n.node_type === "question" && n.fact_key === factKey,
    );
    if (node?.options) {
      return node.options.map((o) => ({ value: o.value, label: o.label }));
    }
  }
  return [];
}
