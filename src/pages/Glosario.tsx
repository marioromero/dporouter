import { useMemo, useState } from "react";
import { GLOSSARY_TERMS, searchGlossary } from "../data/glossary";

export function GlosarioPage() {
  const [term, setTerm] = useState("");
  const results = useMemo(() => searchGlossary(term), [term]);

  return (
    <>
      <h1>Glosario</h1>
      <p className="lede">
        Palabras jurídicas y técnicas explicadas en lenguaje simple, con un
        ejemplo de aplicación desde el trabajo del DPO.
      </p>

      <div className="field">
        <label htmlFor="glosario-input">Buscar en el glosario</label>
        <input
          id="glosario-input"
          className="input"
          type="search"
          placeholder="Buscar por término o concepto... (ej: consentimiento, DPO, supresión)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
        />
      </div>

      <p className="lede" aria-live="polite">
        {results.length} de {GLOSSARY_TERMS.length} términos
      </p>

      {results.length === 0 ? (
        <div className="empty">
          <p>No encontramos ese término. Prueba con otra palabra.</p>
        </div>
      ) : (
        <div className="source-list">
          {results.map((g) => (
            <article key={g.slug} id={g.slug} className="source-card">
              <h3>{g.term}</h3>
              <p>{g.plain}</p>
              <p>
                <strong>Ejemplo: </strong>
                {g.example}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
