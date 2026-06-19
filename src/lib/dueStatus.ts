import { addMonths, differenceInCalendarDays } from 'date-fns'
import type { DueInfo, DueStatus, MaintenanceSchedule } from '../types/database'

const WARN_KM = 300
const WARN_DAYS = 14

export function calculateDueInfo(
  schedule: MaintenanceSchedule,
  currentOdometer: number
): DueInfo {
  const hasKm = schedule.interval_km != null
  const hasMonths = schedule.interval_months != null

  if (!hasKm && !hasMonths) {
    return { status: 'unscheduled', kmRemaining: null, daysRemaining: null, label: 'No interval set' }
  }

  let kmRemaining: number | null = null
  if (hasKm) {
    const baseline = schedule.last_done_odometer ?? 0
    kmRemaining = baseline + schedule.interval_km! - currentOdometer
  }

  let daysRemaining: number | null = null
  if (hasMonths && schedule.last_done_date) {
    const dueDate = addMonths(new Date(schedule.last_done_date), schedule.interval_months!)
    daysRemaining = differenceInCalendarDays(dueDate, new Date())
  }

  // Normalize each available metric against its own warning threshold, then
  // let whichever is most urgent ("whichever comes first") set the status.
  const kmRatio = kmRemaining != null ? kmRemaining / WARN_KM : Infinity
  const dayRatio = daysRemaining != null ? daysRemaining / WARN_DAYS : Infinity
  const minRatio = Math.min(kmRatio, dayRatio)

  let status: DueStatus = 'ok'
  if (Number.isFinite(minRatio)) {
    if (minRatio <= 0) status = 'overdue'
    else if (minRatio <= 1) status = 'due_soon'
  }

  const label = formatDueLabel(kmRemaining, daysRemaining, status)
  return { status, kmRemaining, daysRemaining, label }
}

function formatDueLabel(
  kmRemaining: number | null,
  daysRemaining: number | null,
  status: DueStatus
): string {
  const parts: string[] = []
  if (kmRemaining != null) {
    parts.push(
      kmRemaining >= 0 ? `${Math.round(kmRemaining)} km left` : `${Math.round(Math.abs(kmRemaining))} km over`
    )
  }
  if (daysRemaining != null) {
    parts.push(daysRemaining >= 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days over`)
  }
  if (parts.length === 0) return status === 'unscheduled' ? 'No interval set' : '—'
  return parts.join(' · ')
}
