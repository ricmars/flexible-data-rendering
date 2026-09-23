export const semanticRoles = [
  'media',
  'title',
  'subtitle',
  'identifier',
  'objectType',
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
  'secondary',
  'description',
  'annotation',
  'relation',
  'attachment',
  'action',
  'navigation',
  'sortKey',
  'groupKey',
  'searchText',
  'sensitivity',
] as const

export type SemanticRole = (typeof semanticRoles)[number]
export type Density = 'micro' | 'compact' | 'standard' | 'rich' | 'full'
export type FormatHint =
  | 'text'
  | 'code'
  | 'enum'
  | 'image'
  | 'initials'
  | 'glyph'
  | 'swatch'
  | 'number'
  | 'percent'
  | 'stage'
  | 'boolean'
  | 'labelSet'
  | 'datetime'
  | 'partyRef'
  | 'address'
  | 'richText'
  | 'refCount'
  | 'fileRef'
  | 'command'
  | 'route'
  | 'policy'
  | 'labelValue'
  | 'ordinal'
  | 'collation'
  | 'enumRef'

export type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted'

export type Field = {
  name: string
  label: string
  type: string
  semanticRole: SemanticRole
  rank: number
  format?: FormatHint
  qualifier?: string
  tone?: string
  sensitivity?: Sensitivity
  searchText?: boolean
  sortKey?: string
  groupKey?: string
  /** Name of a sibling field holding the prior value used to derive metric.trend. */
  trendSource?: string
  /** Name of a sibling field holding the "of" denominator for a stage-format progress field. */
  stageOfSource?: string
}

export type RawRecord = Record<string, unknown> & { id: string }

export type ResolvedField = {
  field: Field
  role: SemanticRole
  value: unknown
  displayValue: unknown
  rank: number
  declarationOrder: number
  masked: boolean
  derived?: boolean
  /** Percent delta derived from a trend history, e.g. metric.trend. */
  trendPercent?: number
  /** Percent complete derived from a stage/of pair when not directly supplied. */
  derivedPercent?: number
}

export type ResolutionDiagnostic = {
  severity: 'warning' | 'error'
  code:
    | 'missing-title'
    | 'duplicate-singleton'
    | 'invalid-role'
    | 'incompatible-value'
    | 'fallback-used'
    | 'masked-value'
    | 'overflow'
  message: string
  role?: SemanticRole
  field?: string
}

export type ResolvedRecord = {
  id: string
  fields: ResolvedField[]
  byRole: Partial<Record<SemanticRole, ResolvedField[]>>
  diagnostics: ResolutionDiagnostic[]
}

export type SlotCap = number | 'all'
export type TemplateDefinition = {
  id: string
  label: string
  description: string
  density: Density
  slots: Partial<Record<SemanticRole, SlotCap>>
  hero?: SemanticRole
}

export const densityOrder: Density[] = [
  'micro',
  'compact',
  'standard',
  'rich',
  'full',
]

export const roleDefinitions: Record<
  SemanticRole,
  {
    label: string
    definition: string
    representation: string
    singleton?: boolean
  }
