import { readTriageAnswers, writeTriageAnswers } from "./repository";
import { triageScopeKey } from "./types";
import type { TriageAnswers, TriageScope } from "./types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export interface TriageSessionSnapshot {
  answers: TriageAnswers;
  status: SaveStatus;
  error?: string;
}

const snapshots = new Map<string, TriageSessionSnapshot>();
const listeners = new Map<string, Set<() => void>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const scopes = new Map<string, TriageScope>();
let pageLifecycleListenerInstalled = false;

function snapshotFor(scope: TriageScope): TriageSessionSnapshot {
  const key = triageScopeKey(scope);
  const existing = snapshots.get(key);
  if (existing) return existing;
  const result = readTriageAnswers(scope);
  const snapshot: TriageSessionSnapshot = {
    answers: result.answers,
    status: result.ok ? (Object.keys(result.answers).length > 0 ? "saved" : "idle") : "error",
    ...(!result.ok ? { error: result.error } : {}),
  };
  scopes.set(key, scope);
  snapshots.set(key, snapshot);
  return snapshot;
}

function publish(key: string, snapshot: TriageSessionSnapshot) {
  snapshots.set(key, snapshot);
  for (const listener of listeners.get(key) ?? []) listener();
}

function flush(key: string) {
  const timer = timers.get(key);
  if (timer !== undefined) clearTimeout(timer);
  timers.delete(key);
  const scope = scopes.get(key);
  const current = snapshots.get(key);
  if (!scope || !current || current.status === "error" && !current.error) return;
  const result = writeTriageAnswers(scope, current.answers);
  publish(key, result.ok
    ? { answers: current.answers, status: "saved" }
    : { answers: current.answers, status: "error", error: result.error });
}

function schedule(scope: TriageScope, answers: TriageAnswers) {
  const key = triageScopeKey(scope);
  scopes.set(key, scope);
  const priorTimer = timers.get(key);
  if (priorTimer !== undefined) clearTimeout(priorTimer);
  publish(key, { answers, status: "saving" });
  timers.set(key, setTimeout(() => flush(key), 180));
}

function flushAll() {
  for (const key of timers.keys()) flush(key);
}

export function subscribeTriageSession(scope: TriageScope, listener: () => void): () => void {
  const key = triageScopeKey(scope);
  snapshotFor(scope);
  let scopedListeners = listeners.get(key);
  if (!scopedListeners) {
    scopedListeners = new Set();
    listeners.set(key, scopedListeners);
  }
  scopedListeners.add(listener);
  if (!pageLifecycleListenerInstalled && typeof window !== "undefined") {
    window.addEventListener("pagehide", flushAll);
    window.addEventListener("beforeunload", flushAll);
    pageLifecycleListenerInstalled = true;
  }
  return () => scopedListeners?.delete(listener);
}

export function getTriageSessionSnapshot(scope: TriageScope): TriageSessionSnapshot {
  return snapshotFor(scope);
}

export function updateTriageSession(scope: TriageScope, change: (current: TriageAnswers) => TriageAnswers) {
  const current = snapshotFor(scope);
  schedule(scope, change(current.answers));
}

export function retryTriageSession(scope: TriageScope) {
  const current = snapshotFor(scope);
  schedule(scope, current.answers);
}
