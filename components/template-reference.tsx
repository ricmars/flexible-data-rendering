'use client'

import { useState } from 'react'
import { Layout, Sparkles } from 'lucide-react'
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
 * by the Editor live-preview toggle.
 */

export function TemplateInspector({ template }: { template: Template }) {
  const definition = templateCatalog.find((entry) => entry.value === template)!
  return (
    <div className="text-xs text-foreground">
      <span className="font-semibold">
        {definition.label} · {definition.density} density
      </span>
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
        <div
          role="group"
          aria-label="Preview mode"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border bg-card p-1 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setMode('mock')}
            aria-pressed={mode === 'mock'}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              mode === 'mock'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Layout className="size-3.5" />
            Template mock
          </button>
          <button
            type="button"
            onClick={() => setMode('runtime')}
            aria-pressed={mode === 'runtime'}
            disabled={!sampleRecord}
            title={
              sampleRecord ? undefined : 'No sample records for this model'
            }
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              mode === 'runtime'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="size-3.5" />
            Real content
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
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

export function SemanticRoleReference({
  fields,
  modelName,
}: {
  fields: Field[]
  modelName: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Semantic roles</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        A UI template never asks a data object for a field by name — it asks for
        a <em>role</em>. A role is a fixed, well-known meaning (&quot;this is
        the title&quot;, &quot;this is a status&quot;) that any field on any
        data object can be tagged with. That indirection is what lets the same
        11 built-in templates render 10 unrelated data objects (plants, cases,
        policies, vehicles...) without a single template being aware any of them
        exist: it solves the N×M coupling problem where every new object would
        otherwise need bespoke code in every template, and every new template
        would need bespoke code for every object.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        There are exactly{' '}
        <span className="font-semibold text-foreground">
          {semanticRoles.length} roles
        </span>{' '}
        — not an open vocabulary — so every template can be written once against
        a closed, known set.{' '}
        <span className="font-semibold text-foreground">Singleton</span> roles
        (below) can only ever resolve to one field per record (a record has one
        title, not several); the rest are repeatable, subject to the slot cap a
        given template requests. A handful of roles also have a{' '}
        <span className="font-semibold text-foreground">fallback chain</span>:
        if no field is tagged with the preferred role, resolution walks the
        chain instead of leaving that slot blank (see the fallback list on the
        Architecture page).
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Below, each role also shows how many {modelName} fields currently use
        it, and which built-in templates have a slot for it.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {semanticRoles.map((role) => {
          const info = contractRoleDefinitions[role]
          const count = fields.filter(
            (field) => field.semanticRole === role,
          ).length
          const chain = fallbackChains[role]
          const supportingTemplates = templateCatalog.filter((entry) =>
            entry.supportedRoles.includes(role),
          )
          return (
            <div
              className="flex h-full flex-col rounded-xl border bg-card p-4"
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
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {info.definition}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Format hint:
                </span>{' '}
                {info.representation}
              </p>
              {chain && chain.length > 0 && (
                <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Falls back to:
                  </span>
                  {chain
                    .map(
                      (fallbackRole) =>
                        contractRoleDefinitions[fallbackRole].label,
                    )
                    .join(' → ')}
                </p>
              )}
              <div className="mt-3 flex flex-1 flex-col justify-end gap-1 border-t pt-2 text-[11px] text-muted-foreground/80">
                <p>
                  <span className="font-bold text-foreground">{count}</span>{' '}
                  field{count === 1 ? '' : 's'} in {modelName}
                </p>
                <p>
                  Used by{' '}
                  <span className="font-bold text-foreground">
                    {supportingTemplates.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-foreground">
                    {templateCatalog.length}
                  </span>{' '}
                  templates
                  {supportingTemplates.length > 0 && (
                    <>: {supportingTemplates.map((t) => t.label).join(', ')}</>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
