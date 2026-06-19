import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Paperclip } from 'lucide-react'
import { format } from 'date-fns'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { EmptyState } from '../components/EmptyState'
import { useBikes } from '../hooks/useBikes'
import { useSelectedBike } from '../hooks/useSelectedBike'
import { useMaintenanceEntries, getReceiptSignedUrl } from '../hooks/useMaintenanceEntries'
import { MAINTENANCE_TYPES, maintenanceLabel } from '../lib/maintenanceTypes'
import type { MaintenanceEntry } from '../types/database'

const maintenanceSchema = z.object({
  type: z.string().min(1, 'Required'),
  service_date: z.string().min(1, 'Required'),
  odometer: z.string().min(1, 'Required').refine((v) => !Number.isNaN(Number(v)), 'Must be a number'),
  cost: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
})

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

export function MaintenanceLog() {
  const { data: bikes, updateBike } = useBikes()
  const { selectedBikeId } = useSelectedBike()
  const bike = bikes?.find((b) => b.id === selectedBikeId)
  const { data: entries, isLoading, addEntry, deleteEntry } = useMaintenanceEntries(selectedBikeId)
  const [showForm, setShowForm] = useState(false)
  const [receipt, setReceipt] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      type: MAINTENANCE_TYPES[0].value,
      service_date: format(new Date(), 'yyyy-MM-dd'),
      odometer: bike?.current_odometer.toString() ?? '',
      cost: '',
      vendor: '',
      notes: '',
    },
  })

  if (!bike) {
    return (
      <AppShell title="Service">
        <EmptyState title="No bike selected" body="Add a bike on the Bikes tab first." />
      </AppShell>
    )
  }

  async function onSubmit(values: MaintenanceFormValues) {
    const odometer = Number(values.odometer)
    await addEntry.mutateAsync({
      input: {
        bike_id: bike!.id,
        type: values.type,
        service_date: values.service_date,
        odometer,
        cost: values.cost ? Number(values.cost) : null,
        vendor: values.vendor || null,
        notes: values.notes || null,
        receipt_url: null,
      },
      receipt: receipt ?? undefined,
    })
    if (odometer > bike!.current_odometer) {
      updateBike.mutate({ id: bike!.id, current_odometer: odometer })
    }
    setReceipt(null)
    setShowForm(false)
    reset({ ...values, cost: '', vendor: '', notes: '' })
  }

  return (
    <AppShell title="Service">
      {!showForm && (
        <>
          <Button className="w-full" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Log a service
          </Button>

          <section className="mt-6">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-ink-soft">Loading…</p>
            ) : !entries || entries.length === 0 ? (
              <EmptyState title="No services logged" body="Log your first service to start building history." />
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper-raised">
                {entries.map((e) => (
                  <MaintenanceRow key={e.id} entry={e} unit={bike.odometer_unit} onDelete={deleteEntry.mutate} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-display text-base font-medium text-ink">Log a service</h2>

          <Field label="Type" error={errors.type?.message}>
            <Select {...register('type')}>
              {MAINTENANCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date" error={errors.service_date?.message}>
            <Input type="date" {...register('service_date')} />
          </Field>

          <Field label={`Odometer (${bike.odometer_unit})`} error={errors.odometer?.message}>
            <Input inputMode="decimal" {...register('odometer')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost">
              <Input inputMode="decimal" {...register('cost')} />
            </Field>
            <Field label="Vendor">
              <Input {...register('vendor')} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea {...register('notes')} />
          </Field>

          <Field label="Receipt photo" hint="Optional">
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-soft"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setReceipt(null)
                setShowForm(false)
              }}
            >
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

function MaintenanceRow({
  entry,
  unit,
  onDelete,
}: {
  entry: MaintenanceEntry
  unit: string
  onDelete: (id: string) => void
}) {
  async function openReceipt() {
    if (!entry.receipt_url) return
    const url = await getReceiptSignedUrl(entry.receipt_url)
    if (url) window.open(url, '_blank')
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{maintenanceLabel(entry.type)}</p>
        <p className="font-numeric text-xs text-ink-soft">
          {format(new Date(entry.service_date), 'MMM d, yyyy')} · {entry.odometer.toLocaleString()} {unit}
          {entry.cost ? ` · ${entry.cost}` : ''}
        </p>
        {entry.vendor && <p className="text-xs text-ink-soft">{entry.vendor}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        {entry.receipt_url && (
          <button
            onClick={openReceipt}
            className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
            aria-label="View receipt"
          >
            <Paperclip size={16} />
          </button>
        )}
        <button
          onClick={() => window.confirm('Delete this entry?') && onDelete(entry.id)}
          className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
          aria-label="Delete entry"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}
