import { useMemo } from "react";
import { useWorkspace } from "../../workspace/context";
import { useTriageAnswers } from "./useTriageAnswers";
import { readWorkspaceOrientationSignals } from "../adapters/workspace";
import { evaluateOrientation } from "../engine/evaluate";

export function useOrientationIndicators() {
  const { profile, company } = useWorkspace();
  const scope = profile && company
    ? { advisorId: profile.id, companyId: company.id }
    : null;
  const triage = useTriageAnswers(scope ?? EMPTY_SCOPE);

  return useMemo(() => {
    const workspaceSignals = readWorkspaceOrientationSignals(company);
    return evaluateOrientation({ answers: scope ? triage.answers : {}, workspaceSignals });
  }, [company, scope?.advisorId, scope?.companyId, triage.answers]);
}

const EMPTY_SCOPE = { advisorId: "", companyId: "" };
