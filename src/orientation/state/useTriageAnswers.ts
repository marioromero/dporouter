import { useCallback, useSyncExternalStore } from "react";
import {
  getTriageSessionSnapshot,
  retryTriageSession,
  subscribeTriageSession,
  updateTriageSession,
} from "./session";
import type { TriageScope } from "./types";

export function useTriageAnswers(scope: TriageScope) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeTriageSession(scope, listener),
    [scope.advisorId, scope.companyId],
  );
  const getSnapshot = useCallback(() => getTriageSessionSnapshot(scope), [scope.advisorId, scope.companyId]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback(
    (change: Parameters<typeof updateTriageSession>[1]) => updateTriageSession(scope, change),
    [scope.advisorId, scope.companyId],
  );
  const retry = useCallback(() => retryTriageSession(scope), [scope.advisorId, scope.companyId]);

  return {
    loaded: true,
    answers: state.answers,
    status: state.status,
    error: state.error,
    update,
    retry,
  };
}
