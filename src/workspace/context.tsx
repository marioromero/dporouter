import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ActivityWorkStatus,
  CompanyState,
  FactRecord,
  LocalProfile,
  WorkspaceData,
} from "./types";
import { newCompany, newProfile, nowIso } from "./types";
import { loadWorkspace, saveWorkspace, validateCompanyState } from "./store";
import { getProtocol } from "../../content/protocols/registry";
import { getCanonicalActivity } from "../../content/registry";
import {
  addActor as addActorState,
  addDataItem as addDataItemState,
  addDataPurposeLink as addDataPurposeLinkState,
  addRetentionRule as addRetentionRuleState,
  addSource as addSourceState,
  deleteActor as deleteActorState,
  deleteDataItem as deleteDataItemState,
  deleteRetentionRule as deleteRetentionRuleState,
  deleteSource as deleteSourceState,
  removeDataPurposeLink as removeDataPurposeLinkState,
  updateActor as updateActorState,
  updateDataItem as updateDataItemState,
  updateRetentionRule as updateRetentionRuleState,
  updateSource as updateSourceState,
} from "./locals";
import {
  clearScopedProtocolAnswers as clearScopedAnswersState,
  createPurpose as createPurposeState,
  createTreatment as createTreatmentState,
  deletePurpose as deletePurposeState,
  deleteTreatment as deleteTreatmentState,
  renamePurpose as renamePurposeState,
  renameTreatment as renameTreatmentState,
  saveScopedProtocolAnswer as saveScopedAnswerState,
  scopedAddressAlternatives,
  selectPurpose as selectPurposeState,
  selectTreatment as selectTreatmentState,
} from "./scope";
import type { ExecutionContext } from "./types";
import type {
  ActorInput,
  DataItemInput,
  RetentionRuleInput,
  SourceInput,
} from "./locals";
import {
  applyFinalization,
  finalizeJudgment,
  type ReasoningDraft,
} from "./reasoning";
import {
  applyProcedureFinalization,
  validateProcedureFinalization,
} from "./finalize";
import type { FactMap } from "../../content/protocols/types";

/**
 * Workspace local Stage 1: perfiles y empresas creados por el usuario,
 * con progreso independiente por empresa en localStorage. No es auth
 * segura ni Stage 2: es separación operativa local y así se presenta.
 */

