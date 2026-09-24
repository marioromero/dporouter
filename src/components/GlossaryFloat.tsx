import { useEffect, useId, useMemo, useRef, useState } from "react";
import { suggestGlossaryTerms, type GlossaryTerm } from "../data/glossary";

/**
 * Glosario flotante no invasivo (Stage 1, ayuda UX).
 * Botón fijo abajo a la derecha que abre un panel lateral angosto
 * con buscador predictivo: al elegir un término muestra
 * definición + ejemplo. No bloquea la navegación ni usa
 * datos de empresa/tratamiento/finalidad.
 */
export function GlossaryFloat() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GlossaryTerm | null>(null);
  const [highlight, setHighlight] = useState(0);
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => suggestGlossaryTerms(query), [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (query !== "" || selected) {
          setQuery("");
          setSelected(null);
        } else {
          setOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, query, selected]);

  function choose(term: GlossaryTerm) {
    setSelected(term);
    setQuery(term.term);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      choose(suggestions[highlight] ?? suggestions[0]);
    }
  }

  return (
    <>
      <button
        type="button"
        className="gl-float-btn"
        aria-label={open ? "Cerrar glosario" : "Abrir glosario"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        GL
      </button>
      {open ? (
        <aside
          className="gl-float-panel"
          aria-label="Glosario flotante"
          role="complementary"
        >
          <div className="gl-float-head">
            <strong>Glosario</strong>
            <button
              type="button"
              className="btn ghost small"
              aria-label="Cerrar glosario flotante"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>
          <div className="field">
            <label htmlFor={inputId}>Buscar término</label>
            <input
              id={inputId}
              ref={inputRef}
              className="input"
              type="search"
              placeholder="Escribe: consentimiento, DPO…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              onKeyDown={onInputKey}
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls={listId}
              aria-activedescendant={
                suggestions.length > 0
                  ? `${listId}-${suggestions[highlight]?.slug ?? ""}`
                  : undefined
              }
              autoComplete="off"
            />
          </div>
          {suggestions.length > 0 && !selected ? (
            <ul id={listId} className="gl-float-list" role="listbox" aria-label="Sugerencias">
              {suggestions.map((s, i) => (
                <li key={s.slug} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    id={`${listId}-${s.slug}`}
                    className={`gl-float-item${i === highlight ? " active" : ""}`}
                    onClick={() => choose(s)}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    {s.term}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selected ? (
            <article className="gl-float-result">
              <h3>{selected.term}</h3>
              <p>{selected.plain}</p>
              <p>
                <strong>Ejemplo: </strong>
                {selected.example}
              </p>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  setSelected(null);
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                Nueva búsqueda
              </button>
            </article>
          ) : query.trim() !== "" && suggestions.length === 0 ? (
            <div className="empty">
              <p>Sin coincidencias. Prueba con otra palabra.</p>
            </div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
