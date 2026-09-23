'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Layers3,
  LayoutTemplate,
  Shapes,
  Sparkles,
} from 'lucide-react'
import {
  semanticRoles,
  roleDefinitions as contractRoleDefinitions,
  fallbackChains,
} from '@/lib/rendering-contract'
import type { Field, RawRecord } from '@/lib/rendering-contract'
import {
  RoleChipTag,
  TemplateMockPreview,
  TemplatePreviewSurface,
  makeRecords,
  runtimeByTemplate,
  templateCatalog,
  type Template,
} from '@/components/template-runtime'

/**
 * Reference views used by the "UI Templates" and "Semantic Roles" pages, and
 * by the Live Editor's preview toggle.
 */

export function TemplateInspector({
  template,
  inline = false,
}: {
  template: Template
  inline?: boolean
}) {
  const definition = templateCatalog.find((entry) => entry.value === template)!
  if (inline) {
    return (
      <span className="min-w-0 text-muted-foreground">
        <span className="font-semibold text-foreground">
          {definition.label}
        </span>{' '}
        · {definition.density} density — {definition.description}
      </span>
    )
  }
  return (
    <div className="text-xs text-foreground">
      <span className="font-semibold">
        {definition.label} · {definition.density} density
      </span>
      <p className="mt-0.5 text-muted-foreground">{definition.description}</p>
    </div>
  )
}

