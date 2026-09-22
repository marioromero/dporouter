# Domain Specifications

Approved structured operational content lives under `/content/domains`
(`Dxx.ts` files are the executable canonical source of truth).

The application consumes that structured source; it must not maintain
independent copies of canonical definitions.

`docs/domains/Dxx.md` files are generated human-readable projections of
the same source (regenerate with `npm run content:docs`).

Do not edit generated domain Markdown directly to change obligations:
receive explicit authorization, edit the canonical structured definition,
regenerate its documentation, and run content and integrity validation.

Expected filenames:

```text
D01.md
D02.md
D03.md
D04.md
D05.md
D06.md
D07.md
D08.md
D09.md
D10.md
D11.md
D12.md
````

Do NOT create these files as placeholders.

They will be supplied progressively through controlled project iterations.

Each imported domain file is canonical legal/operational content for implementation.

Coding agents must not:

* invent missing activities;
* rewrite legal conclusions;
* merge activities for convenience;
* split activities without authorization;
* rename semantic activity keys;
* change legal-vs-agency-standard provenance;
* invent dependencies;
* remove evidence requirements.

Cross-domain implementation must preserve referential integrity.

When implementing one domain, load only the domains necessary for that task unless a complete integrity review is explicitly requested.

