import { useBikes } from '../../hooks/useBikes'
import { useSelectedBike } from '../../hooks/useSelectedBike'

export function TopBar({ title }: { title: string }) {
  const { data: bikes } = useBikes()
  const { selectedBikeId, setSelectedBikeId } = useSelectedBike()

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
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
      </div>
    </header>
  )
}
