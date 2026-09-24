# Guided Execution

Status: STAGE 1 CANONICAL LAYER — D1.01–D1.20, D2.01–D2.12 (juicios scopeados D2.06/D2.10/D2.11; D2.12 procedure company-scope), D3.01–D3.06 (D3.01 procedure y D3.02 checklist company-scope; D3.03 procedure, D3.04 juicio decision, D3.05 checklist y D3.06 procedure purpose-scope con puente read-only D2.05 y gating D3.03→D3.04/D3.05/D3.06), D4.01–D4.09 (D4.01–D4.07 company-scope con gating D4.01→D4.02–D4.07; D4.08 decision y D4.09 checklist treatment-scope sobre automatedUses[] compartida con guard de consistencia), D5.01–D5.07 (D5.01–D5.05 + D5.07 decision purpose-scope con juicio y guards; D5.06 checklist purpose-scope sin reasoning; D5 CLOSED)

`The guidance engine assists professional execution; it does not silently create new legal obligations.`

## 1. ActivityDefinition vs ExecutionProtocol

An `ActivityDefinition` describes WHAT operational activity exists: objective,
trigger question, steps, evidence, deliverable, legal basis, dependencies,
regulatory status.

An `ExecutionProtocol` defines HOW a professional is guided from facts to a
conclusion or to a verified operational state: concrete questions,
deterministic rules, explained outcomes and next actions.

They are different concepts and live in different canonical sources:

* `/content/domains` — activity definitions (untouched by this layer);
* `/content/protocols` — execution protocols plus a reusable registry.

One activity has zero or one active protocol in Stage 1. No protocol fields
are added to `ActivityDefinition`; the relation resolves through the
registry (`activity_key → ExecutionProtocol`).

## 2. Nodes

A protocol is a set of `GuidanceNode` items:

* `question` — asks one fact (yes / no / unknown, or a defined selection);
  declares what evidence to review and why the question matters;
* `decision` — applies ordered deterministic transitions over known facts;
  a rule may route either to another node (`goto_node_key`) or to an
  outcome (`goto_outcome_key`);
* `result` — reserved node type for intermediate results.

Array order defines presentation and suggested traversal only. It never
defines semantic prerequisites: node routing is independent from array
position, and a decision rule reaching a node navigates to that node's
deep link with session facts preserved.

Every node has a stable deep link (`/actividad/:activityKey/guia/:nodeKey`).
Opening a node evaluates exclusively its declared `required_facts[]` and
never demands having visited previous nodes. Missing prerequisites are
reported with human-language labels and a link to the next node able to
produce one of them; prior answers are never invented.

## 2b. Mode calibration

The same node contract serves the three modes without new node or answer
types:

