import { getPurpose, getTreatment } from "./scope";
import { deriveD5Candidates, readLawfulnessRoute } from "./specialRegime";
import type { AutomatedUseRecord, CompanyState, ExecutionContext } from "./types";
import type { FactMap } from "../../content/protocols/types";

/**
 * Derived session facts: proyecciones read-only de structured state
 * D2/D4.
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
 *
 * Excepción D5 (Punto 0, ADR-053): las candidaturas
 * `derived.purpose.d5_*_candidate` emiten solo `yes`/`no`; la
 * AUSENCIA del fact es el tercer estado (`unknown` para ruteo).
 * `d5_titleIII_candidate` lee answers almacenadas D2.05 como única
 * excepción de entrada (solo lectura, determinista); el resto deriva
 * exclusivamente de structured state + links. Ninguna escribe,
 * concluye ni genera conflictos.
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
  const uses = t.automatedUses ?? [];
  const covered = uses.filter((u) => u.article8bisCoverage === "covered");
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
    // Mecánico: existe al menos un link dato↔finalidad. No afirma que
    // la cobertura sea suficiente: eso es juicio profesional.
    "derived.treatment.links_exist": yesNo(
      (t.dataPurposeLinks ?? []).length > 0,
    ),
    // Mecánico: existe al menos una regla de conservación.
    "derived.treatment.retention_rules_exist": yesNo(
      Object.keys(t.retentionRules ?? {}).length > 0,
    ),
    // Mecánico: toda regla referencia al menos un dato. No afirma
    // proporcionalidad ni adecuación jurídica del criterio.
    "derived.treatment.retention_rules_linked": yesNo(
      Object.keys(t.retentionRules ?? {}).length > 0 &&
        Object.values(t.retentionRules ?? {}).every(
          (r) => r.dataItemIds.length > 0,
        ),
    ),
    // Usos automatizados D4.08/D4.09 (colección local compartida).
    // Mecánico: existe al menos un uso identificado.
    "derived.treatment.automated_uses_exist": yesNo(uses.length > 0),
    // Mecánico: todo uso identificado tiene cobertura determinada
    // (covered/not_covered). Vacío → "no": nunca completo por
    // vacuidad. No concluye no_covered_use: eso exige finalización
    // D4.08 con ReasoningRecord válido.
    "derived.treatment.automated_uses_coverage_complete": yesNo(
      uses.length > 0 &&
        uses.every((u) => u.article8bisCoverage !== "unknown"),
    ),
    // Mecánico: algún uso pendiente de clasificación. Un unknown no
    // deduce ausencia de cubiertos.
    "derived.treatment.automated_uses_coverage_pending": yesNo(
      uses.some((u) => u.article8bisCoverage === "unknown"),
    ),
    // Mecánico: existe al menos un uso cubierto por art. 8 bis.
    "derived.treatment.automated_uses_covered_exist": yesNo(
      covered.length > 0,
    ),
    // Mecánico: todo uso cubierto tiene vía determinada (las tres
    // excepciones y `none` cuentan como determinadas; `unknown`
    // sigue pendiente). Vacío de cubiertos → "no".
    "derived.treatment.automated_uses_legal_path_complete": yesNo(
      covered.length > 0 &&
        covered.every((u) => u.legalPath !== "unknown"),
    ),
    // Mecánico: algún uso cubierto con ausencia determinada de vía
    // (`none`). `unknown` es pendiente, no ausencia.
    "derived.treatment.automated_uses_unpathed_covered_exist": yesNo(
      covered.some((u) => u.legalPath === "none"),
    ),
    // Mecánico: todo uso cubierto tiene sus cinco verificaciones
    // determinadas (yes/no explícitos). Vacío de cubiertos → "no":
    // sin conjunción vacía hacia cumplimiento.
    "derived.treatment.automated_uses_safeguards_complete": yesNo(
      covered.length > 0 && covered.every((u) => safeguardsDetermined(u)),
    ),
    // Mecánico: todo uso cubierto con las cinco en "yes". Exige al
    // menos un cubierto: nunca cumplimiento por vacuidad.
    "derived.treatment.automated_uses_safeguards_enabled": yesNo(
      covered.length > 0 && covered.every((u) => safeguardsEnabled(u)),
    ),
    // Mecánico: algún uso cubierto con una verificación en "no".
    // Solo usos covered: not_covered/unknown quedan excluidos.
    "derived.treatment.automated_uses_safeguards_deficient": yesNo(
      covered.some((u) => safeguardsDeficient(u)),
    ),
  };
}

const SAFEGUARD_CHECKS = [
  "informationTransparency",
  "explanation",
  "humanIntervention",
  "pointOfView",
  "review",
] as const;

function safeguardValues(u: AutomatedUseRecord): (string | undefined)[] {
  const s = u.safeguards;
  if (!s) return [];
  return SAFEGUARD_CHECKS.map((f) => s[f]);
}

function safeguardsDetermined(u: AutomatedUseRecord): boolean {
  const values = safeguardValues(u);
  return (
    values.length === SAFEGUARD_CHECKS.length &&
    values.every((v) => v === "yes" || v === "no")
  );
}

function safeguardsEnabled(u: AutomatedUseRecord): boolean {
  const values = safeguardValues(u);
  return (
    values.length === SAFEGUARD_CHECKS.length &&
    values.every((v) => v === "yes")
  );
}

function safeguardsDeficient(u: AutomatedUseRecord): boolean {
  return safeguardValues(u).some((v) => v === "no");
}

/**
 * Proyección efectiva para un execution context válido. Company
 * aporta existencia de inventario; treatment sus derivados; purpose
 * los del padre más los propios. Contexto inválido → vacío.
 */
export function deriveSessionFacts(
  company: CompanyState | null,
  ctx: ExecutionContext,
): FactMap {
  if (!company || company.id !== ctx.companyId) return {};
  if (ctx.scope === "company") {
    // Mecánico: existe al menos un tratamiento (inventario no vacío).
    // Nunca corrección ni completitud del inventario: eso es revisión
    // profesional (D2.12).
    return {
      "derived.company.treatments_exist": yesNo(
        Object.keys(company.treatments ?? {}).length > 0,
      ),
    };
  }
  const out: FactMap = {
    ...deriveTreatmentFacts(company, ctx.treatmentId),
  };
  if (ctx.scope === "purpose") {
    const p = getPurpose(company, ctx.treatmentId, ctx.purposeId);
    if (!p) return {};
    out["derived.purpose.described"] = yesNo(
      p.purpose.description.trim() !== "",
    );
    // Candidaturas D5 (Punto 0): read-only, no persistidas; ausencia
    // de cada key = unknown para ruteo. Nunca canonical, nunca
    // observation/conflict source, nunca conclusión jurídica.
    const t = getTreatment(company, ctx.treatmentId);
    if (t) {
      Object.assign(
        out,
        deriveD5Candidates(
          t,
          ctx.purposeId,
          readLawfulnessRoute(company, ctx.treatmentId, ctx.purposeId),
        ),
      );
    }
  }
  return out;
}
