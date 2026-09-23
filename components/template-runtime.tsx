'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  Braces,
  Check,
  ChevronRight,
  Clipboard,
  ClipboardX,
  ClockAlert,
  LayoutTemplate,
  LockKeyhole,
  MoreHorizontal,
  Paperclip,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  roleDefinitions as contractRoleDefinitions,
  type Density,
  type Field,
  type RawRecord,
  type ResolvedField,
  type ResolvedRecord,
  type SemanticRole,
  type SlotCap,
} from '@/lib/rendering-contract'
import { resolveCollection, selectSlots, pickHero } from '@/lib/resolve-record'
import { Button } from '@/components/ui/button'

/**
 * Reusable rendering building blocks shared by every page (Editor, UI
 * Templates, Semantic Roles, Architecture). Nothing in this file depends on
 * page-level state (search, pagination, modals) — every export is a pure
 * function or a self-contained component so it can be dropped into any page
 * without wiring up the whole workbench.
 */

export type Template =
  | 'role-chip'
  | 'row'
  | 'tile'
  | 'summary'
  | 'detail-header'
  | 'kpi-card'
  | 'progress-card'
  | 'alert-card'
  | 'party-card'
  | 'timeline-entry'
  | 'board-card'

/** The six promotion variants are the standard tier with one role promoted to hero. */
export const promotionTemplates: Template[] = [
  'kpi-card',
  'progress-card',
  'alert-card',
  'party-card',
  'timeline-entry',
  'board-card',
]

export type RecordItem = ResolvedRecord & {
  name: string
  subtitle: string
  image: string
  price: number
  location: string
  status: string
  tags: string[]
  description: string
  date: string
  available: boolean
}

export type TemplateCatalogEntry = {
  value: Template
  label: string
  description: string
  density: Density
  supportedRoles: SemanticRole[]
  slots: Partial<Record<SemanticRole, SlotCap>>
  regions: string[]
  /** The role promoted above title; only set on the six promotion variants. */
  hero?: SemanticRole
}

export const templateCatalog: TemplateCatalogEntry[] = [
  {
    value: 'role-chip',
    label: 'Role chip',
    description: 'Single-line identity token',
    density: 'micro',
    supportedRoles: ['media', 'title', 'status'],
    slots: { media: 1, title: 1, status: 1 },
    regions: ['Media', 'Title', 'Status'],
  },
  {
    value: 'row',
    label: 'List row',
    description: 'Dense operational row',
    density: 'compact',
    supportedRoles: [
      'media',
      'title',
      'subtitle',
      'identifier',
      'status',
      'flags',
      'metric',
      'people',
      'action',
    ],
    slots: {
      media: 1,
      title: 1,
      subtitle: 1,
      identifier: 1,
      status: 1,
      flags: 'all',
      metric: 1,
      people: 3,
      action: 1,
    },
    regions: [
      'Media',
      'Identity',
      'Status',
      'Flags',
      'Metric',
      'People',
      'Action',
    ],
      },
  {
    value: 'tile',
    label: 'Tile card',
    description: 'Browseable visual tile',
    density: 'standard',
    supportedRoles: [
      'media',
      'objectType',
      'title',
      'subtitle',
      'status',
      'flags',
      'highlight',
      'tags',
      'progress',
    ],
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 1,
      status: 1,
      flags: 'all',
      highlight: 2,
      tags: 2,
      progress: 1,
    },
    regions: ['Media', 'Identity', 'Status', 'Highlights', 'Tags', 'Progress'],
      },
  {
    value: 'summary',
    label: 'Summary card',
    description: 'Comprehension without navigation',
    density: 'rich',
    supportedRoles: [
      'media',
      'objectType',
      'title',
      'subtitle',
      'identifier',
      'status',
      'priority',
      'flags',
      'tags',
      'highlight',
      'progress',
      'description',
      'temporal',
      'people',
      'relation',
      'action',
    ],
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 2,
      identifier: 1,
      status: 1,
      priority: 1,
      flags: 'all',
      tags: 3,
      highlight: 3,
      progress: 1,
      description: 1,
      temporal: 1,
      people: 3,
      relation: 2,
      action: 2,
    },
    regions: [
      'Entity',
      'Status and tags',
      'Primary metric',
      'Highlights',
      'Progress',
      'Time and actor',
      'Actions',
    ],
      },
  {
    value: 'detail-header',
    label: 'Details',
    description: 'Full record identity header',
    density: 'full',
    supportedRoles: [
      'media',
      'objectType',
      'title',
      'subtitle',
      'identifier',
      'status',
      'priority',
      'progress',
      'flags',
      'tags',
      'highlight',
      'metric',
      'temporal',
      'people',
      'location',
      'description',
      'annotation',
      'relation',
      'attachment',
      'secondary',
      'action',
    ],
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 1,
      identifier: 1,
      status: 1,
      priority: 1,
      progress: 1,
      flags: 'all',
      tags: 5,
      highlight: 4,
      metric: 2,
      temporal: 2,
      people: 3,
      location: 1,
      description: 1,
      annotation: 1,
      relation: 3,
      attachment: 'all',
      secondary: 4,
      action: 3,
    },
    regions: ['Identity', 'Status', 'Highlights', 'Metrics', 'Narrative', 'Actions'],
      },
  {
    value: 'kpi-card',
    label: 'KPI card',
    description: 'Metric walls, exec summaries, rollup tiles',
    density: 'standard',
    hero: 'metric',
    supportedRoles: ['metric', 'title', 'status', 'temporal'],
    slots: { metric: 2, title: 1, status: 1, temporal: 1 },
    regions: ['Metric hero', 'Title', 'Status', 'Updated'],
      },
  {
    value: 'progress-card',
    label: 'Progress card',
    description: 'Case worklists, onboarding trackers, SLA monitors',
    density: 'standard',
    hero: 'progress',
    supportedRoles: [
      'progress',
      'title',
      'subtitle',
      'identifier',
      'status',
      'temporal',
      'people',
      'action',
    ],
    slots: {
      progress: 1,
      title: 1,
      subtitle: 2,
      identifier: 1,
      status: 1,
      temporal: 1,
      people: 3,
      action: 3,
    },
    regions: ['Progress hero', 'Identity', 'Status', 'Due', 'People', 'Action'],
      },
  {
    value: 'alert-card',
    label: 'Alert card',
    description: 'Exception queues, SLA breach notices, validation panels',
    density: 'standard',
    hero: 'flags',
    supportedRoles: [
      'flags',
      'priority',
      'title',
      'identifier',
      'temporal',
      'description',
      'action',
    ],
    slots: {
      flags: 'all',
      priority: 1,
      title: 1,
      identifier: 1,
      temporal: 1,
      description: 1,
      action: 2,
    },
    regions: ['Flag hero', 'Priority', 'Title', 'Due', 'Description', 'Action'],
      },
  {
    value: 'party-card',
    label: 'Party card',
    description: 'Contact directories, assignee pickers, org views',
    density: 'standard',
    hero: 'media',
    supportedRoles: [
      'media',
      'title',
      'subtitle',
      'status',
      'flags',
      'highlight',
      'tags',
      'action',
    ],
    slots: {
      media: 1,
      title: 1,
      subtitle: 2,
      status: 1,
      flags: 'all',
      highlight: 2,
      tags: 'all',
      action: 2,
    },
    regions: [
      'Media hero',
      'Identity',
      'Status',
      'Highlights',
      'Tags',
      'Action',
    ],
      },
  {
    value: 'timeline-entry',
    label: 'Timeline entry',
    description: 'Audit trails, activity feeds, case history',
    density: 'standard',
    hero: 'temporal',
    supportedRoles: [
      'temporal',
      'title',
      'status',
      'description',
      'people',
      'relation',
      'attachment',
    ],
    slots: {
      temporal: 1,
      title: 1,
      status: 1,
      description: 1,
      people: 3,
      relation: 3,
      attachment: 1,
    },
    regions: [
      'Time hero',
      'Title',
      'Status',
      'Description',
      'People',
      'Relations',
      'Attachments',
    ],
      },
  {
    value: 'board-card',
    label: 'Board card',
    description: 'Kanban columns, swimlanes, pipeline stages',
    density: 'standard',
    hero: 'groupKey',
    supportedRoles: [
      'groupKey',
      'title',
      'identifier',
      'priority',
      'flags',
      'tags',
      'progress',
      'temporal',
      'people',
    ],
    slots: {
      groupKey: 1,
      title: 1,
      identifier: 1,
      priority: 1,
      flags: 'all',
      tags: 'all',
      progress: 1,
      temporal: 1,
      people: 3,
    },
    regions: ['Group hero', 'Title', 'Priority', 'Tags', 'Progress', 'People'],
      },
]

