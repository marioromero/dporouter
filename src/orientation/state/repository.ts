import {
  ORIENTATION_SCHEMA_VERSION,
  ORIENTATION_STORAGE_KEY,
  TRIAGE_QUESTIONNAIRE_VERSION,
  triageScopeKey,
} from "./types";
import type { TriageAnswers, TriageDocument, TriageEntry, TriageScope } from "./types";
import { validateTriageDocument } from "./validation";

export type RepositoryRead =
  | { ok: true; answers: TriageAnswers }
  | { ok: false; answers: TriageAnswers; error: string };

export type RepositoryWrite = { ok: true } | { ok: false; error: string };

function readDocument(): { ok: true; document: TriageDocument } | { ok: false; error: string } {
  try {
    const raw = window.localStorage.getItem(ORIENTATION_STORAGE_KEY);
    if (raw === null) return { ok: true, document: { schemaVersion: ORIENTATION_SCHEMA_VERSION, entries: {} } };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "No se pudieron leer las respuestas guardadas. Se conservan los datos existentes." };
    }
    const validation = validateTriageDocument(parsed);
    return validation.ok
      ? { ok: true, document: validation.document }
      : { ok: false, error: validation.error };
  } catch {
    return { ok: false, error: "El almacenamiento local no está disponible." };
  }
}

export function readTriageAnswers(scope: TriageScope): RepositoryRead {
  const stored = readDocument();
  if (!stored.ok) return { ok: false, answers: {}, error: stored.error };
  return { ok: true, answers: stored.document.entries[triageScopeKey(scope)]?.responses ?? {} };
}

export function writeTriageAnswers(scope: TriageScope, answers: TriageAnswers): RepositoryWrite {
  const stored = readDocument();
  if (!stored.ok) return stored;
  const validation = validateTriageDocument({
    ...stored.document,
    entries: {
      ...stored.document.entries,
      [triageScopeKey(scope)]: {
        questionnaireVersion: TRIAGE_QUESTIONNAIRE_VERSION,
        updatedAt: new Date().toISOString(),
        responses: answers,
      } satisfies TriageEntry,
    },
  });
  if (!validation.ok) return { ok: false, error: validation.error };
  try {
    window.localStorage.setItem(ORIENTATION_STORAGE_KEY, JSON.stringify(validation.document));
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar en este dispositivo. Tus cambios siguen disponibles para reintentar." };
  }
}
