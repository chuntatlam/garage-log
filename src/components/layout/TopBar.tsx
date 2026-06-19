import { Sun, Moon } from 'lucide-react'
import { useBikes } from '../../hooks/useBikes'
import { useSelectedBike } from '../../hooks/useSelectedBike'
import { useTheme } from '../../hooks/useTheme'

export function TopBar({ title }: { title: string }) {
  const { data: bikes } = useBikes()
  const { selectedBikeId, setSelectedBikeId } = useSelectedBike()
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
        <div className="flex items-center gap-2">
          {bikes && bikes.length > 1 && (
            <select
              value={selectedBikeId ?? ''}
              onChange={(e) => setSelectedBikeId(e.target.value)}
              className="rounded-lg border border-line bg-paper-raised px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
