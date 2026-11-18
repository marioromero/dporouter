import type { CompanyState, ExecutionContext } from "../../workspace/types";
import { getFactStatus } from "../../workspace/facts";
import { deriveSessionFacts } from "../../workspace/derived";
import { getPurpose, getTreatment } from "../../workspace/scope";
import { D5_CANDIDATE_KEYS } from "../../workspace/specialRegime";
import { getScopedFactState } from "../../workspace/scope";
import { WORKSPACE_SIGNAL_KEYS } from "../engine/rules";
import type { WorkspaceOrientationSignal } from "../engine/types";

function addSignal(
  out: WorkspaceOrientationSignal[],
  key: string,
  label: string,
  scope: WorkspaceOrientationSignal["scope"],
  scopeLabel?: string,
) {
  out.push({ key, label, scope, ...(scopeLabel ? { scopeLabel } : {}) });
}

function resolvedCompanyFact(company: CompanyState, factKey: string, accepted: readonly string[]): boolean {
  const status = getFactStatus(company, factKey);
  return status.state === "resolved" && accepted.includes(status.value);
}

function resolvedScopedFact(
  company: CompanyState,
  context: ExecutionContext,
  factKey: string,
  accepted: readonly string[],
): boolean {
  const status = getScopedFactState(company, context, factKey);
  return status.state === "resolved" && status.value !== undefined && accepted.includes(status.value);
}

/** Projection read-only; it never reads activityStates or writes workspace data. */
export function readWorkspaceOrientationSignals(
  company: CompanyState | null,
): WorkspaceOrientationSignal[] {
  if (!company) return [];
  const out: WorkspaceOrientationSignal[] = [];

  const mpiLifecycle = getFactStatus(company, "mpi.lifecycle_status");
  if (
    mpiLifecycle.state === "resolved" &&
    ["adoption_formalized", "implementing", "implemented"].includes(mpiLifecycle.value)
  ) {
    addSignal(out, WORKSPACE_SIGNAL_KEYS.mpiActive, "Estado del MPI resuelto en el workspace", "company");
    if (["adoption_formalized", "implementing"].includes(mpiLifecycle.value)) {
      addSignal(out, WORKSPACE_SIGNAL_KEYS.mpiBeingImplemented, "Estado del MPI resuelto en el workspace", "company");
    }
  }

  if (resolvedCompanyFact(company, "transparency.policy_status", ["assembled"])) {
    addSignal(out, WORKSPACE_SIGNAL_KEYS.d3PolicyAssembled, "Política registrada como ensamblada", "company");
  }

  const treatmentId = company.activeTreatmentId;
  const treatment = treatmentId ? getTreatment(company, treatmentId) : undefined;
  if (!treatment || !treatmentId) return out;

  const treatmentContext: ExecutionContext = { scope: "treatment", companyId: company.id, treatmentId };
  const treatmentFacts = deriveSessionFacts(company, treatmentContext);
  const treatmentScopeLabel = `Tratamiento: ${treatment.context.name}`;
  const treatmentMappings: Array<[string, string, string]> = [
    ["derived.treatment.identified", "yes", WORKSPACE_SIGNAL_KEYS.treatmentIdentified],
    ["derived.treatment.actors_exist", "yes", WORKSPACE_SIGNAL_KEYS.treatmentActorsExist],
    ["derived.treatment.purposes_exist", "yes", WORKSPACE_SIGNAL_KEYS.treatmentPurposesExist],
    ["derived.treatment.sources_exist", "yes", WORKSPACE_SIGNAL_KEYS.treatmentSourcesExist],
    ["derived.treatment.links_exist", "yes", WORKSPACE_SIGNAL_KEYS.treatmentLinkedDataExists],
    ["derived.treatment.retention_rules_exist", "yes", WORKSPACE_SIGNAL_KEYS.treatmentRetentionRulesExist],
    ["derived.treatment.automated_uses_exist", "yes", WORKSPACE_SIGNAL_KEYS.d4AutomatedUsesExist],
    ["derived.treatment.automated_uses_covered_exist", "yes", WORKSPACE_SIGNAL_KEYS.d4CoveredAutomatedUsesExist],
    ["derived.treatment.d6_relationships_exist", "yes", WORKSPACE_SIGNAL_KEYS.d6RelationshipExists],
    ["derived.treatment.d6_processors_exist", "yes", WORKSPACE_SIGNAL_KEYS.d6ProcessorExists],
    ["derived.treatment.d6_subprocessors_exist", "yes", WORKSPACE_SIGNAL_KEYS.d6SubprocessorExists],
  ];
  for (const [factKey, accepted, signalKey] of treatmentMappings) {
    if (treatmentFacts[factKey] === accepted) {
      addSignal(out, signalKey, "Antecedente estructurado del workspace", "treatment", treatmentScopeLabel);
    }
  }

  const purposeId = company.activePurposeId;
  const purpose = purposeId ? getPurpose(company, treatmentId, purposeId) : undefined;
  if (!purpose || !purposeId) return out;
  const purposeContext: ExecutionContext = { scope: "purpose", companyId: company.id, treatmentId, purposeId };
  const purposeScopeLabel = `${treatmentScopeLabel} · Finalidad: ${purpose.purpose.description}`;
  const purposeFacts = deriveSessionFacts(company, purposeContext);

  const consentRouteResolved = resolvedScopedFact(company, purposeContext, "lawful.consent_applies", ["consent_yes"]);
  if (consentRouteResolved) {
    addSignal(out, WORKSPACE_SIGNAL_KEYS.d3ConsentRoute, "Ruta de consentimiento resuelta para la finalidad", "purpose", purposeScopeLabel);
  }
  if (consentRouteResolved && resolvedScopedFact(company, purposeContext, "consent.mechanism_status", ["designed"])) {
    addSignal(out, WORKSPACE_SIGNAL_KEYS.d3ConsentMechanismDesigned, "Mecanismo de consentimiento registrado para la finalidad", "purpose", purposeScopeLabel);
  }

  const purposeMappings: Array<[string, string]> = [
    [D5_CANDIDATE_KEYS.sensitive, WORKSPACE_SIGNAL_KEYS.d5SensitiveCandidate],
    [D5_CANDIDATE_KEYS.healthBiological, WORKSPACE_SIGNAL_KEYS.d5HealthBiologicalCandidate],
    [D5_CANDIDATE_KEYS.biometric, WORKSPACE_SIGNAL_KEYS.d5BiometricCandidate],
    [D5_CANDIDATE_KEYS.minors, WORKSPACE_SIGNAL_KEYS.d5MinorsCandidate],
    [D5_CANDIDATE_KEYS.research, WORKSPACE_SIGNAL_KEYS.d5ResearchCandidate],
    [D5_CANDIDATE_KEYS.geolocation, WORKSPACE_SIGNAL_KEYS.d5GeolocationCandidate],
    [D5_CANDIDATE_KEYS.titleIII, WORKSPACE_SIGNAL_KEYS.d5TitleIIICandidate],
    ["derived.purpose.d6_cessions_exist", WORKSPACE_SIGNAL_KEYS.d6CessionExists],
  ];
  for (const [factKey, signalKey] of purposeMappings) {
    if (purposeFacts[factKey] === "yes") {
      addSignal(out, signalKey, "Antecedente estructurado de la finalidad", "purpose", purposeScopeLabel);
    }
  }

  return out;
}
