'use client'

import type { Field, RawRecord, SemanticRole } from '@/lib/rendering-contract'
import {
  formatMetric,
  makeRecords,
  progressPercent,
  RoleChipTag,
  SafeImage,
  type RecordItem,
} from '@/components/template-runtime'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

/**
 * Section 06 of the content model: collection views fall out of the same
 * declared roles as single-record templates. A view becomes available when
 * its required role is present on the object — calendar needs `temporal`,
 * map needs `location`, board needs `status` or `groupKey`, and so on. None
 * of this is view-specific code: it is the same `byRole` data every other
 * template reads, just projected across a collection instead of one record.
 */

export type CollectionView =
  | 'table'
  | 'list'
  | 'grid'
  | 'board'
  | 'calendar'
  | 'timeline'
  | 'map'
  | 'chart'
  | 'funnel'

export type CollectionViewCatalogEntry = {
  value: CollectionView
  label: string
  description: string
  requiredRoles: SemanticRole[]
  match: 'any' | 'all'
  hero: string
}

export const collectionViewCatalog: CollectionViewCatalogEntry[] = [
  {
    value: 'table',
    label: 'Table',
    description: 'Bulk review, export, reconciliation — click a header to sort',
    requiredRoles: ['sortKey', 'groupKey'],
    match: 'any',
    hero: 'sortKey',
  },
  {
    value: 'list',
    label: 'List',
    description: 'Compact rows, optional section headers from groupKey',
    requiredRoles: [],
    match: 'any',
    hero: '—',
  },
  {
    value: 'grid',
    label: 'Grid',
    description:
      'Media tiles; degrades to initials-only tiles when media is absent',
    requiredRoles: ['media'],
    match: 'any',
    hero: 'media',
  },
  {
    value: 'board',
    label: 'Board',
    description: 'One column per enum value; card = compact tier + progress',
    requiredRoles: ['status', 'groupKey'],
    match: 'any',
    hero: 'status or groupKey',
  },
  {
    value: 'calendar',
    label: 'Calendar',
    description:
      'Placement from the temporal qualifier chosen at view config time',
    requiredRoles: ['temporal'],
    match: 'any',
    hero: 'temporal',
  },
  {
    value: 'timeline',
    label: 'Timeline',
    description: 'Chronological gutter; description clamped to two lines',
    requiredRoles: ['temporal'],
    match: 'any',
    hero: 'temporal',
  },
  {
    value: 'map',
    label: 'Map',
    description: 'Pin clustering; chip tier renders in the popover',
    requiredRoles: ['location'],
    match: 'any',
    hero: 'location',
  },
  {
    value: 'chart',
    label: 'Chart',
    description: 'metric becomes series, groupKey becomes dimension',
    requiredRoles: ['metric'],
    match: 'any',
    hero: 'metric',
  },
  {
    value: 'funnel',
    label: 'Funnel',
    description: 'Aggregated metric totals by declared group stage',
    requiredRoles: ['groupKey', 'metric'],
    match: 'all',
    hero: 'groupKey + metric',
  },
]

export function isViewAvailable(
  fields: Field[],
  entry: CollectionViewCatalogEntry,
) {
  if (entry.requiredRoles.length === 0) return true
  const present = (role: SemanticRole) =>
    fields.some((field) => field.semanticRole === role)
  return entry.match === 'all'
    ? entry.requiredRoles.every(present)
    : entry.requiredRoles.some(present)
}

