'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutTemplate, Rows3, Shapes, Workflow } from 'lucide-react'
import { models, defaultModelId } from '@/lib/model-sources'

/**
 * Sticky header shared by every page (Editor, UI Templates, Semantic
 * Roles, Architecture): a data-object picker on the left, driven by the
 * `?model=` search param, and route-based nav tabs on the right.
 */

const tabs = [
  { href: '/editor', label: 'Editor', icon: Rows3 },
  { href: '/templates', label: 'UI Templates', icon: LayoutTemplate },
  { href: '/roles', label: 'Semantic Roles', icon: Shapes },
  { href: '/architecture', label: 'Architecture', icon: Workflow },
] as const

export function WorkbenchHeader({
  showModelPicker = true,
}: {
  showModelPicker?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const modelId = searchParams.get('model') ?? defaultModelId

  return (
    <div className="shrink-0 border-b bg-muted/40 shadow-sm">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-6 py-4">
        {showModelPicker ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold">Data object</span>
            <select
              value={modelId}
              onChange={(event) =>
                router.push(`${pathname}?model=${event.target.value}`)
              }
              className="rounded-lg border bg-card px-3 py-2 text-sm font-normal shadow-sm"
            >
              {models.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} · {entry.industry}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-pressed={pathname === tab.href}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                pathname === tab.href
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