> = {
  media: {
    label: 'Media',
    definition: 'Visual recognition anchor.',
    representation: 'Image, initials, or glyph',
    singleton: true,
  },
  title: {
    label: 'Title',
    definition: 'The object name.',
    representation: 'Headline',
    singleton: true,
  },
  subtitle: {
    label: 'Subtitle',
    definition: 'A disambiguating qualifier.',
    representation: 'Muted text',
  },
  identifier: {
    label: 'Identifier',
    definition: 'A human-readable business key.',
    representation: 'Copyable code',
    singleton: true,
  },
  objectType: {
    label: 'Object type',
    definition: "The object's own class. Mandatory in mixed-type surfaces.",
    representation: 'Enum badge',
    singleton: true,
  },
  status: {
    label: 'Status',
    definition: 'The current lifecycle state.',
    representation: 'Tone-aware badge',
    singleton: true,
  },
  priority: {
    label: 'Priority',
    definition: 'Ordinal severity.',
    representation: 'Rail, tint, or badge',
    singleton: true,
  },
  progress: {
    label: 'Progress',
    definition: 'Completion or stage.',
    representation: 'Bar or stepper',
    singleton: true,
  },
  flags: {
    label: 'Flags',
    definition: 'Boolean attention signals.',
    representation: 'Icon or label set',
  },
  tags: {
    label: 'Tags',
    definition: 'Open categorical classification.',
    representation: 'Tag set',
  },
  highlight: {
    label: 'Highlights',
    definition: 'Facts important for scanning.',
    representation: 'Label/value pairs',
  },
  metric: {
    label: 'Metrics',
    definition: 'Quantitative values.',
    representation: 'Number with unit',
  },
  temporal: {
    label: 'Temporal',
    definition: 'Qualified dates and times.',
    representation: 'Relative time',
  },
  people: {
    label: 'People',
    definition: 'Role-qualified party references.',
    representation: 'Avatar and name',
  },
  location: {
    label: 'Location',
    definition: 'Address or coordinates.',
    representation: 'Address or map pin',
    singleton: true,
  },
  secondary: {
    label: 'Secondary',
    definition: 'Additional factual metadata.',
    representation: 'Label/value pairs',
  },
  description: {
    label: 'Description',
    definition: 'Unstructured narrative.',
    representation: 'Clamped prose',
    singleton: true,
  },
  annotation: {
    label: 'Annotation',
    definition: 'Low-salience provenance.',
    representation: 'Recessive text',
    singleton: true,
  },
  relation: {
    label: 'Relations',
    definition: 'Links to related objects.',
    representation: 'Reference counts',
  },
  attachment: {
    label: 'Attachments',
    definition: 'File references.',
    representation: 'File list',
  },
  action: {
    label: 'Actions',
    definition: 'Qualified commands.',
    representation: 'Buttons or menu',
  },
  navigation: {
    label: 'Navigation',
    definition: 'The object click target.',
    representation: 'Route',
    singleton: true,
  },
  sortKey: {
    label: 'Sort key',
    definition: 'Declared sort dimensions.',
    representation: 'Behavioral only',
  },
  groupKey: {
    label: 'Group key',
    definition: 'Declared grouping dimensions.',
    representation: 'Behavioral only',
  },
  searchText: {
    label: 'Search text',
    definition: 'Explicit full-text inputs.',
    representation: 'Behavioral only',
  },
  sensitivity: {
    label: 'Sensitivity',
    definition: 'Access and masking policy.',
    representation: 'Behavioral only',
    singleton: true,
  },
}

export const fallbackChains: Partial<Record<SemanticRole, SemanticRole[]>> = {
  title: ['identifier', 'objectType'],
  media: [],
  subtitle: ['identifier', 'objectType'],
  status: [],
  metric: ['highlight'],
}

export const templates: TemplateDefinition[] = [
  {
    id: 'micro',
    label: 'Micro',
    description: 'Inline token and autocomplete surface',
    density: 'micro',
    slots: { media: 1, title: 1, status: 1 },
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Dense list row',
    density: 'compact',
    slots: {
      media: 1,
      title: 1,
      subtitle: 1,
      identifier: 1,
      status: 1,
      metric: 1,
      temporal: 1,
      people: 2,
      flags: 2,
      action: 1,
    },
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Scannable workhorse card',
    density: 'standard',
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 1,
      status: 1,
      flags: 2,
      highlight: 2,
      tags: 2,
      progress: 1,
    },
  },
  {
    id: 'rich',
    label: 'Rich',
    description: 'Comprehension without navigation',
    density: 'rich',
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 2,
      identifier: 1,
      status: 1,
      priority: 1,
      flags: 3,
      highlight: 3,
      tags: 3,
      description: 1,
      temporal: 1,
      people: 3,
      secondary: 2,
      relation: 2,
      action: 2,
    },
  },
  {
    id: 'full',
    label: 'Full',
    description: 'Every visible role resolves',
    density: 'full',
    slots: {
      media: 1,
      objectType: 1,
      title: 1,
      subtitle: 2,
      identifier: 1,
      status: 1,
      priority: 1,
      progress: 1,
      flags: 'all',
      tags: 'all',
      highlight: 'all',
      metric: 'all',
      temporal: 'all',
      people: 'all',
      location: 1,
      secondary: 'all',
      description: 1,
      annotation: 1,
      relation: 'all',
      attachment: 'all',
      action: 'all',
    },
  },
]

export const singletonRoles = new Set(
  semanticRoles.filter((role) => roleDefinitions[role].singleton),
)