export function resolveTemplateSlots(item: ResolvedRecord, template: Template) {
  const definition = templateCatalog.find((entry) => entry.value === template)
  return selectSlots(item, {
    id: template,
    label: definition?.label ?? template,
    description: definition?.description ?? '',
    density: definition?.density ?? 'standard',
    slots: Object.fromEntries(
      (definition?.supportedRoles ?? []).map((role) => [
        role,
        definition?.slots[role] ?? 0,
      ]),
    ),
  })
}

export function makeRecords(
  fields: Field[],
  records: RawRecord[],
): RecordItem[] {
  return resolveCollection(fields, records).map((resolved) => {
    const valueFor = (role: SemanticRole) =>
      resolved.byRole[role]?.[0]?.displayValue
    const valuesFor = (role: SemanticRole) => resolved.byRole[role] ?? []
    const status = valueFor('status')
    const metric = valueFor('metric')
    const temporal = valueFor('temporal')
    return {
      ...resolved,
      name: String(valueFor('title') ?? 'Untitled record'),
      subtitle: String(valueFor('subtitle') ?? ''),
      image: String(valueFor('media') ?? ''),
      price: Number(metric ?? 0),
      location: String(valueFor('highlight') ?? ''),
      status: String(status ?? 'Active'),
      tags: valuesFor('tags').flatMap((entry) =>
        Array.isArray(entry.displayValue)
          ? entry.displayValue.map(String)
          : entry.displayValue == null
            ? []
            : [String(entry.displayValue)],
      ),
      description: String(valueFor('description') ?? ''),
      date: String(temporal ?? ''),
      available: status === 'Available',
    }
  })
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value)

export const formatMetric = (value: number, field: Field) =>
  field.type === 'currency'
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : formatNumber(value)

export function formatFieldValue(entry: ResolvedField) {
  if (entry.masked) return String(entry.displayValue)

  const value = entry.displayValue
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.map(String).join(', ')

  if (entry.field.format === 'percent') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? `${numeric}%` : String(value)
  }

  if (entry.field.format === 'datetime' || entry.field.type === 'date') {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: entry.field.format === 'datetime' ? 'short' : undefined,
      }).format(date)
    }
  }

  if (entry.field.format === 'fileRef') {
    const count = Number(value)
    if (Number.isFinite(count))
      return `${count} ${count === 1 ? 'file' : 'files'}`
  }

  if (entry.field.type === 'number' || entry.field.type === 'currency') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return formatMetric(numeric, entry.field)
  }

  if (entry.field.type === 'boolean') return value === true ? 'Yes' : 'No'
  return String(value)
}

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export function SafeImage({
  alt,
  ...props
}: React.ComponentProps<typeof Image>) {
  const [failedSource, setFailedSource] = useState<
    React.ComponentProps<typeof Image>['src'] | null
  >(null)

  if (!props.src || failedSource === props.src) return null

  return (
    <Image {...props} alt={alt} onError={() => setFailedSource(props.src)} />
  )
}

const flagDescriptions: Record<string, string> = {
  overdue: 'The due date has passed and the item is still active.',
  locked: 'Editing is restricted until the item is unlocked.',
  escalated: 'This item needs priority handling or review.',
  confidential: 'This item contains information with restricted visibility.',
  new: 'This item was recently created or added.',
}

function flagLabel(entry: ResolvedField) {
  const name = entry.field.name.split('.').pop()?.toLowerCase() ?? ''
  if (name in flagDescriptions) return name[0].toUpperCase() + name.slice(1)
  return entry.field.label
}

export function FlagIndicator({
  entry,
  dense = false,
}: {
  entry: ResolvedField
  dense?: boolean
}) {
  const name = entry.field.name.split('.').pop()?.toLowerCase() ?? ''
  const label = flagLabel(entry)
  const description = flagDescriptions[name] ?? `${label} is active.`
  const Icon =
    name === 'overdue'
      ? ClockAlert
      : name === 'locked'
        ? LockKeyhole
        : name === 'confidential'
          ? ShieldAlert
          : name === 'new'
            ? Sparkles
            : AlertTriangle

  return (
    <span
      title={`${label}: ${description}`}
      aria-label={`${label}: ${description}`}
      className={`inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground ${dense ? 'px-1.5' : ''}`}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={dense ? 'sr-only' : undefined}>{label}</span>
    </span>
  )
}

/**
 * Status shown as a colored dot + label pill, consistent across every
 * template that surfaces a status value.
 */
export function StatusPill({
  entry,
  className = '',
}: {
  entry: ResolvedField
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {String(entry.displayValue)}
    </span>
  )
}

/**
 * Flattens one or more `tags` field entries into a list of chips, capping
 * how many are shown and collapsing the remainder into a single "+N" chip
 * so a tags field with many values doesn't blow out card layouts.
 */
export function TagList({
  entries,
  max = 3,
  className = '',
}: {
  entries: ResolvedField[]
  max?: number
  className?: string
}) {
  const all = entries.flatMap((entry) =>
    Array.isArray(entry.displayValue)
      ? entry.displayValue.map(String)
      : [String(entry.displayValue ?? '')],
  )
  if (all.length === 0) return null
  const visible = all.slice(0, max)
  const overflow = all.length - visible.length
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visible.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="rounded-md border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground"
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}

/**
 * Renders `action` role values as a single primary button, an optional
 * secondary (outline) button, and — for any further actions — one "more
 * actions" icon button, so every template treats actions the same way:
 * one primary call to action, everything else demoted.
 */
