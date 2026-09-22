import { useState } from "react";
import type { ActivityType } from "../types";
import type { CanonicalSource } from "../../content/sources";

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

/**
 * Insignia de estado regulatorio transitorio: normativa promulgada/publicada
 * con entrada en vigencia diferida. Distinta de "Pendiente de regulación".
 * Texto + forma; color solo como apoyo.
 */
export function TransitionalBadge() {
  return (
    <span className="reg-badge transitional">
      <i aria-hidden="true">◷</i>
      Vigencia diferida
    </span>
  );
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  assessment: "Evaluación",
  implementation: "Implementación",
  monitoring: "Monitoreo",
};

/** Etiqueta visible en español para `activity_type` (identidad intacta). */
export function activityTypeLabel(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type];
}

const SOURCE_KIND_LABELS: Record<CanonicalSource["kind"], string> = {
  law: "Ley",
  regulation: "Reglamento",
};

/** Etiqueta visible en español para el tipo de fuente. */
export function sourceKindLabel(kind: CanonicalSource["kind"]): string {
  return SOURCE_KIND_LABELS[kind];
}
