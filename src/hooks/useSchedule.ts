import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSync } from './useRealtimeSync'
import type { MaintenanceSchedule } from '../types/database'

export function useSchedule(bikeId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useRealtimeSync('maintenance_schedule', [['maintenance_schedule', bikeId]])

  const query = useQuery({
    queryKey: ['maintenance_schedule', bikeId],
    queryFn: async (): Promise<MaintenanceSchedule[]> => {
      const { data, error } = await supabase
        .from('maintenance_schedule')
        .select('*')
        .eq('bike_id', bikeId)
      if (error) throw error
      return data
    },
    enabled: !!user && !!bikeId,
  })

  const upsertSchedule = useMutation({
    mutationFn: async (row: Partial<MaintenanceSchedule> & { bike_id: string; type: string }) => {
      const { data, error } = await supabase
        .from('maintenance_schedule')
        .upsert({ ...row, user_id: user?.id }, { onConflict: 'bike_id,type' })
        .select()
        .single()
      if (error) throw error
      return data as MaintenanceSchedule
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance_schedule', bikeId] }),
  })

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance_schedule').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance_schedule', bikeId] }),
  })

  return { ...query, upsertSchedule, deleteSchedule }
}
