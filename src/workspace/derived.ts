import { getPurpose, getTreatment } from "./scope";
import { deriveD5Candidates, readLawfulnessRoute } from "./specialRegime";
import {
  cessionsForPurpose,
  hasValidParent,
  indexRelationships,
  processorsOf,
  subprocessorsOf,
} from "./thirdParty";
import type {
  AutomatedUseRecord,
  CompanyState,
  ExecutionContext,
  ThirdPartyRelationshipRecord,
} from "./types";
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
    ...deriveD6TreatmentFacts(t.thirdPartyRelationships ?? []),
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
 * Derivados D6 Punto 0 (ADR-054): proyecciones mecánicas de la
 * colección `thirdPartyRelationships[]`. Vacío nunca es completo ni
 * positivo: sin conjunción vacía hacia cumplimiento. Ningún juicio
 * jurídico; las conclusiones viven en futuros protocolos D6 con
 * ReasoningRecord y finalización explícita.
 */
function deriveD6TreatmentFacts(
  rels: readonly ThirdPartyRelationshipRecord[],
): FactMap {
  const byId = indexRelationships(rels);
  const processors = processorsOf(rels);
  const subprocessors = subprocessorsOf(rels);
  const complete = (r: ThirdPartyRelationshipRecord): boolean =>
    r.relationshipType !== "unknown" &&
    r.internationalDimension !== "unknown" &&
    (r.relationshipType !== "subprocessor" || hasValidParent(r, byId));
  const contractOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.processorAssessment?.contract;
  const instructionsOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.processorAssessment?.instructions;
  const operationalOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.processorAssessment?.operational;
  const authorizationOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.subprocessorAssessment?.authorization;
  return {
    // D6.01 routing: existencia, completitud estructural, unknowns,
    // dimensión internacional. Vacío ≠ completo.
    "derived.treatment.d6_relationships_exist": yesNo(rels.length > 0),
    "derived.treatment.d6_map_complete": yesNo(
      rels.length > 0 && rels.every(complete),
    ),
    "derived.treatment.d6_map_unknown_exist": yesNo(
      rels.some(
        (r) =>
          r.relationshipType === "unknown" ||
          r.internationalDimension === "unknown",
      ),
    ),
    "derived.treatment.d6_international_exist": yesNo(
      rels.some((r) => r.internationalDimension === "yes"),
    ),
    // D6.04: conjunto processor. Cero processors ≠ validado.
    "derived.treatment.d6_processors_exist": yesNo(processors.length > 0),
    "derived.treatment.d6_processors_contract_known": yesNo(
      processors.length > 0 &&
        processors.every(
          (r) => contractOf(r) === "validated" || contractOf(r) === "remediation_required",
        ),
    ),
    "derived.treatment.d6_processors_contract_validated": yesNo(
      processors.length > 0 && processors.every((r) => contractOf(r) === "validated"),
    ),
    "derived.treatment.d6_processors_contract_remediation": yesNo(
      processors.some((r) => contractOf(r) === "remediation_required"),
    ),
    "derived.treatment.d6_processors_contract_unknown": yesNo(
      processors.some((r) => contractOf(r) !== "validated" && contractOf(r) !== "remediation_required"),
    ),
    // D6.05: instrucciones del mismo conjunto.
    "derived.treatment.d6_processors_instructions_known": yesNo(
      processors.length > 0 &&
        processors.every(
          (r) =>
            instructionsOf(r) === "controlled" ||
            instructionsOf(r) === "remediation_required",
        ),
    ),
    "derived.treatment.d6_processors_instructions_controlled": yesNo(
      processors.length > 0 && processors.every((r) => instructionsOf(r) === "controlled"),
    ),
    "derived.treatment.d6_processors_instructions_remediation": yesNo(
      processors.some((r) => instructionsOf(r) === "remediation_required"),
    ),
    "derived.treatment.d6_processors_instructions_unknown": yesNo(
      processors.some(
        (r) => instructionsOf(r) !== "controlled" && instructionsOf(r) !== "remediation_required",
      ),
    ),
    // D6.07: controles operacionales del mismo conjunto.
    "derived.treatment.d6_processors_operational_known": yesNo(
      processors.length > 0 &&
        processors.every(
          (r) =>
            operationalOf(r) === "controlled" ||
            operationalOf(r) === "remediation_required",
        ),
    ),
    "derived.treatment.d6_processors_operational_controlled": yesNo(
      processors.length > 0 && processors.every((r) => operationalOf(r) === "controlled"),
    ),
    "derived.treatment.d6_processors_operational_remediation": yesNo(
      processors.some((r) => operationalOf(r) === "remediation_required"),
    ),
    "derived.treatment.d6_processors_operational_unknown": yesNo(
      processors.some(
        (r) => operationalOf(r) !== "controlled" && operationalOf(r) !== "remediation_required",
      ),
    ),
    // D6.06: conjunto subprocessor. Vacío ≠ controlado; "none recorded"
    // no es `not_applicable` (eso exige mapa D6.01 revisado/completo).
    "derived.treatment.d6_subprocessors_exist": yesNo(subprocessors.length > 0),
    "derived.treatment.d6_subprocessors_parents_complete": yesNo(
      subprocessors.length > 0 &&
        subprocessors.every((r) => hasValidParent(r, byId)),
    ),
    "derived.treatment.d6_subprocessors_authorization_known": yesNo(
      subprocessors.length > 0 &&
        subprocessors.every(
          (r) =>
            authorizationOf(r) === "controlled" ||
            authorizationOf(r) === "remediation_required",
        ),
    ),
    "derived.treatment.d6_subprocessors_authorization_controlled": yesNo(
      subprocessors.length > 0 &&
        subprocessors.every((r) => authorizationOf(r) === "controlled"),
    ),
    "derived.treatment.d6_subprocessors_authorization_remediation": yesNo(
      subprocessors.some((r) => authorizationOf(r) === "remediation_required"),
    ),
    "derived.treatment.d6_subprocessors_authorization_unknown": yesNo(
      subprocessors.some(
        (r) => authorizationOf(r) !== "controlled" && authorizationOf(r) !== "remediation_required",
      ),
    ),
  };
}