export function ActionGroup({
  entries,
  size = 'sm',
  className = '',
}: {
  entries: ResolvedField[]
  size?: 'xs' | 'sm'
  className?: string
}) {
  if (entries.length === 0) return null
  const [primary, secondary, ...rest] = entries
  const stop = (event: MouseEvent) => event.stopPropagation()
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Button size={size} onClick={stop}>
        {formatFieldValue(primary)}
      </Button>
      {secondary && (
        <Button variant="outline" size={size} onClick={stop}>
          {formatFieldValue(secondary)}
        </Button>
      )}
      {rest.length > 0 && (
        <Button
          variant="outline"
          size={size === 'xs' ? 'icon-xs' : 'icon-sm'}
          onClick={stop}
          aria-label={`More actions: ${rest
            .map((entry) => formatFieldValue(entry))
            .join(', ')}`}
          title={rest.map((entry) => formatFieldValue(entry)).join(', ')}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

export function CopyableIdentifier({
  entry,
  className = '',
}: {
  entry: ResolvedField
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const value = formatFieldValue(entry)

  useEffect(() => {
    if (state === 'idle') return
    const timeout = window.setTimeout(() => setState('idle'), 2200)
    return () => window.clearTimeout(timeout)
  }, [state])

  const copyValue = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('error')
    }
  }

  const isCopied = state === 'copied'
  const isError = state === 'error'
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-transparent bg-muted/60 px-1.5 py-0.5 ${className}`}
    >
      <code className="min-w-0 truncate text-[inherit]">{value}</code>
      {!entry.masked && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title={
            isCopied ? 'Copied' : isError ? 'Copy failed' : 'Copy identifier'
          }
          aria-label={
            isCopied
              ? 'Identifier copied'
              : isError
                ? 'Copy identifier failed'
                : 'Copy identifier'
          }
          onClick={copyValue}
          className="size-5 rounded-sm text-muted-foreground hover:text-foreground"
        >
          {isCopied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : isError ? (
            <ClipboardX className="size-3.5 text-destructive" />
          ) : (
            <Clipboard className="size-3.5" />
          )}
        </Button>
      )}
      {isCopied && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          Copied
        </span>
      )}
      {isError && (
        <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
          Copy failed
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {isCopied
          ? 'Identifier copied to clipboard'
          : isError
            ? 'Unable to copy identifier'
            : ''}
      </span>
    </span>
  )
}

// Progress values can exceed 100 (e.g. quota attainment); clamp for display only.
export function progressPercent(entry: ResolvedField, fallback: number) {
  const numeric = Number(entry.value)
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(100, numeric))
    : fallback
}

export function ProgressBar({
  label,
  ariaLabel,
  percent,
  className = '',
}: {
  label: React.ReactNode
  ariaLabel?: string
  percent: number
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={
          ariaLabel ?? (typeof label === 'string' ? label : 'Progress')
        }
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className="h-full rounded-full bg-cyan-600"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// Compact radial indicator for dense rows where a labeled bar won't fit.
export function ProgressRing({
  label,
  percent,
}: {
  label: string
  percent: number
}) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <span
      title={`${label}: ${Math.round(percent)}%`}
      aria-label={`${label}: ${Math.round(percent)}%`}
      className="relative inline-grid size-9 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={4}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-cyan-600"
        />
      </svg>
      <span className="absolute text-[9px] font-semibold">
        {Math.round(percent)}%
      </span>
    </span>
  )
}

export function RoleChipTag({
  role,
  suffix,
  editing,
  compact,
}: {
  role: SemanticRole
  suffix?: string
  editing?: boolean
  compact?: boolean
}) {
  return (
    <span
      className={`role-chip semantic-region-${role} inline-flex items-stretch overflow-hidden rounded border text-[11px] font-medium ${editing ? 'role-chip-editing' : ''}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center border-r border-current/25 font-bold ${compact ? 'w-4' : 'w-5'}`}
        style={{ backgroundColor: 'oklch(55% 0.16 var(--region-hue) / 0.3)' }}
      >
        {role.charAt(0).toUpperCase()}
      </span>
      <span className={compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}>
        {contractRoleDefinitions[role].label}
        {suffix}
      </span>
    </span>
  )
}

export function RoleChipDot({ role }: { role: SemanticRole }) {
  return (
    <span
      className={`role-chip semantic-region-${role} flex size-full items-center justify-center rounded-full text-[11px] font-bold`}
    >
      {role.charAt(0).toUpperCase()}
    </span>
  )
}

export function HoverActions({
  onViewJson,
  onViewTemplate,
  variant = 'overlay',
}: {
  onViewJson: () => void
  onViewTemplate: () => void
  variant?: 'overlay' | 'inline'
}) {
  return (
    <span
      className={`z-10 flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${
        variant === 'overlay' ? 'absolute right-2 top-2' : ''
      }`}
    >
      <button
        type="button"
        title="View JSON"
        aria-label="View JSON"
        onClick={(event) => {
          event.stopPropagation()
          onViewJson()
        }}
        className="rounded-md bg-foreground p-1 text-background shadow-sm backdrop-blur transition hover:opacity-80"
      >
        <Braces className="size-3" />
      </button>
      <button
        type="button"
        title="View template"
        aria-label="View template"
        onClick={(event) => {
          event.stopPropagation()
          onViewTemplate()
        }}
        className="rounded-md bg-foreground p-1 text-background shadow-sm backdrop-blur transition hover:opacity-80"
      >
        <LayoutTemplate className="size-3" />
      </button>
    </span>
  )
}

export function TemplatePreviewSurface({
  className = '',
  contentClassName,
  children,
}: {
  className?: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <div
      className={`p-4 ${className}`}
      style={{
        backgroundImage:
          'conic-gradient(rgba(128,128,128,0.14) 25%, transparent 25% 50%, rgba(128,128,128,0.14) 50% 75%, transparent 75%)',
        backgroundSize: '16px 16px',
      }}
    >
      <div className={contentClassName}>{children}</div>
    </div>
  )
}

export function TemplateMockPreview({
  template,
  fields,
  className = '',
}: {
  template: Template
  fields: Field[]
  className?: string
}) {
  return (
    <TemplatePreviewSurface
      className={className}
      contentClassName={
        template === 'tile' || template === 'detail-header'
          ? 'max-w-sm'
          : 'w-full'
      }
    >
      <TemplateSample template={template} fields={fields} />
    </TemplatePreviewSurface>
  )
}

export function TemplateSample({
  template,
  fields,
}: {
  template: Template
  fields: Field[]
}) {
  const definition = templateCatalog.find((entry) => entry.value === template)!
  const usedRoles = new Set(fields.map((field) => field.semanticRole))
  const supports = (role: SemanticRole) =>
    definition.supportedRoles.includes(role) && usedRoles.has(role)

  if (template === 'role-chip')
    return (
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm shadow-sm">
        {supports('media') && (
          <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
            <RoleChipDot role="media" />
          </span>
        )}
        {supports('title') && (
          <span className="min-w-0 truncate">
            <RoleChipTag role="title" />
          </span>
        )}
        {supports('status') && (
          <span className="shrink-0">
            <RoleChipTag role="status" />
          </span>
        )}
      </div>
    )

  if (template === 'row')
    return (
      <div className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3">
        {supports('media') && (
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
            <RoleChipDot role="media" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          {supports('title') && <RoleChipTag role="title" />}
          <span className="flex flex-wrap items-center gap-1.5">
            {supports('subtitle') && <RoleChipTag role="subtitle" />}
            {supports('identifier') && <RoleChipTag role="identifier" />}
          </span>
        </span>
        {supports('status') && <RoleChipTag role="status" />}
        {supports('flags') && <RoleChipTag role="flags" />}
        {supports('metric') && <RoleChipTag role="metric" />}
        {supports('people') && <RoleChipTag role="people" />}
        {supports('action') && <RoleChipTag role="action" />}
      </div>
    )

  if (template === 'summary')
    return (
      <div className="overflow-hidden rounded-xl border bg-card p-4 text-sm">
        <div className="flex min-w-0 items-start gap-3">
          {supports('media') && (
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              <RoleChipDot role="media" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {supports('objectType') && (
              <div>
                <RoleChipTag role="objectType" />
              </div>
            )}
            {supports('title') && (
              <div>
                <RoleChipTag role="title" />
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {supports('subtitle') && <RoleChipTag role="subtitle" />}
              {supports('identifier') && <RoleChipTag role="identifier" />}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {supports('status') && <RoleChipTag role="status" />}
            {supports('priority') && <RoleChipTag role="priority" />}
          </div>
        </div>
        {supports('flags') && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <RoleChipTag role="flags" />
          </div>
        )}
        {supports('highlight') && (
          <div className="mt-3 grid gap-3 border-y py-3 sm:grid-cols-3">
            <RoleChipTag role="highlight" />
            <RoleChipTag role="highlight" />
            <RoleChipTag role="highlight" />
          </div>
        )}
        {supports('progress') && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <RoleChipTag role="progress" />
          </div>
        )}
        {supports('description') && (
          <p className="mt-3">
            <RoleChipTag role="description" />
          </p>
        )}
        {(supports('temporal') ||
          supports('people') ||
          supports('relation')) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {supports('temporal') && <RoleChipTag role="temporal" />}
            {supports('people') && <RoleChipTag role="people" />}
            {supports('relation') && <RoleChipTag role="relation" />}
          </div>
        )}
        {supports('tags') && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <RoleChipTag role="tags" />
          </div>
        )}
        {supports('action') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <RoleChipTag role="action" />
          </div>
        )}
      </div>
    )

  if (template === 'detail-header')
    return (
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {supports('media') && (
          <div className="flex h-44 w-full items-center justify-center bg-muted/60">
            <RoleChipTag role="media" />
          </div>
        )}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {supports('objectType') ? (
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <RoleChipTag role="objectType" />
                </p>
              ) : (
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Collection item
                </p>
              )}
              {supports('title') && (
                <span className="text-xl">
                  <RoleChipTag role="title" />
                </span>
              )}
              {supports('subtitle') && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <RoleChipTag role="subtitle" />
                </div>
              )}
              {supports('identifier') && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <RoleChipTag role="identifier" />
                </div>
              )}
            </div>
            {(supports('status') ||
              supports('priority') ||
              supports('flags')) && (
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {supports('status') && <RoleChipTag role="status" />}
                {supports('priority') && <RoleChipTag role="priority" />}
                {supports('flags') && <RoleChipTag role="flags" />}
              </div>
            )}
          </div>
          {supports('highlight') && (
            <div className="grid grid-cols-2 gap-2 border-y py-2 sm:grid-cols-4">
              <RoleChipTag role="highlight" />
            </div>
          )}
          {supports('tags') && (
            <div className="flex flex-wrap gap-1.5">
              <RoleChipTag role="tags" />
            </div>
          )}
          {supports('progress') && (
            <div className="flex flex-wrap gap-1.5">
              <RoleChipTag role="progress" />
            </div>
          )}
          {supports('metric') && (
            <div className="flex flex-wrap gap-1.5">
              <RoleChipTag role="metric" />
            </div>
          )}
          {supports('description') && (
            <div className="flex flex-wrap gap-1.5">
              <RoleChipTag role="description" />
            </div>
          )}
          {supports('temporal') && (
            <div className="flex flex-wrap gap-2">
              <RoleChipTag role="temporal" />
            </div>
          )}
          {supports('location') && <RoleChipTag role="location" />}
          {supports('people') && (
            <div className="flex flex-wrap gap-2">
              <RoleChipTag role="people" />
            </div>
          )}
          {supports('annotation') && <RoleChipTag role="annotation" />}
          {supports('relation') && (
            <div className="flex flex-wrap gap-2">
              <RoleChipTag role="relation" />
            </div>
          )}
          {supports('secondary') && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <RoleChipTag role="secondary" />
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <RoleChipTag role="secondary" />
              </div>
            </div>
          )}
          {supports('action') && (
            <div className="flex flex-wrap gap-2">
              <RoleChipTag role="action" />
            </div>
          )}
        </div>
      </div>
    )

  if (template === 'kpi-card')
    return (
      <div className="w-full rounded-2xl border bg-card p-4 shadow-sm">
        {supports('metric') && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg">
              <RoleChipTag role="metric" />
            </span>
          </div>
        )}
        {supports('title') && (
          <div className="mt-2">
            <RoleChipTag role="title" />
          </div>
        )}
        {(supports('status') || supports('temporal')) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {supports('status') && <RoleChipTag role="status" />}
            {supports('temporal') && <RoleChipTag role="temporal" />}
          </div>
        )}
      </div>
    )

  if (template === 'progress-card')
    return (
      <div className="w-full rounded-2xl border bg-card p-4 shadow-sm">
        {supports('progress') && <RoleChipTag role="progress" />}
        {supports('title') && (
          <div className="mt-3">
            <RoleChipTag role="title" />
          </div>
        )}
        {(supports('subtitle') || supports('identifier')) && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {supports('subtitle') && <RoleChipTag role="subtitle" />}
            {supports('identifier') && <RoleChipTag role="identifier" />}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {supports('status') && <RoleChipTag role="status" />}
            {supports('temporal') && <RoleChipTag role="temporal" />}
          </div>
          {supports('people') && <RoleChipTag role="people" />}
        </div>
        {supports('action') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <RoleChipTag role="action" />
          </div>
        )}
      </div>
    )

  if (template === 'alert-card')
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-l-4 border-border border-l-destructive bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {supports('flags') && (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10">
              <RoleChipDot role="flags" />
            </span>
          )}
          {supports('flags') && <RoleChipTag role="flags" />}
          {supports('priority') && <RoleChipTag role="priority" />}
          {supports('temporal') && <RoleChipTag role="temporal" />}
        </div>
        {supports('title') && (
          <div className="mt-3">
            <RoleChipTag role="title" />
          </div>
        )}
        {supports('description') && (
          <div className="mt-2">
            <RoleChipTag role="description" />
          </div>
        )}
        {supports('identifier') && (
          <div className="mt-2">
            <RoleChipTag role="identifier" />
          </div>
        )}
        {supports('action') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <RoleChipTag role="action" />
          </div>
        )}
      </div>
    )

  if (template === 'party-card')
    return (
      <div className="w-full rounded-2xl border bg-card p-4 text-center shadow-sm">
        {supports('media') && (
          <div className="mx-auto flex size-14 items-center justify-center overflow-hidden rounded-full bg-muted">
            <RoleChipDot role="media" />
          </div>
        )}
        {supports('title') && (
          <div className="mt-3 flex justify-center">
            <RoleChipTag role="title" />
          </div>
        )}
        {supports('subtitle') && (
          <div className="mt-1 flex justify-center">
            <RoleChipTag role="subtitle" />
          </div>
        )}
        {supports('status') && (
          <div className="mt-2 flex justify-center gap-1.5">
            <RoleChipTag role="status" />
          </div>
        )}
        {supports('flags') && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <RoleChipTag role="flags" />
          </div>
        )}
        {supports('highlight') && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-left">
            <RoleChipTag role="highlight" />
            <RoleChipTag role="highlight" />
          </div>
        )}
        {supports('tags') && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <RoleChipTag role="tags" />
          </div>
        )}
        {supports('action') && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <RoleChipTag role="action" />
          </div>
        )}
      </div>
    )

  if (template === 'timeline-entry')
    return (
      <div className="flex w-full gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        {supports('temporal') && (
          <div className="w-20 shrink-0 pt-1 text-right">
            <RoleChipTag role="temporal" />
          </div>
        )}
        <div className="flex flex-col items-center pt-1">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="mt-1 w-px flex-1 bg-border" />
        </div>
        <div className="min-w-0 flex-1">
          {supports('title') && <RoleChipTag role="title" />}
          {supports('status') && (
            <div className="mt-1.5">
              <RoleChipTag role="status" />
            </div>
          )}
          {supports('description') && (
            <div className="mt-1.5">
              <RoleChipTag role="description" />
            </div>
          )}
          {(supports('people') || supports('relation') || supports('attachment')) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {supports('people') && <RoleChipTag role="people" />}
              {supports('relation') && <RoleChipTag role="relation" />}
              {supports('attachment') && <RoleChipTag role="attachment" />}
            </div>
          )}
        </div>
      </div>
    )

  if (template === 'board-card')
    return (
      <div className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex">
          {supports('groupKey') && (
            <span className="w-1 shrink-0 bg-primary/60" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-start justify-between gap-2">
              {supports('title') && <RoleChipTag role="title" />}
              {supports('priority') && <RoleChipTag role="priority" />}
            </div>
            {supports('identifier') && (
              <div className="mt-1">
                <RoleChipTag role="identifier" />
              </div>
            )}
            {supports('flags') && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <RoleChipTag role="flags" />
              </div>
            )}
            {supports('tags') && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <RoleChipTag role="tags" />
              </div>
            )}
            {supports('progress') && (
              <div className="mt-2">
                <RoleChipTag role="progress" />
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {supports('temporal') && <RoleChipTag role="temporal" />}
              {supports('people') && <RoleChipTag role="people" />}
            </div>
          </div>
        </div>
      </div>
    )

  // tile
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {supports('media') && (
        <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-muted/60">
          <RoleChipTag role="media" />
          {supports('status') && (
            <span className="absolute right-3 top-3">
              <RoleChipTag role="status" />
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          {supports('objectType') && <RoleChipTag role="objectType" />}
          {supports('flags') && <RoleChipTag role="flags" />}
        </div>
        <div className="flex flex-col items-start gap-1">
          {supports('title') && <RoleChipTag role="title" />}
          {supports('subtitle') && <RoleChipTag role="subtitle" />}
        </div>
        {supports('highlight') && (
          <div className="grid gap-2 border-y py-3 sm:grid-cols-2">
            <RoleChipTag role="highlight" />
            <RoleChipTag role="highlight" />
          </div>
        )}
        {supports('progress') && <RoleChipTag role="progress" />}
        {supports('tags') && (
          <div className="flex flex-wrap gap-1.5">
            <RoleChipTag role="tags" />
          </div>
        )}
      </div>
    </div>
  )
}

// --- Runtime components -----------------------------------------------------
// One component per template kind, each rendering a single real record with
// its actual resolved values (not placeholders). All interaction hooks are
// optional so the same component works as a static preview (e.g. on the
// Architecture page) or fully wired up (e.g. on the Live Editor page).

export type RuntimeInteractions = {
  /** Extra classes applied to a role's region, e.g. for edit-mode highlight. */
  roleClass?: (role: SemanticRole) => string
  onOpenDetail?: (item: RecordItem) => void
  onViewJson?: (item: RecordItem) => void
  onViewTemplate?: (item: RecordItem) => void
  onPersonClick?: (name: string, fieldLabel: string, anchorRect: DOMRect) => void
  isLast?: boolean
}

type RuntimeProps = { item: RecordItem } & RuntimeInteractions

function useSelection(item: RecordItem, template: Template) {
  const selection = resolveTemplateSlots(item, template)
  const valuesFor = (role: SemanticRole) => selection.byRole[role] ?? []
  const valueFor = (role: SemanticRole) => valuesFor(role)[0]?.displayValue
  const textFor = (role: SemanticRole) =>
    valuesFor(role)
      .map((entry) => formatFieldValue(entry))
      .filter(Boolean)
  const temporalFor = (qualifier?: string) => {
    const values = valuesFor('temporal')
    if (!qualifier) return values
    return values.filter((entry) => entry.field.qualifier === qualifier)
  }
  const metricTextFor = () => {
    const entry = valuesFor('metric')[0]
    if (!entry) return '—'
    return entry.masked
      ? String(entry.displayValue)
      : formatMetric(Number(entry.value), entry.field)
  }
  return { selection, valuesFor, valueFor, textFor, temporalFor, metricTextFor }
}

function PersonControl({
  entry,
  onPersonClick,
}: {
  entry: ResolvedField
  onPersonClick?: (name: string, fieldLabel: string, anchorRect: DOMRect) => void
}) {
  const name = String(entry.displayValue)
  if (!onPersonClick) {
    return (
      <span
        key={entry.field.name}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm"
      >
        <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
          {initialsFor(name)}
        </span>
        {name}
      </span>
    )
  }
  return (
    <span
      key={entry.field.name}
      role="button"
      tabIndex={0}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:border-cyan-400"
      onClick={(event) => {
        event.stopPropagation()
        onPersonClick(
          name,
          entry.field.label,
          event.currentTarget.getBoundingClientRect(),
        )
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          onPersonClick(
            name,
            entry.field.label,
            event.currentTarget.getBoundingClientRect(),
          )
        }
      }}
    >
      <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
        {initialsFor(name)}
      </span>
      {name}
    </span>
  )
}

const avatarPalette = [
  'bg-primary/10 text-primary',
  'bg-muted text-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
]

/**
 * Compact people display: a single person still shows a labeled pill, but
 * once there is more than one (and the layout is too tight for full names)
 * this collapses to overlapping initials-only avatars plus a "+N" badge for
 * whatever doesn't fit.
 */
function PersonAvatarStack({
  entries,
  onPersonClick,
  max = 2,
  className = '',
}: {
  entries: ResolvedField[]
  onPersonClick?: (name: string, fieldLabel: string, anchorRect: DOMRect) => void
  max?: number
  className?: string
}) {
  if (entries.length === 0) return null
  if (entries.length === 1) {
    return (
      <div className={className}>
        <PersonControl entry={entries[0]} onPersonClick={onPersonClick} />
      </div>
    )
  }
  const visible = entries.slice(0, max)
  const overflow = entries.slice(max)
  return (
    <div className={`flex -space-x-1.5 ${className}`}>
      {visible.map((entry, index) => {
        const name = String(entry.displayValue)
        const palette = avatarPalette[index % avatarPalette.length]
        const shared = `grid size-6 shrink-0 place-items-center rounded-full border-2 border-card text-[10px] font-bold shadow-sm ${palette}`
        if (!onPersonClick) {
          return (
            <span key={entry.field.name} className={shared} title={name}>
              {initialsFor(name)}
            </span>
          )
        }
        return (
          <button
            key={entry.field.name}
            type="button"
            title={name}
            className={`${shared} cursor-pointer hover:ring-2 hover:ring-cyan-400 hover:ring-offset-1`}
            onClick={(event) => {
              event.stopPropagation()
              onPersonClick(
                name,
                entry.field.label,
                event.currentTarget.getBoundingClientRect(),
              )
            }}
          >
            {initialsFor(name)}
          </button>
        )
      })}
      {overflow.length > 0 && (
        <span
          className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground shadow-sm"
          title={overflow.map((entry) => String(entry.displayValue)).join(', ')}
        >
          +{overflow.length}
        </span>
      )}
    </div>
  )
}

function RelationControl({
  entry,
  item,
  onOpenDetail,
}: {
  entry: ResolvedField
  item: RecordItem
  onOpenDetail?: (item: RecordItem) => void
}) {
  if (!onOpenDetail) return <span>{String(entry.displayValue)}</span>
  return (
    <span
      role="link"
      tabIndex={0}
      className="cursor-pointer text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80"
      onClick={(event) => {
        event.stopPropagation()
        onOpenDetail(item)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          onOpenDetail(item)
        }
      }}
    >
      {String(entry.displayValue)}
    </span>
  )
}

export function RoleChipRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
}: RuntimeProps) {
  const { valueFor } = useSelection(item, 'role-chip')
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDetail!(item)
              }
            }
          : undefined
      }
      className={`group inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-2 text-left text-sm shadow-sm transition ${interactive ? 'cursor-pointer hover:border-cyan-400 hover:shadow-md' : ''}`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary ${roleClass('media')}`}
      >
        <SafeImage
          src={item.image}
          alt=""
          width={24}
          height={24}
          className="size-full object-cover"
        />
      </span>
      <span className={`min-w-0 truncate font-medium ${roleClass('title')}`}>
        {String(valueFor('title'))}
      </span>
      <span
        className={`shrink-0 text-xs text-muted-foreground ${roleClass('status')}`}
      >
        {String(valueFor('status'))}
      </span>
      {onViewJson && onViewTemplate && (
        <HoverActions
          variant="inline"
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
    </div>
  )
}

export function RowRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
}: RuntimeProps) {
  const { valuesFor, valueFor, textFor, metricTextFor } = useSelection(
    item,
    'row',
  )
  const interactive = Boolean(onOpenDetail)
  const metricEntry = valuesFor('metric')[0]
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDetail!(item)
              }
            }
          : undefined
      }
      className={`group relative flex w-full items-center gap-3 border-b px-4 py-3 text-left transition last:border-0 ${interactive ? 'cursor-pointer hover:bg-muted/40' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <span
        className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-xs font-semibold text-primary ${roleClass('media')}`}
      >
        <SafeImage
          src={item.image}
          alt=""
          width={36}
          height={36}
          className="size-full object-cover"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-medium ${roleClass('title')}`}
        >
          {item.name}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`truncate ${roleClass('subtitle')}`}
          >
            {item.subtitle || item.location}
          </span>
          {valuesFor('identifier').map((entry) => (
            <CopyableIdentifier
              key={entry.field.name}
              entry={entry}
              className={`shrink-0 font-mono text-[11px] ${roleClass('identifier')}`}
            />
          ))}
        </span>
      </span>
      {valuesFor('status').length > 0 && (
        <span
          className={`hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs sm:block ${roleClass('status')}`}
        >
          {String(valueFor('status'))}
        </span>
      )}
      {valuesFor('flags').length > 0 && (
        <span
          className={`hidden shrink-0 flex-wrap justify-end gap-1 sm:flex ${roleClass('flags')}`}
        >
          {valuesFor('flags')
            .filter((entry) => entry.value === true || entry.derived)
            .map((entry) => (
              <FlagIndicator key={entry.field.name} entry={entry} dense />
            ))}
        </span>
      )}
      {metricEntry && (
        <span
          className={`hidden shrink-0 flex-col items-end text-right sm:flex ${roleClass('metric')}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {metricTextFor()}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {metricEntry.field.label}
          </span>
        </span>
      )}
      {valuesFor('people').length > 0 && (
        <PersonAvatarStack
          entries={valuesFor('people')}
          onPersonClick={onPersonClick}
          className={`hidden shrink-0 sm:flex ${roleClass('people')}`}
        />
      )}
      {valuesFor('action').length > 0 && (
        <span
          className={`hidden shrink-0 grid size-7 place-items-center rounded-md border bg-card text-muted-foreground sm:grid ${roleClass('action')}`}
          title={textFor('action')[0]}
          aria-label={textFor('action')[0]}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  )
}

