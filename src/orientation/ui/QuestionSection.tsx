import type { ReactNode } from "react";
import type { TriageQuestion } from "../catalog/questions";

export function QuestionSection({
  question,
  responseState,
  children,
}: {
  question: TriageQuestion;
  responseState: "Sin responder" | "Respondida parcialmente" | "Respondida";
  children: ReactNode;
}) {
  return (
    <details className="triage-section">
      <summary className="triage-section-summary">
        <span className="triage-section-title">
          <span className="triage-section-code" aria-hidden="true">{question.id}</span>
          {question.title}
        </span>
        <span className="triage-section-state">{responseState}</span>
      </summary>
      <div className="triage-section-content">
        <p className="triage-prompt">{question.prompt}</p>
        {question.help ? <p className="triage-help">{question.help}</p> : null}
        {children}
      </div>
    </details>
  );
}
