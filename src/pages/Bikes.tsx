import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { EmptyState } from '../components/EmptyState'
import { useBikes } from '../hooks/useBikes'
import { useAuth } from '../hooks/useAuth'
import type { Bike, BikeInput } from '../types/database'

const bikeSchema = z.object({
  name: z.string().min(1, 'Bike name is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  registration_no: z.string().optional(),
  vin: z.string().optional(),
  purchase_date: z.string().optional(),
  insurance_expiry: z.string().optional(),
  puc_expiry: z.string().optional(),
  current_odometer: z
    .string()
    .min(1, 'Required')
    .refine((v) => !Number.isNaN(Number(v)), 'Must be a number'),
  odometer_unit: z.enum(['km', 'mi']),
})

type BikeFormValues = z.infer<typeof bikeSchema>

const emptyDefaults: BikeFormValues = {
  name: '',
  make: '',
  model: '',
  year: '',
  registration_no: '',
  vin: '',
  purchase_date: '',
  insurance_expiry: '',
  puc_expiry: '',
  current_odometer: '0',
  odometer_unit: 'km',
}

function toBikeInput(values: BikeFormValues): BikeInput {
  return {
    name: values.name,
    make: values.make || null,
    model: values.model || null,
    year: values.year ? Number(values.year) : null,
    registration_no: values.registration_no || null,
    vin: values.vin || null,
    purchase_date: values.purchase_date || null,
    insurance_expiry: values.insurance_expiry || null,
    puc_expiry: values.puc_expiry || null,
    current_odometer: Number(values.current_odometer),
    odometer_unit: values.odometer_unit,
  }
}

export function Bikes() {
  const { data: bikes, isLoading, createBike, updateBike, deleteBike } = useBikes()
  const { user, signOut } = useAuth()
  const [editing, setEditing] = useState<Bike | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BikeFormValues>({ resolver: zodResolver(bikeSchema), defaultValues: emptyDefaults })

  function openAdd() {
    setEditing(null)
    reset(emptyDefaults)
    setShowForm(true)
  }

  function openEdit(bike: Bike) {
    setEditing(bike)
    reset({
      name: bike.name,
      make: bike.make ?? '',
      model: bike.model ?? '',
      year: bike.year?.toString() ?? '',
      registration_no: bike.registration_no ?? '',
      vin: bike.vin ?? '',
      purchase_date: bike.purchase_date ?? '',
      insurance_expiry: bike.insurance_expiry ?? '',
      puc_expiry: bike.puc_expiry ?? '',
      current_odometer: bike.current_odometer.toString(),
      odometer_unit: bike.odometer_unit,
    })
    setShowForm(true)
  }

  async function onSubmit(values: BikeFormValues) {
    const input = toBikeInput(values)
    if (editing) {
      await updateBike.mutateAsync({ id: editing.id, ...input })
    } else {
      await createBike.mutateAsync(input)
    }
    setShowForm(false)
  }

  function onDelete(bike: Bike) {
    if (window.confirm(`Delete ${bike.name}? This also removes its fuel and service history.`)) {
      deleteBike.mutate(bike.id)
    }
  }

  return (
    <AppShell title="Bikes">
      {!showForm && (
        <>
          {isLoading ? (
            <p className="py-12 text-center text-sm text-ink-soft">Loading…</p>
          ) : !bikes || bikes.length === 0 ? (
            <EmptyState
              title="No bikes yet"
              body="Add a profile for each bike you want to track."
              action={<Button onClick={openAdd}>Add a bike</Button>}
            />
          ) : (
            <ul className="space-y-3">
              {bikes.map((b) => (
                <li key={b.id} className="rounded-xl border border-line bg-paper-raised p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-medium text-ink">{b.name}</p>
                      <p className="text-sm text-ink-soft">
                        {[b.make, b.model, b.year].filter(Boolean).join(' ') || 'No make/model set'}
                      </p>
                      <p className="font-numeric mt-1 text-sm text-ink-soft">
                        {b.current_odometer.toLocaleString()} {b.odometer_unit}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink"
                        aria-label={`Edit ${b.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(b)}
                        className="rounded-lg p-2 text-ink-soft hover:bg-danger-soft hover:text-danger"
                        aria-label={`Delete ${b.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {bikes && bikes.length > 0 && (
            <Button variant="secondary" className="mt-4 w-full" onClick={openAdd}>
              <Plus size={16} /> Add another bike
            </Button>
          )}

          <div className="mt-10 border-t border-line pt-4">
            <p className="mb-3 text-sm text-ink-soft">Signed in as {user?.email}</p>
            <Button variant="ghost" onClick={() => signOut()}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-display text-base font-medium text-ink">
            {editing ? `Edit ${editing.name}` : 'Add a bike'}
          </h2>

          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="e.g. Activa, Royal Enfield" {...register('name')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Make">
              <Input {...register('make')} />
            </Field>
            <Field label="Model">
              <Input {...register('model')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <Input inputMode="numeric" {...register('year')} />
            </Field>
            <Field label="Registration no.">
              <Input {...register('registration_no')} />
            </Field>
          </div>

          <Field label="VIN / chassis no.">
            <Input {...register('vin')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Current odometer" error={errors.current_odometer?.message}>
              <Input inputMode="decimal" {...register('current_odometer')} />
            </Field>
            <Field label="Unit">
              <Select {...register('odometer_unit')}>
                <option value="km">km</option>
                <option value="mi">mi</option>
              </Select>
            </Field>
          </div>

          <Field label="Purchase date">
            <Input type="date" {...register('purchase_date')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Insurance expiry">
              <Input type="date" {...register('insurance_expiry')} />
            </Field>
            <Field label="PUC / emissions expiry">
              <Input type="date" {...register('puc_expiry')} />
            </Field>
          </div>

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
