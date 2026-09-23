import { useState } from "react";
import { useWorkspace } from "../workspace/context";
import { getFactStatus, humanSourceName } from "../workspace/facts";
import {
  activeExecutionContext,
  getScopedFactState,
  scopedAddressAlternatives,
} from "../workspace/scope";
import type { ExecutionContext, ExecutionScope } from "../workspace/types";
import { describeFactKey, describeFactValue } from "../workspace/factLabels";

/**
 * Resolución explícita de un fact en conflicto (Stage 1).
 *
 * Muestra las alternativas humanas disponibles (valor, origen humano,
 * fecha) y deja que el profesional elija cuál refleja actualmente la
 * situación. La elección se registra con alternativas y momento; las
 * observaciones originales se conservan y una nueva contradicción
 * posterior reabre el conflicto. Sin empresa activa no opera.
 *
 * Con `scope` treatment/purpose opera sobre la dirección del contexto
 * activo; sin `scope` (D1) conserva el comportamiento company.
 */
export function ConflictResolver({
  factKey,
  scope = "company",
}: {
  factKey: string;
  scope?: ExecutionScope;
}) {
  const { company, resolveFactConflict } = useWorkspace();
  const [selectedKey, setSelectedKey] = useState("");
  if (!company) return null;
  const ctx: ExecutionContext | null =
    scope === "company"
      ? { scope: "company", companyId: company.id }
      : activeExecutionContext(company, scope);
  let alternatives: Array<{ value: string; source: string; updatedAt: string }>;
  if (ctx && ctx.scope !== "company") {
    if (getScopedFactState(company, ctx, factKey).state !== "conflict") {
      return null;
    }
    alternatives = scopedAddressAlternatives(company, ctx, factKey);
  } else {
    const status = getFactStatus(company, factKey);
    if (status.state !== "conflict") return null;
    alternatives = status.alternatives;
  }

  const options = alternatives.map((r) => ({
    key: `${r.source}:${r.value}`,
    value: r.value,
    label: describeFactValue(factKey, r.value),
    source: humanSourceName(r.source),
    when: r.updatedAt,
  }));
  const selected = options.find((o) => o.key === selectedKey);
  // La resolución hereda la dirección en conflicto; company usa el
  // camino histórico sin contexto.
  const resolveCtx = ctx && ctx.scope !== "company" ? ctx : undefined;

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
            if (selected) resolveFactConflict(factKey, selected.value, resolveCtx);
            setSelectedKey("");
          }}
        >
          Resolver conflicto
        </button>
      </div>
    </div>
  );
}
