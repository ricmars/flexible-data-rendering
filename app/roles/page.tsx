'use client'

import { Suspense } from 'react'
import { WorkbenchHeader } from '@/components/workbench-header'
import RolesView from '@/components/roles-view'

function RolesPageInner() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <WorkbenchHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-6 py-6">
          <RolesView />
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
