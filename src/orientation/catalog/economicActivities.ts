import catalog from "./economic-activities.json";

export interface EconomicActivity {
  code: string;
  description: string;
}

export const ECONOMIC_ACTIVITY_SOURCE = {
  url: catalog.sourceUrl,
  consultedAt: catalog.consultedAt,
  version: null,
} as const;

export const ECONOMIC_ACTIVITIES: readonly EconomicActivity[] = catalog.activities;

export function normalizeActivitySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .trim();
}

export function searchEconomicActivities(query: string, limit = 30): EconomicActivity[] {
  const normalized = normalizeActivitySearch(query);
  if (normalized === "") return [];
  const terms = normalized.split(/\s+/);
  const found: EconomicActivity[] = [];
  for (const activity of ECONOMIC_ACTIVITIES) {
    const haystack = normalizeActivitySearch(`${activity.code} ${activity.description}`);
    if (terms.every((term) => haystack.includes(term))) {
      found.push(activity);
      if (found.length >= limit) break;
    }
  }
  return found;
}
