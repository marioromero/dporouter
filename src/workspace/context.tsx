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
  clearProtocolAnswers: (protocolKey: string) => void;
  clearProtocolFact: (protocolKey: string, factKey: string) => void;
  setDiagnosticFact: (factKey: string, value: string) => void;
  clearDiagnosticFact: (factKey: string) => void;
  resolveFactConflict: (factKey: string, value: string) => void;
  setLastLocation: (path: string) => void;
  exportCompany: (id: string) => string | null;
  importCompany: (json: string) => { ok: true } | { ok: false; error: string };
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
   * refleja actualmente a la empresa. Guarda valor, momento, alternativas
   * y elección explícita sin borrar las observaciones originales. Una
   * nueva observación contradictoria posterior reabre el conflicto.
   */
  const resolveFactConflict = useCallback(
    (factKey: string, value: string) => {
      if (!company) return;
      updateCompany(company.id, (c) => {
        // Alternativas = última observación por fuente (sin duplicar).
        const alternatives: Array<{
          value: string;
          source: string;
          updatedAt: string;
        }> = [];
        const diag = c.diagnosticFacts[factKey];
        if (diag) alternatives.push({ ...diag });
        for (const answers of Object.values(c.protocolAnswers)) {
          const r = answers[factKey];
          if (r) alternatives.push({ ...r });
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
      clearProtocolAnswers,
      clearProtocolFact,
      setDiagnosticFact,
      clearDiagnosticFact,
      resolveFactConflict,
      setLastLocation,
      exportCompany,
      importCompany,
    }),
    [
      data, profile, company, createProfile, selectProfile, createCompany,
      selectCompany, setActivityStatus, saveProtocolAnswer, clearProtocolAnswers,
      clearProtocolFact, setDiagnosticFact, clearDiagnosticFact, resolveFactConflict,
      setLastLocation,
      exportCompany, importCompany,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("WorkspaceProvider ausente en la jerarquía");
  return ctx;
}
