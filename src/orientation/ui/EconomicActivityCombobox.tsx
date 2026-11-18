import { useEffect, useId, useRef, useState } from "react";
import { searchEconomicActivities } from "../catalog/economicActivities";
import type { EconomicActivity } from "../catalog/economicActivities";

export function EconomicActivityCombobox({
  label,
  selectedActivity,
  selectedCode,
  excludedCodes = [],
  onSelect,
  onClear,
}: {
  label: string;
  selectedActivity?: EconomicActivity;
  selectedCode?: string;
  excludedCodes?: readonly string[];
  onSelect: (activity: EconomicActivity) => void;
  onClear?: () => void;
}) {
  const id = useId();
  const inputId = `${id}-input`;
  const listId = `${id}-list`;
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = open
    ? searchEconomicActivities(query).filter((activity) => !excludedCodes.includes(activity.code))
    : [];
  const activeOptionId = results[activeIndex] ? `${id}-option-${results[activeIndex].code}` : undefined;

  useEffect(() => {
    if (!activeOptionId) return;
    const option = document.getElementById(activeOptionId);
    option?.scrollIntoView?.({ block: "nearest" });
  }, [activeOptionId]);

  function choose(activity: EconomicActivity) {
    onSelect(activity);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div className="field triage-combobox-field">
      <label htmlFor={inputId}>{label}</label>
      {selectedCode ? (
        <div className="triage-selected-activity">
          <span>
            <strong>{selectedCode}</strong>
            {" · "}{selectedActivity?.description ?? "Actividad guardada"}
          </span>
          {onClear ? (
            <button type="button" className="btn ghost small" onClick={onClear}>
              Quitar
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        id={inputId}
        className="input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && query.trim() !== ""}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        aria-label={label}
        value={query}
        placeholder="Buscar por código o descripción"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown" && results.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
          }
          if (event.key === "ArrowUp" && results.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
          }
          if (event.key === "Enter" && results[activeIndex]) {
            event.preventDefault();
            choose(results[activeIndex]);
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open && query.trim() !== "" ? (
        <div ref={listRef} id={listId} className="triage-combobox-results" role="listbox" aria-label={`${label}: resultados`}>
          {results.length > 0 ? (
            results.map((activity, index) => (
              <button
                id={`${id}-option-${activity.code}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`triage-combobox-option${activeIndex === index ? " active" : ""}`}
                key={activity.code}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(activity)}
              >
                <strong>{activity.code}</strong>
                <span>{activity.description}</span>
              </button>
            ))
          ) : (
            <p className="triage-combobox-empty">No se encontraron actividades.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
