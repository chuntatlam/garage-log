import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Bikes } from './pages/Bikes'
import { FuelLog } from './pages/FuelLog'
import { MaintenanceLog } from './pages/MaintenanceLog'
import { Schedule } from './pages/Schedule'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-soft">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/fuel" element={<FuelLog />} />
      <Route path="/maintenance" element={<MaintenanceLog />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/bikes" element={<Bikes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
