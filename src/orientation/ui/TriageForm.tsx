import { useId } from "react";
import { ECONOMIC_ACTIVITY_SOURCE, type EconomicActivity } from "../catalog/economicActivities";
import {
  OPTIONS,
  QUESTION_IDS,
  QUESTION_OPTION_MAP,
  TRIAGE_QUESTIONS,
} from "../catalog/questions";
import type { TriageOption, TriageQuestion } from "../catalog/questions";
import type { TriageAnswers, TriageScope } from "../state/types";
import { useTriageAnswers } from "../state/useTriageAnswers";
import { EconomicActivityCombobox } from "./EconomicActivityCombobox";
import { MultiSelect } from "./MultiSelect";
import { QuestionSection } from "./QuestionSection";

function RadioOptions({
  questionId,
  legend,
  options,
  value,
  onChange,
}: {
  questionId: string;
  legend: string;
  options: readonly TriageOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  const groupId = useId();
  return (
    <fieldset className="triage-options">
      <legend className="triage-subquestion">{legend}</legend>
      {options.map((option) => {
        const inputId = `${groupId}-${option.id}`;
        return (
          <label className="triage-option" htmlFor={inputId} key={option.id}>
            <input
              id={inputId}
              type="radio"
              name={`${groupId}-${questionId}`}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
      {value !== "" ? (
        <button type="button" className="btn ghost small triage-clear-answer" onClick={() => onChange("")}>
          Quitar respuesta
        </button>
      ) : null}
    </fieldset>
  );
}

function responseState(question: TriageQuestion, answers: TriageAnswers): "Sin responder" | "Respondida parcialmente" | "Respondida" {
  const responded = question.responseIds.filter((id) => {
    const response = answers[id];
    if (id === QUESTION_IDS.activity) {
      if (typeof response !== "object" || response === null) return false;
      const value = response as { primary?: unknown; secondary?: unknown[] };
      return value.primary !== undefined || (Array.isArray(value.secondary) && value.secondary.length > 0);
    }
    if (Array.isArray(response)) return response.length > 0;
    return typeof response === "string" && response !== "";
  }).length;
  if (responded === 0) return "Sin responder";
  if (responded < question.responseIds.length) return "Respondida parcialmente";
  return "Respondida";
}

function withoutEmpty(values: TriageAnswers): TriageAnswers {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => {
      if (value === undefined || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && value !== null) return Object.keys(value).length > 0;
      return true;
    }),
  );
}

export function TriageForm({ scope }: { scope: TriageScope }) {
  const { loaded, answers, status, error, update, retry } = useTriageAnswers(scope);

  function updateAnswer(id: string, value: unknown) {
    update((current) => {
      const next = { ...current };
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return withoutEmpty(next);
    });
  }

  function renderQuestion(question: TriageQuestion) {
    if (question.id === "T01") {
      const selected = (answers[QUESTION_IDS.activity] ?? {}) as {
        primary?: EconomicActivity;
        secondary?: EconomicActivity[];
      };
      const secondary = selected.secondary ?? [];
      function setActivities(next: { primary?: EconomicActivity; secondary: EconomicActivity[] }) {
        updateAnswer(QUESTION_IDS.activity, {
          ...(next.primary ? { primary: next.primary } : {}),
          ...(next.secondary.length > 0 ? { secondary: next.secondary } : {}),
        });
      }
      return (
        <>
          <EconomicActivityCombobox
            label="Actividad económica principal"
            selectedActivity={selected.primary}
            selectedCode={selected.primary?.code}
            excludedCodes={secondary.map((activity) => activity.code)}
            onSelect={(activity) => setActivities({
              primary: activity,
              secondary: secondary.filter((item) => item.code !== activity.code),
            })}
            onClear={() => setActivities({ primary: undefined, secondary })}
          />
          <EconomicActivityCombobox
            label="Agregar actividad secundaria"
            excludedCodes={[...(selected.primary ? [selected.primary.code] : []), ...secondary.map((activity) => activity.code)]}
            onSelect={(activity) => setActivities({ primary: selected.primary, secondary: [...secondary, activity] })}
          />
          {secondary.length > 0 ? (
            <ul className="triage-selected-list" aria-label="Actividades económicas secundarias">
              {secondary.map((activity) => (
                <li key={activity.code}>
                  <span><strong>{activity.code}</strong> · {activity.description}</span>
                  <button
                    type="button"
                    className="btn ghost small"
                    aria-label={`Quitar actividad secundaria ${activity.code}`}
                    onClick={() => setActivities({
                      primary: selected.primary,
                      secondary: secondary.filter((item) => item.code !== activity.code),
                    })}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="triage-source-note">
            Catálogo oficial del Servicio de Impuestos Internos. Consulta: {ECONOMIC_ACTIVITY_SOURCE.consultedAt}.{" "}
            <a href={ECONOMIC_ACTIVITY_SOURCE.url} target="_blank" rel="noreferrer">
              Ver fuente oficial
            </a>
          </p>
        </>
      );
    }

    if (question.id === "T02") {
      return (
        <>
          <RadioOptions
            questionId={QUESTION_IDS.size}
            legend="Ventas anuales aproximadas"
            options={OPTIONS.companySize}
            value={String(answers[QUESTION_IDS.size] ?? "")}
            onChange={(value) => updateAnswer(QUESTION_IDS.size, value)}
          />
          <RadioOptions
            questionId={QUESTION_IDS.people}
            legend="Personas que trabajan aproximadamente en la organización"
            options={OPTIONS.workerCount}
            value={String(answers[QUESTION_IDS.people] ?? "")}
            onChange={(value) => updateAnswer(QUESTION_IDS.people, value)}
          />
        </>
      );
    }

    if (question.id === "T03") {
      return (
        <>
          <p className="triage-help">Los rangos de personas son descriptivos para orientación, no umbrales legales.</p>
          <RadioOptions
            questionId={QUESTION_IDS.scopeCount}
            legend="A. Cantidad aproximada de personas cuyos datos se tratan"
            options={OPTIONS.scopeCount}
            value={String(answers[QUESTION_IDS.scopeCount] ?? "")}
            onChange={(value) => updateAnswer(QUESTION_IDS.scopeCount, value)}
          />
          <RadioOptions
            questionId={QUESTION_IDS.scopeDiversity}
            legend="B. Diversidad de tratamientos y finalidades"
            options={OPTIONS.scopeDiversity}
            value={String(answers[QUESTION_IDS.scopeDiversity] ?? "")}
            onChange={(value) => updateAnswer(QUESTION_IDS.scopeDiversity, value)}
          />
        </>
      );
    }

    const questionId = question.responseIds[0];
    const options = QUESTION_OPTION_MAP[questionId] ?? [];
    const value = answers[questionId];
    const multipleIds = new Set<string>([QUESTION_IDS.groups, QUESTION_IDS.characteristics, QUESTION_IDS.roles, QUESTION_IDS.thirdParties, QUESTION_IDS.territory]);
    const multiple = multipleIds.has(questionId);
    return (
      <>
        {multiple ? (
          <MultiSelect
            questionId={questionId}
            options={options}
            value={Array.isArray(value) ? value as string[] : []}
            onChange={(next) => {
              update((current) => {
                const nextAnswers = { ...current };
                if (next.length > 0) nextAnswers[questionId] = next;
                else delete nextAnswers[questionId];
                if (question.id === "T04" && !next.includes("other")) {
                  delete nextAnswers[`${QUESTION_IDS.groups}_other_description`];
                }
                return withoutEmpty(nextAnswers);
              });
            }}
          />
        ) : (
          <RadioOptions
            questionId={questionId}
            legend={question.prompt}
            options={options}
            value={String(value ?? "")}
            onChange={(next) => updateAnswer(questionId, next)}
          />
        )}
        {question.id === "T04" && (value as string[] | undefined)?.includes("other") ? (
          <div className="field triage-other-field">
            <label htmlFor="triage-other-groups">Describe brevemente otros grupos (opcional)</label>
            <textarea
              id="triage-other-groups"
              className="input"
              maxLength={200}
              value={String(answers[`${QUESTION_IDS.groups}_other_description`] ?? "")}
              onChange={(event) => updateAnswer(`${QUESTION_IDS.groups}_other_description`, event.target.value)}
            />
          </div>
        ) : null}
        {question.id === "T04" ? (
          <p className="triage-help">La selección de grupos no permite inferir por sí sola datos de menores, datos sensibles ni categorías especiales.</p>
        ) : null}
        {question.id === "T05" ? (
          <p className="triage-help">Estas opciones recopilan señales generales: servicios digitales no implican necesariamente decisiones automatizadas; investigación no determina un régimen jurídico; y “especial cuidado” no es una clasificación legal definitiva.</p>
        ) : null}
        {question.id === "T07" ? (
          <p className="triage-help">La selección no determina que exista una relación de encargado, cesión, subencargo o transferencia internacional.</p>
        ) : null}
        {question.id === "T08" ? (
          <p className="triage-help">Infraestructura extranjera, acceso remoto e intercambio de datos son situaciones distintas; su clasificación se realizará posteriormente.</p>
        ) : null}
      </>
    );
  }

  return (
    <section aria-labelledby="triage-cuestionario">
      <h2 id="triage-cuestionario">Cuestionario de orientación</h2>
      <p className="lede triage-intro">
        Las respuestas son opcionales, editables y de orientación general. No constituyen conclusiones jurídicas ni una evaluación de cumplimiento.
      </p>
      <div className="triage-save-line" aria-live="polite" role="status">
        {status === "saving" ? <span>Guardando…</span> : null}
        {status === "saved" ? <span>Guardado.</span> : null}
        {status === "error" ? (
          <span className="triage-save-error">
            {error ?? "No se pudo guardar."}{" "}
            <button type="button" className="btn ghost small" onClick={retry}>Reintentar</button>
          </span>
        ) : null}
        {status === "idle" ? <span>Los cambios se guardan automáticamente en este dispositivo.</span> : null}
      </div>
      {!loaded ? <p className="empty">Cargando las respuestas de esta empresa…</p> : (
        <div className="triage-sections">
          {TRIAGE_QUESTIONS.map((question) => (
            <QuestionSection key={question.id} question={question} responseState={responseState(question, answers)}>
              {renderQuestion(question)}
            </QuestionSection>
          ))}
        </div>
      )}
    </section>
  );
}
