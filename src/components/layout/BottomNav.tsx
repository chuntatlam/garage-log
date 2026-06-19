import { NavLink } from 'react-router-dom'
import { Gauge, Fuel, Wrench, CalendarClock, Bike } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/fuel', label: 'Fuel', icon: Fuel },
  { to: '/maintenance', label: 'Service', icon: Wrench },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/bikes', label: 'Bikes', icon: Bike },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper-raised/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md justify-between px-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-ink-soft'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
