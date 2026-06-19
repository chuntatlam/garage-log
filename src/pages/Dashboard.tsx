import { Link } from 'react-router-dom'
import { differenceInCalendarDays } from 'date-fns'
import { AppShell } from '../components/layout/AppShell'
import { OdometerPlate } from '../components/OdometerPlate'
import { StatusPill } from '../components/StatusPill'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/Button'
import { useBikes } from '../hooks/useBikes'
import { useSelectedBike } from '../hooks/useSelectedBike'
import { useSchedule } from '../hooks/useSchedule'
import { useFuelEntries, calculateEfficiencySeries } from '../hooks/useFuelEntries'
import { calculateDueInfo } from '../lib/dueStatus'
import { maintenanceLabel } from '../lib/maintenanceTypes'

export function Dashboard() {
  const { data: bikes, isLoading: bikesLoading } = useBikes()
  const { selectedBikeId } = useSelectedBike()
  const bike = bikes?.find((b) => b.id === selectedBikeId)

  const { data: schedule } = useSchedule(selectedBikeId)
  const { data: fuelEntries } = useFuelEntries(selectedBikeId)

  if (bikesLoading) {
    return (
      <AppShell title="Dashboard">
        <p className="py-12 text-center text-sm text-ink-soft">Loading…</p>
      </AppShell>
    )
  }

  if (!bikes || bikes.length === 0) {
    return (
      <AppShell title="Dashboard">
        <EmptyState
          title="Add your first bike"
          body="Set up a bike profile to start logging fuel, services, and reminders."
          action={
            <Link to="/bikes">
              <Button>Add a bike</Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  const efficiencySeries = fuelEntries ? calculateEfficiencySeries(fuelEntries) : []
  const latestEfficiency = efficiencySeries.at(-1)

  const dueItems = (schedule ?? [])
    .map((s) => ({ schedule: s, due: calculateDueInfo(s, bike?.current_odometer ?? 0) }))
    .filter((item) => item.due.status !== 'unscheduled')
    .sort((a, b) => {
      const rank = { overdue: 0, due_soon: 1, ok: 2, unscheduled: 3 }
      return rank[a.due.status] - rank[b.due.status]
    })

  const mostUrgent = dueItems[0]

  const docs = bike
    ? [
        { label: 'Insurance', date: bike.insurance_expiry },
        { label: 'PUC / Emissions', date: bike.puc_expiry },
      ].filter((d) => d.date)
    : []

  return (
    <AppShell title="Dashboard">
      {bike && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <OdometerPlate
              label="Odometer"
              value={bike.current_odometer.toLocaleString()}
              unit={bike.odometer_unit}
            />
            <OdometerPlate
              label="Latest efficiency"
              value={latestEfficiency ? latestEfficiency.efficiency.toFixed(1) : '—'}
              unit={latestEfficiency ? `${bike.odometer_unit}/L` : undefined}
            />
          </div>

          <div className="mt-3">
            {mostUrgent ? (
              <OdometerPlate
                label={`Next due — ${maintenanceLabel(mostUrgent.schedule.type)}`}
                value={mostUrgent.due.label}
                tone={
                  mostUrgent.due.status === 'overdue'
                    ? 'danger'
                    : mostUrgent.due.status === 'due_soon'
                      ? 'warn'
                      : 'default'
                }
              />
            ) : (
              <OdometerPlate label="Next due" value="All caught up" />
            )}
          </div>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-ink-soft">Upcoming &amp; overdue</h2>
            {dueItems.length === 0 ? (
              <EmptyState
                title="Nothing scheduled yet"
                body="Set intervals on the Schedule tab or log a service to get started."
                action={
                  <Link to="/schedule">
                    <Button variant="secondary">Go to Schedule</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper-raised">
                {dueItems.map(({ schedule: s, due }) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{maintenanceLabel(s.type)}</p>
                      <p className="font-numeric text-xs text-ink-soft">{due.label}</p>
                    </div>
                    <StatusPill status={due.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {docs.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-medium text-ink-soft">Documents</h2>
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper-raised">
                {docs.map((d) => {
                  const days = differenceInCalendarDays(new Date(d.date as string), new Date())
                  const status = days < 0 ? 'overdue' : days <= 30 ? 'due_soon' : 'ok'
                  return (
                    <li key={d.label} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{d.label}</p>
                        <p className="font-numeric text-xs text-ink-soft">
                          {days >= 0 ? `${days} days left` : `${Math.abs(days)} days over`}
                        </p>
                      </div>
                      <StatusPill status={status} />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