/**
 * Derivados D6.02/D6.03 por purpose: cesiones relevantes (type cession
 * con la purpose en `purposeIds`). Incluye la precisión D6.03
 * (instrumento vs licitud independientes): `ready_positive` solo con
 * todo supported + todo validated; `blocked_by_lawfulness` con todo
 * validated pero alguna licitud not_supported (bloqueado, NO
 * remediación de instrumento).
 */
function deriveD6PurposeFacts(
  rels: readonly ThirdPartyRelationshipRecord[],
  purposeId: string,
): FactMap {
  const cessions = cessionsForPurpose(rels, purposeId);
  const lawfulnessOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.cessionAssessment?.lawfulness;
  const instrumentOf = (r: ThirdPartyRelationshipRecord): string | undefined =>
    r.cessionAssessment?.instrument;
  const determined = (v: string | undefined, ok: readonly string[]): boolean =>
    v !== undefined && (ok as readonly string[]).includes(v);
  return {
    "derived.purpose.d6_cessions_exist": yesNo(cessions.length > 0),
    "derived.purpose.d6_cessions_lawfulness_known": yesNo(
      cessions.length > 0 &&
        cessions.every((r) => determined(lawfulnessOf(r), ["supported", "not_supported"])),
    ),
    "derived.purpose.d6_cessions_lawfulness_supported": yesNo(
      cessions.length > 0 && cessions.every((r) => lawfulnessOf(r) === "supported"),
    ),
    "derived.purpose.d6_cessions_lawfulness_blocked": yesNo(
      cessions.some((r) => lawfulnessOf(r) === "not_supported"),
    ),
    "derived.purpose.d6_cessions_lawfulness_unknown": yesNo(
      cessions.some((r) => lawfulnessOf(r) !== "supported" && lawfulnessOf(r) !== "not_supported"),
    ),
    "derived.purpose.d6_cessions_instrument_known": yesNo(
      cessions.length > 0 &&
        cessions.every((r) =>
          determined(instrumentOf(r), ["validated", "remediation_required"]),
        ),
    ),
    "derived.purpose.d6_cessions_instrument_validated": yesNo(
      cessions.length > 0 && cessions.every((r) => instrumentOf(r) === "validated"),
    ),
    "derived.purpose.d6_cessions_instrument_remediation": yesNo(
      cessions.some((r) => instrumentOf(r) === "remediation_required"),
    ),
    "derived.purpose.d6_cessions_instrument_unknown": yesNo(
      cessions.some(
        (r) => instrumentOf(r) !== "validated" && instrumentOf(r) !== "remediation_required",
      ),
    ),
    "derived.purpose.d6_cession_ready_positive": yesNo(
      cessions.length > 0 &&
        cessions.every((r) => lawfulnessOf(r) === "supported") &&
        cessions.every((r) => instrumentOf(r) === "validated"),
    ),
    "derived.purpose.d6_cession_blocked_by_lawfulness": yesNo(
      cessions.length > 0 &&
        cessions.every((r) => instrumentOf(r) === "validated") &&
        cessions.some((r) => lawfulnessOf(r) === "not_supported"),
    ),
  };
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
      // D6 Punto 0: routing de cesiones relevantes por purpose.
      Object.assign(
        out,
        deriveD6PurposeFacts(t.thirdPartyRelationships ?? [], ctx.purposeId),
      );
    }
  }
  return out;
}
