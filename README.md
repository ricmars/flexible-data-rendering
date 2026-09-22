# Flexible Data Rendering

Flexible Data Rendering is a Next.js workbench for defining semantic data models and previewing how the same records fit different collection templates. The included examples cover vehicles, phones, organizations, people, buildings, accounts, cases, patients, policies, and plants.

## What it does

- Select a model and inspect its semantic field roles.
- Preview records as role chips, list rows, tile cards, summary cards, or detail headers.
- Compare compact, standard, rich, and full-density layouts.
- Highlight the semantic regions that each template renders.
- Open record and operator details from the preview.
- Fall back safely when remote preview images cannot be loaded.
- Respect both an explicit `.dark` theme and the operating system color preference.

## Requirements

- Node.js 20 or newer
- pnpm 12 (the repository pins `pnpm@12.5.1`)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) after the development server starts.

## Commands

| Command                                 | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                              | Start the local development server.            |
| `pnpm build`                            | Create a production build.                     |
| `pnpm start`                            | Serve the production build.                    |
| `pnpm lint`                             | Run ESLint and check Prettier formatting.      |
| `pnpm fix`                              | Format files and apply automatic ESLint fixes. |
| `node scripts/generate-sample-data.mjs` | Regenerate the sample JSON models and records. |

## Project structure

```text
app/                    Next.js app shell and global theme styles
components/             Workbench UI and shared UI primitives
data/                   Model definitions and generated sample records
lib/rendering-contract.ts
						Semantic roles, field types, and template contracts
lib/resolve-record.ts   Resolves raw records into renderable fields
scripts/                Sample data generation utilities
```

## How the data model works

Each model in `data/*-model.json` defines fields with a type and a `semanticRole`, such as `title`, `media`, `metric`, `status`, or `people`. Matching records live in the corresponding data file, for example `vehicle-model.json` and `vehicles.json`.

The rendering contract maps those roles to template slots. `lib/resolve-record.ts` resolves raw record values, while `components/model-workbench.tsx` selects the supported slots for the active template and renders the preview.

To add a new sample model:

1. Add its model and record JSON files under `data/`, or extend `scripts/generate-sample-data.mjs`.
2. Register the model and records in `modelSources` in `components/model-workbench.tsx`.
3. Add the model to the available model list if it is not generated there.
4. Run `pnpm lint` and verify each template in the workbench.

## Image assets

The sample records use remote Unsplash URLs for preview imagery. A network connection is required for those images; the UI hides an image when a source fails instead of breaking the surrounding layout.
