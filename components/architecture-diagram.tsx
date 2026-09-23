'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Database,
  LayoutTemplate,
  Shapes,
  Sparkles,
} from 'lucide-react'
import type { Template } from '@/components/template-runtime'
import {
  RoleChipTag,
  TemplateSample,
  makeRecords,
  runtimeByTemplate,
  templateCatalog,
} from '@/components/template-runtime'
import {
  fallbackChains,
  templates as densityTiers,
} from '@/lib/rendering-contract'
import { modelSources } from '@/lib/model-sources'

/**
 * Architecture page: a small "layers" diagram at the top (Data object ->
 * Semantic roles -> UI templates -> Runtime), followed by concrete, worked
 * examples for the four densest-to-richest per-record templates (Role
 * chip, List row, Tile card, Summary card) rendered for one real data
 * object ("Manufacturing plant") — as three columns each: the data model
 * with semantic roles mapped, the template's mock structure, and its live
 * runtime render. Everything below the mini diagram uses real shared
 * assets (`lib/model-sources.ts`, `components/template-runtime.tsx`), not
 * hand-drawn mockups.
 */

const plant = modelSources.plant.model
const plantFields = plant.fields
const plantRecords = makeRecords(plantFields, modelSources.plant.records)
const sampleRecord = plantRecords[0]
const exampleTemplateValues: Template[] = [
  'role-chip',
  'row',
  'tile',
  'summary',
]
const exampleTemplates = exampleTemplateValues.map((value) =>
  templateCatalog.find((entry) => entry.value === value)!,
)

