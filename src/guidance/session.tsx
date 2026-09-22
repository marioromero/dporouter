import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { FactMap } from "../../content/protocols/types";

/**
 * Sesión transitoria de evaluación guiada (Stage 1).
 *
 * Las respuestas viven en memoria mientras dura la sesión de navegación.
 * No hay persistencia por cliente, no hay base de datos, no hay
 * localStorage: un reload crea una sesión nueva sin inventar respuestas.
 *
 * Reutilización futura de hechos: el proveedor acepta `initialFacts`
 * (hechos ya conocidos, p. ej. desde Diagnóstico en una iteración posterior)
 * separados de las respuestas de sesión. Un hecho proveniente de
 * `initialFacts` se muestra como "Dato ya disponible" y no se exige
 * responderlo nuevamente. En Stage 1 `initialFacts` está vacío y todo se
 * resuelve por respuestas de la sesión, pero el protocolo no debe
 * reescribirse cuando llegue la inyección.
 */

interface GuidanceSessionState {
  /** Respuestas de la sesión por protocolo. */
  sessions: Record<string, FactMap>;
  /** Hechos conocidos inyectados (futura integración con Diagnóstico). */
  initialFacts: Record<string, FactMap>;
  answer: (protocolKey: string, factKey: string, value: string) => void;
  resetProtocol: (protocolKey: string) => void;
  answersFor: (protocolKey: string) => FactMap;
  isProvided: (protocolKey: string, factKey: string) => boolean;
}

const GuidanceSessionContext =
  createContext<GuidanceSessionState | null>(null);

export function GuidanceSessionProvider({
  children,
  initialFacts = {},
}: {
  children: React.ReactNode;
  initialFacts?: Record<string, FactMap>;
}) {
  const [sessions, setSessions] = useState<Record<string, FactMap>>({});

  const answer = useCallback(
    (protocolKey: string, factKey: string, value: string) => {
      setSessions((prev) => ({
        ...prev,
        [protocolKey]: { ...(prev[protocolKey] ?? {}), [factKey]: value },
      }));
    },
    [],
  );

  const resetProtocol = useCallback((protocolKey: string) => {
    setSessions((prev) => {
      if (!(protocolKey in prev)) return prev;
      const next = { ...prev };
      delete next[protocolKey];
      return next;
    });
  }, []);

  const answersFor = useCallback(
    (protocolKey: string): FactMap => ({
      ...(initialFacts[protocolKey] ?? {}),
      ...(sessions[protocolKey] ?? {}),
    }),
    [initialFacts, sessions],
  );

  const isProvided = useCallback(
    (protocolKey: string, factKey: string): boolean =>
      initialFacts[protocolKey] !== undefined &&
      factKey in initialFacts[protocolKey] &&
      !(factKey in (sessions[protocolKey] ?? {})),
    [initialFacts, sessions],
  );

  const value = useMemo(
    () => ({ sessions, initialFacts, answer, resetProtocol, answersFor, isProvided }),
    [sessions, initialFacts, answer, resetProtocol, answersFor, isProvided],
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

/** Estado transitorio de un protocolo: hechos, respuesta y reinicio. */
export function useGuidanceProtocol(protocolKey: string): {
  facts: FactMap;
  started: boolean;
  answer: (factKey: string, value: string) => void;
  reset: () => void;
  isProvided: (factKey: string) => boolean;
} {
  const ctx = useGuidanceSessionContext();
  const facts = ctx.answersFor(protocolKey);
  return {
    facts,
    started: Object.keys(ctx.sessions[protocolKey] ?? {}).length > 0,
    answer: (factKey, value) => ctx.answer(protocolKey, factKey, value),
    reset: () => ctx.resetProtocol(protocolKey),
    isProvided: (factKey) => ctx.isProvided(protocolKey, factKey),
  };
}