interface WorkspaceContextValue {
  data: WorkspaceData;
  profile: LocalProfile | null;
  company: CompanyState | null;
  createProfile: (name: string) => void;
  selectProfile: (id: string) => void;
  createCompany: (name: string) => void;
  selectCompany: (id: string) => void;
  setActivityStatus: (activityKey: string, status: ActivityWorkStatus) => void;
  saveProtocolAnswer: (
    protocolKey: string,
    factKey: string,
    value: string,
    source: string,
  ) => void;
  saveScopedProtocolAnswer: (
    ctx: ExecutionContext,
    protocolKey: string,
    factKey: string,
    value: string,
    source: string,
  ) => void;
  clearScopedProtocolAnswers: (
    ctx: ExecutionContext,
    protocolKey: string,
  ) => void;
  clearProtocolAnswers: (protocolKey: string) => void;
  clearProtocolFact: (protocolKey: string, factKey: string) => void;
  setDiagnosticFact: (factKey: string, value: string) => void;
  clearDiagnosticFact: (factKey: string) => void;
  resolveFactConflict: (
    factKey: string,
    value: string,
    ctx?: ExecutionContext,
  ) => void;
  finalizeProfessionalJudgment: (
    protocolKey: string,
    draft: ReasoningDraft,
    facts: FactMap,
  ) => { ok: true } | { ok: false; errors: string[] };
  finalizeProtocolOutcome: (
    protocolKey: string,
    outcomeKey: string,
    facts: FactMap,
  ) => { ok: true; applied: string[] } | { ok: false; errors: string[] };
  setLastLocation: (path: string) => void;
  exportCompany: (id: string) => string | null;
  importCompany: (json: string) => { ok: true } | { ok: false; error: string };
  addTreatment: (input: {
    name: string;
    description?: string;
    canonicalTreatmentId?: string;
  }) => string | null;
  selectTreatment: (id: string | null) => void;
  renameTreatment: (
    id: string,
    input: { name?: string; description?: string; canonicalTreatmentId?: string },
  ) => void;
  deleteTreatment: (id: string) => void;
  addPurpose: (treatmentId: string, description: string) => string | null;
  selectPurpose: (treatmentId: string, id: string | null) => void;
  renamePurpose: (treatmentId: string, id: string, description: string) => void;
  deletePurpose: (treatmentId: string, id: string) => void;
  addActor: (treatmentId: string, input: ActorInput) => string | null;
  updateActor: (
    treatmentId: string,
    id: string,
    patch: {
      kind?: "organization" | "person";
      name?: string;
      role?: "responsible" | "processor" | null;
      evidenceRef?: string | null;
    },
  ) => void;
  deleteActor: (treatmentId: string, id: string) => void;
  addDataItem: (treatmentId: string, input: DataItemInput) => string | null;
  updateDataItem: (
    treatmentId: string,
    id: string,
    patch: {
      label?: string;
      category?: string | null;
      sourceRefs?: string[];
      note?: string | null;
    },
  ) => void;
  deleteDataItem: (treatmentId: string, id: string) => void;
  addSource: (treatmentId: string, input: SourceInput) => string | null;
  updateSource: (
    treatmentId: string,
    id: string,
    patch: {
      kind?: SourceInput["kind"];
      description?: string;
      evidenceRef?: string | null;
    },
  ) => void;
  deleteSource: (treatmentId: string, id: string) => void;
  addRetentionRule: (
    treatmentId: string,
    input: RetentionRuleInput,
  ) => string | null;
  updateRetentionRule: (
    treatmentId: string,
    id: string,
    patch: {
      dataItemIds?: string[];
      criterion?: string;
      legalBasisRef?: string | null;
      event?: string | null;
      owner?: string;
      exceptions?: string | null;
    },
  ) => void;
  deleteRetentionRule: (treatmentId: string, id: string) => void;
  addDataPurposeLink: (
    treatmentId: string,
    link: { dataId: string; purposeId: string },
  ) => void;
  removeDataPurposeLink: (
    treatmentId: string,
    link: { dataId: string; purposeId: string },
  ) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function touchCompany(company: CompanyState): CompanyState {
  return { ...company, updatedAt: nowIso() };
}

/** Elimina resoluciones cuyos hechos ya no tienen observaciones. */
function pruneResolutions(c: CompanyState): CompanyState {
  const alive = new Set<string>([
    ...Object.keys(c.diagnosticFacts),
    ...Object.values(c.protocolAnswers).flatMap((a) => Object.keys(a)),
    // Observaciones en scopes jurídicos (tratamientos y finalidades).
    ...Object.values(c.treatments ?? {}).flatMap((t) => [
      ...Object.values(t.protocolAnswers).flatMap((a) => Object.keys(a)),
      ...Object.values(t.purposes).flatMap((p) =>
        Object.values(p.protocolAnswers).flatMap((a) => Object.keys(a)),
      ),
    ]),
  ]);
  const kept: CompanyState["factResolutions"] = {};
  for (const [k, r] of Object.entries(c.factResolutions)) {
    if (alive.has(k)) kept[k] = r;
  }
  if (Object.keys(kept).length === Object.keys(c.factResolutions).length) {
    return c;
  }
  return { ...c, factResolutions: kept };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => loadWorkspace());

  useEffect(() => {
    saveWorkspace(data);
  }, [data]);

  const profile: LocalProfile | null =
    data.profiles.find((p) => p.id === data.activeProfileId) ?? null;
  const company: CompanyState | null =
    (profile?.activeCompanyId ? data.companies[profile.activeCompanyId] : undefined) ??
    null;

