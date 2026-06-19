import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRealtimeSync(table: string, queryKeys: unknown[][]) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // Unique per hook instance — avoids collisions when the same table is
  // subscribed from multiple mounted components simultaneously.
  const channelName = useRef(`${table}-${user?.id}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        () => {
          queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, user?.id])
}
