# Skill: guided-protocol

# Guided Protocol Skill

Use this skill when implementing, updating or reviewing an
`ExecutionProtocol` under `/content/protocols`.

## Frozen engine properties (never change implicitly)

Preserve exactly:

- `required_facts[]` defines semantic prerequisites;
- array order does NOT define prerequisites (presentation only);
- `external_fact_keys[]` allows facts produced outside the protocol;
- a decision rule may route to another node OR to an outcome;
- `unknown`, absent fact and resolved fact are three different states;
- node deep links keep working (`/actividad/:activityKey/guia/:nodeKey`);
- no activity-specific logic in generic code (`dpo.need_assessment`
  is the first real protocol, not a special case);
- rules stay deterministic, ordered first-match-wins, explained;
- obligation (MPI-derived) and agency recommendation never mix;
- session answers persist per company; Diagnóstico facts enter as
  injected context; fact origin is never silently mixed;
- switching companies switches the facts/answers context.

## Required context

Before modifying:

1. Read `/AGENTS.md`.
2. Read `/docs/IMPLEMENTATION_STATUS.md`.
3. Read `/docs/DATA_CONTRACTS.md` (§§33-39).
4. Read `/docs/DECISIONS.md` (ADR-042/043).
5. Read `/docs/GUIDED_EXECUTION.md`.
6. Read `/docs/PRODUCT_UX_CONTRACT.md` for presentation rules.
7. Read only the target protocol file.

Do not touch `ActivityDefinition`, domain content, or the engine's
evaluation semantics unless the task explicitly redesigns them.

## Implementation rules

- Protocols live as canonical structured content, never hardcoded in UI.
- Every `goto_node_key` must resolve exactly one node.
- Every `required_facts` entry must be produced in-protocol or declared
  in `external_fact_keys[]`.
- Navigation graph must be acyclic (validated, not assumed).
- Outcomes keep `legal_requirement` vs `agency_standard` separated.
- Next actions resolve to real links or the pending-reference mechanism.
- Never convert `unknown` into `no`; never invent missing answers.
- An incomplete evaluation never claims a definitive result.

## Validation before completion

1. `validateProtocolStructure` returns zero errors.
2. Unit tests cover every outcome and every routing shape used
   (question→node, decision→node, decision→outcome).
3. Deep-link, reload, restart and copy-link behavior verified.
4. D1.02 still produces its exact outcomes when touched indirectly.
5. `integrity-check` passes; `reviewer` has no BLOCKER/MAJOR.

Base directory for this skill: C:\Users\Mario\WebstormProjects\dporouter\.opencode\skills\guided-protocol
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>

</skill_files>
