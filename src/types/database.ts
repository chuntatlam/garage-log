export type OdometerUnit = 'km' | 'mi'

export interface Bike {
  id: string
  user_id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  registration_no: string | null
  vin: string | null
  purchase_date: string | null
  insurance_expiry: string | null
  puc_expiry: string | null
  current_odometer: number
  odometer_unit: OdometerUnit
  created_at: string
}

export type BikeInput = Omit<Bike, 'id' | 'user_id' | 'created_at'>

export interface FuelEntry {
  id: string
  user_id: string
  bike_id: string
  entry_date: string
  odometer: number
  quantity: number
  cost: number | null
  fuel_type: string | null
  notes: string | null
  created_at: string
}

export type FuelEntryInput = Omit<FuelEntry, 'id' | 'user_id' | 'created_at'>

export interface MaintenanceEntry {
  id: string
  user_id: string
  bike_id: string
  type: string
  service_date: string
  odometer: number
  cost: number | null
  vendor: string | null
  notes: string | null
  receipt_url: string | null
  created_at: string
}

export type MaintenanceEntryInput = Omit<MaintenanceEntry, 'id' | 'user_id' | 'created_at'>

export interface MaintenanceSchedule {
  id: string
  user_id: string
  bike_id: string
  type: string
  interval_km: number | null
  interval_months: number | null
  last_done_date: string | null
  last_done_odometer: number | null
  created_at: string
}

export type MaintenanceScheduleInput = Omit<MaintenanceSchedule, 'id' | 'user_id' | 'created_at'>

export type DueStatus = 'ok' | 'due_soon' | 'overdue' | 'unscheduled'

export interface DueInfo {
  status: DueStatus
  kmRemaining: number | null
  daysRemaining: number | null
  label: string
}
