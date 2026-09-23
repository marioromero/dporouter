import { getPurpose, getTreatment } from "./scope";
import type { CompanyState, ExecutionContext } from "./types";
import type { FactMap } from "../../content/protocols/types";

/**
 * Derived session facts: proyecciones read-only de structured state D2.
 *
 * Capa mínima, pura y determinista. Mismo CompanyState + mismo
 * ExecutionContext → mismo FactMap. Sin side effects, sin
 * persistencia, sin observations, sin resolutions, sin protocol
 * answers, sin canonical effects, sin execution scope nuevo.
 *
 * Solo afirmaciones objetivas/mecánicas (existencia, completitud
 * estructural). Ningún juicio jurídico: especificidad, corrección,
 * adecuación o cumplimiento permanecen en protocolo/reasoning.
 *
 * Namespace reservado `derived.*`: no persistible, no escribible
 * manualmente, no materializable. Los valores usan el vocabulario del
 * motor (`yes`/`no`); nunca `unknown` porque describen objetivamente
 * el estado actual.
 */

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

/** Derivados treatment-level (padre incluido en vista purpose). */
function deriveTreatmentFacts(
  company: CompanyState,
  treatmentId: string,
): FactMap {
  const t = getTreatment(company, treatmentId);
  if (!t) return {};
  const actors = Object.values(t.actors ?? {});
  const purposes = Object.values(t.purposes ?? {});
  return {
    "derived.treatment.actors_exist": yesNo(actors.length > 0),
    // Vacío → "no": un conjunto vacío nunca cuenta como completo.
    // Solo completitud estructural; nunca corrección jurídica.
    "derived.treatment.actors_roles_complete": yesNo(
      actors.length > 0 && actors.every((a) => a.role !== undefined),
    ),
    "derived.treatment.purposes_exist": yesNo(purposes.length > 0),
    // Mecánico: todas descritas (no vacías). Nunca especificidad,
    // explicitud ni licitud: eso es juicio profesional.
    "derived.treatment.purposes_described_complete": yesNo(
      purposes.length > 0 &&
        purposes.every((p) => p.purpose.description.trim() !== ""),
    ),
    // Mecánico: identificador canónico asignado (requisito D2.01).
    // El id local estable siempre existe; esto verifica el acto de
    // identificación, no corrección.
    "derived.treatment.identified": yesNo(
      (t.context.canonicalTreatmentId ?? "").trim() !== "",
    ),
    "derived.treatment.data_items_exist": yesNo(
      Object.keys(t.dataItems ?? {}).length > 0,
    ),
    "derived.treatment.sources_exist": yesNo(
      Object.keys(t.sources ?? {}).length > 0,
    ),
  };
}

/**
 * Proyección efectiva para un execution context válido. Company
 * aporta vacío; treatment sus derivados; purpose los del padre más
 * los propios. Contexto inválido → vacío.
 */
export function deriveSessionFacts(
  company: CompanyState | null,
  ctx: ExecutionContext,
): FactMap {
  if (!company || company.id !== ctx.companyId) return {};
  if (ctx.scope === "company") return {};
  const out: FactMap = {
    ...deriveTreatmentFacts(company, ctx.treatmentId),
  };
  if (ctx.scope === "purpose") {
    const p = getPurpose(company, ctx.treatmentId, ctx.purposeId);
    if (!p) return {};
    out["derived.purpose.described"] = yesNo(
      p.purpose.description.trim() !== "",
    );
  }
  return out;
}
