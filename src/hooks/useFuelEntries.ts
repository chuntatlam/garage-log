import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSync } from './useRealtimeSync'
import type { FuelEntry, FuelEntryInput } from '../types/database'

export function useFuelEntries(bikeId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useRealtimeSync('fuel_entries', [['fuel_entries', bikeId]])

  const query = useQuery({
    queryKey: ['fuel_entries', bikeId],
    queryFn: async (): Promise<FuelEntry[]> => {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*')
        .eq('bike_id', bikeId)
        .order('odometer', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user && !!bikeId,
  })

  const addEntry = useMutation({
    mutationFn: async (input: FuelEntryInput) => {
      const { data, error } = await supabase.from('fuel_entries').insert(input).select().single()
      if (error) throw error
      return data as FuelEntry
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fuel_entries', bikeId] }),
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fuel_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fuel_entries', bikeId] }),
  })

  return { ...query, addEntry, deleteEntry }
}

/** km (or mi) per liter between each consecutive pair of fill-ups, oldest→newest. */
export function calculateEfficiencySeries(entries: FuelEntry[]) {
  const sorted = [...entries].sort((a, b) => a.odometer - b.odometer)
  const points: { date: string; efficiency: number }[] = []
  for (let i = 1; i < sorted.length; i++) {
    const distance = sorted[i].odometer - sorted[i - 1].odometer
    const quantity = sorted[i].quantity
    if (distance > 0 && quantity > 0) {
      points.push({ date: sorted[i].entry_date, efficiency: Number((distance / quantity).toFixed(2)) })
    }
  }
  return points
}
