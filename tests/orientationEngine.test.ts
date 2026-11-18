import { describe, expect, it } from "vitest";
import { ALL_ACTIVITIES } from "../content/registry";
import { DOMAINS } from "../src/data/domains";
import { QUESTION_IDS } from "../src/orientation/catalog/questions";
import { evaluateOrientation, validateOrientationRuleTargets } from "../src/orientation/engine/evaluate";
import { ORIENTATION_RULES } from "../src/orientation/engine/rules";
import type { TriageAnswers } from "../src/orientation/state/types";

function activityLevel(answers: TriageAnswers, activityKey: string, workspaceSignals: never[] = []) {
  return evaluateOrientation({ answers, workspaceSignals }).activities[activityKey];
}

describe("motor puro de orientación", () => {
  it("apunta solo a actividades canónicas y conserva las 61 definiciones", () => {
    expect(validateOrientationRuleTargets()).toEqual([]);
    expect(ALL_ACTIVITIES).toHaveLength(61);
    expect(Object.keys(evaluateOrientation({ answers: {}, workspaceSignals: [] }).activities)).toHaveLength(61);
    expect(DOMAINS.filter((domain) => domain.activity_keys.length === 0).map((domain) => domain.domain_key)).toEqual([
      "d7", "d8", "d9", "d10", "d11", "d12",
    ]);
  });

  it("activa asociaciones generales aprobadas sin inferir resultados jurídicos", () => {
    const answers: TriageAnswers = {
      [QUESTION_IDS.scopeDiversity]: "several",
      [QUESTION_IDS.groups]: ["patients"],
      [QUESTION_IDS.characteristics]: ["profiling"],
      [QUESTION_IDS.roles]: ["follows_instructions"],
      [QUESTION_IDS.thirdParties]: ["hosting"],
    };
    const result = evaluateOrientation({ answers, workspaceSignals: [] });

    expect(result.activities["dpo.need_assessment"].level).toBe("amber");
    expect(result.activities["mpi.need_assessment"].level).toBe("amber");
    expect(result.activities["treatment.inventory_create"].level).toBe("amber");
    expect(result.activities["treatment.actor_roles"].level).toBe("amber");
    expect(result.activities["third_party.relationship_map"].level).toBe("amber");
    expect(result.activities["automated_decision.scope_assess"].level).toBe("amber");
    expect(result.activities["sensitive.lawfulness_assess"].level).toBe("gray");
    expect(result.activities["minors.processing_assess"].level).toBe("gray");
    expect(result.activities["financial.titleIII_scope"].level).toBe("gray");
  });

  it("ignora ausencias, respuestas desconocidas, negativas y señales explícitamente excluidas", () => {
    const answers: TriageAnswers = {
      [QUESTION_IDS.size]: "large",
      [QUESTION_IDS.people]: "1000_plus",
      [QUESTION_IDS.scopeCount]: "100000_plus",
      [QUESTION_IDS.groups]: ["none"],
      [QUESTION_IDS.characteristics]: ["digital_services"],
      [QUESTION_IDS.roles]: ["unknown"],
      [QUESTION_IDS.thirdParties]: ["unknown"],
      [QUESTION_IDS.territory]: ["mainly_chile"],
      [QUESTION_IDS.activity]: { primary: { code: "011101", description: "CULTIVO DE TRIGO" } },
    };
    const result = evaluateOrientation({ answers, workspaceSignals: [] });
    expect(result.activities["dpo.need_assessment"].level).toBe("gray");
    expect(result.activities["mpi.need_assessment"].level).toBe("gray");
    expect(result.activities["rights.opposition_enable"].level).toBe("gray");
    expect(result.activities["automated_decision.scope_assess"].level).toBe("gray");
    expect(result.activities["research.public_interest_assess"].level).toBe("gray");
    expect(result.activities["third_party.relationship_map"].level).toBe("gray");
    expect(result.domains.d5.level).toBe("gray");
    expect(result.domains.d7.level).toBe("gray");
    expect(result.domains.d8.level).toBe("gray");
    expect(evaluateOrientation({
      answers: { [QUESTION_IDS.characteristics]: ["systematic_monitoring"] },
      workspaceSignals: [],
    }).domains.d8.level).toBe("gray");
    expect(evaluateOrientation({
      answers: { [QUESTION_IDS.territory]: ["foreign_access"] },
      workspaceSignals: [],
    }).domains.d7.level).toBe("gray");

    const explicitNo: TriageAnswers = {
      [QUESTION_IDS.characteristics]: ["none"],
      [QUESTION_IDS.groups]: ["unknown"],
    };
    expect(activityLevel(explicitNo, "treatment.inventory_create").level).toBe("gray");
  });

  it("no deriva D4.05 de marketing genérico ni D4.08 de servicios digitales", () => {
    expect(activityLevel({ [QUESTION_IDS.characteristics]: ["marketing"] }, "rights.opposition_enable").level).toBe("gray");
    expect(activityLevel({ [QUESTION_IDS.characteristics]: ["digital_services"] }, "automated_decision.scope_assess").level).toBe("gray");
    expect(ORIENTATION_RULES.some((rule) => rule.id.includes("t05.marketing"))).toBe(false);
  });

  it("no genera actividades provisionales para D7–D12 y el dominio D5 puede marcarse sin propagar a sus actividades", () => {
    const result = evaluateOrientation({
      answers: { [QUESTION_IDS.characteristics]: ["special_care"] },
      workspaceSignals: [],
    });
    expect(result.domains.d5.level).toBe("amber");
    expect(result.activities["sensitive.lawfulness_assess"].level).toBe("gray");
    expect(result.domains.d7.contentAvailable).toBe(false);
    expect(result.domains.d7.level).toBe("gray");
    expect(result.domains.d12.contentAvailable).toBe(false);
    expect(ALL_ACTIVITIES.some((definition) => definition.human_code.startsWith("D7."))).toBe(false);
  });

  it("el azul prevalece sin eliminar motivos ámbar ni elevar acumulaciones ámbar", () => {
    const input = {
      answers: {
        [QUESTION_IDS.scopeDiversity]: "many",
        [QUESTION_IDS.groups]: ["workers"],
      },
      workspaceSignals: [{
        key: "treatment.identified",
        label: "Tratamiento identificado",
        scope: "treatment" as const,
        scopeLabel: "Tratamiento: Nómina",
      }],
    };
    const result = evaluateOrientation(input);
    const inventory = result.activities["treatment.inventory_create"];
    expect(inventory.level).toBe("blue");
    expect(inventory.reasons.map((reason) => reason.level)).toEqual(["amber", "amber", "blue"]);
    expect(inventory.reasons.some((reason) => reason.origin.kind === "workspace" && reason.origin.scopeLabel === "Tratamiento: Nómina")).toBe(true);
    expect(result.domains.d2.level).toBe("blue");

    expect(activityLevel({
      [QUESTION_IDS.scopeDiversity]: "many",
      [QUESTION_IDS.groups]: ["workers"],
    }, "treatment.inventory_create").level).toBe("amber");
  });
});