export function TileRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
}: RuntimeProps) {
  const { valuesFor, valueFor } = useSelection(item, 'tile')
  const interactive = Boolean(onOpenDetail)
  const statusEntry = valuesFor('status')[0]
  const flagEntries = valuesFor('flags').filter(
    (entry) => entry.value === true || entry.derived,
  )
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDetail!(item)
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm transition-all ${interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div className="relative">
        <SafeImage
          src={item.image}
          alt={item.name}
          width={1200}
          height={675}
          className={`h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 ${roleClass('media')}`}
        />
        {statusEntry && (
          <span className={`absolute right-3 top-3 ${roleClass('status')}`}>
            <StatusPill entry={statusEntry} className="bg-card/90 shadow-sm" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          {valuesFor('objectType').length > 0 && (
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 ${roleClass('objectType')}`}
            >
              {String(valueFor('objectType'))}
            </p>
          )}
          {flagEntries.length > 0 && (
            <div className={`flex gap-1.5 ${roleClass('flags')}`}>
              {flagEntries.map((entry) => (
                <FlagIndicator key={entry.field.name} entry={entry} dense />
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className={`font-semibold tracking-tight ${roleClass('title')}`}>
            {item.name}
          </h3>
          <p
            className={`mt-1 text-xs text-muted-foreground ${roleClass('subtitle')}`}
          >
            {item.subtitle}
          </p>
        </div>
        {valuesFor('highlight').length > 0 && (
          <div
            className={`grid gap-3 border-y py-3 sm:grid-cols-2 ${roleClass('highlight')}`}
          >
            {valuesFor('highlight')
              .slice(0, 2)
              .map((entry) => (
                <div key={entry.field.name}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {entry.field.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {String(entry.displayValue)}
                  </p>
                </div>
              ))}
          </div>
        )}
        {valuesFor('progress').length > 0 &&
          (() => {
            const entry = valuesFor('progress')[0]
            return (
              <div className={roleClass('progress')}>
                <ProgressBar
                  label={entry.field.label}
                  percent={progressPercent(entry, item.available ? 72 : 42)}
                />
              </div>
            )
          })()}
        {valuesFor('tags').length > 0 && (
          <TagList entries={valuesFor('tags')} className={roleClass('tags')} />
        )}
      </div>
    </div>
  )
}

export function SummaryRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
}: RuntimeProps) {
  const { valuesFor, temporalFor } = useSelection(item, 'summary')
  const interactive = Boolean(onOpenDetail)
  const flagEntries = valuesFor('flags').filter(
    (entry) => entry.value === true || entry.derived,
  )
  const peopleEntries = valuesFor('people')
  const actionEntries = valuesFor('action')
  const temporalEntries = temporalFor()
  return (
    <article
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDetail!(item)
              }
            }
          : undefined
      }
      className={`group relative rounded-xl border bg-card p-4 text-sm shadow-sm ${interactive ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SafeImage
          src={item.image}
          alt=""
          width={32}
          height={32}
          className={`size-8 shrink-0 rounded-lg object-cover ${roleClass('media')}`}
        />
        {valuesFor('status').map((entry) => (
          <span key={entry.field.name} className={roleClass('status')}>
            <StatusPill entry={entry} />
          </span>
        ))}
        {valuesFor('priority').map((entry) => (
          <span
            key={entry.field.name}
            className={`rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive ${roleClass('priority')}`}
          >
            {String(entry.displayValue)}
          </span>
        ))}
        {flagEntries.length > 0 && (
          <div className={`flex gap-1.5 ${roleClass('flags')}`}>
            {flagEntries.map((entry) => (
              <FlagIndicator key={entry.field.name} entry={entry} dense />
            ))}
          </div>
        )}
      </div>
      <div className="mt-2">
        {valuesFor('objectType').length > 0 && (
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 ${roleClass('objectType')}`}
          >
            {String(valuesFor('objectType')[0].displayValue)}
          </p>
        )}
        <p className={`font-semibold ${roleClass('title')}`}>{item.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {valuesFor('subtitle').map((entry) => (
            <span key={entry.field.name} className={roleClass('subtitle')}>
              {String(entry.displayValue)}
            </span>
          ))}
          {valuesFor('identifier').map((entry) => (
            <CopyableIdentifier
              key={entry.field.name}
              entry={entry}
              className={`font-mono ${roleClass('identifier')}`}
            />
          ))}
        </div>
      </div>
      {valuesFor('highlight').length > 0 && (
        <div
          className={`mt-3 grid gap-3 border-y py-3 sm:grid-cols-2 ${roleClass('highlight')}`}
        >
          {valuesFor('highlight').map((entry) => (
            <div key={entry.field.name}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {entry.field.label}
              </p>
              <p className="mt-1 font-semibold">{String(entry.displayValue)}</p>
            </div>
          ))}
        </div>
      )}
      {valuesFor('progress').length > 0 &&
        (() => {
          const entry = valuesFor('progress')[0]
          return (
            <div className={`mt-3 ${roleClass('progress')}`}>
              <ProgressBar
                label={entry.field.label}
                percent={progressPercent(entry, 65)}
              />
            </div>
          )
        })()}
      {temporalEntries.length > 0 && (
        <div className={`mt-3 rounded-lg border bg-muted/40 px-3 py-2 ${roleClass('temporal')}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {temporalEntries[0].field.label}
          </p>
          <p className="mt-1 font-semibold">
            {String(temporalEntries[0].displayValue)}
          </p>
        </div>
      )}
      {valuesFor('description').length > 0 && (
        <p
          className={`mt-3 line-clamp-2 text-muted-foreground ${roleClass('description')}`}
        >
          {item.description}
        </p>
      )}
      {valuesFor('relation').length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {valuesFor('relation').map((entry) => (
            <span key={entry.field.name} className={roleClass('relation')}>
              {entry.field.label}:{' '}
              <RelationControl
                entry={entry}
                item={item}
                onOpenDetail={onOpenDetail}
              />
            </span>
          ))}
        </div>
      )}
      {valuesFor('tags').length > 0 && (
        <TagList
          entries={valuesFor('tags')}
          max={3}
          className={`mt-3 ${roleClass('tags')}`}
        />
      )}
      {(peopleEntries.length > 0 ||
        flagEntries.length > 0 ||
        actionEntries.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {peopleEntries.length > 0 && (
              <span className={roleClass('people')}>
                <PersonAvatarStack
                  entries={peopleEntries}
                  onPersonClick={onPersonClick}
                />
              </span>
            )}
            {flagEntries.length > 0 && (
              <div className={`flex gap-1.5 ${roleClass('flags')}`}>
                {flagEntries.map((entry) => (
                  <FlagIndicator
                    key={`footer-${entry.field.name}`}
                    entry={entry}
                    dense
                  />
                ))}
              </div>
            )}
          </div>
          {actionEntries.length > 0 && (
            <ActionGroup entries={actionEntries} className={roleClass('action')} />
          )}
        </div>
      )}
    </article>
  )
}

export function DetailHeaderRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
}: RuntimeProps) {
  const { valuesFor, textFor, metricTextFor } = useSelection(
    item,
    'detail-header',
  )
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDetail!(item)
              }
            }
          : undefined
      }
      data-resolved-roles={Object.keys(
        resolveTemplateSlots(item, 'detail-header').byRole,
      ).join(',')}
      className={`group relative overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <SafeImage
        src={item.image}
        alt={item.name}
        width={1200}
        height={400}
        className={`h-44 w-full object-cover ${roleClass('media')}`}
      />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-xs font-medium uppercase tracking-wider text-muted-foreground ${roleClass('objectType')}`}
            >
              {valuesFor('objectType').length > 0
                ? String(valuesFor('objectType')[0].displayValue)
                : 'Collection item'}
            </p>
            <h3 className={`text-xl font-semibold ${roleClass('title')}`}>
              {item.name}
            </h3>
            <p
              className={`text-sm text-muted-foreground ${roleClass('subtitle')}`}
            >
              {item.subtitle}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {valuesFor('identifier').map((entry) => (
                <CopyableIdentifier
                  key={entry.field.name}
                  entry={entry}
                  className={`font-mono text-xs text-muted-foreground ${roleClass('identifier')}`}
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {valuesFor('status').map((entry) => (
              <span
                key={entry.field.name}
                className={`rounded-full bg-muted px-2 py-1 text-xs text-foreground ${roleClass('status')}`}
              >
                {String(entry.displayValue)}
              </span>
            ))}
            {valuesFor('priority').map((entry) => (
              <span
                key={entry.field.name}
                className={`rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive ${roleClass('priority')}`}
              >
                {String(entry.displayValue)}
              </span>
            ))}
            {valuesFor('flags')
              .filter((entry) => entry.value === true || entry.derived)
              .map((entry) => (
                <FlagIndicator key={entry.field.name} entry={entry} dense />
              ))}
          </div>
        </div>
        {valuesFor('highlight').length > 0 && (
          <div
            className={`grid grid-cols-2 gap-3 border-y py-3 sm:grid-cols-4 ${roleClass('highlight')}`}
          >
            {valuesFor('highlight').map((entry) => (
              <div key={entry.field.name}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {entry.field.label}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {String(entry.displayValue)}
                </p>
              </div>
            ))}
          </div>
        )}
        {valuesFor('tags').length > 0 && (
          <TagList entries={valuesFor('tags')} className={roleClass('tags')} />
        )}
        {valuesFor('progress').length > 0 &&
          (() => {
            const entry = valuesFor('progress')[0]
            return (
              <div
                className={`rounded-md bg-muted/50 p-2 ${roleClass('progress')}`}
              >
                <ProgressBar
                  label={entry.field.label}
                  percent={progressPercent(entry, 72)}
                />
              </div>
            )
          })()}
        {valuesFor('metric').length > 0 && (
          <p className={`text-xl font-semibold ${roleClass('metric')}`}>
            {metricTextFor()}
          </p>
        )}
        {valuesFor('description').length > 0 && (
          <p
            className={`line-clamp-2 text-xs leading-relaxed text-muted-foreground ${roleClass('description')}`}
          >
            {item.description}
          </p>
        )}
        {valuesFor('temporal').length > 0 && (
          <div
            className={`flex flex-wrap gap-2 text-xs text-muted-foreground ${roleClass('temporal')}`}
          >
            {valuesFor('temporal').map((entry) => (
              <time key={entry.field.name}>
                {entry.field.label}: {String(entry.displayValue)}
              </time>
            ))}
          </div>
        )}
        {valuesFor('location').length > 0 && (
          <p className={`text-sm ${roleClass('location')}`}>
            {textFor('location').join(', ')}
          </p>
        )}
        {valuesFor('people').length > 0 && (
          <div
            className={`flex flex-wrap gap-2 text-sm ${roleClass('people')}`}
          >
            {valuesFor('people').map((entry) => (
              <PersonControl
                key={entry.field.name}
                entry={entry}
                onPersonClick={onPersonClick}
              />
            ))}
          </div>
        )}
        {valuesFor('annotation').length > 0 && (
          <p
            className={`text-xs text-muted-foreground ${roleClass('annotation')}`}
          >
            {textFor('annotation').join(' · ')}
          </p>
        )}
        {valuesFor('relation').length > 0 && (
          <div
            className={`flex flex-wrap gap-2 text-xs text-muted-foreground ${roleClass('relation')}`}
          >
            {valuesFor('relation').map((entry) => (
              <span key={entry.field.name}>
                {entry.field.label}:{' '}
                <RelationControl
                  entry={entry}
                  item={item}
                  onOpenDetail={onOpenDetail}
                />
              </span>
            ))}
          </div>
        )}
        {valuesFor('secondary').length > 0 && (
          <div
            className={`grid gap-2 sm:grid-cols-2 ${roleClass('secondary')}`}
          >
            {valuesFor('secondary').map((entry) => (
              <div
                key={entry.field.name}
                className="rounded-md bg-muted/50 p-2 text-xs"
              >
                <span className="block text-muted-foreground">
                  {entry.field.label}
                </span>
                <span className="font-semibold">
                  {String(entry.displayValue)}
                </span>
              </div>
            ))}
          </div>
        )}
        {valuesFor('action').length > 0 && (
          <ActionGroup
            entries={valuesFor('action')}
            className={roleClass('action')}
          />
        )}
      </div>
    </div>
  )
}

export function KpiCardRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
}: RuntimeProps) {
  const { valuesFor, metricTextFor } = useSelection(item, 'kpi-card')
  const hero = pickHero(item, 'metric')
  const secondaryMetric = valuesFor('metric')[1]
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative rounded-2xl border bg-card p-4 shadow-sm ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div className={`flex items-baseline gap-2 ${roleClass('metric')}`}>
        <p className="text-3xl font-bold tracking-tight">
          {hero ? metricTextFor() : '—'}
        </p>
        {hero?.trendPercent !== undefined && (
          <span
            className={`text-xs font-semibold ${hero.trendPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {hero.trendPercent >= 0 ? '+' : ''}
            {hero.trendPercent.toFixed(1)}%
          </span>
        )}
      </div>
      {secondaryMetric && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {secondaryMetric.field.label} {String(secondaryMetric.displayValue)}
        </p>
      )}
      <p className={`mt-2 text-sm font-medium ${roleClass('title')}`}>
        {item.name}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {valuesFor('status').map((entry) => (
          <span
            key={entry.field.name}
            className={`rounded-full bg-muted px-2 py-0.5 text-xs ${roleClass('status')}`}
          >
            {String(entry.displayValue)}
          </span>
        ))}
        {valuesFor('temporal').map((entry) => (
          <span
            key={entry.field.name}
            className={`text-xs text-muted-foreground ${roleClass('temporal')}`}
          >
            {entry.field.label} {String(entry.displayValue)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ProgressCardRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
}: RuntimeProps) {
  const { valuesFor } = useSelection(item, 'progress-card')
  const progress = valuesFor('progress')[0]
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative rounded-2xl border bg-card p-4 shadow-sm ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      {progress && (
        <div className={roleClass('progress')}>
          <ProgressBar
            label={progress.field.label}
            percent={progress.derivedPercent ?? progressPercent(progress, 40)}
          />
        </div>
      )}
      <p className={`mt-3 text-sm font-medium ${roleClass('title')}`}>
        {item.name}
      </p>
      <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {valuesFor('subtitle').map((entry) => (
          <span key={entry.field.name} className={roleClass('subtitle')}>
            {String(entry.displayValue)}
          </span>
        ))}
        {valuesFor('identifier').map((entry) => (
          <CopyableIdentifier
            key={entry.field.name}
            entry={entry}
            className={`font-mono ${roleClass('identifier')}`}
          />
        ))}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {valuesFor('status').map((entry) => (
            <span
              key={entry.field.name}
              className={`rounded-full bg-muted px-2 py-0.5 text-xs ${roleClass('status')}`}
            >
              {String(entry.displayValue)}
            </span>
          ))}
          {valuesFor('temporal').map((entry) => (
            <span
              key={entry.field.name}
              className={`text-xs text-muted-foreground ${roleClass('temporal')}`}
            >
              {String(entry.displayValue)}
            </span>
          ))}
        </div>
        <PersonAvatarStack
          entries={valuesFor('people')}
          onPersonClick={onPersonClick}
          className={roleClass('people')}
        />
      </div>
      {valuesFor('action').length > 0 && (
        <ActionGroup
          entries={valuesFor('action')}
          className={`mt-3 ${roleClass('action')}`}
        />
      )}
    </div>
  )
}

export function AlertCardRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
}: RuntimeProps) {
  const { valuesFor, temporalFor } = useSelection(item, 'alert-card')
  const flags = valuesFor('flags').filter(
    (entry) => entry.value === true || entry.derived,
  )
  const [heroFlag, ...restFlags] = flags
  const heroFlagName = heroFlag
    ? (heroFlag.field.name.split('.').pop()?.toLowerCase() ?? '')
    : ''
  const HeroIcon =
    heroFlagName === 'overdue'
      ? ClockAlert
      : heroFlagName === 'locked'
        ? LockKeyhole
        : heroFlagName === 'confidential'
          ? ShieldAlert
          : heroFlagName === 'new'
            ? Sparkles
            : AlertTriangle
  const priorityEntry = valuesFor('priority')[0]
  const temporalEntry = temporalFor()[0]
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-l-4 border-border border-l-destructive bg-card p-4 shadow-sm ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive ${roleClass('flags')}`}
        >
          <HeroIcon aria-hidden="true" className="size-4.5" />
        </span>
        {heroFlag ? (
          <span className="text-base font-bold text-destructive">
            {flagLabel(heroFlag)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No active flags</span>
        )}
        {priorityEntry && (
          <span
            className={`rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive ${roleClass('priority')}`}
          >
            {String(priorityEntry.displayValue)}
          </span>
        )}
        {temporalEntry && (
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 ${roleClass('temporal')}`}
          >
            <ClockAlert aria-hidden="true" className="size-3.5" />
            {String(temporalEntry.displayValue)}
          </span>
        )}
        {restFlags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {restFlags.map((entry) => (
              <FlagIndicator key={entry.field.name} entry={entry} dense />
            ))}
          </div>
        )}
      </div>
      <p className={`mt-3 text-base font-semibold ${roleClass('title')}`}>
        {item.name}
      </p>
      {valuesFor('description').length > 0 && (
        <p
          className={`mt-2 line-clamp-2 text-sm text-muted-foreground ${roleClass('description')}`}
        >
          {item.description}
        </p>
      )}
      {valuesFor('identifier').map((entry) => (
        <CopyableIdentifier
          key={entry.field.name}
          entry={entry}
          className={`mt-2 font-mono text-xs text-muted-foreground ${roleClass('identifier')}`}
        />
      ))}
      {valuesFor('action').length > 0 && (
        <ActionGroup
          entries={valuesFor('action')}
          className={`mt-3 ${roleClass('action')}`}
        />
      )}
    </div>
  )
}

export function PartyCardRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
}: RuntimeProps) {
  const { valuesFor } = useSelection(item, 'party-card')
  const hero = pickHero(item, 'media')
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative rounded-2xl border bg-card p-4 text-center shadow-sm ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div
        className={`mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary ${roleClass('media')}`}
      >
        {hero ? (
          initialsFor(item.name)
        ) : (
          <SafeImage
            src={item.image}
            alt={item.name}
            width={56}
            height={56}
            className="size-14 rounded-full object-cover"
          />
        )}
      </div>
      <p className={`mt-3 text-sm font-semibold ${roleClass('title')}`}>
        {item.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {valuesFor('subtitle')
          .map((entry) => String(entry.displayValue))
          .join(' · ')}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {valuesFor('status').map((entry) => (
          <span
            key={entry.field.name}
            className={`rounded-full bg-muted px-2 py-0.5 text-xs ${roleClass('status')}`}
          >
            {String(entry.displayValue)}
          </span>
        ))}
      </div>
      {valuesFor('flags').filter(
        (entry) => entry.value === true || entry.derived,
      ).length > 0 && (
        <div
          className={`mt-2 flex flex-wrap justify-center gap-1.5 ${roleClass('flags')}`}
        >
          {valuesFor('flags')
            .filter((entry) => entry.value === true || entry.derived)
            .map((entry) => (
              <FlagIndicator key={entry.field.name} entry={entry} dense />
            ))}
        </div>
      )}
      {valuesFor('highlight').length > 0 && (
        <div
          className={`mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-left ${roleClass('highlight')}`}
        >
          {valuesFor('highlight').map((entry) => (
            <div key={entry.field.name}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {entry.field.label}
              </p>
              <p className="text-xs font-medium">
                {String(entry.displayValue)}
              </p>
            </div>
          ))}
        </div>
      )}
      {valuesFor('tags').length > 0 && (
        <TagList
          entries={valuesFor('tags')}
          className={`mt-2 justify-center ${roleClass('tags')}`}
        />
      )}
      {valuesFor('action').length > 0 && (
        <ActionGroup
          entries={valuesFor('action')}
          className={`mt-3 justify-center ${roleClass('action')}`}
        />
      )}
    </div>
  )
}

export function TimelineEntryRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
  isLast = false,
}: RuntimeProps) {
  const { valuesFor } = useSelection(item, 'timeline-entry')
  const hero = pickHero(item, 'temporal')
  const peopleEntries = valuesFor('people')
  const attachmentEntry = valuesFor('attachment')[0]
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative flex gap-3 bg-card px-4 transition ${interactive ? 'cursor-pointer hover:bg-muted/40' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <div
        className={`w-20 shrink-0 pt-4 text-right ${roleClass('temporal')}`}
      >
        <p className="text-sm font-semibold text-foreground">
          {hero ? String(hero.displayValue) : '—'}
        </p>
        {hero && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hero.field.label}
          </p>
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className="mt-4 size-2.5 shrink-0 rounded-full border-2 border-primary bg-card" />
        {!isLast && <span className="w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 py-3">
        <p className={`text-sm font-semibold ${roleClass('title')}`}>
          {item.name}
        </p>
        {valuesFor('status').map((entry) => (
          <span key={entry.field.name} className={`mt-1.5 inline-block ${roleClass('status')}`}>
            <StatusPill entry={entry} />
          </span>
        ))}
        {valuesFor('description').length > 0 && (
          <p
            className={`mt-1.5 line-clamp-2 text-xs text-muted-foreground ${roleClass('description')}`}
          >
            {item.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {peopleEntries.length > 0 && (
            <>
              <PersonAvatarStack
                entries={peopleEntries}
                onPersonClick={onPersonClick}
                className={roleClass('people')}
              />
              <span className="font-medium text-foreground">
                {String(peopleEntries[0].displayValue)}
              </span>
            </>
          )}
          {valuesFor('relation').map((entry) => (
            <span key={entry.field.name} className={roleClass('relation')}>
              · {String(entry.displayValue)}
            </span>
          ))}
          {attachmentEntry && (
            <span
              className={`inline-flex items-center gap-1 font-medium text-foreground ${roleClass('attachment')}`}
            >
              <Paperclip className="size-3.5" />
              {String(attachmentEntry.displayValue)} {attachmentEntry.field.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const groupAccent: Record<string, string> = {
  Intake: 'bg-sky-400',
  'In progress': 'bg-amber-400',
  Review: 'bg-violet-400',
  Closed: 'bg-emerald-400',
}

export function BoardCardRuntime({
  item,
  roleClass = () => '',
  onOpenDetail,
  onViewJson,
  onViewTemplate,
  onPersonClick,
}: RuntimeProps) {
  const { valuesFor } = useSelection(item, 'board-card')
  // groupKey is declared but never rendered as content — it only drives which
  // board column/rail this card belongs to (shown here as an accent color).
  const group = valuesFor('groupKey')[0]
  const progress = valuesFor('progress')[0]
  const interactive = Boolean(onOpenDetail)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpenDetail!(item) : undefined}
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-sm ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {onViewJson && onViewTemplate && (
        <HoverActions
          onViewJson={() => onViewJson(item)}
          onViewTemplate={() => onViewTemplate(item)}
        />
      )}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${roleClass('groupKey')} ${
          group
            ? (groupAccent[String(group.displayValue)] ??
              'bg-muted-foreground/30')
            : 'bg-muted-foreground/30'
        }`}
        aria-hidden="true"
      />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${roleClass('title')}`}>
            {item.name}
          </p>
          {valuesFor('priority').map((entry) => (
            <span
              key={entry.field.name}
              className={`shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive ${roleClass('priority')}`}
            >
              {String(entry.displayValue)}
            </span>
          ))}
        </div>
        {valuesFor('identifier').map((entry) => (
          <CopyableIdentifier
            key={entry.field.name}
            entry={entry}
            className={`mt-0.5 font-mono text-xs text-muted-foreground ${roleClass('identifier')}`}
          />
        ))}
        {valuesFor('flags').filter(
          (entry) => entry.value === true || entry.derived,
        ).length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-1.5 ${roleClass('flags')}`}>
            {valuesFor('flags')
              .filter((entry) => entry.value === true || entry.derived)
              .map((entry) => (
                <FlagIndicator key={entry.field.name} entry={entry} dense />
              ))}
          </div>
        )}
        {valuesFor('tags').length > 0 && (
          <TagList
            entries={valuesFor('tags')}
            className={`mt-2 ${roleClass('tags')}`}
          />
        )}
        {progress && (
          <div className={`mt-2 ${roleClass('progress')}`}>
            <ProgressBar
              label={progress.field.label}
              percent={progress.derivedPercent ?? progressPercent(progress, 40)}
              className="[&_span]:text-[10px]"
            />
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          {valuesFor('temporal').map((entry) => (
            <span key={entry.field.name} className={roleClass('temporal')}>
              {String(entry.displayValue)}
            </span>
          ))}
          <PersonAvatarStack
            entries={valuesFor('people')}
            onPersonClick={onPersonClick}
            className={roleClass('people')}
          />
        </div>
      </div>
    </div>
  )
}

export const runtimeByTemplate: Record<
  Template,
  React.ComponentType<RuntimeProps>
> = {
  'role-chip': RoleChipRuntime,
  row: RowRuntime,
  tile: TileRuntime,
  summary: SummaryRuntime,
  'detail-header': DetailHeaderRuntime,
  'kpi-card': KpiCardRuntime,
  'progress-card': ProgressCardRuntime,
  'alert-card': AlertCardRuntime,
  'party-card': PartyCardRuntime,
  'timeline-entry': TimelineEntryRuntime,
  'board-card': BoardCardRuntime,
}