function LayerBlock({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  tone: 'neutral' | 'accent'
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border p-4 text-center shadow-sm ${
        tone === 'accent'
          ? 'border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/30'
          : 'border-border bg-card'
      }`}
    >
      <Icon
        className={`size-5 ${tone === 'accent' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-muted-foreground'}`}
      />
      <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-muted-foreground/50">
      <ArrowRight className="hidden size-5 sm:block" />
      <ArrowRight className="size-5 rotate-90 sm:hidden" />
    </div>
  )
}

function ColumnHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="mb-3 flex items-start gap-2 border-b pb-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <h2 className="text-sm font-semibold leading-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// One row per field: its label, semantic role chip, and its raw field type
// — deliberately no field id/name, since the point of this column is the
// role mapping, not the underlying schema.
function FieldRoleRow({ field }: { field: (typeof plantFields)[number] }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
      <span className="truncate font-medium">{field.label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {field.type}
        </span>
        <RoleChipTag role={field.semanticRole} compact />
      </div>
    </div>
  )
}

// The density ladder, straight from the same `templates` slot definitions
// the runtime uses (lib/rendering-contract.ts). Roles carried over from a
// leaner tier are dimmed; roles newly introduced at this tier are
// highlighted, so the "strict superset" claim is visible, not just stated.
function DensityLadder() {
  const seen = new Set<string>()
  return (
    <div className="flex flex-col gap-2">
      {densityTiers.map((tier, index) => {
        const roleEntries = Object.entries(tier.slots) as [
          string,
          number | 'all',
        ][]
        const rows = roleEntries.map(([role, cap]) => {
          const isNew = !seen.has(role)
          seen.add(role)
          return { role, cap, isNew }
        })
        return (
          <div
            key={tier.id}
            className="rounded-lg border bg-card p-2.5 text-xs"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                {index + 1}
              </span>
              <span className="font-semibold">{tier.label}</span>
              <span className="text-muted-foreground">{tier.description}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pl-7">
              {rows.map(({ role, cap, isNew }) => (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 rounded-full ${
                    isNew
                      ? 'ring-2 ring-fuchsia-400/70 ring-offset-1 ring-offset-card'
                      : 'opacity-45'
                  }`}
                  title={
                    isNew
                      ? 'New at this tier'
                      : 'Carried over from a leaner tier'
                  }
                >
                  <RoleChipTag
                    role={role as (typeof plantFields)[number]['semanticRole']}
                    compact
                  />
                  {(cap === 'all' || cap > 1) && (
                    <span className="pr-1.5 text-[10px] font-semibold text-muted-foreground">
                      ×{cap}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Every role that has a defined fallback chain: if the "preferred" role has
// no field mapped to it, resolution walks the chain instead of leaving the
// slot blank.
function FallbackChainList() {
  const chains = Object.entries(fallbackChains).filter(
    ([, chain]) => (chain?.length ?? 0) > 0,
  ) as [string, string[]][]
  return (
    <div className="flex flex-col gap-2">
      {chains.map(([role, chain]) => (
        <div
          key={role}
          className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-card p-2.5 text-xs"
        >
          <RoleChipTag
            role={role as (typeof plantFields)[number]['semanticRole']}
            compact
          />
          {chain.map((fallbackRole) => (
            <span key={fallbackRole} className="flex items-center gap-1.5">
              <ArrowRight className="size-3 text-muted-foreground/60" />
              <RoleChipTag
                role={
                  fallbackRole as (typeof plantFields)[number]['semanticRole']
                }
                compact
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function ArchitectureDiagram() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-3xl font-extrabold tracking-tight text-balance">
          Data objects and UI templates never reference each other directly.
        </p>
        <p className="mb-2 max-w-3xl text-sm text-muted-foreground">
          Normally, adding a new data object means hand-wiring it into every
          card/row/detail layout that should render it, and adding a new layout
          means touching every data object&apos;s mapping code. This codebase
          removes that N×M coupling with a fixed vocabulary of{' '}
          <span className="font-semibold text-foreground">
            26 semantic roles
          </span>{' '}
          (title, status, metric, temporal, people, and so on — see the{' '}
          <Link
            href="/roles"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Semantic Roles page
          </Link>{' '}
          for the full catalog). A field only ever declares{' '}
          <em>which role it plays</em> (&quot;this is the <code>title</code>
          &quot;); a template only ever declares <em>
            which roles it needs
          </em>{' '}
          to fill its slots. Neither side knows the other exists — swap the
          object, swap the template, and the mapping still resolves.
        </p>
        <p className="mb-8 max-w-3xl text-sm text-muted-foreground">
          Four mechanisms make that resolution actually work in practice, rather
          than just look nice as a diagram: templates request a slot{' '}
          <em>count</em>, not specific fields (a &quot;highlight&quot; slot
          capped at 3 shows however many highlight-role fields exist, up to 3);
          density tiers (micro → compact → standard → rich → full) are strict
          supersets, so a richer template never contradicts a leaner one, it
          only shows more; missing roles fall back along a defined chain (no{' '}
          <code>title</code>? fall back to <code>identifier</code>, then{' '}
          <code>objectType</code>) instead of leaving a blank slot; and a field
          marked <code>sensitivity</code>-masked can never be promoted to a hero
          position, even if a hero-promotion template would otherwise pick it.
        </p>

        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How the layers connect
          </h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <LayerBlock
              icon={Database}
              title="Data object"
              description="A schema's fields — e.g. plantType, capacity, owner"
              tone="neutral"
            />
            <FlowArrow />
            <LayerBlock
              icon={Shapes}
              title="Semantic roles"
              description="Each field is tagged with 1 of 26 fixed roles"
              tone="accent"
            />
            <FlowArrow />
            <LayerBlock
              icon={LayoutTemplate}
              title="UI templates"
              description="Each slot asks for a role + a max count, not a field"
              tone="neutral"
            />
            <FlowArrow />
            <LayerBlock
              icon={Sparkles}
              title="Runtime"
              description="Roles resolved, ranked, and rendered for one record"
              tone="neutral"
            />
          </div>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Density tiers are strict supersets
            </h2>
            <p className="mb-3 max-w-md text-sm text-muted-foreground">
              5 tiers, ordered leanest to richest. A role that appears at tier 1
              is still there at tier 5 — richer tiers only ever <em>add</em>{' '}
              roles, never drop or replace one.{' '}
              <span className="rounded bg-fuchsia-50 px-1 py-0.5 ring-1 ring-fuchsia-300 dark:bg-fuchsia-950/30">
                Highlighted
              </span>{' '}
              roles are new at that tier; faded roles were already resolved by a
              leaner one. A <code>×N</code> badge is that slot&apos;s cap —
              &quot;up to N fields with this role,&quot; not &quot;field
              N.&quot;
            </p>
            <DensityLadder />
          </div>

          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fallback chains: never a blank slot
            </h2>
            <p className="mb-3 max-w-md text-sm text-muted-foreground">
              If a data object has no field mapped to the preferred role,
              resolution walks the chain instead of rendering nothing. Every{' '}
              <code>plant</code>, <code>case</code>, or <code>policy</code>{' '}
              record can always show a title, because &quot;no{' '}
              <code>title</code>&quot; falls back to &quot;show the{' '}
              <code>identifier</code>&quot;, and failing that, the{' '}
              <code>objectType</code>.
            </p>
            <FallbackChainList />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Worked examples: the same field mapping, four density tiers
          </h2>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            The{' '}
            <span className="font-semibold text-foreground">{plant.name}</span>{' '}
            data model is mapped to its semantic roles exactly once (left).
            Every template on the right reads that same mapping — nothing is
            remapped per template. Role chip → List row → Tile card → Summary
            card is the actual density ladder, low to high: each step is a
            superset of the previous one&apos;s roles, so title/status never
            disappear going up a tier, they&apos;re just joined by more
            (highlights, progress, people, description...). The &quot;UI
            template&quot; column is the slot structure derived purely from
            roles; &quot;Runtime&quot; is the same component rendering one real
            record — compare them to see exactly which role landed in which
            slot.
          </p>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="min-w-0 rounded-xl border border-dashed p-3 lg:sticky lg:top-6">
              <ColumnHeader
                icon={Database}
                title="Data model with roles mapped"
                description={`Every ${plant.name} field → its semantic role`}
              />
              <div className="flex flex-col gap-1">
                {plantFields.map((field) => (
                  <FieldRoleRow key={field.name} field={field} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {exampleTemplates.map((tmpl) => {
                const Runtime = runtimeByTemplate[tmpl.value]
                return (
                  <div key={tmpl.value}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {tmpl.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl border border-dashed p-3">
                        <ColumnHeader
                          icon={LayoutTemplate}
                          title="UI template"
                          description={tmpl.description}
                        />
                        <TemplateSample
                          template={tmpl.value}
                          fields={plantFields}
                        />
                      </div>

                      <div className="min-w-0 rounded-xl border border-dashed p-3">
                        <ColumnHeader
                          icon={Sparkles}
                          title="Runtime"
                          description={`${sampleRecord.name} rendered live`}
                        />
                        <Runtime item={sampleRecord} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <p className="mt-8 rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          The role-chip colors above are the same ones used everywhere in this
          app — a field tagged <code>status</code> renders in the same hue on a
          list row, a tile, or a detail header. Beyond the 4 density tiers shown
          here plus Detail header (5 total, each a strict superset of the last),
          there are {templateCatalog.length - 5} more built-in templates: 6
          hero-promotion variants (KPI, Progress, Alert, Party, Timeline entry,
          Board — each the standard tier with one extra role promoted above the
          title) and a role-driven availability matrix that decides which
          collection views (Table, Grid, Calendar, Map, Chart...) a data object
          even qualifies for, based only on which roles it has mapped. See{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            /templates
          </code>{' '}
          for all of them, against any of the 10 sample data objects.
        </p>
      </div>
    </main>
  )
}
