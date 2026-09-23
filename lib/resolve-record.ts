import {
  fallbackChains,
  type Field,
  type RawRecord,
  type ResolutionDiagnostic,
  type ResolvedField,
  type ResolvedRecord,
  roleDefinitions,
  singletonRoles,
  type SemanticRole,
  type Sensitivity,
  type SlotCap,
  type TemplateDefinition,
} from './rendering-contract'

const terminalStatuses = new Set([
  'approved',
  'closed',
  'completed',
  'resolved',
  'cancelled',
])

const stringValue = (value: unknown) =>
  value == null
    ? ''
    : Array.isArray(value)
      ? value.map(String).join(', ')
      : String(value)

const isPresent = (value: unknown) =>
  value !== undefined && value !== null && value !== ''

const isCompatible = (field: Field, value: unknown) => {
  if (!isPresent(value)) return true
  if (field.type === 'number' || field.type === 'currency')
    return typeof value === 'number' || !Number.isNaN(Number(value))
  if (field.type === 'boolean') return typeof value === 'boolean'
  if (field.type === 'image') return typeof value === 'string'
  if (field.type === 'date' || field.format === 'datetime')
    return typeof value === 'string' || value instanceof Date
  return true
}

const sensitivityFor = (field: Field, record: RawRecord): Sensitivity => {
  const value = field.sensitivity ?? record.sensitivity
  return value === 'restricted' ||
    value === 'confidential' ||
    value === 'internal'
    ? value
    : 'public'
}

const maskValue = (value: unknown, sensitivity: Sensitivity) =>
  sensitivity === 'public' ? value : '••••••'

const synthetic = (
  role: SemanticRole,
  value: unknown,
  label: string,
  declarationOrder: number,
): ResolvedField => ({
  field: {
    name: `derived.${role}`,
    label,
    type: 'text',
    semanticRole: role,
    rank: 0,
  },
  role,
  value,
  displayValue: value,
  rank: 0,
  declarationOrder,
  masked: false,
  derived: true,
})

