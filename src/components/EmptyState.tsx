import type { ReactNode } from 'react'

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-paper-raised/60 px-5 py-8 text-center">
      <p className="font-display text-base font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
