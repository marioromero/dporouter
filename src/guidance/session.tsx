import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { FactMap } from "../../content/protocols/types";
import { useWorkspace } from "../workspace/context";
import { humanSourceName } from "../workspace/facts";
import type { ExecutionContext, ExecutionScope } from "../workspace/types";
import {
  activeExecutionContext,
  buildScopedFactMap,
  excludeScopedProtocol,
  getScopedProtocolAnswers,
  normalizeAnswerValue,
  scopedInjectedRecord,
} from "../workspace/scope";
import { deriveSessionFacts } from "../workspace/derived";

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
  answer: (
    protocolKey: string,
    factKey: string,
    value: string,
    scope?: ExecutionScope,
  ) => void;
  resetProtocol: (protocolKey: string, scope?: ExecutionScope) => void;
  answersFor: (protocolKey: string, scope?: ExecutionScope) => FactMap;
  addressedFactsFor: (
    protocolKey: string,
    ctx: ExecutionContext | null,
  ) => FactMap;
  ownAnswersFor: (protocolKey: string, scope?: ExecutionScope) => FactMap;
  isProvided: (
    protocolKey: string,
    factKey: string,
    scope?: ExecutionScope,
  ) => boolean;
  providedSource: (
    protocolKey: string,
    factKey: string,
    scope?: ExecutionScope,
  ) => string | null;
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
  const { company, saveScopedProtocolAnswer, clearScopedProtocolAnswers } =
    useWorkspace();
  const [memory, setMemory] = useState<Record<string, FactMap>>({});

  const ownAnswers = useCallback(
    (protocolKey: string, scope: ExecutionScope = "company"): FactMap => {
      if (company) {
        const ctx = activeExecutionContext(company, scope);
        if (!ctx) return {};
        return recordsToFacts(getScopedProtocolAnswers(company, ctx, protocolKey));
      }
      return memory[protocolKey] ?? {};
    },
    [company, memory],
  );

  const injectedFacts = useCallback(
    (protocolKey: string, scope: ExecutionScope = "company"): FactMap => {
      const merged: FactMap = { ...(initialFacts[protocolKey] ?? {}) };
      if (company) {
        const ctx = activeExecutionContext(company, scope);
        if (ctx) {
          for (const [k, v] of Object.entries(
            buildScopedFactMap(
              excludeScopedProtocol(company, ctx, protocolKey),
              ctx,
            ),
          )) {
            merged[k] = v;
          }
        }
      }
      return merged;
    },
    [company, initialFacts],
  );

  const answer = useCallback(
    (
      protocolKey: string,
      factKey: string,
      value: string,
      scope: ExecutionScope = "company",
    ) => {
      if (company) {
        const ctx = activeExecutionContext(company, scope);
        if (!ctx) return;
        saveScopedProtocolAnswer(ctx, protocolKey, factKey, value, protocolKey);
        return;
      }
      // Sin empresa: memoria transitoria con la misma normalización
      // (vacío/inválido en text/date equivale a no respondido).
      const stored = normalizeAnswerValue(protocolKey, factKey, value);
      if (stored === null) return;
      setMemory((prev) => ({
        ...prev,
        [protocolKey]: { ...(prev[protocolKey] ?? {}), [factKey]: stored },
      }));
    },
    [company, saveScopedProtocolAnswer],
  );

  const resetProtocol = useCallback(
    (protocolKey: string, scope: ExecutionScope = "company") => {
      if (company) {
        const ctx = activeExecutionContext(company, scope);
        if (!ctx) return;
        clearScopedProtocolAnswers(ctx, protocolKey);
        return;
      }
      setMemory((prev) => {
        if (!(protocolKey in prev)) return prev;
        const next = { ...prev };
        delete next[protocolKey];
        return next;
      });
    },
    [company, clearScopedProtocolAnswers],
  );

  const answersFor = useCallback(
    (protocolKey: string, scope: ExecutionScope = "company"): FactMap => {
      const base: FactMap = {
        ...injectedFacts(protocolKey, scope),
        ...ownAnswers(protocolKey, scope),
      };
      // Overlay read-only final: proyecciones del namespace reservado.
      // Nunca se escriben al workspace ni pasan por resolución.
      if (company) {
        const ctx = activeExecutionContext(company, scope);
        if (ctx) {
          for (const [k, v] of Object.entries(deriveSessionFacts(company, ctx))) {
            base[k] = v;
          }
        }
      }
      return base;
    },
    [company, injectedFacts, ownAnswers],
  );

  /**
   * Vista de facts para un contexto addressed explícito (no la
   * selección activa). Misma composición que `answersFor`: inyectados
   * (iniciales + otros protocolos del mismo address) + respuestas
   * propias + proyecciones read-only. La finalización evalúa esta
   * vista para que lo evaluado y lo escrito compartan address.
   */
  const addressedFactsFor = useCallback(
    (protocolKey: string, ctx: ExecutionContext | null): FactMap => {
      const base: FactMap = { ...(initialFacts[protocolKey] ?? {}) };
      if (company && ctx && ctx.companyId === company.id) {
        for (const [k, v] of Object.entries(
          buildScopedFactMap(
            excludeScopedProtocol(company, ctx, protocolKey),
            ctx,
          ),
        )) {
          base[k] = v;
        }
        for (const [k, v] of Object.entries(
          recordsToFacts(getScopedProtocolAnswers(company, ctx, protocolKey)),
        )) {
          base[k] = v;
        }
        for (const [k, v] of Object.entries(deriveSessionFacts(company, ctx))) {
          base[k] = v;
        }
      }
      return base;
    },
    [company, initialFacts],
  );

  const isProvided = useCallback(
    (
      protocolKey: string,
      factKey: string,
      scope: ExecutionScope = "company",
    ): boolean => {
      const injected = injectedFacts(protocolKey, scope);
      const own = ownAnswers(protocolKey, scope);
      return factKey in injected && !(factKey in own);
    },
    [injectedFacts, ownAnswers],
  );

  const providedSource = useCallback(
    (
      protocolKey: string,
      factKey: string,
      scope: ExecutionScope = "company",
    ): string | null => {
      if (!isProvided(protocolKey, factKey, scope)) return null;
      if (factKey in (initialFacts[protocolKey] ?? {})) return "contexto inicial";
      if (!company) return null;
      const ctx = activeExecutionContext(company, scope);
      if (!ctx) return null;
      const rec = scopedInjectedRecord(company, ctx, protocolKey, factKey);
      if (!rec) return null;
      return humanSourceName(rec.source);
    },
    [company, initialFacts, isProvided],
  );

  // Mapa company-scope heredado (D1 y compatibilidad). Los protocolos
  // treatment/purpose usan ownAnswersFor con scope; este mapa nunca
  // representa vistas scopeadas.
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
    () => ({ sessions, initialFacts, answer, resetProtocol, answersFor, addressedFactsFor, ownAnswersFor: ownAnswers, isProvided, providedSource }),
    [sessions, initialFacts, answer, resetProtocol, answersFor, addressedFactsFor, ownAnswers, isProvided, providedSource],
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

