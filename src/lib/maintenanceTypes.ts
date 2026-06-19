export interface MaintenanceTypeDef {
  value: string
  label: string
  defaultIntervalKm: number | null
  defaultIntervalMonths: number | null
}

// Defaults are reasonable starting points for a typical motorcycle/scooter —
// every item is editable per-bike on the Schedule page after seeding.
export const MAINTENANCE_TYPES: MaintenanceTypeDef[] = [
  { value: 'oil_change', label: 'Engine Oil (EO) Change', defaultIntervalKm: 3000, defaultIntervalMonths: 4 },
  { value: 'battery_change', label: 'Battery Change', defaultIntervalKm: null, defaultIntervalMonths: 24 },
  { value: 'air_filter', label: 'Air Filter', defaultIntervalKm: 6000, defaultIntervalMonths: 12 },
  { value: 'spark_plug', label: 'Spark Plug', defaultIntervalKm: 8000, defaultIntervalMonths: 12 },
  { value: 'brake_pads', label: 'Brake Pads', defaultIntervalKm: 10000, defaultIntervalMonths: null },
  { value: 'brake_fluid', label: 'Brake Fluid', defaultIntervalKm: null, defaultIntervalMonths: 24 },
  { value: 'chain_belt', label: 'Chain / Belt Lubrication', defaultIntervalKm: 500, defaultIntervalMonths: null },
  { value: 'coolant', label: 'Coolant', defaultIntervalKm: null, defaultIntervalMonths: 24 },
  { value: 'tires', label: 'Tires', defaultIntervalKm: 15000, defaultIntervalMonths: null },
  { value: 'suspension', label: 'Suspension / Fork Oil', defaultIntervalKm: 20000, defaultIntervalMonths: 24 },
  { value: 'clutch', label: 'Clutch Adjustment', defaultIntervalKm: 5000, defaultIntervalMonths: null },
  { value: 'general_service', label: 'General Service', defaultIntervalKm: 5000, defaultIntervalMonths: 6 },
  { value: 'other', label: 'Other', defaultIntervalKm: null, defaultIntervalMonths: null },
]

export function maintenanceLabel(value: string): string {
  return MAINTENANCE_TYPES.find((t) => t.value === value)?.label ?? value
}
