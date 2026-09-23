import { Suspense } from 'react'
import ArchitectureDiagram from '@/components/architecture-diagram'
import { WorkbenchHeader } from '@/components/workbench-header'

export default function ArchitecturePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Suspense fallback={null}>
        <WorkbenchHeader showModelPicker={false} />
      </Suspense>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ArchitectureDiagram />
      </div>
    </div>
  )
}
