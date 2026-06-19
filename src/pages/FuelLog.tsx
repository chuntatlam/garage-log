import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { EmptyState } from '../components/EmptyState'
import { useBikes } from '../hooks/useBikes'
import { useSelectedBike } from '../hooks/useSelectedBike'
import { useFuelEntries, calculateEfficiencySeries } from '../hooks/useFuelEntries'

const fuelSchema = z.object({
  entry_date: z.string().min(1, 'Required'),
  odometer: z.string().min(1, 'Required').refine((v) => !Number.isNaN(Number(v)), 'Must be a number'),
  quantity: z.string().min(1, 'Required').refine((v) => Number(v) > 0, 'Must be greater than 0'),
  cost: z.string().optional(),
  fuel_type: z.string().optional(),
  notes: z.string().optional(),
})

type FuelFormValues = z.infer<typeof fuelSchema>

export function FuelLog() {
  const { data: bikes } = useBikes()
  const { selectedBikeId } = useSelectedBike()
  const bike = bikes?.find((b) => b.id === selectedBikeId)
  const { data: entries, isLoading, addEntry, deleteEntry } = useFuelEntries(selectedBikeId)
  const { updateBike } = useBikes()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      odometer: bike?.current_odometer.toString() ?? '',
      quantity: '',
      cost: '',
      fuel_type: '',
      notes: '',
    },
  })

  if (!bike) {
    return (
      <AppShell title="Fuel">
        <EmptyState title="No bike selected" body="Add a bike on the Bikes tab first." />
      </AppShell>
    )
  }

  async function onSubmit(values: FuelFormValues) {
    const odometer = Number(values.odometer)
    await addEntry.mutateAsync({
      bike_id: bike!.id,
      entry_date: values.entry_date,
      odometer,
      quantity: Number(values.quantity),
      cost: values.cost ? Number(values.cost) : null,
      fuel_type: values.fuel_type || null,
      notes: values.notes || null,
    })
    if (odometer > bike!.current_odometer) {
      updateBike.mutate({ id: bike!.id, current_odometer: odometer })
    }
    setShowForm(false)
    reset({ ...values, odometer: odometer.toString(), quantity: '', cost: '', notes: '' })
  }

  const series = entries ? calculateEfficiencySeries(entries) : []

  return (
    <AppShell title="Fuel">
      {!showForm && (
        <>
          <Button className="w-full" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Log a fill-up
          </Button>

          {series.length >= 2 && (
            <div className="mt-6 h-48 rounded-xl border border-line bg-paper-raised p-3">
              <p className="mb-2 text-sm font-medium text-ink-soft">
                Efficiency ({bike.odometer_unit}/L)
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C4" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), 'MMM d')}
                    fontSize={11}
                    stroke="#565B60"
                  />
                  <YAxis fontSize={11} stroke="#565B60" width={32} />
                  <Tooltip
                    labelFormatter={(d) => format(new Date(d as string), 'MMM d, yyyy')}
                    formatter={(v) => [`${v} ${bike.odometer_unit}/L`, 'Efficiency']}
                  />
                  <Line type="monotone" dataKey="efficiency" stroke="#BB5A2E" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <section className="mt-6">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-ink-soft">Loading…</p>
            ) : !entries || entries.length === 0 ? (
              <EmptyState title="No fill-ups logged" body="Log your first fill-up to start tracking efficiency." />
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper-raised">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{format(new Date(e.entry_date), 'MMM d, yyyy')}</p>
                      <p className="font-numeric text-xs text-ink-soft">
                        {e.odometer.toLocaleString()} {bike.odometer_unit} · {e.quantity} L
                        {e.cost ? ` · ${e.cost}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => window.confirm('Delete this entry?') && deleteEntry.mutate(e.id)}
                      className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-display text-base font-medium text-ink">Log a fill-up</h2>

          <Field label="Date" error={errors.entry_date?.message}>
            <Input type="date" {...register('entry_date')} />
          </Field>

          <Field label={`Odometer (${bike.odometer_unit})`} error={errors.odometer?.message}>
            <Input inputMode="decimal" {...register('odometer')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (L)" error={errors.quantity?.message}>
              <Input inputMode="decimal" {...register('quantity')} />
            </Field>
            <Field label="Cost">
              <Input inputMode="decimal" {...register('cost')} />
            </Field>
          </div>

          <Field label="Fuel type" hint="Optional, e.g. petrol, diesel, EV charge">
            <Input {...register('fuel_type')} />
          </Field>

          <Field label="Notes">
            <Input {...register('notes')} />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  )
}
