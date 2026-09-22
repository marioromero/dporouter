import type { CompanyState, FactRecord } from "./types";

/**
 * Resolución de hechos por empresa con origen explícito.
 *
 * Un mismo fact puede existir en Diagnóstico y en respuestas de guías
 * con valores distintos. La resolución es determinista y única en toda
 * la app: gana el más reciente (`updatedAt`); en empate, Diagnóstico
 * (base curada). Nada se mezcla en silencio: cada valor conserva su
 * `source` y los conflictos quedan visibles donde se listan hechos.
 */

export function groupFactRecords(
  company: CompanyState | null,
): Record<string, FactRecord[]> {
  const out: Record<string, FactRecord[]> = {};
  if (!company) return out;
  const push = (k: string, r: FactRecord) => {
    out[k] = [...(out[k] ?? []), r];
  };
  for (const [k, r] of Object.entries(company.diagnosticFacts)) push(k, r);
  for (const answers of Object.values(company.protocolAnswers)) {
    for (const [k, r] of Object.entries(answers)) push(k, r);
  }
  return out;
}

function pickWinner(list: FactRecord[]): FactRecord {
  return (
    list
      .slice()
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) ||
          (a.source === "diagnostico" ? -1 : b.source === "diagnostico" ? 1 : 0),
      )[0] ?? list[0]
  );
}

/**
 * Hechos fusionados: un valor vigente por key con su origen.
 * `excludeProtocol` omite las respuestas propias de esa guía (para
 * construir contexto inyectado sin auto-proveerse).
 */
export function mergedFactRecords(
  company: CompanyState | null,
  excludeProtocol?: string,
): Record<string, FactRecord> {
  if (!company) return {};
  const out: Record<string, FactRecord> = {};
  const byKey = new Map<string, FactRecord[]>();
  const push = (k: string, r: FactRecord) => {
    byKey.set(k, [...(byKey.get(k) ?? []), r]);
  };
  for (const [k, r] of Object.entries(company.diagnosticFacts)) push(k, r);
  for (const [pk, answers] of Object.entries(company.protocolAnswers)) {
    if (pk === excludeProtocol) continue;
    for (const [k, r] of Object.entries(answers)) push(k, r);
  }
  for (const [k, list] of byKey) out[k] = pickWinner(list);
  return out;
}

/** ¿Hay valores distintos según origen para este fact? */
export function factHasConflict(
  company: CompanyState | null,
  factKey: string,
): boolean {
  if (!company) return false;
  const values = new Set<string>();
  const diag = company.diagnosticFacts[factKey];
  if (diag) values.add(diag.value);
  for (const answers of Object.values(company.protocolAnswers)) {
    const r = answers[factKey];
    if (r) values.add(r.value);
  }
  return values.size > 1;
}
