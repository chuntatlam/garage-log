import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSync } from './useRealtimeSync'
import type { Bike, BikeInput } from '../types/database'

export function useBikes() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useRealtimeSync('bikes', [['bikes']])

  const query = useQuery({
    queryKey: ['bikes', user?.id],
    queryFn: async (): Promise<Bike[]> => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createBike = useMutation({
    mutationFn: async (input: BikeInput) => {
      const { data, error } = await supabase.from('bikes').insert(input).select().single()
      if (error) throw error
      return data as Bike
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bikes'] }),
  })

  const updateBike = useMutation({
    mutationFn: async ({ id, ...input }: Partial<BikeInput> & { id: string }) => {
      const { data, error } = await supabase.from('bikes').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Bike
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bikes'] }),
  })

  const deleteBike = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bikes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bikes'] }),
  })

  return { ...query, createBike, updateBike, deleteBike }
}
