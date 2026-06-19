import type { DueStatus } from '../types/database'

const styles: Record<DueStatus, string> = {
  ok: 'bg-good-soft text-good',
  due_soon: 'bg-warn-soft text-warn',
  overdue: 'bg-danger-soft text-danger',
  unscheduled: 'bg-line/40 text-ink-soft',
}

const labels: Record<DueStatus, string> = {
  ok: 'On track',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  unscheduled: 'Unscheduled',
}

export function StatusPill({ status }: { status: DueStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