export function CollectionViewAvailability({
  fields,
  modelName,
}: {
  fields: Field[]
  modelName: string
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 font-semibold">View</th>
            <th className="px-3 py-2 font-semibold">Required role</th>
            <th className="px-3 py-2 font-semibold">What it maps to</th>
            <th className="px-3 py-2 font-semibold">For {modelName}</th>
          </tr>
        </thead>
        <tbody>
          {collectionViewCatalog.map((entry) => {
            const available = isViewAvailable(fields, entry)
            return (
              <tr key={entry.value} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{entry.label}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {entry.hero}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {entry.description}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      available
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function useCollectionRecords(fields: Field[], records: RawRecord[]) {
  return useMemo(
    () => makeRecords(fields, records).slice(0, 8),
    [fields, records],
  )
}

function TableViewMock({
  fields,
  records,
}: {
  fields: Field[]
  records: RawRecord[]
}) {
  const items = useCollectionRecords(fields, records)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const sorted = useMemo(() => {
    const withRank = items.map((item) => ({
      item,
      rank: Number(item.byRole.sortKey?.[0]?.value ?? 0),
    }))
    withRank.sort((a, b) =>
      sortDir === 'asc' ? a.rank - b.rank : b.rank - a.rank,
    )
    return withRank.map((entry) => entry.item)
  }, [items, sortDir])

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">
              <button
                type="button"
                onClick={() =>
                  setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                }
                className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
              >
                Title
                {sortDir === 'asc' ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
              </button>
            </th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Metric</th>
            <th className="px-3 py-2 font-semibold">Due</th>
            <th className="px-3 py-2 font-semibold">Owner</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const metricEntry = item.byRole.metric?.[0]
            const dueEntry = item.byRole.temporal?.find(
              (entry) => entry.field.qualifier === 'due',
            )
            const owner = item.byRole.people?.[0]
            return (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {metricEntry
                    ? formatMetric(Number(metricEntry.value), metricEntry.field)
                    : '—'}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {dueEntry ? String(dueEntry.displayValue) : '—'}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {owner ? String(owner.displayValue) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="flex items-center gap-1 border-t bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
        <ArrowUpDown className="size-3" /> Sorted by the object&apos;s declared
        sortKey — click the header to flip direction.
      </p>
    </div>
  )
}

function ListViewMock({ items }: { items: RecordItem[] }) {
  return (
    <div className="divide-y rounded-xl border">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
        >
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-muted-foreground">
            {item.byRole.groupKey?.[0]
              ? String(item.byRole.groupKey[0].displayValue)
              : item.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function GridViewMock({ items }: { items: RecordItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-xl border bg-card"
        >
          <div className="relative aspect-square bg-muted">
            {item.image ? (
              <SafeImage
                src={item.image}
                alt={item.name}
                width={200}
                height={200}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-lg font-bold text-muted-foreground">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <p className="truncate p-2 text-xs font-medium">{item.name}</p>
        </div>
      ))}
    </div>
  )
}

function BoardViewMock({ items }: { items: RecordItem[] }) {
  const columns = ['Intake', 'In progress', 'Review', 'Closed']
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {columns.map((column) => {
        const columnItems = items.filter(
          (item) => String(item.byRole.groupKey?.[0]?.displayValue) === column,
        )
        return (
          <div key={column} className="rounded-xl border bg-muted/20 p-2">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {column} · {columnItems.length}
            </p>
            <div className="flex flex-col gap-2">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-2 text-xs shadow-sm"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-muted-foreground">{item.status}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CalendarViewMock({ items }: { items: RecordItem[] }) {
  const byMonth = new Map<string, RecordItem[]>()
  items.forEach((item) => {
    const due = item.byRole.temporal?.find(
      (entry) => entry.field.qualifier === 'due',
    )
    const value = due?.value ?? item.date
    const date = value ? new Date(String(value)) : undefined
    const key =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unscheduled'
    byMonth.set(key, [...(byMonth.get(key) ?? []), item])
  })
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from(byMonth.entries()).map(([month, monthItems]) => (
        <div key={month} className="rounded-xl border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {month}
          </p>
          <ul className="space-y-1.5 text-xs">
            {monthItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2"
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TimelineViewMock({ items }: { items: RecordItem[] }) {
  const sorted = [...items].sort((a, b) => {
    const aUpdated = a.byRole.temporal?.find(
      (e) => e.field.qualifier === 'updated',
    )
    const bUpdated = b.byRole.temporal?.find(
      (e) => e.field.qualifier === 'updated',
    )
    return String(bUpdated?.value ?? '').localeCompare(
      String(aUpdated?.value ?? ''),
    )
  })
  return (
    <ol className="space-y-3 border-l pl-4">
      {sorted.map((item) => {
        const updated = item.byRole.temporal?.find(
          (e) => e.field.qualifier === 'updated',
        )
        return (
          <li key={item.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-cyan-500" />
            <p className="text-xs text-muted-foreground">
              {updated ? String(updated.displayValue) : '—'}
            </p>
            <p className="font-medium">{item.name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function MapViewMock({ items }: { items: RecordItem[] }) {
  const located = items.filter((item) => item.byRole.location?.length)
  if (located.length === 0)
    return (
      <p className="rounded-xl border p-4 text-sm text-muted-foreground">
        No fields with the <RoleChipTag role="location" /> role — the map view
        is unavailable for this object.
      </p>
    )
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {located.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-xl border p-3"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-100 text-cyan-800">
            📍
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {String(item.byRole.location![0].displayValue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartViewMock({ items }: { items: RecordItem[] }) {
  const withMetric = items
    .map((item) => ({ item, entry: item.byRole.metric?.[0] }))
    .filter(
      (
        row,
      ): row is {
        item: RecordItem
        entry: NonNullable<RecordItem['byRole']['metric']>[number]
      } => Boolean(row.entry),
    )
  if (withMetric.length === 0)
    return (
      <p className="rounded-xl border p-4 text-sm text-muted-foreground">
        No fields with the <RoleChipTag role="metric" /> role — the chart view
        is unavailable for this object.
      </p>
    )
  const max = Math.max(
    ...withMetric.map((row) => Number(row.entry.value) || 0),
    1,
  )
  return (
    <div className="space-y-2 rounded-xl border p-4">
      {withMetric.map(({ item, entry }) => {
        const value = Number(entry.value) || 0
        const percent = progressPercent(
          { ...entry, value: (value / max) * 100 },
          0,
        )
        return (
          <div key={item.id} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 truncate">{item.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-medium">
              {formatMetric(value, entry.field)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FunnelViewMock({ items }: { items: RecordItem[] }) {
  const totals = new Map<string, { value: number; count: number }>()
  items.forEach((item) => {
    const stage = item.byRole.groupKey?.[0]?.displayValue
    const metric = item.byRole.metric?.[0]?.value
    if (stage == null || metric == null) return
    const key = String(stage)
    const current = totals.get(key) ?? { value: 0, count: 0 }
    totals.set(key, {
      value: current.value + (Number(metric) || 0),
      count: current.count + 1,
    })
  })
  const stages = Array.from(totals.entries())
  const maximum = Math.max(1, ...stages.map(([, entry]) => entry.value))
  if (stages.length === 0)
    return (
      <p className="rounded-md border p-4 text-sm text-muted-foreground">
        Funnel requires both a group stage and a metric.
      </p>
    )
  return (
    <ol className="space-y-2 rounded-xl border bg-card p-4">
      {stages.map(([stage, entry], index) => (
        <li
          key={stage}
          className="mx-auto"
          style={{ width: `${Math.max(38, 100 - index * 11)}%` }}
        >
          <div className="flex items-center justify-between gap-3 rounded-md bg-primary px-3 py-2 text-primary-foreground">
            <span className="truncate text-sm font-medium">{stage}</span>
            <span className="shrink-0 text-xs">
              {formatMetric(
                entry.value,
                items[0].byRole.metric?.[0]?.field ??
                  ({ type: 'number' } as Field),
              )}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{entry.count} records</span>
            <span>{Math.round((entry.value / maximum) * 100)}% of max</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function CollectionViewMock({
  view,
  fields,
  records,
}: {
  view: CollectionView
  fields: Field[]
  records: RawRecord[]
}) {
  const items = useCollectionRecords(fields, records)
  switch (view) {
    case 'table':
      return <TableViewMock fields={fields} records={records} />
    case 'list':
      return <ListViewMock items={items} />
    case 'grid':
      return <GridViewMock items={items} />
    case 'board':
      return <BoardViewMock items={items} />
    case 'calendar':
      return <CalendarViewMock items={items} />
    case 'timeline':
      return <TimelineViewMock items={items} />
    case 'map':
      return <MapViewMock items={items} />
    case 'chart':
      return <ChartViewMock items={items} />
    case 'funnel':
      return <FunnelViewMock items={items} />
  }
}

export function CollectionTemplateReference({
  fields,
  records,
  modelName,
}: {
  fields: Field[]
  records: RawRecord[]
  modelName: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">
        Collection templates
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Views over the {modelName} collection, driven entirely by declared roles
        — nothing here is hard-coded per object.
      </p>
      <div className="mt-4">
        <CollectionViewAvailability fields={fields} modelName={modelName} />
      </div>
      <div className="mt-6 grid gap-6">
        {collectionViewCatalog.map((entry) => (
          <div key={entry.value}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{entry.label}</h3>
              <span className="text-xs text-muted-foreground">
                {entry.description}
              </span>
            </div>
            <CollectionViewMock
              view={entry.value}
              fields={fields}
              records={records}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
