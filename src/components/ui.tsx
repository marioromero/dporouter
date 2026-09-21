import { useState } from "react";

export type ProvenanceKind = "legal" | "method" | "pending" | "unresolved";

const LABELS: Record<ProvenanceKind, string> = {
  legal: "Obligación legal",
  method: "Estándar metodológico",
  pending: "Pendiente de regulación u orientación",
  unresolved: "No resuelto",
};

/**
 * Patrón visual reutilizable de procedencia.
 * Texto + forma siempre presentes; color solo como apoyo.
 */
export function ProvenanceBadge({ kind }: { kind: ProvenanceKind }) {
  return (
    <span className={`prov-badge ${kind}`}>
      <i aria-hidden="true" />
      {LABELS[kind]}
    </span>
  );
}

export function ProvenanceCard({
  kind,
  text,
}: {
  kind: ProvenanceKind;
  text: string;
}) {
  return (
    <div className={`prov ${kind}`}>
      <i aria-hidden="true" />
      <div>
        <strong>{LABELS[kind]}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

export function CopyLinkButton({ label = "Copiar enlace" }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span>
      <button type="button" className="btn ghost small" onClick={copy}>
        {label}
      </button>{" "}
      <span className="copy-feedback" role="status" aria-live="polite">
        {copied ? "Enlace copiado" : ""}
      </span>
    </span>
  );
}
