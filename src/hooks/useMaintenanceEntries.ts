import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSync } from './useRealtimeSync'
import { MAINTENANCE_TYPES } from '../lib/maintenanceTypes'
import type { MaintenanceEntry, MaintenanceEntryInput } from '../types/database'

export function useMaintenanceEntries(bikeId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useRealtimeSync('maintenance_entries', [['maintenance_entries', bikeId]])

  const query = useQuery({
    queryKey: ['maintenance_entries', bikeId],
    queryFn: async (): Promise<MaintenanceEntry[]> => {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .eq('bike_id', bikeId)
        .order('service_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user && !!bikeId,
  })

  const addEntry = useMutation({
    mutationFn: async ({ input, receipt }: { input: MaintenanceEntryInput; receipt?: File }) => {
      let receipt_url: string | null = null
      if (receipt && user) {
        receipt_url = await uploadReceipt(receipt, user.id, input.bike_id)
      }
      const { data, error } = await supabase
        .from('maintenance_entries')
        .insert({ ...input, receipt_url })
        .select()
        .single()
      if (error) throw error

      if (user) {
        await syncScheduleAfterEntry(user.id, input.bike_id, input.type, input.service_date, input.odometer)
      }
      return data as MaintenanceEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_entries', bikeId] })
      queryClient.invalidateQueries({ queryKey: ['maintenance_schedule', bikeId] })
    },
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance_entries', bikeId] }),
  })

  return { ...query, addEntry, deleteEntry }
}

async function uploadReceipt(file: File, userId: string, bikeId: string): Promise<string> {
  const path = `${userId}/${bikeId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('maintenance-receipts').upload(path, file)
  if (error) throw error
  return path
}

export async function getReceiptSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('maintenance-receipts').createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

/**
 * Keeps maintenance_schedule.last_done_* in step with the latest logged
 * entry for that (bike, type). If no schedule row exists yet, seeds one
 * using the curated default intervals so the item shows up on the
 * Schedule page immediately.
 */
async function syncScheduleAfterEntry(
  userId: string,
  bikeId: string,
  type: string,
  serviceDate: string,
  odometer: number
) {
  const { data: existing } = await supabase
    .from('maintenance_schedule')
    .select('*')
    .eq('bike_id', bikeId)
    .eq('type', type)
    .maybeSingle()

  if (!existing) {
    const def = MAINTENANCE_TYPES.find((t) => t.value === type)
    await supabase.from('maintenance_schedule').insert({
      user_id: userId,
      bike_id: bikeId,
      type,
      interval_km: def?.defaultIntervalKm ?? null,
      interval_months: def?.defaultIntervalMonths ?? null,
      last_done_date: serviceDate,
      last_done_odometer: odometer,
    })
  } else if (existing.last_done_odometer == null || odometer >= existing.last_done_odometer) {
    await supabase
      .from('maintenance_schedule')
      .update({ last_done_date: serviceDate, last_done_odometer: odometer })
      .eq('id', existing.id)
  }
}
