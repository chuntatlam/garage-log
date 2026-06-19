import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { StatusPill } from '../components/StatusPill'
import { EmptyState } from '../components/EmptyState'
import { useBikes } from '../hooks/useBikes'
import { useSelectedBike } from '../hooks/useSelectedBike'
import { useSchedule } from '../hooks/useSchedule'
import { calculateDueInfo } from '../lib/dueStatus'
import { MAINTENANCE_TYPES } from '../lib/maintenanceTypes'
import type { MaintenanceSchedule } from '../types/database'

export function Schedule() {
  const { data: bikes } = useBikes()
  const { selectedBikeId } = useSelectedBike()
  const bike = bikes?.find((b) => b.id === selectedBikeId)
  const { data: schedule, upsertSchedule, deleteSchedule } = useSchedule(selectedBikeId)

  if (!bike) {
    return (
      <AppShell title="Schedule">
        <EmptyState title="No bike selected" body="Add a bike on the Bikes tab first." />
      </AppShell>
    )
  }

  return (
    <AppShell title="Schedule">
      <p className="mb-4 text-sm text-ink-soft">
        Set a distance interval, a time interval, or both — whichever comes due first triggers the reminder.
      </p>
      <ul className="space-y-3">
        {MAINTENANCE_TYPES.map((t) => {
          const existing = schedule?.find((s) => s.type === t.value)
          return (
            <ScheduleRow
              key={t.value}
              typeValue={t.value}
              typeLabel={t.label}
              defaultKm={t.defaultIntervalKm}
              defaultMonths={t.defaultIntervalMonths}
              existing={existing}
              bikeId={bike.id}
              currentOdometer={bike.current_odometer}
              odometerUnit={bike.odometer_unit}
              onSave={(row) => upsertSchedule.mutate(row)}
              onDelete={existing ? () => deleteSchedule.mutate(existing.id) : undefined}
            />
          )
        })}
      </ul>
    </AppShell>
  )
}

function ScheduleRow({
  typeValue,
  typeLabel,
  defaultKm,
  defaultMonths,
  existing,
  bikeId,
  currentOdometer,
  odometerUnit,
  onSave,
  onDelete,
}: {
  typeValue: string
  typeLabel: string
  defaultKm: number | null
  defaultMonths: number | null
  existing: MaintenanceSchedule | undefined
  bikeId: string
  currentOdometer: number
  odometerUnit: string
  onSave: (row: Partial<MaintenanceSchedule> & { bike_id: string; type: string }) => void
  onDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [intervalKm, setIntervalKm] = useState(
    (existing?.interval_km ?? defaultKm)?.toString() ?? ''
  )
  const [intervalMonths, setIntervalMonths] = useState(
    (existing?.interval_months ?? defaultMonths)?.toString() ?? ''
  )
  const [lastDoneDate, setLastDoneDate] = useState(existing?.last_done_date ?? '')
  const [lastDoneOdometer, setLastDoneOdometer] = useState(
    existing?.last_done_odometer?.toString() ?? ''
  )

  const due = existing ? calculateDueInfo(existing, currentOdometer) : null

  function save() {
    onSave({
      bike_id: bikeId,
      type: typeValue,
      interval_km: intervalKm ? Number(intervalKm) : null,
      interval_months: intervalMonths ? Number(intervalMonths) : null,
      last_done_date: lastDoneDate || null,
      last_done_odometer: lastDoneOdometer ? Number(lastDoneOdometer) : null,
    })
    setEditing(false)
  }

  return (
    <li className="rounded-xl border border-line bg-paper-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{typeLabel}</p>
          <p className="font-numeric text-xs text-ink-soft">{due ? due.label : 'Not set'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {due && <StatusPill status={due.status} />}
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
            aria-label={`Edit ${typeLabel} schedule`}
          >
            <Pencil size={16} />
          </button>
          {onDelete && (
            <button
              onClick={() => window.confirm(`Clear the ${typeLabel} schedule?`) && onDelete()}
              className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
              aria-label={`Clear ${typeLabel} schedule`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Every (${odometerUnit})`} hint="Leave blank to skip">
              <Input inputMode="decimal" value={intervalKm} onChange={(e) => setIntervalKm(e.target.value)} />
            </Field>
            <Field label="Every (months)" hint="Leave blank to skip">
              <Input
                inputMode="decimal"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last done on">
              <Input type="date" value={lastDoneDate} onChange={(e) => setLastDoneDate(e.target.value)} />
            </Field>
            <Field label={`Last done at (${odometerUnit})`}>
              <Input
                inputMode="decimal"
                value={lastDoneOdometer}
                onChange={(e) => setLastDoneOdometer(e.target.value)}
              />
            </Field>
          </div>
          <Button className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      )}
    </li>
  )
}