/**
 * Estado de un protocolo: hechos, respuesta, reinicio y contexto
 * addressed de la guía.
 *
 * El ExecutionContext queda direccionado al abrir la guía (primera
 * resolución válida para esta empresa y scope) y NO sigue cambios
 * posteriores de la selección activa: la finalización escribe en la
 * guía que se finaliza, nunca en la selección tardía. La lectura y
 * escritura de respuestas conserva su comportamiento actual.
 */
export function useGuidanceProtocol(
  protocolKey: string,
  scope: ExecutionScope = "company",
): {
  facts: FactMap;
  /** Vista evaluable del contexto addressed: lo evaluado y lo escrito comparten address. */
  addressedFacts: FactMap;
  started: boolean;
  answer: (factKey: string, value: string) => void;
  reset: () => void;
  isProvided: (factKey: string) => boolean;
  providedSource: (factKey: string) => string | null;
  ctx: ExecutionContext | null;
} {
  const ctx = useGuidanceSessionContext();
  const { company } = useWorkspace();
  const addressed = useMemo(
    () => activeExecutionContext(company, scope),
    // Intencional: solo empresa, protocolo y scope re-direccionan.
    // La selección activa posterior no mueve la guía ya abierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company?.id, protocolKey, scope],
  );
  const facts = ctx.answersFor(protocolKey, scope);
  return {
    facts,
    addressedFacts: ctx.addressedFactsFor(protocolKey, addressed),
    started: Object.keys(ctx.ownAnswersFor(protocolKey, scope)).length > 0,
    answer: (factKey, value) => ctx.answer(protocolKey, factKey, value, scope),
    reset: () => ctx.resetProtocol(protocolKey, scope),
    isProvided: (factKey) => ctx.isProvided(protocolKey, factKey, scope),
    providedSource: (factKey) => ctx.providedSource(protocolKey, factKey, scope),
    ctx: addressed,
  };
}
