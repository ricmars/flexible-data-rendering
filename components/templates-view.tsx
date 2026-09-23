import { TemplateReference } from '@/components/template-reference'
import { CollectionTemplateReference } from '@/components/collection-views'
import { modelSources, resolveModel } from '@/lib/model-sources'

/**
 * The "UI Templates" page: a static reference grid of every rendering
 * template, backed by the active data object's fields, plus the collection
 * templates (table, list, grid, board, calendar, timeline, map, chart) that
 * fall out of the same declared roles.
 */
export default function TemplatesView({ modelId }: { modelId: string }) {
  const activeModel = resolveModel(modelId)
  const records = modelSources[activeModel.id]?.records ?? []
  return (
    <div className="flex flex-col gap-10">
      <TemplateReference
        fields={activeModel.fields}
        records={records}
        modelName={activeModel.name}
      />
      <CollectionTemplateReference
        fields={activeModel.fields}
        records={records}
        modelName={activeModel.name}
      />
    </div>
  )
}
