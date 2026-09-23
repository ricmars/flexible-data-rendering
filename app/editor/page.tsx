'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkbenchHeader } from '@/components/workbench-header'
import EditorView from '@/components/editor-view'
import { defaultModelId } from '@/lib/model-sources'

function EditorPageInner() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model') ?? defaultModelId
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <WorkbenchHeader />
      <div className="min-h-0 flex-1 overflow-hidden">
        <EditorView modelId={modelId} />
      </div>
    </main>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorPageInner />
    </Suspense>
  )
}