  const createProfile = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    const p = newProfile(trimmed);
    setData((prev) => ({
      ...prev,
      profiles: [...prev.profiles, p],
      activeProfileId: p.id,
    }));
  }, []);

  const selectProfile = useCallback((id: string) => {
    setData((prev) =>
      prev.profiles.some((p) => p.id === id)
        ? { ...prev, activeProfileId: id }
        : prev,
    );
  }, []);

  const createCompany = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    setData((prev) => {
      const active = prev.profiles.find((p) => p.id === prev.activeProfileId);
      if (!active) return prev;
      const c = newCompany(trimmed);
      return {
        ...prev,
        companies: { ...prev.companies, [c.id]: c },
        profiles: prev.profiles.map((p) =>
          p.id === active.id
            ? {
                ...p,
                companyIds: [...p.companyIds, c.id],
                activeCompanyId: c.id,
              }
            : p,
        ),
      };
    });
  }, []);

  const selectCompany = useCallback((id: string) => {
    setData((prev) => {
      const active = prev.profiles.find((p) => p.id === prev.activeProfileId);
      if (!active || !active.companyIds.includes(id) || !prev.companies[id]) {
        return prev;
      }
      return {
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === active.id ? { ...p, activeCompanyId: id } : p,
        ),
      };
    });
  }, []);

  const updateCompany = useCallback(
    (id: string, fn: (c: CompanyState) => CompanyState) => {
      setData((prev) => {
        const current = prev.companies[id];
        if (!current) return prev;
        return {
          ...prev,
          companies: { ...prev.companies, [id]: touchCompany(fn(current)) },
        };
      });
    },
    [],
  );

  const setActivityStatus = useCallback(
    (activityKey: string, status: ActivityWorkStatus) => {
      if (!company) return;
      updateCompany(company.id, (c) => ({
        ...c,
        activityStates: {
          ...c.activityStates,
          [activityKey]: { status, updatedAt: nowIso() },
        },
      }));
    },
    [company, updateCompany],
  );

  const saveProtocolAnswer = useCallback(
    (protocolKey: string, factKey: string, value: string, source: string) => {
      if (!company) return;
      const record: FactRecord = { value, source, updatedAt: nowIso() };
      updateCompany(company.id, (c) => ({
        ...c,
        protocolAnswers: {
          ...c.protocolAnswers,
          [protocolKey]: { ...(c.protocolAnswers[protocolKey] ?? {}), [factKey]: record },
        },
      }));
    },
    [company, updateCompany],
  );

  const clearProtocolAnswers = useCallback(
    (protocolKey: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        if (!(protocolKey in c.protocolAnswers)) return c;
        const next = { ...c.protocolAnswers };
        delete next[protocolKey];
        return pruneResolutions({ ...c, protocolAnswers: next });
      });
    },
    [company, updateCompany],
  );

  const clearProtocolFact = useCallback(
    (protocolKey: string, factKey: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const answers = c.protocolAnswers[protocolKey];
        if (!answers || !(factKey in answers)) return c;
        const nextAnswers = { ...answers };
        delete nextAnswers[factKey];
        return pruneResolutions({
          ...c,
          protocolAnswers: { ...c.protocolAnswers, [protocolKey]: nextAnswers },
        });
      });
    },
    [company, updateCompany],
  );

  /**
   * Escritura scopeada de respuestas (sesión guiada). Company scope usa
   * el storage actual; treatment/purpose escriben en su subárbol. Misma
   * forma de observación; el contexto inválido no escribe.
   */
  const saveScopedProtocolAnswer = useCallback(
    (
      ctx: ExecutionContext,
      protocolKey: string,
      factKey: string,
      value: string,
      source: string,
    ) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const next = saveScopedAnswerState(
          c,
          ctx,
          protocolKey,
          factKey,
          value,
          source,
        );
        return next ?? c;
      });
    },
    [company, updateCompany],
  );

  const clearScopedProtocolAnswers = useCallback(
    (ctx: ExecutionContext, protocolKey: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const next = clearScopedAnswersState(c, ctx, protocolKey);
        if (!next) return c;
        return pruneResolutions(next);
      });
    },
    [company, updateCompany],
  );

  /**
   * CRUD de objetos jurídicos Stage 1 (tratamientos y finalidades).
   * Modifican identidad/metadata/navegación; nunca progreso, outcomes
   * ni completion de actividades.
   */
  const addTreatment = useCallback(
    (input: {
      name: string;
      description?: string;
      canonicalTreatmentId?: string;
    }): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = createTreatmentState(c, input);
        if (!result) return c;
        created = result.treatmentId;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const selectTreatment = useCallback(
    (id: string | null) => {
      if (!company) return;
      updateCompany(company.id, (c) => selectTreatmentState(c, id) ?? c);
    },
    [company, updateCompany],
  );

  const renameTreatment = useCallback(
    (
      id: string,
      input: {
        name?: string;
        description?: string;
        canonicalTreatmentId?: string;
      },
    ) => {
      if (!company) return;
      updateCompany(company.id, (c) => renameTreatmentState(c, id, input) ?? c);
    },
    [company, updateCompany],
  );

  const deleteTreatment = useCallback(
    (id: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const next = deleteTreatmentState(c, id);
        if (!next) return c;
        return pruneResolutions(next);
      });
    },
    [company, updateCompany],
  );

  const addPurpose = useCallback(
    (treatmentId: string, description: string): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = createPurposeState(c, treatmentId, description);
        if (!result) return c;
        created = result.purposeId;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const selectPurpose = useCallback(
    (treatmentId: string, id: string | null) => {
      if (!company) return;
      updateCompany(company.id, (c) => selectPurposeState(c, treatmentId, id) ?? c);
    },
    [company, updateCompany],
  );

  const renamePurpose = useCallback(
    (treatmentId: string, id: string, description: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const next = renamePurposeState(c, treatmentId, id, description);
        return next ?? c;
      });
    },
    [company, updateCompany],
  );

  const deletePurpose = useCallback(
    (treatmentId: string, id: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        const next = deletePurposeState(c, treatmentId, id);
        if (!next) return c;
        return pruneResolutions(next);
      });
    },
    [company, updateCompany],
  );

  /**
   * CRUD de estructuras locales D2 (actores, datos, fuentes). Operan
   * sobre objetos del treatment activo; nunca generan facts, outcomes
   * ni completan actividades.
   */
  const addActor = useCallback(
    (treatmentId: string, input: ActorInput): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = addActorState(c, treatmentId, input);
        if (!result) return c;
        created = result.id;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const updateActor = useCallback(
    (
      treatmentId: string,
      id: string,
      patch: {
        kind?: "organization" | "person";
        name?: string;
        role?: "responsible" | "processor" | null;
        evidenceRef?: string | null;
      },
    ) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => updateActorState(c, treatmentId, id, patch) ?? c,
      );
    },
    [company, updateCompany],
  );

  const deleteActor = useCallback(
    (treatmentId: string, id: string) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => deleteActorState(c, treatmentId, id) ?? c,
      );
    },
    [company, updateCompany],
  );

  const addDataItem = useCallback(
    (treatmentId: string, input: DataItemInput): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = addDataItemState(c, treatmentId, input);
        if (!result) return c;
        created = result.id;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const updateDataItem = useCallback(
    (
      treatmentId: string,
      id: string,
      patch: {
        label?: string;
        category?: string | null;
        sourceRefs?: string[];
        note?: string | null;
      },
    ) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => updateDataItemState(c, treatmentId, id, patch) ?? c,
      );
    },
    [company, updateCompany],
  );

  const deleteDataItem = useCallback(
    (treatmentId: string, id: string) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => deleteDataItemState(c, treatmentId, id) ?? c,
      );
    },
    [company, updateCompany],
  );

  const addSource = useCallback(
    (treatmentId: string, input: SourceInput): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = addSourceState(c, treatmentId, input);
        if (!result) return c;
        created = result.id;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const updateSource = useCallback(
    (
      treatmentId: string,
      id: string,
      patch: {
        kind?: SourceInput["kind"];
        description?: string;
        evidenceRef?: string | null;
      },
    ) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => updateSourceState(c, treatmentId, id, patch) ?? c,
      );
    },
    [company, updateCompany],
  );

  const deleteSource = useCallback(
    (treatmentId: string, id: string) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => deleteSourceState(c, treatmentId, id) ?? c,
      );
    },
    [company, updateCompany],
  );

  const addRetentionRule = useCallback(
    (treatmentId: string, input: RetentionRuleInput): string | null => {
      if (!company) return null;
      let created: string | null = null;
      updateCompany(company.id, (c) => {
        const result = addRetentionRuleState(c, treatmentId, input);
        if (!result) return c;
        created = result.id;
        return result.company;
      });
      return created;
    },
    [company, updateCompany],
  );

  const updateRetentionRule = useCallback(
    (
      treatmentId: string,
      id: string,
      patch: {
        dataItemIds?: string[];
        criterion?: string;
        legalBasisRef?: string | null;
        event?: string | null;
        owner?: string;
        exceptions?: string | null;
      },
    ) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => updateRetentionRuleState(c, treatmentId, id, patch) ?? c,
      );
    },
    [company, updateCompany],
  );

  const deleteRetentionRule = useCallback(
    (treatmentId: string, id: string) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => deleteRetentionRuleState(c, treatmentId, id) ?? c,
      );
    },
    [company, updateCompany],
  );

  const addDataPurposeLink = useCallback(
    (treatmentId: string, link: { dataId: string; purposeId: string }) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => addDataPurposeLinkState(c, treatmentId, link) ?? c,
      );
    },
    [company, updateCompany],
  );

  const removeDataPurposeLink = useCallback(
    (treatmentId: string, link: { dataId: string; purposeId: string }) => {
      if (!company) return;
      updateCompany(
        company.id,
        (c) => removeDataPurposeLinkState(c, treatmentId, link) ?? c,
      );
    },
    [company, updateCompany],
  );
  const setDiagnosticFact = useCallback(
    (factKey: string, value: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => ({
        ...c,
        diagnosticFacts: {
          ...c.diagnosticFacts,
          [factKey]: { value, source: "diagnostico", updatedAt: nowIso() },
        },
      }));
    },
    [company, updateCompany],
  );

  const clearDiagnosticFact = useCallback(
    (factKey: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        if (!(factKey in c.diagnosticFacts)) return c;
        const next = { ...c.diagnosticFacts };
        delete next[factKey];
        return pruneResolutions({ ...c, diagnosticFacts: next });
      });
    },
    [company, updateCompany],
  );

  /**
   * Resolución explícita de un conflicto: el profesional elige qué valor
   * refleja actualmente la situación. Guarda valor, momento, alternativas
   * y elección explícita sin borrar las observaciones originales. Una
   * nueva observación contradictoria posterior reabre el conflicto.
   * Con `ctx` scopeado, las alternativas provienen de esa dirección y la
   * resolución solo rige allí; sin `ctx` (D1/ConflictResolver actual),
   * comportamiento company idéntico al histórico.
   */
  const resolveFactConflict = useCallback(
    (factKey: string, value: string, ctx?: ExecutionContext) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        // Alternativas = última observación por fuente (sin duplicar).
        const alternatives: Array<{
          value: string;
          source: string;
          updatedAt: string;
        }> = [];
        if (ctx && ctx.companyId === c.id && ctx.scope !== "company") {
          for (const r of scopedAddressAlternatives(c, ctx, factKey)) {
            alternatives.push({ ...r });
          }
        } else {
          const diag = c.diagnosticFacts[factKey];
          if (diag) alternatives.push({ ...diag });
          for (const answers of Object.values(c.protocolAnswers)) {
            const r = answers[factKey];
            if (r) alternatives.push({ ...r });
          }
        }
        return {
          ...c,
          factResolutions: {
            ...c.factResolutions,
            [factKey]: {
              factKey,
              value,
              resolvedAt: nowIso(),
              decidedBy: "professional" as const,
              alternatives,
              ...(ctx && ctx.scope === "treatment"
                ? { scope: ctx.scope, treatmentId: ctx.treatmentId }
                : {}),
              ...(ctx && ctx.scope === "purpose"
                ? {
                    scope: ctx.scope,
                    treatmentId: ctx.treatmentId,
                    purposeId: ctx.purposeId,
                  }
                : {}),
            },
          },
        };
      });
    },
    [company, updateCompany],
  );

  const setLastLocation = useCallback(
    (path: string) => {
      if (!company || company.lastLocation === path) return;
      updateCompany(company.id, (c) => ({ ...c, lastLocation: path }));
    },
    [company, updateCompany],
  );

  /**
   * Finalización atómica del juicio profesional: valida gate, borrador
   * y coherencia, y persiste el ReasoningRecord junto a los
   * canonical_fact_effects del outcome en una única escritura. Nunca
   * deja un registro sin su fact ni un fact sin su registro.
   */
  const finalizeProfessionalJudgment = useCallback(
    (
      protocolKey: string,
      draft: ReasoningDraft,
      facts: FactMap,
    ): { ok: true } | { ok: false; errors: string[] } => {
      if (!company) return { ok: false, errors: ["Requiere empresa activa."] };
      const protocol = getProtocol(protocolKey);
      if (!protocol) return { ok: false, errors: ["Protocolo desconocido."] };
      const activity = getCanonicalActivity(protocol.activity_key);
      const result = finalizeJudgment({
        protocol,
        company,
        facts,
        draft,
        legalBasis: activity?.legal_basis ?? [],
      });
      if (!result.ok) return result;
      updateCompany(company.id, (c) =>
        applyFinalization(c, protocol, result.record, result.effects),
      );
      return { ok: true };
    },
    [company, updateCompany],
  );

  /**
   * Finalización explícita genérica de un resultado definitivo con
   * efectos canónicos (protocolos procedure/checklist). Valida primero
   * y persiste los facts en una única escritura junto al estado. Nunca
   * se ejecuta por render ni navegación: solo por acción del profesional.
   * Independiente del camino de juicio D1.03 (sin ReasoningRecord).
   */
  const finalizeProtocolOutcome = useCallback(
    (
      protocolKey: string,
      outcomeKey: string,
      facts: FactMap,
    ): { ok: true; applied: string[] } | { ok: false; errors: string[] } => {
      if (!company) return { ok: false, errors: ["Requiere empresa activa."] };
      const protocol = getProtocol(protocolKey);
      if (!protocol) return { ok: false, errors: ["Protocolo desconocido."] };
      const validated = validateProcedureFinalization({
        protocol,
        company,
        facts,
        outcomeKey,
      });
      if (!validated.ok) return validated;
      const { company: next, applied } = applyProcedureFinalization(
        company,
        protocol,
        validated.effects,
      );
      updateCompany(company.id, () => next);
      return { ok: true, applied };
    },
    [company, updateCompany],
  );

  const exportCompany = useCallback(
    (id: string): string | null => {
      const c = data.companies[id];
      return c ? JSON.stringify(c, null, 2) : null;
    },
    [data],
  );

  const importCompany = useCallback(
    (json: string): { ok: true } | { ok: false; error: string } => {
      if (!profile) return { ok: false, error: "Selecciona un perfil primero." };
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return { ok: false, error: "El archivo no es un JSON válido." };
      }
      const checked = validateCompanyState(parsed);
      if (!checked.ok) return checked;
      const incoming = checked.value;
      if (
        data.companies[incoming.id] &&
        !window.confirm(
          `Ya existe “${data.companies[incoming.id].name}”. ¿Reemplazarla con el respaldo importado?`,
        )
      ) {
        return { ok: true };
      }
      setData((prev) => {
        const active = prev.profiles.find((p) => p.id === prev.activeProfileId);
        if (!active) return prev;
        const id = incoming.id;
        const stored: CompanyState = { ...incoming, id, updatedAt: nowIso() };
        return {
          ...prev,
          companies: { ...prev.companies, [id]: stored },
          profiles: prev.profiles.map((p) =>
            p.id === active.id
              ? {
                  ...p,
                  companyIds: p.companyIds.includes(id)
                    ? p.companyIds
                    : [...p.companyIds, id],
                  activeCompanyId: id,
                }
              : p,
          ),
        };
      });
      return { ok: true };
    },
    [profile, data],
  );

  const value = useMemo(
    () => ({
      data,
      profile,
      company,
      createProfile,
      selectProfile,
      createCompany,
      selectCompany,
      setActivityStatus,
      saveProtocolAnswer,
      saveScopedProtocolAnswer,
      clearScopedProtocolAnswers,
      clearProtocolAnswers,
      clearProtocolFact,
      setDiagnosticFact,
      clearDiagnosticFact,
      resolveFactConflict,
      finalizeProfessionalJudgment,
      finalizeProtocolOutcome,
      setLastLocation,
      exportCompany,
      importCompany,
      addTreatment,
      selectTreatment,
      renameTreatment,
      deleteTreatment,
      addPurpose,
      selectPurpose,
      renamePurpose,
      deletePurpose,
      addActor,
      updateActor,
      deleteActor,
      addDataItem,
      updateDataItem,
      deleteDataItem,
      addSource,
      updateSource,
      deleteSource,
      addRetentionRule,
      updateRetentionRule,
      deleteRetentionRule,
      addDataPurposeLink,
      removeDataPurposeLink,
    }),
    [
      data, profile, company, createProfile, selectProfile, createCompany,
      selectCompany, setActivityStatus, saveProtocolAnswer, saveScopedProtocolAnswer,
      clearScopedProtocolAnswers, clearProtocolAnswers,
      clearProtocolFact, setDiagnosticFact, clearDiagnosticFact, resolveFactConflict,
      finalizeProfessionalJudgment, finalizeProtocolOutcome, setLastLocation,
      exportCompany, importCompany, addTreatment, selectTreatment,
      renameTreatment, deleteTreatment, addPurpose, selectPurpose,
      renamePurpose, deletePurpose, addActor, updateActor, deleteActor,
      addDataItem, updateDataItem, deleteDataItem, addSource, updateSource,
      deleteSource, addRetentionRule, updateRetentionRule, deleteRetentionRule,
      addDataPurposeLink, removeDataPurposeLink,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("WorkspaceProvider ausente en la jerarquía");
  return ctx;
}
