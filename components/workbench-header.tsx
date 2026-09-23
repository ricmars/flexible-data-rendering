'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutTemplate, PencilLine, Shapes, Workflow } from 'lucide-react'
import { models, defaultModelId } from '@/lib/model-sources'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Sticky header shared by every page (Architecture, Semantic Roles, UI
 * Templates, Live Editor): a data-object picker on the left, driven by the
 * `?model=` search param, and route-based nav tabs plus a theme toggle on
 * the right.
 */

const tabs = [
  { href: '/architecture', label: 'Architecture', icon: Workflow },
  { href: '/roles', label: 'Semantic Roles', icon: Shapes },
  { href: '/templates', label: 'UI Templates', icon: LayoutTemplate },
  { href: '/editor', label: 'Live Editor', icon: PencilLine },
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-pressed={pathname === tab.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab.href === '/editor'
                    ? pathname === tab.href
                      ? 'bg-violet-600 text-white shadow-sm dark:bg-violet-500'
                      : 'text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950/40'
                    : pathname === tab.href
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon
                  className={`size-3.5 ${tab.href === '/editor' ? 'text-current' : ''}`}
                />
                {tab.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
