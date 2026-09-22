import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { FactMap } from "../../content/protocols/types";
import { useWorkspace } from "../workspace/context";
import { mergedFactRecords } from "../workspace/facts";

/**
 * Sesión de evaluación guiada (Stage 1).
 *
 * Con empresa activa, las respuestas se persisten separadamente por
 * empresa en almacenamiento local y los facts de Diagnóstico más las
 * respuestas de otros protocolos ingresan como contexto inyectado
 * (`initialFacts` o equivalente). Sin empresa activa, la sesión es
 * transitoria en memoria y así se indica.
 *
 * Origen nunca mezclado en silencio: cada hecho persistido registra su
 * fuente (`diagnostico` o la `protocol_key` que lo respondió). Cambiar
 * de empresa cambia el contexto completo de facts y respuestas.
 *
 * El motor determinístico no cambia: esta capa solo provee hechos.
 */

interface GuidanceSessionState {
  sessions: Record<string, FactMap>;
  initialFacts: Record<string, FactMap>;
  answer: (protocolKey: string, factKey: string, value: string) => void;
  resetProtocol: (protocolKey: string) => void;
  answersFor: (protocolKey: string) => FactMap;
  isProvided: (protocolKey: string, factKey: string) => boolean;
  providedSource: (protocolKey: string, factKey: string) => string | null;
}

const GuidanceSessionContext =
  createContext<GuidanceSessionState | null>(null);

function recordsToFacts(
  records: Record<string, { value: string }>,
): FactMap {
  const out: FactMap = {};
  for (const [k, r] of Object.entries(records)) out[k] = r.value;
  return out;
}

export function GuidanceSessionProvider({
  children,
  initialFacts = {},
}: {
  children: React.ReactNode;
  initialFacts?: Record<string, FactMap>;
}) {
  const { company, saveProtocolAnswer, clearProtocolAnswers } = useWorkspace();
  const [memory, setMemory] = useState<Record<string, FactMap>>({});

  const ownAnswers = useCallback(
    (protocolKey: string): FactMap => {
      if (company) {
        return recordsToFacts(company.protocolAnswers[protocolKey] ?? {});
      }
      return memory[protocolKey] ?? {};
    },
    [company, memory],
  );

  const injectedFacts = useCallback(
    (protocolKey: string): FactMap => {
      const merged: FactMap = { ...(initialFacts[protocolKey] ?? {}) };
      if (company) {
        for (const [k, r] of Object.entries(
          mergedFactRecords(company, protocolKey),
        )) {
          merged[k] = r.value;
        }
      }
      return merged;
    },
    [company, initialFacts],
  );

  const answer = useCallback(
    (protocolKey: string, factKey: string, value: string) => {
      if (company) {
        saveProtocolAnswer(protocolKey, factKey, value, protocolKey);
        return;
      }
      setMemory((prev) => ({
        ...prev,
        [protocolKey]: { ...(prev[protocolKey] ?? {}), [factKey]: value },
      }));
    },
    [company, saveProtocolAnswer],
  );

  const resetProtocol = useCallback(
    (protocolKey: string) => {
      if (company) {
        clearProtocolAnswers(protocolKey);
        return;
      }
      setMemory((prev) => {
        if (!(protocolKey in prev)) return prev;
        const next = { ...prev };
        delete next[protocolKey];
        return next;
      });
    },
    [company, clearProtocolAnswers],
  );

  const answersFor = useCallback(
    (protocolKey: string): FactMap => ({
      ...injectedFacts(protocolKey),
      ...ownAnswers(protocolKey),
    }),
    [injectedFacts, ownAnswers],
  );

  const isProvided = useCallback(
    (protocolKey: string, factKey: string): boolean => {
      const injected = injectedFacts(protocolKey);
      const own = ownAnswers(protocolKey);
      return factKey in injected && !(factKey in own);
    },
    [injectedFacts, ownAnswers],
  );

  const providedSource = useCallback(
    (protocolKey: string, factKey: string): string | null => {
      if (!isProvided(protocolKey, factKey)) return null;
      if (factKey in (initialFacts[protocolKey] ?? {})) return "contexto inicial";
      if (!company) return null;
      const rec = mergedFactRecords(company, protocolKey)[factKey];
      if (!rec) return null;
      return rec.source === "diagnostico" ? "Diagnóstico" : `Guía ${rec.source}`;
    },
    [company, initialFacts, isProvided],
  );

  const sessions = useMemo(() => {
    if (company) {
      const out: Record<string, FactMap> = {};
      for (const [pk, answers] of Object.entries(company.protocolAnswers)) {
        out[pk] = recordsToFacts(answers);
      }
      return out;
    }
    return memory;
  }, [company, memory]);

  const value = useMemo(
    () => ({ sessions, initialFacts, answer, resetProtocol, answersFor, isProvided, providedSource }),
    [sessions, initialFacts, answer, resetProtocol, answersFor, isProvided, providedSource],
  );

  return (
    <GuidanceSessionContext.Provider value={value}>
      {children}
    </GuidanceSessionContext.Provider>
  );
}

function useGuidanceSessionContext(): GuidanceSessionState {
  const ctx = useContext(GuidanceSessionContext);
  if (!ctx) {
    throw new Error("GuidanceSessionProvider ausente en la jerarquía");
  }
  return ctx;
}

/** Estado de un protocolo: hechos, respuesta y reinicio. */
export function useGuidanceProtocol(protocolKey: string): {
  facts: FactMap;
  started: boolean;
  answer: (factKey: string, value: string) => void;
  reset: () => void;
  isProvided: (factKey: string) => boolean;
  providedSource: (factKey: string) => string | null;
} {
  const ctx = useGuidanceSessionContext();
  const facts = ctx.answersFor(protocolKey);
  return {
    facts,
    started: Object.keys(ctx.sessions[protocolKey] ?? {}).length > 0,
    answer: (factKey, value) => ctx.answer(protocolKey, factKey, value),
    reset: () => ctx.resetProtocol(protocolKey),
    isProvided: (factKey) => ctx.isProvided(protocolKey, factKey),
    providedSource: (factKey) => ctx.providedSource(protocolKey, factKey),
  };
}