export function resolveRecord(
  fields: Field[],
  record: RawRecord,
): ResolvedRecord {
  const diagnostics: ResolutionDiagnostic[] = []
  const resolved: ResolvedField[] = []

  fields.forEach((field, declarationOrder) => {
    const value = record[field.name]
    if (!isPresent(value)) return
    if (!isCompatible(field, value)) {
      diagnostics.push({
        severity: 'warning',
        code: 'incompatible-value',
        message: `${field.label} does not match the declared ${field.type} type.`,
        role: field.semanticRole,
        field: field.name,
      })
      return
    }
    const sensitivity = sensitivityFor(field, record)
    const masked = sensitivity !== 'public'
    if (masked) {
      diagnostics.push({
        severity: 'warning',
        code: 'masked-value',
        message: `${field.label} is masked by its sensitivity policy.`,
        role: field.semanticRole,
        field: field.name,
      })
    }
    resolved.push({
      field,
      role: field.semanticRole,
      value,
      displayValue: maskValue(value, sensitivity),
      rank: field.rank ?? 0,
      declarationOrder,
      masked,
    })
  })

  const byRole: Partial<Record<SemanticRole, ResolvedField[]>> = {}
  resolved.forEach((entry) => {
    byRole[entry.role] ??= []
    byRole[entry.role]!.push(entry)
  })
  Object.values(byRole).forEach((entries) =>
    entries?.sort(
      (a, b) => a.rank - b.rank || a.declarationOrder - b.declarationOrder,
    ),
  )

  if (!byRole.identifier?.length) {
    byRole.identifier = [
      synthetic('identifier', record.id, 'Identifier', fields.length + 1),
    ]
  }

  singletonRoles.forEach((role) => {
    const entries = byRole[role]
    if (entries && entries.length > 1) {
      diagnostics.push({
        severity: 'warning',
        code: 'duplicate-singleton',
        message: `${roleDefinitions[role].label} has multiple values; the first ranked value will render.`,
        role,
      })
    }
  })

  const fallback = (role: SemanticRole) => {
    if (byRole[role]?.length) return
    const chain = fallbackChains[role] ?? []
    const source = chain
      .map((candidate) => byRole[candidate]?.[0])
      .find((entry) => entry && isPresent(entry.displayValue))
    if (!source) {
      if (role === 'title') {
        byRole.title = [synthetic('title', 'Record', 'Title', fields.length)]
        diagnostics.push({
          severity: 'warning',
          code: 'missing-title',
          message: 'Title fallback uses the object type.',
          role,
        })
      }
      return
    }
    const entry = synthetic(
      role,
      source.displayValue,
      roleDefinitions[role].label,
      fields.length + 1,
    )
    byRole[role] = [entry]
    diagnostics.push({
      severity: 'warning',
      code: 'fallback-used',
      message: `${roleDefinitions[role].label} uses ${source.role} as a fallback.`,
      role,
    })
  }

  fallback('title')
  fallback('subtitle')
  fallback('status')
  if (!byRole.media?.length && byRole.title?.[0]) {
    const initials = stringValue(byRole.title[0].displayValue)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
    byRole.media = [
      synthetic('media', initials || '•', 'Media fallback', fields.length + 2),
    ]
    diagnostics.push({
      severity: 'warning',
      code: 'fallback-used',
      message: 'Media fallback uses title initials.',
      role: 'media',
    })
  }

  if (byRole.temporal?.length && byRole.status?.[0]) {
    const due = byRole.temporal.find((entry) => entry.field.qualifier === 'due')
    const dueDate = due?.value ? new Date(String(due.value)) : undefined
    const status = stringValue(byRole.status[0].value).toLowerCase()
    if (
      dueDate &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate < new Date() &&
      !terminalStatuses.has(status)
    ) {
      byRole.flags ??= []
      byRole.flags.push(
        synthetic('flags', 'Overdue', 'Overdue', fields.length + 4),
      )
    }
  }

  // status → derived from progress → omit. Only synthesize when the
  // progress field carries a stage qualifier; a bare percentage isn't a
  // meaningful status label, so the role is left absent (omitted) instead.
  if (!byRole.status?.length && byRole.progress?.[0]) {
    const progressEntry = byRole.progress[0]
    const stageLabel = progressEntry.field.qualifier
      ? stringValue(progressEntry.displayValue)
      : undefined
    if (stageLabel) {
      byRole.status = [
        synthetic('status', stageLabel, 'Status', fields.length + 5),
      ]
      diagnostics.push({
        severity: 'warning',
        code: 'fallback-used',
        message: 'Status derived from progress stage.',
        role: 'status',
      })
    }
  }

  // progress.pct derived from stage/of when the raw value isn't already a
  // percent (format: 'stage', value like "3" with a stageOfSource sibling).
  byRole.progress?.forEach((entry) => {
    if (entry.field.format !== 'stage' || entry.derived) return
    const stage = Number(entry.value)
    const of = entry.field.stageOfSource
      ? Number(record[entry.field.stageOfSource])
      : undefined
    if (Number.isFinite(stage) && of && Number.isFinite(of) && of > 0) {
      entry.derivedPercent = Math.round((stage / of) * 100)
    }
  })

  // metric.trend derived from a declared history/prior-value sibling field —
  // computed once, centrally, rather than per template.
  byRole.metric?.forEach((entry) => {
    const trendSource = entry.field.trendSource
    if (!trendSource) return
    const previous = Number(record[trendSource])
    const current = Number(entry.value)
    if (
      Number.isFinite(previous) &&
      previous !== 0 &&
      Number.isFinite(current)
    ) {
      entry.trendPercent = ((current - previous) / Math.abs(previous)) * 100
    }
  })

  return {
    id: record.id,
    fields: resolved,
    byRole,
    diagnostics,
  }
}

export function resolveCollection(fields: Field[], records: RawRecord[]) {
  return records.map((record) => resolveRecord(fields, record))
}

/**
 * Sensitivity resolves before every other rule, including hero promotion: a
 * masked field must never be promoted to hero, even when its rank would
 * otherwise select it. Returns the first unmasked candidate for the role.
 */
export function pickHero(
  record: ResolvedRecord,
  role: SemanticRole,
): ResolvedField | undefined {
  return record.byRole[role]?.find((entry) => !entry.masked)
}

export type SelectedSlots = {
  byRole: Partial<Record<SemanticRole, ResolvedField[]>>
  available: Partial<Record<SemanticRole, number>>
  rendered: Partial<Record<SemanticRole, number>>
  dropped: Partial<Record<SemanticRole, number>>
}

export function selectSlots(
  record: ResolvedRecord,
  template: TemplateDefinition,
): SelectedSlots {
  const byRole: SelectedSlots['byRole'] = {}
  const available: SelectedSlots['available'] = {}
  const rendered: SelectedSlots['rendered'] = {}
  const dropped: SelectedSlots['dropped'] = {}
  Object.entries(record.byRole).forEach(([role, entries]) => {
    const semanticRole = role as SemanticRole
    const values = entries ?? []
    available[semanticRole] = values.length
    const cap: SlotCap | undefined = template.slots[semanticRole]
    if (cap === undefined) return
    const selected = cap === 'all' ? values : values.slice(0, cap)
    byRole[semanticRole] = selected
    rendered[semanticRole] = selected.length
    if (selected.length < values.length)
      dropped[semanticRole] = values.length - selected.length
  })
  return { byRole, available, rendered, dropped }
}
