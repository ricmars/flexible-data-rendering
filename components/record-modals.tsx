'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import salesPeople from '@/data/sales-people.json'
import { Button } from '@/components/ui/button'
import type { Model } from '@/lib/model-sources'
import { modelSources } from '@/lib/model-sources'
import {
  roleDefinitions as contractRoleDefinitions,
  type RawRecord,
} from '@/lib/rendering-contract'
import {
  RoleChipTag,
  SafeImage,
  formatMetric,
  resolveTemplateSlots,
  templateCatalog,
  type RecordItem,
  type Template,
} from '@/components/template-runtime'

/**
 * Page-level modals for the Live Editor view: record detail, operator
 * lookup, raw JSON, and the per-record template slot breakdown.
 */

export function Detail({
  item,
  model,
  onClose,
}: {
  item: RecordItem
  model: Model
  onClose: () => void
}) {
  const metric = model.fields.find((field) => field.semanticRole === 'metric')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name} details`}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="relative aspect-[2/1] bg-muted">
          <SafeImage
            src={item.image}
            alt={item.name}
            width={1200}
            height={600}
            className="size-full object-cover"
          />
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute right-3 top-3 rounded-full bg-card/90 p-2 shadow"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {model.name} details
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{item.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.subtitle} · {item.location}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">
                {metric?.label ?? 'Value'}
              </p>
              <p className="mt-1 font-semibold">
                {metric ? formatMetric(item.price, metric) : item.price}
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 font-semibold">{item.status}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="mt-1 font-semibold">{model.industry}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}

export function OperatorPopover({
  name,
  fieldLabel,
  anchorRect,
  onClose,
}: {
  name: string
  fieldLabel: string
  anchorRect: DOMRect
  onClose: () => void
}) {
  const operator = (salesPeople as RawRecord[]).find(
    (record) => record.fullName === name,
  )
  const details: Array<[string, string]> = operator
    ? [
        ['Role', String(operator.role)],
        ['Territory', String(operator.territory)],
        ['Status', String(operator.status)],
        ['Reference', String(operator.referenceCode)],
      ]
    : []
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
  })

  // Anchor the popover just below the clicked avatar/pill, then nudge it
  // back on-screen (or flip above the trigger) once its real size is known.
  useLayoutEffect(() => {
    const node = popoverRef.current
    if (!node) return
    const { width, height } = node.getBoundingClientRect()
    const margin = 12
    let top = anchorRect.bottom + 8
    let left = anchorRect.left
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - width)
    }
    if (top + height > window.innerHeight - margin) {
      top = anchorRect.top - height - 8
    }
    top = Math.max(margin, top)
    setPosition({ top, left })
  }, [anchorRect])

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        ref={popoverRef}
        className="fixed w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 text-left shadow-2xl"
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-label={`${name} operator details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {fieldLabel}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close operator details"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        {operator ? (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {String(operator.bio)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Operator details are not available for this record.
          </p>
        )}
      </div>
    </div>
  )
}

export function JsonModal({
  item,
  model,
  onClose,
}: {
  item: RecordItem
  model: Model
  onClose: () => void
}) {
  const raw = modelSources[model.id]?.records.find(
    (record) => record.id === item.id,
  )
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute left-1/2 top-1/2 flex max-h-[80vh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} JSON record`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {model.name} record
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close JSON view"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <pre className="overflow-auto p-4 text-xs leading-relaxed">
          <code>{JSON.stringify(raw ?? { id: item.id }, null, 2)}</code>
        </pre>
      </div>
    </div>
  )
}

export function TemplateModal({
  item,
  template,
  onClose,
}: {
  item: RecordItem
  template: Template
  onClose: () => void
}) {
  const definition = templateCatalog.find((entry) => entry.value === template)!
  const selection = resolveTemplateSlots(item, template)
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute left-1/2 top-1/2 flex max-h-[80vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`${definition.label} template for ${item.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {definition.density} density · {item.name}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{definition.label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {definition.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close template details"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="flex flex-wrap gap-1.5">
            {definition.supportedRoles.map((role) => (
              <RoleChipTag key={role} role={role} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {definition.supportedRoles.map((role) => {
              const entries = selection.byRole[role] ?? []
              return (
                <div
                  key={role}
                  className={`semantic-region-${role} rounded-lg border bg-muted/40 p-3`}
                >
                  <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{contractRoleDefinitions[role].label}</span>
                    <span>
                      {entries.length > 0
                        ? `${entries.length} value${entries.length === 1 ? '' : 's'}`
                        : 'empty'}
                    </span>
                  </p>
                  {entries.length > 0 ? (
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {entries.map((entry) => (
                        <li
                          key={entry.field.name}
                          className="flex justify-between gap-3"
                        >
                          <span className="text-muted-foreground">
                            {entry.field.label}
                          </span>
                          <span className="max-w-[60%] truncate text-right font-medium">
                            {String(entry.displayValue)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground/70">
                      No field resolves to this slot for this record.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
