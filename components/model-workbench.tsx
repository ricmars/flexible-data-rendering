'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import models from '@/data/data-models.json'
import accountModel from '@/data/account-model.json'
import accounts from '@/data/accounts.json'
import buildingModel from '@/data/building-model.json'
import buildings from '@/data/buildings.json'
import caseModel from '@/data/case-model.json'
import cases from '@/data/cases.json'
import organizationModel from '@/data/organization-model.json'
import organizations from '@/data/organizations.json'
import patientModel from '@/data/patient-model.json'
import patients from '@/data/patients.json'
import phoneModel from '@/data/phone-model.json'
import phones from '@/data/phones.json'
import plantModel from '@/data/plant-model.json'
import plants from '@/data/plants.json'
import policyModel from '@/data/policy-model.json'
import policies from '@/data/policies.json'
import salesPersonModel from '@/data/sales-person-model.json'
import salesPeople from '@/data/sales-people.json'
import vehicleModel from '@/data/vehicle-model.json'
import vehicles from '@/data/vehicles.json'
import {
  AlertTriangle,
  Braces,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClockAlert,
  Eye,
  EyeOff,
  Layers3,
  LayoutTemplate,
  LockKeyhole,
  PanelRightClose,
  PanelRightOpen,
  Rows3,
  Save,
  Shapes,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  roleDefinitions as contractRoleDefinitions,
  semanticRoles,
  type Field,
  type RawRecord,
  type ResolvedField,
  type ResolvedRecord,
  type Density,
  type SemanticRole,
  type SlotCap,
} from '@/lib/rendering-contract'
import { resolveCollection, selectSlots } from '@/lib/resolve-record'

