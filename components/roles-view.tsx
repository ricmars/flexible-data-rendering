import { SemanticRoleReference } from '@/components/template-reference'
import { resolveModel } from '@/lib/model-sources'

/**
 * The "Semantic Roles" page: a static reference grid of every semantic
 * role, backed by the active data object's fields.
 */
export default function RolesView({ modelId }: { modelId: string }) {
  const activeModel = resolveModel(modelId)
  return (
    <SemanticRoleReference
      fields={activeModel.fields}
      modelName={activeModel.name}
    />
  )
}
