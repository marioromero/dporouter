import {
  MULTI_SELECT_EXCLUSIVE_IDS,
  QUESTION_IDS,
  QUESTION_OPTION_MAP,
} from "../catalog/questions";
import { ORIENTATION_SCHEMA_VERSION, TRIAGE_QUESTIONNAIRE_VERSION } from "./types";
import type { TriageAnswers, TriageDocument } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueOptionArray(questionId: string, value: unknown): value is string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) return false;
  const allowed = new Set((QUESTION_OPTION_MAP[questionId] ?? []).map((option) => option.id));
  const exclusive = MULTI_SELECT_EXCLUSIVE_IDS[questionId] ?? [];
  return (
    value.every((entry) => allowed.has(entry)) &&
    new Set(value).size === value.length &&
    (!value.some((entry) => exclusive.includes(entry)) || value.length === 1)
  );
}

function validEconomicSelections(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (
    value.primary !== undefined &&
    (!isRecord(value.primary) ||
      typeof value.primary.code !== "string" ||
      !/^\d{6}$/.test(value.primary.code) ||
      typeof value.primary.description !== "string" ||
      value.primary.description.length === 0)
  ) {
    return false;
  }
  if (value.secondary !== undefined) {
    if (
      !Array.isArray(value.secondary) ||
      !value.secondary.every(
        (entry) =>
          isRecord(entry) &&
          typeof entry.code === "string" &&
          /^\d{6}$/.test(entry.code) &&
          typeof entry.description === "string" &&
          entry.description.length > 0,
      )
    ) {
      return false;
    }
    const codes = value.secondary.map((entry) => (entry as { code: string }).code);
    if (new Set(codes).size !== codes.length || (value.primary && codes.includes((value.primary as { code: string }).code))) {
      return false;
    }
  }
  return true;
}

export function validateTriageAnswers(value: unknown): value is TriageAnswers {
  if (!isRecord(value)) return false;
  const knownIds = new Set<string>([
    ...Object.keys(QUESTION_OPTION_MAP),
    QUESTION_IDS.activity,
    `${QUESTION_IDS.groups}_other_description`,
    `${QUESTION_IDS.thirdParties}_other_description`,
  ]);
  for (const [id, answer] of Object.entries(value)) {
    if (!knownIds.has(id)) continue; // Keep future answer fields intact.
    if (id === QUESTION_IDS.activity) {
      if (!validEconomicSelections(answer)) return false;
      continue;
    }
    if (id.endsWith("_other_description")) {
      if (typeof answer !== "string" || answer.length > 200) return false;
      continue;
    }
    const questionId = id as keyof typeof QUESTION_OPTION_MAP;
    if (questionId === QUESTION_IDS.groups ||
        questionId === QUESTION_IDS.characteristics ||
        questionId === QUESTION_IDS.roles ||
        questionId === QUESTION_IDS.thirdParties ||
        questionId === QUESTION_IDS.territory) {
      if (!isUniqueOptionArray(id, answer)) return false;
    } else if (
      typeof answer !== "string" ||
      !(QUESTION_OPTION_MAP[id] ?? []).some((option) => option.id === answer)
    ) {
      return false;
    }
  }
  return true;
}

export function validateTriageDocument(value: unknown):
  | { ok: true; document: TriageDocument }
  | { ok: false; error: string } {
  if (!isRecord(value) || !Number.isInteger(value.schemaVersion)) {
    return { ok: false, error: "El archivo de orientación no tiene un formato válido." };
  }
  if (value.schemaVersion !== ORIENTATION_SCHEMA_VERSION) {
    return { ok: false, error: "Los datos pertenecen a otra versión y se conservaron sin cambios." };
  }
  if (!isRecord(value.entries)) {
    return { ok: false, error: "No se pudieron validar las respuestas de orientación." };
  }
  for (const entry of Object.values(value.entries)) {
    if (
      !isRecord(entry) ||
      entry.questionnaireVersion !== TRIAGE_QUESTIONNAIRE_VERSION ||
      typeof entry.updatedAt !== "string" ||
      Number.isNaN(Date.parse(entry.updatedAt)) ||
      !validateTriageAnswers(entry.responses)
    ) {
      return { ok: false, error: "Hay respuestas incompatibles o dañadas; se conservaron sin cambios." };
    }
  }
  return { ok: true, document: value as unknown as TriageDocument };
}
