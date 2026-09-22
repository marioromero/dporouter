# Guided Execution

Status: STAGE 1 CANONICAL LAYER — PILOT D1.02

`The guidance engine assists professional execution; it does not silently create new legal obligations.`

## 1. ActivityDefinition vs ExecutionProtocol

An `ActivityDefinition` describes WHAT operational activity exists: objective,
trigger question, steps, evidence, deliverable, legal basis, dependencies,
regulatory status.

An `ExecutionProtocol` defines HOW a professional is guided from facts to a
conclusion for activities requiring professional judgment: concrete
questions, deterministic rules, explained outcomes and next actions.

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
* `result` — reserved node type for intermediate results.

Every node has a stable deep link (`/actividad/:activityKey/guia/:nodeKey`).
Opening a node without prior session state renders its content and never
invents prior answers; missing prerequisites are reported with a link to
the first required antecedent.

## 3. Facts

Nodes produce facts with stable keys (e.g. an MPI lifecycle state, or one
professional-assessment factor). Facts are distinct from answers: several
options may map to one fact, and one fact is asked at most once per
protocol.

## 4. Answer reuse

The engine receives an evaluation context. When a fact already has a known
value (injected context), the system reuses it, marks it as `Dato ya
disponible`, and does not demand answering it again. Session answers may
still update it explicitly.

In Stage 1 there is no persistent characterization yet, so pilot facts
resolve through session answers. The architecture already separates
injected facts from session answers, so future Diagnóstico integration
reuses the same protocols without rewriting them.

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

## 10. Futura integración con Diagnóstico

When characterization exists, its known facts inject into the evaluation
context (`initialFacts`) and appear as already-available data. Protocols,
rules and UI remain unchanged.

## 11. Futura persistencia Stage 2

Stage 1 session state is transient (in-memory, no database, no
localStorage, no per-client persistence) and is always presented as such.
Stage 2 may persist per-client evaluations with full audit history (who,
what, when, why, evidence, previous and new values, version) without
rewriting the canonical protocol model.
