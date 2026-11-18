import type { OrientationIndicator as OrientationIndicatorModel } from "../engine/types";
import type { OrientationLevel } from "../engine/types";
import "./orientation.css";

const LEVEL_LABELS = {
  amber: "Revisión sugerida",
  blue: "Revisión especialmente fundamentada",
  gray: "Sin señal específica",
} as const;

export function orientationLevelLabel(level: OrientationLevel): string {
  return LEVEL_LABELS[level];
}

export function orientationNavClass(level: OrientationLevel): string {
  return `orientation-nav-level--${level}`;
}

export function OrientationBadge({
  indicator,
}: {
  indicator: OrientationIndicatorModel;
}) {
  const level = orientationLevelLabel(indicator.level);
  return (
    <span
      className={`orientation-indicator-badge orientation-indicator-badge--${indicator.level}`}
      aria-label={`Orientación de Triage: ${level}`}
    >
      <span className="orientation-indicator-dot" aria-hidden="true" />
      <span className="orientation-indicator-label">{level}</span>
    </span>
  );
}
