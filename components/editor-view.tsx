'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  LayoutTemplate,
  PanelRightClose,
  PanelRightOpen,
  PencilLine,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { modelSources, resolveModel } from '@/lib/model-sources'
import {
  roleDefinitions as contractRoleDefinitions,
  semanticRoles,
  type Field,
  type SemanticRole,
} from '@/lib/rendering-contract'
import {
  RoleChipTag,
  TemplateMockPreview,
  makeRecords,
  templateCatalog,
  runtimeByTemplate,
  type RecordItem,
  type Template,
} from '@/components/template-runtime'
import { TemplateInspector } from '@/components/template-reference'
import {
  Detail,
  JsonModal,
  OperatorPopover,
  TemplateModal,
} from '@/components/record-modals'

const semanticRoleLabels = Object.fromEntries(
  semanticRoles.map((role) => [role, contractRoleDefinitions[role].label]),
) as Record<SemanticRole, string>

/**
 * The "Live Editor" page: search/filter/sort/pagination over the active
 * data object's records, rendered through the selected template, plus the
 * "Edit Semantic Role Mapping" side panel.
 */
export default function EditorView({ modelId }: { modelId: string }) {
  const activeModel = useMemo(() => resolveModel(modelId), [modelId])
  const [fields, setFields] = useState<Field[]>(() => activeModel.fields)
  const [savedFields, setSavedFields] = useState<Field[]>(
    () => activeModel.fields,
  )
  const [selectedId, setSelectedId] = useState('')
  const [template, setTemplate] = useState<Template>('tile')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All statuses')
  const [sort, setSort] = useState('Available first')
  const [page, setPage] = useState(1)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [showTemplateStructure, setShowTemplateStructure] = useState(false)
  const [panelQuery, setPanelQuery] = useState('')
  const [showOnlyVisibleFields, setShowOnlyVisibleFields] = useState(false)
  const [detail, setDetail] = useState<RecordItem | null>(null)
  const [jsonItem, setJsonItem] = useState<RecordItem | null>(null)
  const [templateItem, setTemplateItem] = useState<RecordItem | null>(null)
  const [operator, setOperator] = useState<{
    name: string
    fieldLabel: string
  } | null>(null)

  // Reset all record-view state whenever the active data object changes
  // (mirrors the original `switchModel` behavior). Adjusting state during
  // render (rather than in an effect) avoids an extra, wasted render pass.
  const [prevModelId, setPrevModelId] = useState(modelId)
  if (prevModelId !== modelId) {
    setPrevModelId(modelId)
    setFields(activeModel.fields)
    setSavedFields(activeModel.fields)
    setSelectedId('')
    setPage(1)
    setQuery('')
    setDetail(null)
    setPanelQuery('')
  }

  const records = useMemo(
    () => makeRecords(fields, modelSources[modelId].records),
    [fields, modelId],
  )
  const editingRole = fields.find(
    (field) => field.name === selectedId,
  )?.semanticRole
  const hasUnsavedChanges =
    JSON.stringify(fields) !== JSON.stringify(savedFields)
  const activeTemplateDef = templateCatalog.find(
    (entry) => entry.value === template,
  )!
  // A field only actually renders if its role has a non-zero slot cap and
  // the field ranks within that cap among same-role fields (ties broken by
  // declaration order), matching the selection logic in selectSlots.
  const presentFieldNames = useMemo(() => {
    const byRole = new Map<SemanticRole, Field[]>()
    fields.forEach((field) => {
      const list = byRole.get(field.semanticRole) ?? []
      list.push(field)
      byRole.set(field.semanticRole, list)
    })
    const present = new Set<string>()
    byRole.forEach((roleFields, role) => {
      if (!activeTemplateDef.supportedRoles.includes(role)) return
      const cap = activeTemplateDef.slots[role]
      if (cap === undefined || cap === 0) return
      const ordered = [...roleFields].sort(
        (a, b) => a.rank - b.rank || fields.indexOf(a) - fields.indexOf(b),
      )
      const selected = cap === 'all' ? ordered : ordered.slice(0, cap)
      selected.forEach((field) => present.add(field.name))
    })
    return present
  }, [fields, activeTemplateDef])
  const panelFields = useMemo(() => {
    const q = panelQuery.trim().toLowerCase()
    return fields.filter((field) => {
      if (showOnlyVisibleFields && !presentFieldNames.has(field.name))
        return false
      if (!q) return true
      return (
        field.label.toLowerCase().includes(q) ||
        field.name.toLowerCase().includes(q) ||
        field.type.toLowerCase().includes(q) ||
        semanticRoleLabels[field.semanticRole].toLowerCase().includes(q)
      )
    })
  }, [fields, panelQuery, showOnlyVisibleFields, presentFieldNames])
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

  const roleClass = (role: SemanticRole) =>
    editingRole === role
      ? `semantic-region semantic-region-${role} semantic-region-editing`
      : ''

  const RuntimeComponent = runtimeByTemplate[template]

  const renderItems = () => {
    if (template === 'row')
      return (
        <div className="overflow-hidden rounded-xl border bg-card">
          {pageItems.map((item) => (
            <RuntimeComponent
              key={item.id}
              item={item}
              roleClass={roleClass}
              onOpenDetail={setDetail}
              onViewJson={setJsonItem}
              onViewTemplate={setTemplateItem}
              onPersonClick={(name, fieldLabel) =>
                setOperator({ name, fieldLabel })
              }
            />
          ))}
        </div>
      )
    if (template === 'summary')
      return (
        <div className="grid gap-3">
          <div className="hidden grid-cols-[minmax(180px,1.4fr)_140px_120px_120px_28px] gap-4 border-b bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{activeModel.name}</span>
            <span>Location</span>
            <span>Value</span>
            <span>Status</span>
            <span />
          </div>
          {pageItems.map((item) => (
            <RuntimeComponent
              key={item.id}
              item={item}
              roleClass={roleClass}
              onOpenDetail={setDetail}
              onViewJson={setJsonItem}
              onViewTemplate={setTemplateItem}
              onPersonClick={(name, fieldLabel) =>
                setOperator({ name, fieldLabel })
              }
            />
          ))}
        </div>
      )
    if (template === 'role-chip')
      return (
        <div className="flex flex-wrap gap-2">
          {pageItems.map((item) => (
            <RuntimeComponent
              key={item.id}
              item={item}
              roleClass={roleClass}
              onOpenDetail={setDetail}
              onViewJson={setJsonItem}
              onViewTemplate={setTemplateItem}
            />
          ))}
        </div>
      )
    if (template === 'detail-header')
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {pageItems.map((item) => (
            <RuntimeComponent
              key={item.id}
              item={item}
              roleClass={roleClass}
              onOpenDetail={setDetail}
              onViewJson={setJsonItem}
              onViewTemplate={setTemplateItem}
              onPersonClick={(name, fieldLabel) =>
                setOperator({ name, fieldLabel })
              }
            />
          ))}
        </div>
      )
    return (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {pageItems.map((item) => (
          <RuntimeComponent
            key={item.id}
            item={item}
            roleClass={roleClass}
            onOpenDetail={setDetail}
            onViewJson={setJsonItem}
            onViewTemplate={setTemplateItem}
          />
        ))}
      </div>
    )
  }

  return (
    <>
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
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Use the panel on the right to change how each field is interpreted,
          its semantic role and display rank, then save your changes. The
          preview on the left updates immediately, rendering real sample records
          from this data model through the selected template, so you can see
          exactly how your changes affect the final experience.
        </p>
      </div>
      <div
        className={`grid gap-6 ${isPanelCollapsed ? 'xl:grid-cols-[minmax(0,1fr)_3.5rem]' : 'xl:grid-cols-[minmax(0,1fr)_350px]'}`}
      >
        <section className="min-w-0 rounded-2xl border border-accent-surface-border bg-accent-surface p-4 text-accent-surface-foreground">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Live preview
            </p>
            <button
              type="button"
              aria-pressed={showTemplateStructure}
              onClick={() => setShowTemplateStructure((current) => !current)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition ${
                showTemplateStructure
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutTemplate className="size-3.5" />
              {showTemplateStructure ? 'Hide' : 'Show'} template
            </button>
          </div>
          {showTemplateStructure && (
            <div className="mb-4 rounded-2xl border border-primary/30 shadow-sm">
              <div className="rounded-t-2xl border-b border-dashed border-primary/20 bg-muted p-3">
                <TemplateInspector template={template} />
              </div>
              <TemplateMockPreview
                template={template}
                fields={fields}
                className="rounded-b-2xl"
              />
            </div>
          )}
          {renderToolbar(
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
            {Math.min(page * 6, visible.length)} of {visible.length} records
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
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3.5 shrink-0" />
                      {presentFieldNames.size} visible / {fields.length} total
                      fields
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {hasUnsavedChanges && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSavedFields(fields)
                          setSelectedId('')
                        }}
                      >
                        <Save className="size-3.5" />
                        Save
                      </Button>
                    )}
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
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={panelQuery}
                      onChange={(event) => setPanelQuery(event.target.value)}
                      placeholder="Search fields, types, roles…"
                      aria-label="Search fields"
                      className="w-full rounded-md border bg-background py-1.5 pl-8 pr-7 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {panelQuery && (
                      <button
                        type="button"
                        onClick={() => setPanelQuery('')}
                        aria-label="Clear search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOnlyVisibleFields((v) => !v)}
                    aria-pressed={showOnlyVisibleFields}
                    title={
                      showOnlyVisibleFields
                        ? `Showing only fields visible in ${activeTemplateDef.label}`
                        : `Show only fields visible in ${activeTemplateDef.label}`
                    }
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium shadow-sm transition ${
                      showOnlyVisibleFields
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {showOnlyVisibleFields ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                    Visible only
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Select a field to edit its semantic role and rank.
                </p>
              </div>
              <div className="flex flex-col p-0 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                {panelFields.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    No fields match &quot;{panelQuery}&quot;
                    {showOnlyVisibleFields ? ' among visible fields' : ''}.
                  </p>
                )}
                {panelFields.map((field) => {
                  const isOpen = selectedId === field.name
                  const isPresent = presentFieldNames.has(field.name)
                  return (
                    <div
                      key={field.name}
                      className={`semantic-region-${field.semanticRole} relative shrink-0 border-b border-border/60 last:border-b-0`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: 'oklch(55% 0.16 var(--region-hue))',
                      }}
                    >
                      <div className="flex items-center gap-2 px-2 py-2">
                        <span className="flex shrink-0 flex-col items-center gap-0.5">
                          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Rank
                          </span>
                          <span className="grid size-6 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                            {field.rank}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {field.label}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-mono text-[11px] text-muted-foreground">
                              {field.type}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <RoleChipTag role={field.semanticRole} compact />
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
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedId(isOpen ? '' : field.name)
                            }
                            aria-expanded={isOpen}
                            aria-haspopup="dialog"
                            aria-label={`Edit role and rank for ${field.label}`}
                            title={`Edit role and rank for ${field.label}`}
                            className={`rounded-md p-1.5 transition ${
                              isOpen
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <PencilLine className="size-3.5" />
                          </button>
                        </span>
                      </div>
                      {isOpen && (
                        <div
                          role="dialog"
                          aria-label={`Edit ${field.label}`}
                          className="absolute right-2 top-full z-20 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Edit {field.label}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Choose its role and display priority.
                              </p>
                            </div>
                            <RoleChipTag role={field.semanticRole} compact />
                          </div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Semantic role
                            <select
                              value={field.semanticRole}
                              onChange={(event) =>
                                updateSemanticRole(
                                  field.name,
                                  event.target.value as SemanticRole,
                                )
                              }
                              className="mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
                            >
                              {semanticRoles.map((semanticRole) => (
                                <option key={semanticRole} value={semanticRole}>
                                  {semanticRoleLabels[semanticRole]}
                                </option>
                              ))}
                            </select>
                          </label>
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
                              className="mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm font-normal tracking-normal text-foreground"
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
  )
}

function renderToolbar(
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
          {templateCatalog.map((entry) => (
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
