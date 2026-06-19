export function OdometerPlate({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string
  value: string
  unit?: string
  tone?: 'default' | 'warn' | 'danger'
}) {
  const digitTone =
    tone === 'danger' ? 'text-danger-soft' : tone === 'warn' ? 'text-warn-soft' : 'text-plate-digit'

  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="rounded-md bg-plate px-3 py-2.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.45)]">
        <span className={`font-numeric text-2xl font-semibold tracking-wider ${digitTone}`}>{value}</span>
        {unit && <span className={`ml-1.5 font-numeric text-xs ${digitTone} opacity-70`}>{unit}</span>}
      </div>
    </div>
  )
}
