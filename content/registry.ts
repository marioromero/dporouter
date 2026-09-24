import type { ActivityDefinition } from "../src/types";
import { D01_ACTIVITIES, D1_ACTIVITY_KEYS } from "./domains/d01";
import { D02_ACTIVITIES, D2_ACTIVITY_KEYS } from "./domains/d02";
import { D03_ACTIVITIES, D3_ACTIVITY_KEYS } from "./domains/d03";
import { D04_ACTIVITIES, D4_ACTIVITY_KEYS } from "./domains/d04";
import { normalizeText } from "./text";

/**
 * Agregado canónico de solo lectura sobre /content/domains.
 * No duplica definiciones: reexporta y deriva índices. La UI y los tests
 * consumen este registry en lugar de importar dominios por separado.
 */
export const ALL_ACTIVITIES: ActivityDefinition[] = [
  ...D01_ACTIVITIES,
  ...D02_ACTIVITIES,
  ...D03_ACTIVITIES,
  ...D04_ACTIVITIES,
];

const KEYS = new Set<string>(ALL_ACTIVITIES.map((a) => a.activity_key));

const DOMAIN_OF = new Map<string, { domainKey: string; domainCode: string }>();
for (const k of D1_ACTIVITY_KEYS) DOMAIN_OF.set(k, { domainKey: "d1", domainCode: "D1" });
for (const k of D2_ACTIVITY_KEYS) DOMAIN_OF.set(k, { domainKey: "d2", domainCode: "D2" });
for (const k of D3_ACTIVITY_KEYS) DOMAIN_OF.set(k, { domainKey: "d3", domainCode: "D3" });
for (const k of D4_ACTIVITY_KEYS) DOMAIN_OF.set(k, { domainKey: "d4", domainCode: "D4" });

export function getCanonicalActivity(
  activityKey: string,
): ActivityDefinition | undefined {
  return ALL_ACTIVITIES.find((a) => a.activity_key === activityKey);
}

export function getCanonicalKeys(): Set<string> {
  return new Set<string>(KEYS);
}

export function getDomainForActivity(
  activityKey: string,
): { domainKey: string; domainCode: string } | undefined {
  return DOMAIN_OF.get(activityKey);
}

/**
 * Referencias cross-domain pendientes: destinos no definidos por ningún
 * dominio importado. Lista derivada, no manual.
 */
export function getUnresolvedReferences(): string[] {
  const missing = new Set<string>();
  for (const a of ALL_ACTIVITIES) {
    for (const d of a.activity_dependencies) {
      if (!KEYS.has(d.target_activity_key)) {
        missing.add(d.target_activity_key);
      }
    }
  }
  return [...missing].sort();
}

/** Referencias pendientes originadas por un dominio concreto. */
export function getDomainPendingReferences(
  activities: ActivityDefinition[],
): string[] {
  const missing = new Set<string>();
  for (const a of activities) {
    for (const d of a.activity_dependencies) {
      if (!KEYS.has(d.target_activity_key)) {
        missing.add(d.target_activity_key);
      }
    }
  }
  return [...missing].sort();
}

/** Búsqueda sobre actividades canónicas: código, nombre, clave, objetivo. */
export function searchCanonicalActivities(term: string): ActivityDefinition[] {
  const q = normalizeText(term.trim());
  if (q === "") return [];
  return ALL_ACTIVITIES.filter((a) =>
    [a.human_code, a.name, a.activity_key, a.objective].some((field) =>
      normalizeText(field).includes(q),
    ),
  );
}
