# Implementation Playbook

Status: PERMANENT
Purpose: the repetitive procedure for every future iteration. Follow it in
order; do not skip steps.

1. Read `docs/IMPLEMENTATION_STATUS.md`.
2. Load the relevant canonical documents for the scope (never the whole
   repository eagerly; never pre-load all domains).
3. Load the matching project skills (`domain-implementation`,
   `integrity-check`, `ui-quality`, `guided-protocol`) when their
   descriptions match the work.
4. Implement only the requested scope. Do not import extra domains, invent
   legal content, add dependencies, or redesign outside the scope.
5. Run the relevant tests (unit/content; build when UI or content changed).
   Cover fact-conflict cases (agreement, conflict, explicit resolution,
   reopening) for guide-related work.
6. Run `integrity-check` for canonical, cross-domain or engine-adjacent work.
7. Run `ui-quality` for any visual change.
8. Run the read-only reviewer for substantial changes.
9. Fix every BLOCKER and MAJOR before proceeding.
10. Update `docs/IMPLEMENTATION_STATUS.md` when the iteration requests it.
11. Commit only when explicitly requested, with only the iteration's files.
12. Stop. Do not continue into the next iteration without instruction.
13. Documentation Synchronization Gate: when the iteration introduced or
modified a contract, changed an architectural decision, added relevant
runtime capability, changed readiness, introduced a new scope/context,
or changed persistence, facts, protocol state, reasoning, lifecycle or
export/import, review `docs/DATA_CONTRACTS.md`,
`docs/GUIDED_EXECUTION.md`, `docs/DECISIONS.md`,
`docs/IMPLEMENTATION_STATUS.md` and any directly affected document or
skill. If a canonical document requires explicit authorization, report
`documentation sync: pending authorization` instead of editing. Close
with exactly one of: `documentation sync: not required`,
`documentation sync: completed`, or
`documentation sync: pending authorization`.

Blocked or uncertain: report the blocker and the exact affected
artifact, then stop that specific change until instructed.