type Model = (typeof models)[number] & { fields: Field[] }
type RecordItem = ResolvedRecord & {
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
type Template = 'role-chip' | 'row' | 'tile' | 'summary' | 'detail-header'

function SafeImage({ alt, ...props }: React.ComponentProps<typeof Image>) {
  const [failedSource, setFailedSource] = useState<
    React.ComponentProps<typeof Image>['src'] | null
  >(null)

  if (!props.src || failedSource === props.src) return null

  return (
    <Image {...props} alt={alt} onError={() => setFailedSource(props.src)} />
  )
}

const semanticRoleLabels = Object.fromEntries(
  semanticRoles.map((role) => [role, contractRoleDefinitions[role].label]),
) as Record<SemanticRole, string>
const templates: {
  value: Template
  label: string
  description: string
  density: Density
  supportedRoles: SemanticRole[]
  slots: Partial<Record<SemanticRole, SlotCap>>
  regions: string[]
}[] = [
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
      'highlight',
      'progress',
      'temporal',
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
      highlight: 0,
      progress: 1,
      temporal: 1,
      people: 2,
      action: 1,
    },
    regions: [
      'Identity',
      'Alert',
      'Metrics',
      'Progress',
      'Description',
      'Key details',
      'Additional facts',
      'Actions',
    ],
  },
  {
    value: 'tile',
    label: 'Tile card',
    description: 'Browseable visual tile',
    density: 'standard',
    supportedRoles: [
      'media',
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
    label: 'Detail header',
    description: 'Full record identity header',
    density: 'full',
    supportedRoles: [
      'media',
      'title',
      'subtitle',
      'identifier',
      'status',
      'priority',
      'progress',
      'flags',
      'tags',
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
      title: 1,
      subtitle: 1,
      identifier: 1,
      status: 1,
      priority: 1,
      progress: 1,
      flags: 'all',
      tags: 5,
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
    regions: ['Identity', 'Status', 'Metrics', 'Narrative', 'Actions'],
  },
]
const canonicalizeFields = (fields: Field[]) => fields
const resolveTemplateSlots = (item: ResolvedRecord, template: Template) => {
  const definition = templates.find((entry) => entry.value === template)
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
const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value)
const formatMetric = (value: number, field: Field) =>
  field.type === 'currency'
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : formatNumber(value)
const modelSources: Record<
  string,
  {
    model: { name: string; description: string; fields: Field[] }
    records: RawRecord[]
  }
> = {
  vehicle: {
    model: vehicleModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: vehicles as RawRecord[],
  },
  phone: {
    model: phoneModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: phones as RawRecord[],
  },
  organization: {
    model: organizationModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: organizations as RawRecord[],
  },
  'sales-person': {
    model: salesPersonModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: salesPeople as RawRecord[],
  },
  building: {
    model: buildingModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: buildings as RawRecord[],
  },
  account: {
    model: accountModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: accounts as RawRecord[],
  },
  case: {
    model: caseModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: cases as RawRecord[],
  },
  patient: {
    model: patientModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: patients as RawRecord[],
  },
  policy: {
    model: policyModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: policies as RawRecord[],
  },
  plant: {
    model: plantModel as unknown as {
      name: string
      description: string
      fields: Field[]
    },
    records: plants as RawRecord[],
  },
}

function makeRecords(fields: Field[], records: RawRecord[]): RecordItem[] {
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

function FlagIndicator({
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
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground ${dense ? 'px-1.5' : ''}`}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={dense ? 'sr-only' : undefined}>{label}</span>
    </span>
  )
}

// Progress values can exceed 100 (e.g. quota attainment); clamp for display only.
function progressPercent(entry: ResolvedField, fallback: number) {
  const numeric = Number(entry.value)
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(100, numeric))
    : fallback
}

function ProgressBar({
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
function ProgressRing({
  label,
  percent,
  size = 30,
  className = '',
}: {
  label: string
  percent: number
  size?: number
  className?: string
}) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      title={`${label}: ${Math.round(percent)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-cyan-600"
        />
      </svg>
      <span className="absolute text-[9px] font-semibold text-foreground">
        {Math.round(percent)}
      </span>
    </span>
  )
}

function Detail({
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

function OperatorPopover({
  name,
  fieldLabel,
  onClose,
}: {
  name: string
  fieldLabel: string
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

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute left-1/2 top-1/2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-4 text-left shadow-2xl"
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

function HoverActions({
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
        className="rounded-md border bg-card/95 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:border-cyan-400 hover:text-foreground"
      >
        <Braces className="size-3.5" />
      </button>
      <button
        type="button"
        title="View template"
        aria-label="View template"
        onClick={(event) => {
          event.stopPropagation()
          onViewTemplate()
        }}
        className="rounded-md border bg-card/95 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition hover:border-cyan-400 hover:text-foreground"
      >
        <LayoutTemplate className="size-3.5" />
      </button>
    </span>
  )
}

function JsonModal({
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

function TemplateModal({
  item,
  template,
  onClose,
}: {
  item: RecordItem
  template: Template
  onClose: () => void
}) {
  const definition = templates.find((entry) => entry.value === template)!
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

function TemplateInspector({
  template,
  editingRole,
}: {
  template: Template
  editingRole?: SemanticRole
}) {
  const definition = templates.find((entry) => entry.value === template)!
  return (
    <div className="text-xs text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="font-semibold">
          {definition.label} · {definition.density} density
        </span>
        <span className="flex items-center gap-1">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Render order
          </span>
          {definition.supportedRoles.map((role, index) => (
            <span key={role} className="flex items-center">
              <span
                className={`semantic-region-${role} flex size-5 items-center justify-center rounded-full border text-[10px] font-bold`}
                style={{
                  backgroundColor: 'oklch(55% 0.16 var(--region-hue) / 0.25)',
                }}
              >
                {role.charAt(0).toUpperCase()}
              </span>
              {index < definition.supportedRoles.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/40" />
              )}
            </span>
          ))}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {definition.supportedRoles.map((role) => (
          <RoleChipTag
            key={role}
            role={role}
            editing={role === editingRole}
            suffix={`: ${definition.slots[role] === 'all' ? 'all' : (definition.slots[role] ?? 0)}`}
          />
        ))}
      </div>
    </div>
  )
}

function RoleChipTag({
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
      className={`role-chip semantic-region-${role} inline-flex items-stretch overflow-hidden rounded-md border text-[11px] font-medium ${editing ? 'role-chip-editing' : ''}`}
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

function RoleChipDot({ role }: { role: SemanticRole }) {
  return (
    <span
      className={`role-chip semantic-region-${role} flex size-full items-center justify-center rounded-full text-[11px] font-bold`}
    >
      {role.charAt(0).toUpperCase()}
    </span>
  )
}

function TemplateSample({
  template,
  fields,
}: {
  template: Template
  fields: Field[]
}) {
  const definition = templates.find((entry) => entry.value === template)!
  const usedRoles = new Set(fields.map((field) => field.semanticRole))
  const supports = (role: SemanticRole) =>
    definition.supportedRoles.includes(role) && usedRoles.has(role)

  if (template === 'role-chip')
    return (
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm shadow-sm">
        {supports('media') && (
          <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50">
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
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-blue-50">
            <RoleChipDot role="media" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          {supports('title') && <RoleChipTag role="title" />}
          {supports('subtitle') && <RoleChipTag role="subtitle" />}
          {supports('identifier') && <RoleChipTag role="identifier" />}
        </span>
        {supports('status') && <RoleChipTag role="status" />}
        {supports('flags') && <RoleChipTag role="flags" />}
        {supports('metric') && <RoleChipTag role="metric" />}
        {supports('progress') && <RoleChipTag role="progress" />}
        {(supports('temporal') || supports('people')) && (
          <span className="hidden flex-col items-end gap-1 sm:flex">
            {supports('temporal') && <RoleChipTag role="temporal" />}
            {supports('people') && <RoleChipTag role="people" />}
          </span>
        )}
        {supports('action') && <RoleChipTag role="action" />}
      </div>
    )

  if (template === 'summary')
    return (
      <div className="overflow-hidden rounded-xl border bg-card p-4 text-sm">
        <div className="flex min-w-0 items-start gap-3">
          {supports('media') && (
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-blue-50">
              <RoleChipDot role="media" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {supports('title') && <RoleChipTag role="title" />}
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
          <div className="flex h-44 w-full items-center justify-center bg-blue-50">
            <RoleChipTag role="media" />
          </div>
        )}
        <div className="flex flex-col gap-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Collection item
          </p>
          {supports('title') && (
            <span className="text-xl">
              <RoleChipTag role="title" />
            </span>
          )}
          <div className="space-y-3">
            {supports('identifier') && (
              <div className="flex flex-wrap gap-1.5">
                <RoleChipTag role="identifier" />
              </div>
            )}
            {(supports('status') ||
              supports('priority') ||
              supports('flags')) && (
              <div className="flex flex-wrap gap-1.5">
                {supports('status') && <RoleChipTag role="status" />}
                {supports('priority') && <RoleChipTag role="priority" />}
                {supports('flags') && <RoleChipTag role="flags" />}
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
          </div>
          {supports('subtitle') && <RoleChipTag role="subtitle" />}
          {supports('metric') && <RoleChipTag role="metric" />}
          {supports('description') && <RoleChipTag role="description" />}
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

  // tile
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {supports('media') && (
        <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-blue-50">
          <RoleChipTag role="media" />
          {supports('status') && (
            <span className="absolute left-3 top-3">
              <RoleChipTag role="status" />
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col items-start gap-1">
          {supports('title') && <RoleChipTag role="title" />}
          {supports('subtitle') && <RoleChipTag role="subtitle" />}
        </div>
        {supports('flags') && (
          <div className="flex flex-wrap gap-1.5">
            <RoleChipTag role="flags" />
          </div>
        )}
        {supports('highlight') && (
          <div className="grid gap-2 border-y py-3 sm:grid-cols-2">
            <RoleChipTag role="highlight" />
            <RoleChipTag role="highlight" />
          </div>
        )}
        {supports('tags') && (
          <div className="flex flex-wrap gap-1.5">
            <RoleChipTag role="tags" />
          </div>
        )}
        {supports('progress') && <RoleChipTag role="progress" />}
        {supports('description') && <RoleChipTag role="description" />}
        {supports('action') && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <RoleChipTag role="action" />
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateReference({
  fields,
  modelName,
}: {
  fields: Field[]
  modelName: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">UI templates</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every rendering template, its semantic role slots, and a mock preview
        based on the {modelName} model.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {templates.map((entry) => {
          const fieldsShown = fields.filter((field) =>
            entry.supportedRoles.includes(field.semanticRole),
          ).length
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
              </div>
              <div className="border-b bg-muted/30 p-4">
                <TemplateInspector template={entry.value} />
                <p className="mt-3 text-xs text-muted-foreground">
                  {fieldsShown} of {fields.length} fields from {modelName}{' '}
                  render in this template.
                </p>
              </div>
              <div
                className="flex-1 rounded-b-2xl p-4"
                style={{
                  backgroundImage:
                    'conic-gradient(rgba(128,128,128,0.14) 25%, transparent 25% 50%, rgba(128,128,128,0.14) 50% 75%, transparent 75%)',
                  backgroundSize: '16px 16px',
                }}
              >
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Eye className="size-3.5" />
                  Mock preview
                </p>
                <div
                  className={
                    entry.value === 'tile' || entry.value === 'detail-header'
                      ? 'max-w-sm'
                      : 'w-full'
                  }
                >
                  <TemplateSample template={entry.value} fields={fields} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SemanticRoleReference({
  fields,
  modelName,
}: {
  fields: Field[]
  modelName: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Semantic roles</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every semantic role available to a field, what it represents, and how
        many {modelName} fields currently use it.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {semanticRoles.map((role) => {
          const info = contractRoleDefinitions[role]
          const count = fields.filter(
            (field) => field.semanticRole === role,
          ).length
          return (
            <div key={role} className="rounded-xl border bg-card p-4">
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
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {info.representation}
              </p>
              <p className="mt-2 text-xs">
                {count} field{count === 1 ? '' : 's'} in {modelName}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ModelWorkbench() {
  const [modelId, setModelId] = useState('plant')
  const activeModel = useMemo<Model>(() => {
    const metadata = models.find((entry) => entry.id === modelId) ?? models[0]
    return {
      ...metadata,
      description: modelSources[metadata.id].model.description,
      fields: canonicalizeFields(modelSources[metadata.id].model.fields),
    }
  }, [modelId])
  const [fields, setFields] = useState<Field[]>(
    canonicalizeFields(modelSources.plant.model.fields),
  )
  const [selectedId, setSelectedId] = useState('')
  const [template, setTemplate] = useState<Template>('tile')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All statuses')
  const [sort, setSort] = useState('Available first')
  const [page, setPage] = useState(1)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [showTemplateStructure, setShowTemplateStructure] = useState(false)
  const [activeTab, setActiveTab] = useState<'records' | 'templates' | 'roles'>(
    'records',
  )
  const [detail, setDetail] = useState<RecordItem | null>(null)
  const [jsonItem, setJsonItem] = useState<RecordItem | null>(null)
  const [templateItem, setTemplateItem] = useState<RecordItem | null>(null)
  const [operator, setOperator] = useState<{
    name: string
    fieldLabel: string
  } | null>(null)
  const records = useMemo(
    () => makeRecords(fields, modelSources[modelId].records),
    [fields, modelId],
  )
  const editingRole = fields.find(
    (field) => field.name === selectedId,
  )?.semanticRole
  const activeTemplateDef = templates.find((entry) => entry.value === template)!
  const visible = useMemo(() => {
    const result = records
      .filter((item) =>
        `${item.name} ${item.subtitle} ${item.location} ${item.status} ${item.tags.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .filter((item) => filter === 'All statuses' || item.status === filter)
    if (sort === 'A–Z') result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'Value: low to high') result.sort((a, b) => a.price - b.price)
    if (sort === 'Value: high to low') result.sort((a, b) => b.price - a.price)
    if (sort === 'Available first')
      result.sort((a, b) => Number(b.available) - Number(a.available))
    return result
  }, [records, query, filter, sort])
  const pageItems = visible.slice((page - 1) * 6, page * 6)
  const setQueryAndReset = (value: string) => {
    setQuery(value)
    setPage(1)
  }
  const setFilterAndReset = (value: string) => {
    setFilter(value)
    setPage(1)
  }
  const setSortAndReset = (value: string) => {
    setSort(value)
    setPage(1)
  }
  const updateSemanticRole = (fieldName: string, semanticRole: SemanticRole) =>
    setFields((current) =>
      current.map((field) =>
        field.name === fieldName ? { ...field, semanticRole } : field,
      ),
    )
  const updateRank = (fieldName: string, rank: number) =>
    setFields((current) =>
      current.map((field) =>
        field.name === fieldName
          ? { ...field, rank: Math.max(1, Math.floor(rank) || 1) }
          : field,
      ),
    )
  const switchModel = (id: string) => {
    const next = modelSources[id] ?? modelSources.plant
    setModelId(id)
    setFields(canonicalizeFields(next.model.fields))
    setSelectedId('')
    setPage(1)
    setQuery('')
    setDetail(null)
  }
  const renderItems = () => {
    const roleClass = (role: SemanticRole) =>
      editingRole === role
        ? `semantic-region semantic-region-${role} semantic-region-editing`
        : ''
    const slotSelectionFor = (item: RecordItem) =>
      resolveTemplateSlots(item, template)
    const selectedValuesFor = (item: RecordItem, role: SemanticRole) =>
      slotSelectionFor(item).byRole[role] ?? []
    const selectedValueFor = (item: RecordItem, role: SemanticRole) =>
      selectedValuesFor(item, role)[0]?.displayValue
    const selectedTextFor = (item: RecordItem, role: SemanticRole) =>
      selectedValuesFor(item, role)
        .map((entry) => String(entry.displayValue ?? ''))
        .filter(Boolean)
    const selectedTemporalFor = (item: RecordItem, qualifier?: string) => {
      const values = selectedValuesFor(item, 'temporal')
      if (!qualifier) return values
      return values.filter((entry) => entry.field.qualifier === qualifier)
    }
    const selectedMetricTextFor = (item: RecordItem) => {
      const entry = selectedValuesFor(item, 'metric')[0]
      if (!entry) return '—'
      return entry.masked
        ? String(entry.displayValue)
        : formatMetric(Number(entry.value), entry.field)
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
    const personControl = (entry: ResolvedRecord['fields'][number]) => {
      const name = String(entry.displayValue)
      return (
        <span
          key={entry.field.name}
          role="button"
          tabIndex={0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:border-cyan-400"
          onClick={(event) => {
            event.stopPropagation()
            setOperator({ name, fieldLabel: entry.field.label })
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              setOperator({ name, fieldLabel: entry.field.label })
            }
          }}
        >
          <span className="grid size-5 place-items-center rounded-full bg-cyan-100 text-[9px] font-bold text-cyan-800">
            {initialsFor(name)}
          </span>
          {name}
        </span>
      )
    }
    const relationControl = (
      entry: ResolvedRecord['fields'][number],
      item: RecordItem,
    ) => (
      <span
        key={entry.field.name}
        role="link"
        tabIndex={0}
        className="cursor-pointer text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:text-cyan-900"
        onClick={(event) => {
          event.stopPropagation()
          setDetail(item)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            setDetail(item)
          }
        }}
      >
        {String(entry.displayValue)}
      </span>
    )
    if (template === 'role-chip')
      return (
        <div className="flex flex-wrap gap-2">
          {pageItems.map((item) => {
            const title = selectedValueFor(item, 'title')
            const status = selectedValueFor(item, 'status')
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setDetail(item)
                  }
                }}
                className="group inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-2 text-left text-sm shadow-sm transition hover:border-cyan-400 hover:shadow-md"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-cyan-100 text-[10px] font-semibold text-cyan-800 ${roleClass('media')}`}
                >
                  <SafeImage
                    src={item.image}
                    alt=""
                    width={24}
                    height={24}
                    className="size-full object-cover"
                  />
                </span>
                <span
                  className={`min-w-0 truncate font-medium ${roleClass('title')}`}
                >
                  {String(title)}
                </span>
                <span
                  className={`shrink-0 text-xs text-muted-foreground ${roleClass('status')}`}
                >
                  {String(status)}
                </span>
                <HoverActions
                  variant="inline"
                  onViewJson={() => setJsonItem(item)}
                  onViewTemplate={() => setTemplateItem(item)}
                />
              </div>
            )
          })}
        </div>
      )
    if (template === 'row')
      return (
        <div className="overflow-hidden rounded-xl border bg-card">
          {pageItems.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDetail(item)
                }
              }}
              className="group relative flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition last:border-0 hover:bg-muted/40"
            >
              <HoverActions
                onViewJson={() => setJsonItem(item)}
                onViewTemplate={() => setTemplateItem(item)}
              />
              <span
                className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-cyan-100 text-xs font-semibold text-cyan-800 ${roleClass('media')}`}
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
                <span
                  className={`block truncate text-xs text-muted-foreground ${roleClass('subtitle')}`}
                >
                  {item.subtitle || item.location}
                </span>
                {selectedValuesFor(item, 'identifier').map((entry) => (
                  <span
                    key={entry.field.name}
                    className={`mt-1 block truncate font-mono text-[11px] text-muted-foreground ${roleClass('identifier')}`}
                  >
                    {String(entry.displayValue)}
                  </span>
                ))}
              </span>
              <span
                className={`shrink-0 text-xs text-muted-foreground ${roleClass('status')}`}
              >
                {item.status}
              </span>
              {selectedValuesFor(item, 'flags').length > 0 && (
                <span
                  className={`hidden shrink-0 flex-wrap justify-end gap-1 sm:flex ${roleClass('flags')}`}
                >
                  {selectedValuesFor(item, 'flags')
                    .filter((entry) => entry.value === true || entry.derived)
                    .map((entry) => (
                      <FlagIndicator
                        key={entry.field.name}
                        entry={entry}
                        dense
                      />
                    ))}
                </span>
              )}
              <span
                className={`shrink-0 text-right text-sm font-medium ${roleClass('metric')}`}
              >
                {selectedMetricTextFor(item)}
              </span>
              {selectedValuesFor(item, 'progress').length > 0 &&
                (() => {
                  const entry = selectedValuesFor(item, 'progress')[0]
                  return (
                    <span
                      className={`hidden shrink-0 sm:block ${roleClass('progress')}`}
                    >
                      <ProgressRing
                        label={entry.field.label}
                        percent={progressPercent(entry, 65)}
                      />
                    </span>
                  )
                })()}
              <span className="hidden shrink-0 flex-col items-end gap-1 text-[11px] text-muted-foreground sm:flex">
                {selectedTemporalFor(item).map((entry) => (
                  <time
                    key={entry.field.name}
                    className={roleClass('temporal')}
                  >
                    {String(entry.displayValue)}
                  </time>
                ))}
                {selectedValuesFor(item, 'people').map((entry) => (
                  <span key={entry.field.name} className={roleClass('people')}>
                    {String(entry.displayValue)}
                  </span>
                ))}
              </span>
              {selectedValuesFor(item, 'action').length > 0 && (
                <span
                  className={`hidden shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground sm:block ${roleClass('action')}`}
                >
                  {String(selectedValueFor(item, 'action'))}
                </span>
              )}
            </div>
          ))}
        </div>
      )
    if (template !== 'tile' && template !== 'summary')
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {pageItems.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDetail(item)
                }
              }}
              data-resolved-roles={Object.keys(
                slotSelectionFor(item).byRole,
              ).join(',')}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-md"
            >
              <HoverActions
                onViewJson={() => setJsonItem(item)}
                onViewTemplate={() => setTemplateItem(item)}
              />
              <SafeImage
                src={item.image}
                alt={item.name}
                width={1200}
                height={400}
                className={`h-44 w-full object-cover ${roleClass('media')}`}
              />
              <div className="flex flex-col gap-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Collection item
                </p>
                <h3
                  className={`font-semibold ${template === 'detail-header' ? 'text-xl' : ''} ${roleClass('title')}`}
                >
                  {item.name}
                </h3>
                {template === 'detail-header' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedValuesFor(item, 'identifier').map((entry) => (
                        <span
                          key={entry.field.name}
                          className={`font-mono text-xs text-muted-foreground ${roleClass('identifier')}`}
                        >
                          {String(entry.displayValue)}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedValuesFor(item, 'status').map((entry) => (
                        <span
                          key={entry.field.name}
                          className={`rounded-full bg-muted px-2 py-1 text-xs text-foreground ${roleClass('status')}`}
                        >
                          {String(entry.displayValue)}
                        </span>
                      ))}
                      {selectedValuesFor(item, 'priority').map((entry) => (
                        <span
                          key={entry.field.name}
                          className={`rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-800 ${roleClass('priority')}`}
                        >
                          {String(entry.displayValue)}
                        </span>
                      ))}
                      {selectedValuesFor(item, 'flags')
                        .filter(
                          (entry) => entry.value === true || entry.derived,
                        )
                        .map((entry) => (
                          <FlagIndicator
                            key={entry.field.name}
                            entry={entry}
                            dense
                          />
                        ))}
                    </div>
                    {selectedValuesFor(item, 'tags').length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1.5 ${roleClass('tags')}`}
                      >
                        {selectedTextFor(item, 'tags').map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border bg-muted/60 px-2 py-1 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedValuesFor(item, 'progress').length > 0 &&
                      (() => {
                        const entry = selectedValuesFor(item, 'progress')[0]
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
                  </div>
                )}
                <p
                  className={`text-sm text-muted-foreground ${roleClass('subtitle')}`}
                >
                  {item.subtitle}
                </p>
                {selectedValuesFor(item, 'metric').length > 0 && (
                  <p className={`text-xl font-semibold ${roleClass('metric')}`}>
                    {selectedMetricTextFor(item)}
                  </p>
                )}
                {selectedValuesFor(item, 'description').length > 0 && (
                  <p
                    className={`line-clamp-2 text-xs leading-relaxed text-muted-foreground ${roleClass('description')}`}
                  >
                    {item.description}
                  </p>
                )}
                {template === 'detail-header' && (
                  <>
                    {selectedValuesFor(item, 'temporal').length > 0 && (
                      <div
                        className={`flex flex-wrap gap-2 text-xs text-muted-foreground ${roleClass('temporal')}`}
                      >
                        {selectedValuesFor(item, 'temporal').map((entry) => (
                          <time key={entry.field.name}>
                            {entry.field.label}: {String(entry.displayValue)}
                          </time>
                        ))}
                      </div>
                    )}
                    {selectedValuesFor(item, 'location').length > 0 && (
                      <p className={`text-sm ${roleClass('location')}`}>
                        {selectedTextFor(item, 'location').join(', ')}
                      </p>
                    )}
                    {selectedValuesFor(item, 'people').length > 0 && (
                      <div
                        className={`flex flex-wrap gap-2 text-sm ${roleClass('people')}`}
                      >
                        {selectedValuesFor(item, 'people').map((entry) =>
                          personControl(entry),
                        )}
                      </div>
                    )}
                    {selectedValuesFor(item, 'annotation').length > 0 && (
                      <p
                        className={`text-xs text-muted-foreground ${roleClass('annotation')}`}
                      >
                        {selectedTextFor(item, 'annotation').join(' · ')}
                      </p>
                    )}
                    {selectedValuesFor(item, 'relation').length > 0 && (
                      <div
                        className={`flex flex-wrap gap-2 text-xs text-muted-foreground ${roleClass('relation')}`}
                      >
                        {selectedValuesFor(item, 'relation').map((entry) => (
                          <span key={entry.field.name}>
                            {entry.field.label}: {relationControl(entry, item)}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedValuesFor(item, 'secondary').length > 0 && (
                      <div
                        className={`grid gap-2 sm:grid-cols-2 ${roleClass('secondary')}`}
                      >
                        {selectedValuesFor(item, 'secondary').map((entry) => (
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
                    {selectedValuesFor(item, 'action').length > 0 && (
                      <div
                        className={`flex flex-wrap gap-2 ${roleClass('action')}`}
                      >
                        {selectedValuesFor(item, 'action').map((entry) => (
                          <span
                            key={entry.field.name}
                            className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
                          >
                            {String(entry.displayValue)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    if (template === 'summary')
      return (
        <div className="overflow-hidden rounded-xl border">
          <div className="hidden grid-cols-[minmax(180px,1.4fr)_140px_120px_120px_28px] gap-4 border-b bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{activeModel.name}</span>
            <span>Location</span>
            <span>Value</span>
            <span>Status</span>
            <span />
          </div>
          {pageItems.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDetail(item)
                }
              }}
              className="group relative cursor-pointer border-b border-border/60 p-4 text-sm last:border-0 hover:bg-muted/30"
            >
              <HoverActions
                onViewJson={() => setJsonItem(item)}
                onViewTemplate={() => setTemplateItem(item)}
              />
              <div className="flex min-w-0 items-start gap-3">
                <SafeImage
                  src={item.image}
                  alt=""
                  width={40}
                  height={40}
                  className={`size-10 rounded-lg object-cover ${roleClass('media')}`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${roleClass('title')}`}>
                    {item.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {selectedValuesFor(item, 'subtitle').map((entry) => (
                      <span
                        key={entry.field.name}
                        className={roleClass('subtitle')}
                      >
                        {String(entry.displayValue)}
                      </span>
                    ))}
                    {selectedValuesFor(item, 'identifier').map((entry) => (
                      <span
                        key={entry.field.name}
                        className={`font-mono ${roleClass('identifier')}`}
                      >
                        {String(entry.displayValue)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {selectedValuesFor(item, 'status').map((entry) => (
                    <span
                      key={entry.field.name}
                      className={`rounded-full bg-muted px-2 py-1 text-xs ${roleClass('status')}`}
                    >
                      {String(entry.displayValue)}
                    </span>
                  ))}
                  {selectedValuesFor(item, 'priority').map((entry) => (
                    <span
                      key={entry.field.name}
                      className={`rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-800 ${roleClass('priority')}`}
                    >
                      {String(entry.displayValue)}
                    </span>
                  ))}
                </div>
              </div>
              {selectedValuesFor(item, 'flags').length > 0 && (
                <div
                  className={`mt-3 flex flex-wrap gap-1.5 ${roleClass('flags')}`}
                >
                  {selectedValuesFor(item, 'flags')
                    .filter((entry) => entry.value === true || entry.derived)
                    .map((entry) => (
                      <FlagIndicator key={entry.field.name} entry={entry} />
                    ))}
                </div>
              )}
              {selectedValuesFor(item, 'highlight').length > 0 && (
                <div
                  className={`mt-3 grid gap-3 border-y py-3 sm:grid-cols-3 ${roleClass('highlight')}`}
                >
                  {selectedValuesFor(item, 'highlight').map((entry) => (
                    <div key={entry.field.name}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {entry.field.label}
                      </p>
                      <p className="mt-1 font-semibold">
                        {String(entry.displayValue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {selectedValuesFor(item, 'progress').length > 0 &&
                (() => {
                  const entry = selectedValuesFor(item, 'progress')[0]
                  return (
                    <div className={`mt-3 ${roleClass('progress')}`}>
                      <ProgressBar
                        label={entry.field.label}
                        percent={progressPercent(entry, 65)}
                      />
                    </div>
                  )
                })()}
              {selectedValuesFor(item, 'description').length > 0 && (
                <p
                  className={`mt-3 line-clamp-2 text-muted-foreground ${roleClass('description')}`}
                >
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {selectedTemporalFor(item, 'due').map((entry) => (
                  <time
                    key={entry.field.name}
                    className={roleClass('temporal')}
                  >
                    {String(entry.displayValue)}
                  </time>
                ))}
                {selectedValuesFor(item, 'people').map((entry) => (
                  <span key={entry.field.name} className={roleClass('people')}>
                    {personControl(entry)}
                  </span>
                ))}
                {selectedValuesFor(item, 'relation').map((entry) => (
                  <span
                    key={entry.field.name}
                    className={roleClass('relation')}
                  >
                    {entry.field.label}: {relationControl(entry, item)}
                  </span>
                ))}
              </div>
              {selectedValuesFor(item, 'tags').length > 0 && (
                <div
                  className={`mt-3 flex flex-wrap gap-1.5 ${roleClass('tags')}`}
                >
                  {selectedTextFor(item, 'tags').map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border bg-muted/60 px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {selectedValuesFor(item, 'action').length > 0 && (
                <div
                  className={`mt-3 flex flex-wrap gap-2 ${roleClass('action')}`}
                >
                  {selectedValuesFor(item, 'action').map((entry) => (
                    <span
                      key={entry.field.name}
                      className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      {String(entry.displayValue)}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )
    return (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {pageItems.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setDetail(item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setDetail(item)
              }
            }}
            data-resolved-roles={Object.keys(
              slotSelectionFor(item).byRole,
            ).join(',')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <HoverActions
              onViewJson={() => setJsonItem(item)}
              onViewTemplate={() => setTemplateItem(item)}
            />
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <SafeImage
                src={item.image}
                alt={item.name}
                width={1200}
                height={675}
                className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${roleClass('media')}`}
              />
              {selectedValuesFor(item, 'status').length > 0 && (
                <span
                  className={`absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm ${roleClass('status')}`}
                >
                  {String(selectedValueFor(item, 'status'))}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h3
                  className={`font-semibold tracking-tight ${roleClass('title')}`}
                >
                  {item.name}
                </h3>
                <p
                  className={`mt-1 text-xs text-muted-foreground ${roleClass('subtitle')}`}
                >
                  {item.subtitle}
                </p>
              </div>
              {selectedValuesFor(item, 'flags').length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${roleClass('flags')}`}>
                  {selectedValuesFor(item, 'flags')
                    .filter((entry) => entry.value === true || entry.derived)
                    .map((entry) => (
                      <FlagIndicator key={entry.field.name} entry={entry} />
                    ))}
                </div>
              )}
              {selectedValuesFor(item, 'highlight').length > 0 && (
                <div
                  className={`grid gap-2 border-y py-3 sm:grid-cols-2 ${roleClass('highlight')}`}
                >
                  {selectedValuesFor(item, 'highlight').map((entry) => (
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
              {selectedValuesFor(item, 'metric').length > 0 && (
                <div className="flex items-end justify-between border-y py-3">
                  <p className={`text-lg font-semibold ${roleClass('metric')}`}>
                    {selectedMetricTextFor(item)}
                  </p>
                  {selectedValuesFor(item, 'highlight').length > 0 && (
                    <p
                      className={`text-xs text-muted-foreground ${roleClass('highlight')}`}
                    >
                      {String(selectedValueFor(item, 'highlight'))}
                    </p>
                  )}
                </div>
              )}
              {selectedValuesFor(item, 'tags').length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${roleClass('tags')}`}>
                  {selectedValuesFor(item, 'tags').flatMap((entry) =>
                    (Array.isArray(entry.displayValue)
                      ? entry.displayValue.map(String)
                      : [String(entry.displayValue ?? '')]
                    ).map((tag) => (
                      <span
                        key={`${entry.field.name}-${tag}`}
                        className="rounded-md border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    )),
                  )}
                </div>
              )}
              {selectedValuesFor(item, 'progress').length > 0 &&
                (() => {
                  const entry = selectedValuesFor(item, 'progress')[0]
                  return (
                    <div className={roleClass('progress')}>
                      <ProgressBar
                        label={entry.field.label}
                        percent={progressPercent(
                          entry,
                          item.available ? 72 : 42,
                        )}
                      />
                    </div>
                  )
                })()}
              {selectedValuesFor(item, 'description').length > 0 && (
                <p
                  className={`line-clamp-2 text-xs leading-relaxed text-muted-foreground ${roleClass('description')}`}
                >
                  {item.description}
                </p>
              )}
              {selectedValuesFor(item, 'action').length > 0 && (
                <div
                  className={`flex flex-wrap gap-2 border-t pt-3 ${roleClass('action')}`}
                >
                  {selectedValuesFor(item, 'action').map((entry) => (
                    <span
                      key={entry.field.name}
                      className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      {String(entry.displayValue)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {detail && (
        <Detail
          item={detail}
          model={activeModel}
          onClose={() => setDetail(null)}
        />
      )}
      {operator && (
        <OperatorPopover
          name={operator.name}
          fieldLabel={operator.fieldLabel}
          onClose={() => setOperator(null)}
        />
      )}
      {jsonItem && (
        <JsonModal
          item={jsonItem}
          model={activeModel}
          onClose={() => setJsonItem(null)}
        />
      )}
      {templateItem && (
        <TemplateModal
          item={templateItem}
          template={template}
          onClose={() => setTemplateItem(null)}
        />
      )}
      <div className="shrink-0 border-b bg-muted/40 shadow-sm">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-6 py-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold">Data object</span>
            <select
              value={modelId}
              onChange={(event) => switchModel(event.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm font-normal shadow-sm"
            >
              {models.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {entry.industry}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
            {(
              [
                { id: 'records', label: 'Data Records', icon: Rows3 },
                {
                  id: 'templates',
                  label: 'UI Templates',
                  icon: LayoutTemplate,
                },
                { id: 'roles', label: 'Semantic Roles', icon: Shapes },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          {activeTab === 'templates' && (
            <TemplateReference fields={fields} modelName={activeModel.name} />
          )}
          {activeTab === 'roles' && (
            <SemanticRoleReference
              fields={fields}
              modelName={activeModel.name}
            />
          )}
          {activeTab === 'records' && (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {activeModel.name} model
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fields.length} fields · {activeModel.description}
                  </p>
                </div>
              </div>
              <div
                className={`grid gap-6 ${isPanelCollapsed ? 'xl:grid-cols-[minmax(0,1fr)_3.5rem]' : 'xl:grid-cols-[minmax(0,1fr)_350px]'}`}
              >
                <section className="min-w-0 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.03] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" />
                      Live preview
                    </p>
                    <button
                      type="button"
                      aria-pressed={showTemplateStructure}
                      onClick={() =>
                        setShowTemplateStructure((current) => !current)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition ${
                        showTemplateStructure
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Layers3 className="size-3.5" />
                      {showTemplateStructure ? 'Hide' : 'Show'} template
                    </button>
                  </div>
                  {showTemplateStructure && (
                    <div className="mb-4 rounded-2xl border border-primary/30 shadow-sm">
                      <div className="rounded-t-2xl border-b border-dashed border-primary/20 bg-muted p-3">
                        <TemplateInspector
                          template={template}
                          editingRole={editingRole}
                        />
                      </div>
                      <div className="rounded-b-2xl bg-muted/30 p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Isolated preview
                        </p>
                        <div
                          className={
                            template === 'tile' || template === 'detail-header'
                              ? 'max-w-sm'
                              : 'w-full'
                          }
                        >
                          <TemplateSample template={template} fields={fields} />
                        </div>
                      </div>
                    </div>
                  )}
                  {renderToolbar(
                    activeModel,
                    template,
                    setTemplate,
                    query,
                    setQueryAndReset,
                    filter,
                    setFilterAndReset,
                    sort,
                    setSortAndReset,
                    page,
                    setPage,
                    visible.length,
                  )}
                  {renderItems()}
                  <p className="mt-4 text-xs text-muted-foreground">
                    Showing {Math.min((page - 1) * 6 + 1, visible.length)}–
                    {Math.min(page * 6, visible.length)} of {visible.length}{' '}
                    records
                  </p>
                </section>
                <aside className="overflow-hidden rounded-2xl border bg-card shadow-sm xl:sticky xl:top-4 xl:flex xl:max-h-[calc(100vh-9rem)] xl:flex-col">
                  {isPanelCollapsed ? (
                    <div className="flex flex-row items-center justify-center gap-2 p-2 xl:flex-col">
                      <button
                        type="button"
                        onClick={() => setIsPanelCollapsed(false)}
                        aria-label="Expand data model panel"
                        title="Expand data model panel"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <PanelRightOpen className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="shrink-0 border-b px-4 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              Edit Semantic Role Mapping
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {fields.length} fields · {activeModel.name}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button size="sm" onClick={() => setSelectedId('')}>
                              <Save className="size-3.5" />
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={() => setIsPanelCollapsed(true)}
                              aria-label="Collapse data model panel"
                              title="Collapse data model panel"
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <PanelRightClose className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 p-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                        {fields.map((field) => {
                          const isOpen = selectedId === field.name
                          const isPresent =
                            activeTemplateDef.supportedRoles.includes(
                              field.semanticRole,
                            )
                          return (
                            <div
                              key={field.name}
                              className={`shrink-0 overflow-hidden rounded-xl ${isOpen ? 'border border-primary/30' : ''}`}
                            >
                              <button
                                onClick={() =>
                                  setSelectedId(isOpen ? '' : field.name)
                                }
                                aria-expanded={isOpen}
                                className={`flex w-full items-center gap-3 px-3 py-3 text-left ${isOpen ? 'bg-primary/10' : 'rounded-xl hover:bg-muted/60'}`}
                              >
                                <span className="flex shrink-0 flex-col items-center gap-0.5">
                                  <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rank
                                  </span>
                                  <span
                                    className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${isOpen ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
                                  >
                                    {field.rank}
                                  </span>
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold">
                                    {field.label}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                                      {field.type}
                                    </span>
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  <RoleChipTag
                                    role={field.semanticRole}
                                    compact
                                  />
                                  <span
                                    title={
                                      isPresent
                                        ? `Shown in ${activeTemplateDef.label}`
                                        : `Not used by ${activeTemplateDef.label}`
                                    }
                                    aria-label={
                                      isPresent
                                        ? `Shown in ${activeTemplateDef.label}`
                                        : `Not used by ${activeTemplateDef.label}`
                                    }
                                  >
                                    {isPresent ? (
                                      <Eye className="size-3.5 text-foreground" />
                                    ) : (
                                      <EyeOff className="size-3.5 text-muted-foreground/40" />
                                    )}
                                  </span>
                                  <ChevronDown
                                    className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                  />
                                </span>
                              </button>
                              {isOpen && (
                                <div className="border-t border-primary/20 bg-card p-4">
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Semantic role
                                    </p>
                                  </div>
                                  <select
                                    value={field.semanticRole}
                                    onChange={(event) =>
                                      updateSemanticRole(
                                        field.name,
                                        event.target.value as SemanticRole,
                                      )
                                    }
                                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                                  >
                                    {semanticRoles.map((semanticRole) => (
                                      <option
                                        key={semanticRole}
                                        value={semanticRole}
                                      >
                                        {semanticRoleLabels[semanticRole]}
                                      </option>
                                    ))}
                                  </select>
                                  <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rank
                                    <input
                                      type="number"
                                      min={1}
                                      step={1}
                                      value={field.rank}
                                      onChange={(event) =>
                                        updateRank(
                                          field.name,
                                          Number(event.target.value),
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm font-normal text-foreground"
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function renderToolbar(
  activeModel: Model,
  template: Template,
  setTemplate: (value: Template) => void,
  query: string,
  setQuery: (value: string) => void,
  filter: string,
  setFilter: (value: string) => void,
  sort: string,
  setSort: (value: string) => void,
  page: number,
  setPage: (value: number) => void,
  resultCount: number,
) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Choose template"
          value={template}
          onChange={(event) => setTemplate(event.target.value as Template)}
          className="rounded-lg border bg-card px-3 py-2.5 text-sm shadow-sm"
        >
          {templates.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label} · {entry.density} · {entry.description}
            </option>
          ))}
        </select>

        {resultCount > 0 && (
          <div className="ml-auto flex items-center gap-1 rounded-lg border bg-card p-1 text-xs shadow-sm">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {Math.ceil(resultCount / 6)}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= Math.ceil(resultCount / 6)}
              onClick={() => setPage(page + 1)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
