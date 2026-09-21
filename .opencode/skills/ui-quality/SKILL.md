---
name: ui-quality
description: Review Stage 1 views for professional orientation, hierarchy, traceability, navigation, density, accessibility, responsive behavior, fake functionality and Stage 1/Stage 2 separation.
compatibility: opencode
---

# UI Quality Skill

Use this skill after implementing or changing Stage 1 views, before the
read-only reviewer pass.

## Read first

- `/AGENTS.md`
- `/docs/PRODUCT_ARCHITECTURE.md`
- `/docs/UX_PRINCIPLES.md`
- `/docs/IMPLEMENTATION_STATUS.md`

No legal content lives in this skill. Never invent legal references
while reviewing.

## Checks

### Orientation

- Current area, domain/activity context and return path are evident.
- Map Mode (`MAPA`) vs Guided Mode (`GUIADO`) is distinguishable.
- Deep links carry enough context without prior wizard state.

### Hierarchy

- Execution content dominates; technical metadata stays secondary.
- Activity sheets follow: name, human code, objective, applicability,
  trigger, duty, steps, interlocutors, methods, evidence, deliverable,
  time, complexity, grounds, dependencies, outcome, regulatory status,
  legal review — then technical traceability.

### Navigation and density

- Six primary areas reachable; active state correct.
- Desktop sidebar persistent; tablet drawer keeps every action available.
- Information-dense without noise; no decorative cards, gradients,
  heroes, or gratuitous animation.

### Traceability and provenance

- Legal requirement, agency standard and pending regulation stay
  distinguishable by text plus shape, never color alone.
- Unknown states never render as negative answers.

### Accessibility and responsive

- Contrast, visible focus, keyboard reachability, accessible labels.
- No hover-only or color-only meaning.
- No accidental horizontal overflow at 1440px and 820px widths.

### Fake functionality

- No fabricated progress, compliance percentages, statuses, clients,
  users, evidence, sources, deadlines or analytics.
- Empty states honestly describe pending controlled imports.

### Stage boundary

- No Stage 2 controls shown as functional (clients, treatments,
  roadmaps, findings, corrective actions, documents, AI, auth, MCP).
- Definitions never depend on client state.

## Output

Report PASS/FAIL per section with file and location for each defect.
If clean, state explicitly that the scope passed UI quality review.
