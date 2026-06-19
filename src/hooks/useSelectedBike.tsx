import { createContext, useContext, useState, type ReactNode } from 'react'
import { useBikes } from './useBikes'

interface SelectedBikeContextValue {
  selectedBikeId: string | undefined
  setSelectedBikeId: (id: string) => void
}

const SelectedBikeContext = createContext<SelectedBikeContextValue | undefined>(undefined)

const STORAGE_KEY = 'garage-log:selected-bike'

export function SelectedBikeProvider({ children }: { children: ReactNode }) {
  const { data: bikes } = useBikes()
  const [storedId, setStoredId] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined
  )

  // Derived during render rather than via an effect+setState: if the stored
  // id doesn't match a real bike (first run, or that bike was deleted),
  // fall back to the first bike. Nothing is written to state here — only
  // setSelectedBikeId (called from user interaction) persists a choice.
  const stillValid = bikes?.some((b) => b.id === storedId)
  const selectedBikeId = stillValid ? storedId : bikes?.[0]?.id

  const setSelectedBikeId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setStoredId(id)
  }

  return (
    <SelectedBikeContext.Provider value={{ selectedBikeId, setSelectedBikeId }}>
      {children}
    </SelectedBikeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedBike() {
  const ctx = useContext(SelectedBikeContext)
  if (!ctx) throw new Error('useSelectedBike must be used within SelectedBikeProvider')
  return ctx
}