export function TemplateReference({
  fields,
  records,
  modelName,
}: {
  fields: Field[]
  records: RawRecord[]
  modelName: string
}) {
  const [mode, setMode] = useState<'mock' | 'runtime'>('mock')
  const sampleRecord =
    records.length > 0 ? makeRecords(fields, records)[0] : null
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">UI templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every rendering template, its semantic role slots, and a{' '}
            {mode === 'mock' ? 'mock structure' : 'live runtime render'} based
            on the {modelName} model.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              How the pieces fit together
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              Templates turn semantic roles into a usable view
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A semantic role explains what a value means, such as{' '}
              <code>title</code>, <code>status</code>, <code>owner</code>, or{' '}
              <code>progress</code>. A template defines where those roles appear
              and how much space they receive. This lets the same data model
              support different interfaces without coupling field names to a
              screen.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            <div className="rounded-xl border bg-muted/30 p-4">
              <Shapes className="size-5 text-primary" />
              <p className="mt-3 font-medium">Semantic roles</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Describe meaning and presentation hints, independent of the
                source field name.
              </p>
            </div>
            <ArrowRight className="hidden size-5 self-center text-muted-foreground md:block" />
            <div className="rounded-xl border bg-muted/30 p-4">
              <LayoutTemplate className="size-5 text-primary" />
              <p className="mt-3 font-medium">UI template</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Selects supported roles, slot limits, regions, and density for a
                particular interaction pattern.
              </p>
            </div>
            <ArrowRight className="hidden size-5 self-center text-muted-foreground md:block" />
            <div className="rounded-xl border bg-muted/30 p-4">
              <Layers3 className="size-5 text-primary" />
              <p className="mt-3 font-medium">View composition</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Combines templates into a page, list, board, detail view, or
                another product surface.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-accent-surface-border bg-accent-surface p-4 text-sm leading-relaxed text-accent-surface-foreground">
            <span className="font-semibold text-foreground">Example:</span>{' '}
            <span className="text-muted-foreground">
              a service request can use a compact row in a queue, a tile in a
              browse view, and a rich summary card in a dashboard. Each view
              uses the same semantic roles, while the template decides which
              fields to promote, omit, or group.
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/20 p-4 lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-card p-2 shadow-sm">
              <Layers3 className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Reading the template catalog</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Density describes the amount of information a template is
                designed to show. It is a default capacity, not a requirement to
                display every available field. Role rank, slot limits, and
                fallbacks determine the final selection.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {[
              ['Micro', 'single identity signal'],
              ['Compact', 'fast scanning'],
              ['Standard', 'balanced browsing'],
              ['Rich', 'more context'],
              ['Full', 'deep inspection'],
            ].map(([label, meaning]) => (
              <span
                key={label}
                className="rounded-full border bg-card px-2.5 py-1.5"
              >
                <strong className="text-foreground">{label}</strong> · {meaning}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <p className="text-sm font-semibold">Template showcase</p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Preview as
            </span>
            <button
              type="button"
              aria-pressed={mode === 'runtime'}
              aria-label="Toggle between template mock and real data"
              disabled={!sampleRecord}
              title={
                sampleRecord ? undefined : 'No sample records for this model'
              }
              onClick={() =>
                setMode((current) => (current === 'mock' ? 'runtime' : 'mock'))
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'runtime'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {mode === 'runtime' ? (
                <Sparkles className="size-3.5" />
              ) : (
                <LayoutTemplate className="size-3.5" />
              )}
              {mode === 'runtime' ? 'Real data' : 'Template mock'}
            </button>
          </div>
        </div>

        {templateCatalog.map((entry) => {
          const fieldsShown = fields.filter((field) =>
            entry.supportedRoles.includes(field.semanticRole),
          ).length
          const Runtime = runtimeByTemplate[entry.value]
          return (
            <div
              key={entry.value}
              className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="border-b p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{entry.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {entry.density}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {fieldsShown} of {fields.length} fields from {modelName}{' '}
                  render in this template.
                </p>
              </div>
              {mode === 'mock' || !sampleRecord ? (
                <TemplateMockPreview
                  template={entry.value}
                  fields={fields}
                  className="flex-1 rounded-b-2xl"
                />
              ) : (
                <TemplatePreviewSurface
                  className="flex flex-1 items-center justify-center rounded-b-2xl"
                  contentClassName={
                    entry.value === 'tile' || entry.value === 'detail-header'
                      ? 'max-w-sm'
                      : 'w-full'
                  }
                >
                  {entry.value === 'row' || entry.value === 'summary' ? (
                    <div className="overflow-hidden rounded-xl border bg-card">
                      <Runtime item={sampleRecord} />
                    </div>
                  ) : (
                    <Runtime item={sampleRecord} />
                  )}
                </TemplatePreviewSurface>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SemanticRoleReference() {
  return (
    <div>
      <header className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          Semantic contract
        </p>
        <h2 className="text-2xl font-bold tracking-tight">Semantic roles</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A semantic role describes what a field means, not what it is called.
          For example, <code>referenceCode</code> can have the{' '}
          <code>identifier</code> role and <code>updatedAt</code> can have the{' '}
          <code>temporal</code> role.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Clients use the same role vocabulary to choose, rank, and present
          fields. This keeps data models independent from screens, APIs, search,
          and AI responses.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Legend</span>
        <span className="rounded-full border bg-card px-2 py-1">
          <strong className="text-foreground">Singleton</strong> · one value
        </span>
        <span className="rounded-full border bg-card px-2 py-1">
          <strong className="text-foreground">Format hint</strong> · default
          presentation
        </span>
        <span className="rounded-full border bg-card px-2 py-1">
          <strong className="text-foreground">Fallback</strong> · used when a
          role is missing
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="hidden grid-cols-[minmax(150px,0.8fr)_minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)] gap-4 border-b bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Role</span>
          <span>Meaning</span>
          <span>Format hint</span>
          <span>Resolution rule</span>
        </div>
        {semanticRoles.map((role) => {
          const info = contractRoleDefinitions[role]
          const chain = fallbackChains[role]
          return (
            <div
              className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[minmax(150px,0.8fr)_minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)] md:items-center md:gap-4"
              key={role}
            >
              <div className="flex items-center justify-between gap-2">
                <RoleChipTag role={role} />
                {info.singleton && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Singleton
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {info.definition}
              </p>
              <p className="text-sm text-muted-foreground">
                {info.representation}
              </p>
              <p className="text-sm text-muted-foreground">
                {chain && chain.length > 0 ? (
                  <>
                    <span className="font-medium text-foreground">
                      Fallback:
                    </span>{' '}
                    {chain
                      .map(
                        (fallbackRole) =>
                          contractRoleDefinitions[fallbackRole].label,
                      )
                      .join(' then ')}
                  </>
                ) : (
                  'Uses the mapped value directly.'
                )}
              </p>
              <div className="text-xs text-muted-foreground md:hidden">
                <span className="font-medium text-foreground">Format:</span>{' '}
                {info.representation}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
