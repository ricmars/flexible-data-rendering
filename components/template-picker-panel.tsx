'use client'

import { Check, LayoutTemplate } from 'lucide-react'
import { templateCatalog, type Template } from '@/components/template-runtime'

/**
 * Left-hand side panel for the Live Editor: picks the active rendering
 * template and toggles the detailed template structure inspector shown
 * above the live preview. Data-model and semantic-role-mapping changes
 * stay in the right-hand panel; this panel only ever changes *how*
 * records are rendered, never the data itself.
 */
export function TemplatePickerPanel({
  template,
  onSelectTemplate,
  showTemplateStructure,
  onToggleTemplateStructure,
}: {
  template: Template
  onSelectTemplate: (value: Template) => void
  showTemplateStructure: boolean
  onToggleTemplateStructure: () => void
}) {
  const active = templateCatalog.find((entry) => entry.value === template)!

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="shrink-0 border-b px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Select template</p>
          <p className="truncate text-xs text-muted-foreground">
            {active.label} · {active.density} density
          </p>
        </div>
        <button
          type="button"
          aria-pressed={showTemplateStructure}
          onClick={onToggleTemplateStructure}
          className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition ${
            showTemplateStructure
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutTemplate className="size-3.5" />
          {showTemplateStructure ? 'Hide' : 'Show'} template structure
        </button>
      </div>
      <div className="flex flex-col xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {templateCatalog.map((entry) => {
          const isActive = entry.value === template
          return (
            <button
              key={entry.value}
              type="button"
              onClick={() => onSelectTemplate(entry.value)}
              aria-pressed={isActive}
              title={entry.description}
              className={`flex items-center justify-between gap-2 border-b px-4 py-2.5 text-left text-sm transition last:border-0 ${
                isActive
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="truncate">{entry.label}</span>
              {isActive && <Check className="size-4 shrink-0" />}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
