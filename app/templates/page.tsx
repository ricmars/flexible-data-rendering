'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkbenchHeader } from '@/components/workbench-header'
import TemplatesView from '@/components/templates-view'
import { defaultModelId } from '@/lib/model-sources'

function TemplatesPageInner() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model') ?? defaultModelId
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <WorkbenchHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <TemplatesView modelId={modelId} />
        </div>
      </div>
    </main>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesPageInner />
    </Suspense>
  )
}