* `decision` — facts feed deterministic rules toward a classified outcome;
* `procedure` — steps are represented as verifications of facts ("verified
  and recorded" vs "pending"), never as artificial yes/no discovery
  questions; `single_select` carries the explicit state labels;
* `checklist` — each check uses one `yes_no_unknown` fact with explicit
  human meaning per check (satisfactory / requires action / insufficient
  information); no global score is derived.

If a future activity cannot be represented cleanly within these shapes,
the content stays intact and the gap is reported (ENGINE_GAP) instead of
forcing a misleading workaround.

## 3. Facts

Nodes produce facts with stable keys (e.g. an MPI lifecycle state, or one
professional-assessment factor). Facts are distinct from answers: several
options may map to one fact, and one fact is asked at most once per
protocol.

Facts can originate outside the current protocol: session answers,
`initialFacts`, Diagnóstico, another protocol, or future persisted client
information. A node declares what it needs through `required_facts[]`
(semantic fact keys, never node references, since the same fact may come
from several sources). A fact counts as available when present, and as
resolved only with a value other than `unknown`.

## 4. Answer reuse

The engine receives an evaluation context. When a fact already has a known
value (injected context), the system reuses it, marks it as `Dato ya
disponible`, and does not demand answering it again. Session answers may
still update it explicitly.

In Stage 1, characterization facts persist per company (Diagnóstico)
and session answers persist per company in the local workspace. The
architecture separates injected facts from session answers, so
Diagnóstico integration reuses the same protocols without rewriting
them. Session answers are never presented as saved client records
beyond the Stage 1 local workspace.

## 5. Deterministic rules

Decisions use explicit declarative rules: `all`, `any`, `not`, fact
comparison, count of true factors within a set, destination route and a
textual explanation of why the rule fired. Rules evaluate in order; the
first match wins.

No LLM, no external API, no opaque heuristic, no invented scoring. A future
AI layer may assist narrative or documentation, but it must never silently
replace canonical rules as authority over a legal or professional
conclusion.

## 6. Unknown semantics

`unknown != false`. An unanswered or uncertain fact stays unresolved: it is
recorded so the flow can continue, but it never counts as a negative
answer. When the protocol marks facts as mandatory (`decision_fact_keys`),
any unresolved fact blocks a definitive outcome and produces
`assessment_incomplete` with the missing facts enumerated.

## 7. Outcomes

Outcomes carry a human label, a classification (`legal_requirement` or
`agency_standard`), an explanation, provenance and next actions. The result
screen always shows:

* resultado (human label);
* naturaleza (Obligación legal / Estándar metodológico);
* por qué (exact fired rules);
* factores considerados (factor / answer / effect);
* antecedentes revisados in the session;
* siguiente paso (dynamic links).

Obligation derived from MPI state and agency professional recommendation
are never mixed.

## 8. Next actions

A next action links to another activity, another node, an evaluation
restart, or carries information without destination. Existing activities
render as real links; not-yet-imported targets use the canonical
pending-reference mechanism instead of broken links.

## 9. Deep linking

Entry (`/actividad/:activityKey/guia`), node (`.../guia/:nodeKey`) and
result (`.../guia/resultado`) routes are stable, shareable and survive
reload. The copy-link control copies the current node URL.

## 10. Diagnóstico integration

Diagnóstico captures characterization facts per company. Its known
facts inject into the evaluation context (`initialFacts`) and appear
as already-available data. Protocols, rules and UI remain unchanged.

## 11. Stage 1 persistence vs Stage 2

Stage 1 persists work locally per company (browser storage):
companies, treatments and purposes, facts, protocol answers,
reasoning records and export/import. It is not secure authentication
and not Stage 2: no backend, no database, no auth, no longitudinal
audit history.

Stage 2 may persist per-client evaluations with full audit history (who,
what, when, why, evidence, previous and new values, version) without
rewriting the canonical protocol model.

## 12. Execution scopes

A protocol declares the juridical object under analysis through a
closed execution scope:

```text
company
treatment
purpose
```

Company holds multiple treatment contexts; a treatment holds multiple
purposes: `Company → TreatmentContext → TreatmentPurpose`. Scopes are
juridical objects, never work instances: no owners, deadlines,
workflow, history or longitudinal audit.

A treatment or purpose protocol sees company facts plus its own
context, never sibling contexts. Company protocols see only company
facts, so selecting a treatment or purpose never alters a company
evaluation. D1 protocols are company-scoped.

Execution scope differs from storage scope: a protocol may execute on
one object while its guidance addresses another (e.g. managing
purposes from treatment scope). The contract preserves this
separation.

## 13. Explicit finalization and canonical fact effects

A definitive outcome may carry `canonical_fact_effects`: plain
`{fact_key, value}` pairs materialized only through an explicit
professional action. Nothing is written by rendering, navigating or
evaluating. Repeating the action is idempotent; a failed validation
writes nothing.

`ActivityDefinition.state_effect[]` is never interpreted as an
executable language. Append, create, dynamic dates, history and
lifecycle remain gaps: outcomes that require them carry no effects.

Procedure/checklist finalization is scope-aware (ADR-051): the
explicit action evaluates the addressed fact view and writes
`canonical_fact_effects` exclusively to the addressed
`ExecutionContext` of the guide being finalized (company,
treatment or purpose), captured when the guide opens and never
re-resolved from late active selection — what is evaluated and
what is written always share the address. If the active
selection moved since the guide opened, the UI warns and blocks
the record until the guide is reopened. Ancestry is validated
first; cross-parent contexts are rejected. Conflicts block only
within the effective address — sibling treatments or purposes
never block each other — while relevant ancestor facts apply
through the frozen fact-view rules. Repeating the action is
idempotent per full address. No ReasoningRecord and no
deterministic-decision semantics are introduced by this path.

## 14. Fact states and explicit conflicts

Facts are absent, unknown, resolved or conflicted — four
distinguishable states, never silently converted. Same source plus
update keeps the latest observation; different sources with the same
value agree; different sources with different values conflict, and a
conflict in a required fact blocks any definitive conclusion.
Resolution is an explicit professional decision recording fact, value,
moment and alternatives; a later contradiction reopens the conflict.
Conflicts resolve only within the same juridical address, never
across scopes.

## 15. Documented professional judgment

Protocols that require a documented professional conclusion use a
`ReasoningRecord` with an explicit adoption act. The system verifies a
sufficient basis but never deduces the conclusion: it belongs to the
professional, with gating fields declared per protocol. Records persist
in their execution scope (company, treatment or purpose) with
same-scope effects; re-finalizing is idempotent.

## 16. Local automated-use inventory (D4.08/D4.09)

A treatment may hold a local `automatedUses[]` collection (ADR-052,
`DATA_CONTRACTS.md` §46): treatment-owned value objects with local
identity, subordinate coverage/path determinations and per-use
safeguard verifications. It is structure, not execution: no
per-use protocol sessions, progress, outcomes or fact keys exist,
and editing uses never writes canonical facts.

Read-only `derived.treatment.automated_uses_*` projections expose
existence, classification progress, covered presence, legal-path
determination and safeguard state as structural gates. The D4.08
guide (decision, treatment-scope) concludes through the single
treatment-scoped ReasoningRecord; a consistency guard composes the
exact `automated_use:<id>` references, validates conclusion↔state
compatibility and detects collection drift as staleness — all
through data-dispatched helpers, with the generic finalizer,
ProtocolView and progress engine untouched. Treatment aggregates
materialize only through explicit finalization. D4.09 (checklist,
treatment-scope) verifies operational conditions plus the derived
per-use safeguard state over the same collection.

## 17. D5 special-regime candidates (Punto 0, no protocols yet)

Purpose-scoped `derived.purpose.d5_*_candidate` facts (seven
static keys) project hybrid capture state — intrinsic item
signals, purpose regime profile, live links, existing D2.05 route
truth — into the session fact view through the same derived
mechanism: read-only, never persisted, never conflict sources.
Each key emits only `yes` (review mechanically required) or
`no` (mechanically excludable); absence means `unknown` for
routing and never `false`.

Candidates serve routing, UX hints and resume; they never
substitute the future protocol decision and never write
canonical state. D5 protocols (zero active) remain manually
openable; structural coherence warnings stay runtime-only.

## 18. D6 third-party relationship capture (Punto 0, no protocols yet)

Treatment-owned `thirdPartyRelationships[]` (ADR-054,
`DATA_CONTRACTS.md` §48) is the shared local structure for future
D6.01–D6.07: one record per relationship, exactly one juridical
type, `actorId` referencing the untouched D2.02 `ActorRecord`,
same-treatment purpose/data references, international tri-state as
routing only, and optional subordinate assessments
(`cessionAssessment`, `processorAssessment`,
`subprocessorAssessment`). Editing it writes nothing canonical.

Read-only derived projections prepare routing without concluding:
treatment-level `derived.treatment.d6_*` (23 keys: map existence,
structural completeness, unknown classifications, international
existence, and per-dimension processor/subprocessor aggregates) and
purpose-level `derived.purpose.d6_*` (11 keys: relevant cessions
for the purpose, lawfulness and instrument dimensions, and the
D6.03 ready-positive vs blocked-by-lawfulness vs incomplete
separation). Empty sets never produce a positive value; no
per-relationship derived fact and no dynamic fact key exists.

The future contract is frozen at capture level, not at protocol
level: definitive D6.01 requires one treatment-scoped
ReasoningRecord referencing every current relationship through exact
`third_party_relationship:<id>` tokens; definitive D6.02 requires a
purpose-scoped record referencing every current cession linked to
that purpose; D6.03 may conclude positively only when all relevant
instruments are validated and all lawfulness supported, and is
blocked — not remediable — when a validated instrument sits on an
unsupported cession. Execution stays treatment/purpose: no
relationship scope, no per-relationship protocol session, no
selector-as-context. D6 protocols (zero active) remain manually
openable; canonical totals and readiness are unchanged by this
infrastructure.
