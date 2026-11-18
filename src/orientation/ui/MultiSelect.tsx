import { MULTI_SELECT_EXCLUSIVE_IDS, type TriageOption } from "../catalog/questions";
import { toggleMultiSelection } from "./selection";

export function MultiSelect({
  questionId,
  options,
  value,
  onChange,
}: {
  questionId: string;
  options: readonly TriageOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const exclusiveIds = MULTI_SELECT_EXCLUSIVE_IDS[questionId] ?? [];
  return (
    <fieldset className="triage-options">
      <legend className="triage-visually-hidden">Selecciona una o más opciones</legend>
      {options.map((option) => (
        <label className="triage-option" key={option.id}>
          <input
            type="checkbox"
            checked={value.includes(option.id)}
            onChange={() => onChange(toggleMultiSelection(value, option.id, exclusiveIds))}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
