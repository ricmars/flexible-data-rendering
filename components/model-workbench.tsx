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
  ChevronLeft,
  ChevronRight,
  ClockAlert,
  Info,
  Layers3,
  LockKeyhole,
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
      temporal: 1,
      people: 2,
      action: 1,
    },
    regions: [
      'Identity',
      'Alert',
      'Metrics',
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

function RoleTooltip({
  role,
  children,
  onHoverRole,
}: {
  role: SemanticRole
  children: React.ReactNode
  onHoverRole?: (role: SemanticRole | null) => void
}) {
  const definition = contractRoleDefinitions[role]
  return (
    <span
      className="group/role relative inline-flex"
      onMouseEnter={() => onHoverRole?.(role)}
      onMouseLeave={() => onHoverRole?.(null)}
    >
      {children}
      <span className="pointer-events-none invisible absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl bg-primary p-3 text-left text-primary-foreground opacity-0 shadow-xl transition group-hover/role:visible group-hover/role:opacity-100">
        <span className="block text-xs font-semibold">{definition.label}</span>
        <span className="mt-1 block text-[11px] leading-relaxed text-primary-foreground/75">
          {definition.definition}
        </span>
        <span className="mt-2 block text-[10px] text-primary-foreground/55">
          {definition.representation}
        </span>
      </span>
    </span>
  )
}

function TemplateInspector({
  template,
  onHoverRole,
}: {
  template: Template
  onHoverRole: (role: SemanticRole | null) => void
}) {
  const definition = templates.find((entry) => entry.value === template)!
  return (
    <div className="mb-4 rounded-xl border border-dashed border-border bg-muted p-3 text-xs text-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-semibold">
          {definition.label} · {definition.density} density
        </span>
        <span className="text-cyan-800/75">
          {definition.regions.join(' · ')}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {definition.supportedRoles.map((role) => (
          <RoleTooltip key={role} role={role} onHoverRole={onHoverRole}>
            <span className="rounded-full border border-border bg-card px-2 py-1 font-medium text-foreground">
              {contractRoleDefinitions[role].label}:{' '}
              {definition.slots[role] === 'all'
                ? 'all'
                : (definition.slots[role] ?? 0)}
            </span>
          </RoleTooltip>
        ))}
      </div>
    </div>
  )
}

export default function ModelWorkbench() {
  const [modelId, setModelId] = useState('vehicle')
  const activeModel = useMemo<Model>(() => {
    const metadata = models.find((entry) => entry.id === modelId) ?? models[0]
    return {
      ...metadata,
      description: modelSources[metadata.id].model.description,
      fields: canonicalizeFields(modelSources[metadata.id].model.fields),
    }
  }, [modelId])
  const [fields, setFields] = useState<Field[]>(
    canonicalizeFields(modelSources.vehicle.model.fields),
  )
  const [selectedId, setSelectedId] = useState(
    modelSources.vehicle.model.fields[0].name,
  )
  const [template, setTemplate] = useState<Template>('tile')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All statuses')
  const [sort, setSort] = useState('Available first')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<'editor' | 'preview'>('editor')
  const [highlightRegions, setHighlightRegions] = useState(false)
  const [hoveredRole, setHoveredRole] = useState<SemanticRole | null>(null)
  const [detail, setDetail] = useState<RecordItem | null>(null)
  const [operator, setOperator] = useState<{
    name: string
    fieldLabel: string
  } | null>(null)
  const records = useMemo(
    () => makeRecords(fields, modelSources[modelId].records),
    [fields, modelId],
  )
  const selected = fields.find((field) => field.name === selectedId)
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
  const updateSemanticRole = (semanticRole: SemanticRole) =>
    setFields((current) =>
      current.map((field) =>
        field.name === selectedId ? { ...field, semanticRole } : field,
      ),
    )
  const updateRank = (rank: number) =>
    setFields((current) =>
      current.map((field) =>
        field.name === selectedId
          ? { ...field, rank: Math.max(1, Math.floor(rank) || 1) }
          : field,
      ),
    )
  const switchModel = (id: string) => {
    const next = modelSources[id] ?? modelSources.vehicle
    setModelId(id)
    setFields(canonicalizeFields(next.model.fields))
    setSelectedId(next.model.fields[0].name)
    setPage(1)
    setQuery('')
    setDetail(null)
  }
  const renderItems = () => {
    const roleClass = (role: SemanticRole) =>
      highlightRegions
        ? `semantic-region semantic-region-${role}${hoveredRole === role ? ' semantic-region-hovered' : ''}`
        : ''
    const slotSelectionFor = (item: RecordItem) => {
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
              <button
                key={item.id}
                onClick={() => setDetail(item)}
                className="inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-2 text-left text-sm shadow-sm transition hover:border-cyan-400 hover:shadow-md"
              >
                <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-cyan-100 text-[10px] font-semibold text-cyan-800">
                  <SafeImage
                    src={item.image}
                    alt=""
                    width={24}
                    height={24}
                    className="size-full object-cover"
                  />
                </span>
                <span className="min-w-0 truncate font-medium">
                  {String(title)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {String(status)}
                </span>
              </button>
            )
          })}
        </div>
      )
    if (template === 'row')
      return (
        <div className="overflow-hidden rounded-xl border bg-card">
          {pageItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetail(item)}
              className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition last:border-0 hover:bg-muted/40"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-cyan-100 text-xs font-semibold text-cyan-800">
                <SafeImage
                  src={item.image}
                  alt=""
                  width={36}
                  height={36}
                  className="size-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
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
              <span className="shrink-0 text-right text-sm font-medium">
                {selectedMetricTextFor(item)}
              </span>
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
            </button>
          ))}
        </div>
      )
    if (template !== 'tile' && template !== 'summary')
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {pageItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetail(item)}
              data-resolved-roles={Object.keys(
                slotSelectionFor(item).byRole,
              ).join(',')}
              className="group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-md"
            >
              <SafeImage
                src={item.image}
                alt={item.name}
                width={1200}
                height={400}
                className="h-44 w-full object-cover"
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
                    {selectedValuesFor(item, 'progress').length > 0 && (
                      <div
                        className={`rounded-md bg-muted/50 p-2 text-xs ${roleClass('progress')}`}
                      >
                        Progress: {String(selectedValueFor(item, 'progress'))}
                      </div>
                    )}
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
            </button>
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
              onClick={() => setDetail(item)}
              className="cursor-pointer border-b border-border/60 p-4 text-sm last:border-0 hover:bg-muted/30"
            >
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
          <button
            key={item.id}
            onClick={() => setDetail(item)}
            data-resolved-roles={Object.keys(
              slotSelectionFor(item).byRole,
            ).join(',')}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
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
              {template === 'tile' && (
                <div className={`space-y-1.5 ${roleClass('progress')}`}>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {String(selectedValueFor(item, 'progress') ?? 'Progress')}
                    </span>
                    <span>{item.available ? '72%' : '42%'}</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    aria-label="Progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.available ? 72 : 42}
                  >
                    <div
                      className="h-full rounded-full bg-cyan-600"
                      style={{ width: item.available ? '72%' : '42%' }}
                    />
                  </div>
                </div>
              )}
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
          </button>
        ))}
      </div>
    )
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
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
      <div className="mx-auto max-w-[1500px] px-6 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeModel.name} model
            </h1>
          </div>
          <div className="flex items-center gap-1 rounded-xl border bg-card p-1 text-xs shadow-sm">
            <button
              onClick={() => setMode('editor')}
              className={`rounded-lg px-3 py-2 font-medium ${mode === 'editor' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Model editor
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`rounded-lg px-3 py-2 font-medium ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Preview mode
            </button>
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            Data object{' '}
            <select
              value={modelId}
              onChange={(event) => switchModel(event.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm"
            >
              {models.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {entry.industry}
                </option>
              ))}
            </select>
          </label>
        </div>
        {mode === 'editor' ? (
          <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-4">
                <div>
                  <p className="text-sm font-semibold">Data model</p>
                  <p className="text-xs text-muted-foreground">
                    {fields.length} fields · {activeModel.name}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2">
                {fields.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => setSelectedId(field.name)}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-left ${selectedId === field.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {field.label}
                      </span>
                      <span
                        className={`block truncate text-[11px] ${selectedId === field.name ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                      >
                        {field.name} · {field.type}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <RoleTooltip role={field.semanticRole}>
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {semanticRoleLabels[field.semanticRole]}
                        </span>
                      </RoleTooltip>
                      <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Rank {field.rank}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {selected && (
                <div className="border-t bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Semantic role
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {selected.label}
                      </p>
                    </div>
                  </div>
                  <select
                    value={selected.semanticRole}
                    onChange={(event) =>
                      updateSemanticRole(event.target.value as SemanticRole)
                    }
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    {semanticRoles.map((semanticRole) => (
                      <option key={semanticRole} value={semanticRole}>
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
                      value={selected.rank}
                      onChange={(event) =>
                        updateRank(Number(event.target.value))
                      }
                      className="mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm font-normal text-foreground"
                    />
                  </label>
                  <div className="mt-3 rounded-lg border bg-card p-3 text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <Info className="size-3.5 text-cyan-700" />
                      {contractRoleDefinitions[selected.semanticRole].label}
                    </div>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {
                        contractRoleDefinitions[selected.semanticRole]
                          .definition
                      }
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {
                        contractRoleDefinitions[selected.semanticRole]
                          .representation
                      }
                    </p>
                  </div>
                </div>
              )}
            </aside>
            <section className="min-w-0">
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
                highlightRegions,
                setHighlightRegions,
                setHoveredRole,
              )}
              {renderItems()}
            </section>
          </div>
        ) : (
          <section>
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
              highlightRegions,
              setHighlightRegions,
              setHoveredRole,
            )}
            {renderItems()}
          </section>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {Math.min((page - 1) * 6 + 1, visible.length)}–
          {Math.min(page * 6, visible.length)} of {visible.length} records
        </p>
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
  highlightRegions: boolean,
  setHighlightRegions: (value: boolean) => void,
  onHoverRole: (role: SemanticRole | null) => void,
) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
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
      <button
        type="button"
        aria-pressed={highlightRegions}
        onClick={() => setHighlightRegions(!highlightRegions)}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-sm ${highlightRegions ? 'border-border bg-muted text-foreground' : 'bg-card'}`}
      >
        <Layers3 className="size-4" />
        Inspect structure
      </button>

      {highlightRegions && (
        <TemplateInspector template={template} onHoverRole={onHoverRole} />
      )}
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
  )
}
