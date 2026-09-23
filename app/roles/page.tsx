'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkbenchHeader } from '@/components/workbench-header'
import RolesView from '@/components/roles-view'
import { defaultModelId } from '@/lib/model-sources'

function RolesPageInner() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model') ?? defaultModelId
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <WorkbenchHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <RolesView modelId={modelId} />
        </div>
      </div>
    </main>
  )
}

export default function RolesPage() {
  return (
    <Suspense fallback={null}>
      <RolesPageInner />
    </Suspense>
  )
}
