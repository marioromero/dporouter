import { useState } from "react";
import { useWorkspace } from "../workspace/context";
import { getFactStatus, humanSourceName } from "../workspace/facts";
import { describeFactKey, describeFactValue } from "../workspace/factLabels";

/**
 * Resolución explícita de un fact en conflicto (Stage 1).
 *
 * Muestra las alternativas humanas disponibles (valor, origen humano,
 * fecha) y deja que el profesional elija cuál refleja actualmente a
 * la empresa. La elección se registra con alternativas y momento; las
 * observaciones originales se conservan y una nueva contradicción
 * posterior reabre el conflicto. Sin empresa activa no opera.
 */
export function ConflictResolver({ factKey }: { factKey: string }) {
  const { company, resolveFactConflict } = useWorkspace();
  const [selectedKey, setSelectedKey] = useState("");
  if (!company) return null;
  const status = getFactStatus(company, factKey);
  if (status.state !== "conflict") return null;

  const options = status.alternatives.map((r) => ({
    key: `${r.source}:${r.value}`,
    value: r.value,
    label: describeFactValue(factKey, r.value),
    source: humanSourceName(r.source),
    when: r.updatedAt,
  }));
  const selected = options.find((o) => o.key === selectedKey);

  return (
    <div className="panel" data-testid={`resolver-${factKey}`}>
      <p style={{ marginTop: 0 }}>
        <strong>{describeFactKey(factKey)}</strong>
      </p>
      <div className="actions" role="group" aria-label="Alternativas registradas">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            className={selectedKey === o.key ? "btn small" : "btn ghost small"}
            aria-pressed={selectedKey === o.key}
            onClick={() => setSelectedKey(o.key)}
          >
            {o.label} · {o.source}
          </button>
        ))}
      </div>
      <ul>
        {options.map((o) => (
          <li key={o.key}>
            {o.label} — {o.source} ·{" "}
            {new Date(o.when).toLocaleDateString("es-CL")}
          </li>
        ))}
      </ul>
      <div className="actions">
        <button
          type="button"
          className="btn"
          disabled={!selected}
          onClick={() => {
            if (selected) resolveFactConflict(factKey, selected.value);
            setSelectedKey("");
          }}
        >
          Resolver conflicto
        </button>
      </div>
    </div>
  );
}
