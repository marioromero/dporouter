import type { ExecutionProtocol } from "../../content/protocols/types";
import type { CompanyState, FactRecord, FactResolution } from "./types";

/**
 * Estados de fact por empresa. Tres estados distinguibles, nunca
 * convertidos entre sí en silencio:
 *
 * - unresolved: sin observaciones (equivale a pendiente);
 * - resolved: una sola voz entre fuentes, o resolución explícita vigente;
 * - conflict: fuentes distintas con valores distintos y sin resolución
 *   explícita vigente. NO es unknown ni false.
 *
 * Reglas:
 * - misma fuente + actualización → vale la observación más reciente de
 *   esa fuente (comparación por origen, nunca global ciega);
 * - fuentes distintas + mismo valor → acuerdo (resolved);
 * - fuentes distintas + valores distintos → conflicto, salvo resolución
 *   explícita posterior a toda observación contradictoria;
 * - una nueva observación contradictoria posterior a la resolución
 *   reabre el conflicto automáticamente.
 */

export type FactState = "unresolved" | "resolved" | "conflict";

export interface FactStatusResolved {
  state: "resolved";
  value: string;
  /** Orígenes que respaldan el valor vigente (humanizables). */
  sources: string[];
  resolution?: FactResolution;
}

export interface FactStatusConflict {
  state: "conflict";
  /** Última observación por fuente, para mostrar alternativas. */
  alternatives: FactRecord[];
}

export type FactStatus =
  | { state: "unresolved" }
  | FactStatusResolved
  | FactStatusConflict;

function latestPerSource(records: FactRecord[]): FactRecord[] {
  const bySource = new Map<string, FactRecord>();
  for (const r of records) {
    const prev = bySource.get(r.source);
    if (!prev || r.updatedAt >= prev.updatedAt) bySource.set(r.source, r);
  }
  return [...bySource.values()];
}

function statusOfCandidates(
  records: FactRecord[],
  resolution?: FactResolution,
): FactStatus {
  const latests = latestPerSource(records);
  if (latests.length === 0) return { state: "unresolved" };
  const values = new Set(latests.map((r) => r.value));
  if (values.size === 1) {
    return {
      state: "resolved",
      value: latests[0].value,
      sources: latests.map((r) => r.source),
    };
  }
  if (resolution && values.has(resolution.value)) {
    // La resolución es un acto humano explícito posterior a las
    // observaciones que adjudica: en empate de milisegundos prevalece.
    // Solo una contradicción estrictamente posterior la reabre.
    const contradictedAfter = latests.some(
      (r) => r.value !== resolution.value && r.updatedAt > resolution.resolvedAt,
    );
    if (!contradictedAfter) {
      return {
        state: "resolved",
        value: resolution.value,
        sources: [
          "resolucion_profesional",
          ...latests
            .filter((r) => r.value === resolution.value)
            .map((r) => r.source),
        ],
        resolution,
      };
    }
  }
  return { state: "conflict", alternatives: latests };
}

function collectRecords(
  company: CompanyState | null,
  factKey: string,
  excludeProtocol?: string,
): FactRecord[] {
  if (!company) return [];
  const out: FactRecord[] = [];
  const diag = company.diagnosticFacts[factKey];
  if (diag) out.push(diag);
  for (const [pk, answers] of Object.entries(company.protocolAnswers)) {
    if (pk === excludeProtocol) continue;
    const r = answers[factKey];
    if (r) out.push(r);
  }
  return out;
}

export function getFactStatus(
  company: CompanyState | null,
  factKey: string,
): FactStatus {
  if (!company) return { state: "unresolved" };
  return statusOfCandidates(
    collectRecords(company, factKey),
    company.factResolutions[factKey],
  );
}

/**
 * Hechos fusionados con resoluciones aplicadas. En conflicto, el valor
 * es el de la observación más reciente (solo display/recorrido: la
 * conclusión definitiva se bloquea por separado y nunca usa ese valor
 * como si estuviera resuelto).
 */
export function mergedFactRecords(
  company: CompanyState | null,
  excludeProtocol?: string,
): Record<string, FactRecord> {
  if (!company) return {};
  const keys = new Set<string>([
    ...Object.keys(company.diagnosticFacts),
    ...Object.values(company.protocolAnswers).flatMap((a) => Object.keys(a)),
  ]);
  const out: Record<string, FactRecord> = {};
  for (const k of keys) {
    if (excludeProtocol && company.protocolAnswers[excludeProtocol]?.[k]) {
      // Las respuestas propias no se auto-inyectan; se evalúan aparte.
      const others = collectRecords(company, k, excludeProtocol);
      const st = statusOfCandidates(others, company.factResolutions[k]);
      if (st.state === "unresolved") continue;
      if (st.state === "resolved") {
        out[k] = {
          value: st.value,
          source: st.resolution ? "resolucion_profesional" : st.sources[0],
          updatedAt: "",
        };
      } else {
        const latest = latestPerSource(others).sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        )[0];
        if (latest) out[k] = latest;
      }
      continue;
    }
    const st = getFactStatus(company, k);
    if (st.state === "unresolved") continue;
    if (st.state === "resolved") {
      out[k] = {
        value: st.value,
        source: st.resolution ? "resolucion_profesional" : st.sources[0],
        updatedAt: "",
      };
    } else {
      const latest = latestPerSource(collectRecords(company, k)).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )[0];
      if (latest) out[k] = latest;
    }
  }
  return out;
}

/** ¿Hay valores distintos según origen para este fact? */
export function factHasConflict(
  company: CompanyState | null,
  factKey: string,
): boolean {
  if (!company) return false;
  return getFactStatus(company, factKey).state === "conflict";
}

/** Orígenes que respaldan observaciones de un fact (para mostrar amplitud). */
export function factSources(
  company: CompanyState | null,
  factKey: string,
): string[] {
  if (!company) return [];
  const out: string[] = [];
  if (company.diagnosticFacts[factKey]) out.push("diagnostico");
  for (const [pk, answers] of Object.entries(company.protocolAnswers)) {
    if (answers[factKey]) out.push(pk);
  }
  const res = company.factResolutions[factKey];
  if (res) out.push("resolucion_profesional");
  return [...new Set(out)];
}

/** Facts que un protocolo necesita (pregunta, decisión y requeridos). */
export function protocolNeededFacts(protocol: ExecutionProtocol): string[] {
  const out = new Set<string>(protocol.decision_fact_keys);
  for (const n of protocol.nodes) {
    if (n.fact_key) out.add(n.fact_key);
    for (const f of n.required_facts ?? []) out.add(f);
  }
  return [...out];
}

/** Necesidades del protocolo en conflicto: bloquean conclusión definitiva. */
export function blockingConflicts(
  protocol: ExecutionProtocol,
  company: CompanyState | null,
): string[] {
  if (!company) return [];
  return protocolNeededFacts(protocol).filter(
    (k) => getFactStatus(company, k).state === "conflict",
  );
}

/** Nombre humano de una fuente. Nunca IDs en flujo normal. */
export function humanSourceName(source: string): string {
  if (source === "diagnostico") return "Diagnóstico";
  if (source === "resolucion_profesional") return "Resolución del profesional";
  if (source === "contexto inicial") return "Contexto inicial";
  return "Evaluación guiada";
}
