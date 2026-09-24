# Flexible Data Rendering

Flexible Data Rendering is a Next.js workbench for defining semantic data models and previewing how the same records fit different rendering and collection templates. The included examples cover vehicles, phones, organizations, people, buildings, accounts, cases, patients, policies, plants, and projects.

## What it does

The workbench is organized into four pages, in this order, plus a shared **Data object** picker and a light/dark **theme toggle** in a fixed header bar that stays visible while the rest of the page scrolls:

- **Architecture** — an article-style proposal that explains the semantic role contract: the problem it solves, the proposed solution, a reference architecture diagram, the field-level schema (role, rank, format hint, sensitivity), an AI Assistant and cross-client use case, density tiers and fallback chains as contract constraints, and worked examples for four per-record templates (role chip, list row, tile card, summary card) rendered from one real data object. Inline links point to the Semantic Roles and UI Templates pages and to the Live Editor for hands-on experimentation.
- **Semantic Roles** — a compact reference dictionary of every semantic role (title, media, objectType, metric, progress, status, and more), its meaning, default format hint, and fallback rule, with a legend for singleton roles, format hints, and fallbacks. This reference is independent of the active data object.
- **UI Templates** — a side-by-side reference of per-record templates, including role chip, row, tile, summary, detail header, role-promotion variants, metric, progress, contact, workflow, matrix, quote, checklist, approval, and mosaic compositions. A **Collection templates** section includes table, list, grid, board, calendar, timeline, map, chart, and Funnel.
- **Live Editor** — browse the active model's records rendered as role chips, list rows, tile cards, summary cards, detail headers, or one of the six hero-promotion variants (KPI, progress, alert, party, timeline, board cards). An instructional banner at the top explains how to use the page.
  - Toggle **Show template** in the Live preview panel (highlighted with a subtle purple accent surface) to see the template's render order, role slots, and an isolated mock preview alongside the real data.
  - Hover (or focus) any record to reveal **View JSON** (the raw underlying record) and **View template** (how that specific record resolves into the active template's slots).
  - The **Edit Semantic Role Mapping** panel is always visible next to the preview, listed as a compact, role-colored field list. Click the pencil icon on a field to open a popover and change its semantic role or rank; collapse the panel to a narrow rail when you need more room for the preview. A **Save** button appears only once a field has unsaved changes.

Other behaviors:

- Identifier-role fields render as copyable codes: a copy icon transitions to a checkmark and a transient "Copied" chip on success, or a "Copy failed" state if the clipboard is unavailable.
- Percent-like fields (e.g. utilization, quota attainment) mapped to the `progress` role render as a linear bar or a compact radial ring, depending on template density; a `progress` field can also derive its percentage from a declared stage/of pair.
- A `metric` field can declare a `trendSource` sibling field to derive a percent delta (metric.trend), shown on the KPI card.
- Optional `qualifier` metadata distinguishes fields sharing a role (for example, temporal `due` vs. `updated`); `trendSource` and `stageOfSource` reference sibling values used to derive metric trends and stage-based progress. These field attributes are described in the Architecture page's Semantic contract section.
- Project is the eleventh sample data object and contains 50 projects with nested participant, task, checklist, and approval records. Each nested collection declares child fields mapped to the same semantic role contract; collection fields resolve separately from scalar role slots and are rendered in the Project detail preview.
- A field's `format` is a default presentation hint (code, percent, date, file reference, etc.); a template can override it when its context calls for a different presentation.
- Compare micro, compact, standard, rich, and full-density layouts.
- Highlight the semantic regions that each template renders.
- Open record and operator details from the preview.
- Fall back safely when remote preview images cannot be loaded.
- A field's `sensitivity` classification masks its value at every tier and is never promoted to hero, even when its rank would otherwise select it.
- Respect an explicit user theme choice (persisted in `localStorage`), falling back to the operating system color preference, with a header toggle to switch between them.

## Requirements

- Node.js 24

## Getting started

```bash
npm install
npm dev
```

Open [http://localhost:3000](http://localhost:3000) after the development server starts. The root path redirects to `/architecture`.

## Commands

| Command                   | Purpose                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `npm dev`                 | Start the local development server.                                                  |
| `npm build`               | Create a production build.                                                           |
| `npm start`               | Serve the production build.                                                          |
| `npm lint`                | Run ESLint and check Prettier formatting.                                            |
| `npm fix`                 | Format files and apply automatic ESLint fixes.                                       |
| `npm run samples:augment` | Add shared template metadata to existing samples and regenerate the Project dataset. |

## Project structure

```text
app/                    Next.js app shell, routes, and global theme styles
components/             Workbench UI and shared UI primitives
data/                   Model definitions and generated sample records
lib/rendering-contract.ts
						Semantic roles, field types, and template contracts
lib/resolve-record.ts   Resolves raw records into renderable fields
components/template-runtime.tsx
						Per-record template catalog, runtime renderers, and the
						copyable identifier control
components/template-reference.tsx
						UI Templates and Semantic Roles reference pages
components/architecture-diagram.tsx
						Architecture page (proposal, contract schema, examples)
components/editor-view.tsx
						Live Editor page and semantic-role editing panel
components/theme-toggle.tsx
						Light/dark theme switch used in the shared header
components/collection-views.tsx
						Collection templates (table, list, grid, board, calendar,
						timeline, map, chart) and their role-driven availability
```

## How the data model works

Each model in `data/*-model.json` defines fields with a type and a `semanticRole`, such as `title`, `media`, `objectType`, `metric`, `status`, `progress`, or `people`. Matching records live in the corresponding data file, for example `vehicle-model.json` and `vehicles.json`.

Fields with `type: "collection"` can declare `collectionFields` to map nested records, such as Project participants and tasks. The sample builder is deterministic and safe to rerun: it preserves existing model metadata, adds missing shared sample fields, and writes the 50 Project records.

The rendering contract maps those roles to template slots. `lib/resolve-record.ts` resolves raw record values (including fallback chains and derived values like `progress.pct` and `metric.trend`), while `components/template-runtime.tsx` selects the supported slots for the active template and renders the preview.

Semantic roles and rank are edited live from the Live Editor page: click the pencil icon on a field row in the **Edit Semantic Role Mapping** panel to open its editor popover, change its role or rank, and see the preview update immediately. Use **Save** once you are done; this only changes in-memory state for the session and does not write back to the JSON files.

To add a new sample model:

1. Add its model and record JSON files under `data/`.
2. Register the model and records in `modelSources` in `lib/model-sources.ts`.
3. Add the model to the available model list if it is not generated there.
4. Run `npm lint` and verify each template in the workbench.

## Image assets

The sample records use remote Unsplash URLs for preview imagery. A network connection is required for those images; the UI hides an image when a source fails instead of breaking the surrounding layout.
