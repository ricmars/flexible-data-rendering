'use client'

import Link from 'next/link'
import { useState } from 'react'
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
 * Architecture page: an article-style proposal for the semantic role
 * contract, aimed at both executives and architects. It walks through the
 * problem statement, proposed solution, reference architecture, semantic
 * contract schema, an AI/cross-client use case, constraints (density tiers
 * and fallback chains), and worked examples for four per-record templates
 * (Role chip, List row, Tile card, Summary card) rendered for one real
 * data object ("Manufacturing plant") as three columns each: the data
 * model with semantic roles mapped, the template's mock structure, and its
 * live runtime render. Everything on this page uses real shared assets
 * (`lib/model-sources.ts`, `components/template-runtime.tsx`), not
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
          ? 'border-accent-surface-border bg-accent-surface'
          : 'border-border bg-card'
      }`}
    >
      <Icon
        className={`size-5 ${tone === 'accent' ? 'text-primary' : 'text-muted-foreground'}`}
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
// deliberately no field id/name, since the point of this column is the
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
  const [showExamples, setShowExamples] = useState(true)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <header className="mb-8 max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Architecture proposal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            One semantic contract for every client
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A data model should not dictate how every screen, API, search
            result, or AI response is assembled. A shared semantic layer lets
            each client select the fields that matter for its task.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Executive summary
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            Move from field names to shared meaning
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            A field such as <code>updatedAt</code> has a technical name, but
            clients need to know that it represents a temporal value used for
            recency. A field such as <code>referenceCode</code> is an identifier
            that can be copied, searched, or used to find a record. Semantic
            roles make that meaning explicit once and make it available to every
            consumer.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              [
                'Business outcome',
                'Consistent experiences without custom mapping work in every client.',
              ],
              [
                'Architecture outcome',
                'A stable contract between data models and consuming applications.',
              ],
              [
                'AI outcome',
                'Relevant answers based on field meaning instead of raw payload order.',
              ],
            ].map(([label, text]) => (
              <div key={label} className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Problem statement
            </p>
            <h2 className="text-xl font-bold tracking-tight">
              Clients repeat the same decisions
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">UI teams</strong> map fields
                to cards, tables, and detail screens independently.
              </li>
              <li>
                <strong className="text-foreground">
                  API and search teams
                </strong>{' '}
                decide which fields to return using endpoint-specific rules.
              </li>
              <li>
                <strong className="text-foreground">AI assistants</strong> may
                expose too much data or choose fields based on naming and
                payload order.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-accent-surface-border bg-accent-surface p-6 text-accent-surface-foreground shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-80">
              Proposed solution
            </p>
            <h2 className="text-xl font-bold tracking-tight">
              Add a semantic role layer
            </h2>
            <p className="mt-4 text-sm leading-relaxed opacity-90">
              Each field declares a business meaning, such as <code>title</code>
              , <code>status</code>, <code>metric</code>, or <code>owner</code>.
              Clients request those meanings and receive ranked, format-aware
              values. The data model and the client remain independent.
            </p>
            <p className="mt-4 text-sm leading-relaxed opacity-90">
              Review the{' '}
              <Link
                href="/roles"
                className="font-medium underline underline-offset-2 hover:opacity-80"
              >
                Semantic Roles catalog
              </Link>{' '}
              and the{' '}
              <Link
                href="/templates"
                className="font-medium underline underline-offset-2 hover:opacity-80"
              >
                UI Templates catalog
              </Link>{' '}
              to see the contract in action.
            </p>
          </div>
        </section>

        <aside className="mb-10 overflow-hidden rounded-2xl border-2 border-accent-surface-border bg-accent-surface shadow-sm">
          <div className="flex gap-4 p-5 sm:p-6">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Semantic roles can power AI answers, not just UI layouts
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                Semantic roles give every client a shared understanding of what
                each field means and how important it is. An AI Assistant can
                use that layer to select the few relevant fields for an answer
                instead of guessing from raw field names, dumping the whole
                record, or choosing a view at random. The same approach can
                guide search, APIs, mobile clients, automation, and reports:
                each client can decide what to show based on meaning rather than
                bespoke knowledge of every data model.
              </p>
              <blockquote className="mt-4 rounded-xl border border-primary/20 bg-background/80 p-3 text-sm shadow-sm">
                <p className="font-medium text-foreground">
                  &quot;What needs attention at the North Plant?&quot;
                </p>
                <p className="mt-1 text-muted-foreground">
                  The Assistant can prioritize the <code>status</code>,{' '}
                  <code>priority</code>, <code>flags</code>,{' '}
                  <code>nextAction</code>, and <code>owner</code> roles, then
                  answer with the relevant facts without exposing unrelated sort
                  keys, internal annotations, or every field in the record.
                </p>
              </blockquote>
            </div>
          </div>
        </aside>

        <section className="mb-10 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reference architecture
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            One contract, many client experiences
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            The semantic layer is a shared decision point. It does not replace
            the data model or the client. It describes what a field means, how
            it should be presented, and whether it is safe to use.
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <LayerBlock
              icon={Database}
              title="Data model"
              description="Fields such as plantType, capacity, and owner"
              tone="neutral"
            />
            <FlowArrow />
            <LayerBlock
              icon={Shapes}
              title="Semantic contract"
              description="Each field gets a shared business role"
              tone="accent"
            />
            <FlowArrow />
            <LayerBlock
              icon={LayoutTemplate}
              title="Client request"
              description="A screen, API, search, or assistant asks for roles"
              tone="neutral"
            />
            <FlowArrow />
            <LayerBlock
              icon={Sparkles}
              title="Selected response"
              description="Values are ranked, formatted, and policy-aware"
              tone="neutral"
            />
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Semantic contract
            </p>
            <h2 className="text-xl font-bold tracking-tight">
              What a field declares
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The role is the primary meaning. Supporting metadata controls
              ranking, format, sensitivity, and relationships to other fields.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                [
                  'Role',
                  'What the value means, such as title, status, or owner.',
                ],
                [
                  'Rank',
                  'Which value should be preferred when several share a role.',
                ],
                [
                  'Format hint',
                  'The default presentation, such as code, date, percent, or file reference. A template can override it when needed.',
                ],
                [
                  'Policy',
                  'Whether the value is public, masked, searchable, or safe for promotion.',
                ],
                [
                  'Qualifier',
                  'Distinguishes fields that share a role. For example, temporal fields can use due, updated, or created so a client can select the date that fits its task.',
                ],
                [
                  'Derived-value sources',
                  'trendSource names a sibling field with a metric’s prior value; stageOfSource names the denominator for a stage-format progress field. The resolver derives the trend delta or progress percentage centrally.',
                ],
              ].map(([label, text]) => (
                <div key={label} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/50 p-6 text-foreground shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Example declaration
            </p>
            <pre className="overflow-x-auto text-xs leading-relaxed">
              <code>{`{
  "name": "referenceCode",
  "semanticRole": "identifier",
  "format": "code",
  "rank": 1,
  "sensitivity": "public"
}`}</code>
            </pre>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A UI can render this as copyable code. An API can use it as a
              stable identifier. An assistant can include it when the user asks
              how to find or reference the record. The <code>code</code> value
              is a default hint, not a hard rule. A template can override the
              hint when its context requires a different presentation.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Qualifiers and source references are optional field metadata. For
              example, a temporal field can declare{' '}
              <code>&quot;qualifier&quot;: &quot;due&quot;</code> (rather than{' '}
              <code>&quot;updated&quot;</code>) to identify its purpose. A
              metric can declare{' '}
              <code>
                &quot;trendSource&quot;: &quot;previousMetricValue&quot;
              </code>{' '}
              to reference a sibling field; the resolver uses that prior value
              to calculate its percentage trend. Stage-based progress can
              similarly reference its denominator with{' '}
              <code>stageOfSource</code>.
            </p>
          </div>
        </section>

        <section className="mb-10 overflow-hidden rounded-xl border bg-card shadow-sm">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-muted/20"
            aria-expanded={showExamples}
            onClick={() => setShowExamples((visible) => !visible)}
          >
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Worked examples: the same field mapping, four density tiers
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Compare one real data model with its mock templates and live
                runtime output, or{' '}
                <Link
                  href="/editor"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                  onClick={(event) => event.stopPropagation()}
                >
                  open the live Editor
                </Link>{' '}
                to play with the mappings yourself.
              </span>
            </span>
            <ArrowRight
              className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${
                showExamples ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {showExamples && (
            <div className="border-t px-4 pb-4 pt-4 sm:px-5">
              <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                The{' '}
                <span className="font-semibold text-foreground">
                  {plant.name}
                </span>{' '}
                data model is mapped to its semantic roles once, on the left.
                Every template on the right reads the same mapping. The examples
                move from a small role chip to a list row, tile card, and
                summary card. Each step adds more information while keeping the
                earlier roles. The UI template shows the requested slots, and
                Runtime shows the same record with real data.
              </p>

              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="min-w-0 rounded-xl border border-dashed p-3 lg:sticky lg:top-6">
                  <ColumnHeader
                    icon={Database}
                    title="Data model with roles mapped"
                    description={`Every ${plant.name} field and its semantic role`}
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
            </div>
          )}
        </section>

        <section className="mb-10 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Constraints and resolution
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            Rules that keep the contract predictable
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Clients should not need to rebuild selection logic. Density controls
            how much information is requested. Fallbacks keep required slots
            useful when a preferred role is missing.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-5">
              <h3 className="text-lg font-semibold">Density tiers</h3>
              <p className="mt-2 mb-4 text-sm leading-relaxed text-muted-foreground">
                Five tiers move from compact to detailed. A role shown in an
                earlier tier remains available in richer tiers. Highlighted
                roles are new at that tier. A <code>×N</code> badge means the
                tier can show up to N fields with that role.
              </p>
              <DensityLadder />
            </div>
            <div className="rounded-xl border bg-muted/30 p-5">
              <h3 className="text-lg font-semibold">Fallback chains</h3>
              <p className="mt-2 mb-4 text-sm leading-relaxed text-muted-foreground">
                If the preferred role is missing, the runtime uses the next
                useful role. For example, <code>title</code> can use{' '}
                <code>identifier</code>, then <code>objectType</code>. This
                keeps the interface useful instead of leaving an empty slot.
              </p>
              <FallbackChainList />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            References and next steps
          </p>
          <h2 className="text-xl font-bold tracking-tight">
            Apply the contract across the product
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Review the{' '}
            <Link
              href="/roles"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              Semantic Roles
            </Link>{' '}
            catalog, compare the{' '}
            <Link
              href="/templates"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              UI Templates
            </Link>
            , and use the{' '}
            <Link
              href="/editor"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              live Editor
            </Link>{' '}
            to explore how one semantic mapping supports different client
            experiences. The same contract can drive API projections, search
            ranking, assistant responses, and automation.
          </p>
        </section>
      </div>
    </main>
  )
}
