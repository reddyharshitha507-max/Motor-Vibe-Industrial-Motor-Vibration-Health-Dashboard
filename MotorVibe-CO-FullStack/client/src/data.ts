import type { AlertItem, MaintenanceItem, Motor, SensorReading, HealthStatus } from './types'

const calcStatus = (v: number, t: number): HealthStatus => v >= 8 || t >= 90 ? 'Critical' : v >= 5 || t >= 75 ? 'Warning' : 'Healthy'
export const initialMotors: Motor[] = [
  { id: 'MTR-001', name: 'Main Drive Motor', location: 'Production · Line A', model: 'ABB M3BP 160', vibration: 3.2, temperature: 62, rpm: 1475, current: 8.4, health: 94, status: 'Healthy', lastService: '2026-09-18' },
  { id: 'MTR-002', name: 'Conveyor Motor 02', location: 'Assembly · Line B', model: 'Siemens 1LE1', vibration: 6.7, temperature: 78, rpm: 1438, current: 11.2, health: 71, status: 'Warning', lastService: '2026-08-29' },
  { id: 'MTR-003', name: 'Cooling Pump Motor', location: 'Utilities · Pump Room', model: 'WEG W22', vibration: 9.1, temperature: 94, rpm: 1450, current: 13.6, health: 42, status: 'Critical', lastService: '2026-07-11' },
  { id: 'MTR-004', name: 'Packaging Motor', location: 'Packaging · Line C', model: 'ABB M2BAX', vibration: 2.1, temperature: 56, rpm: 1480, current: 7.1, health: 97, status: 'Healthy', lastService: '2026-10-01' },
  { id: 'MTR-005', name: 'Exhaust Fan Motor', location: 'Ventilation · Zone 3', model: 'Brook Crompton', vibration: 5.4, temperature: 73, rpm: 1392, current: 9.8, health: 78, status: 'Warning', lastService: '2026-09-05' },
]
export function makeReading(motor: Motor): SensorReading {
  const vibration = Math.max(0.5, +(motor.vibration + (Math.random() - .5) * 1.2).toFixed(2))
  const temperature = Math.max(20, +(motor.temperature + (Math.random() - .5) * 5).toFixed(1))
  const status = calcStatus(vibration, temperature)
  return { id: crypto.randomUUID(), motorId: motor.id, motorName: motor.name, timestamp: new Date().toISOString(), vibration, temperature, rpm: Math.round(motor.rpm + (Math.random() - .5) * 35), current: +(motor.current + (Math.random() - .5) * 1.2).toFixed(1), health: Math.max(5, Math.min(100, Math.round(100 - vibration * 3.2 - Math.max(0, temperature - 60) * .6))), status, simulated: true }
}
export const initialHistory: SensorReading[] = Array.from({ length: 18 }, (_, i) => {
  const motor = initialMotors[i % initialMotors.length]
  const reading = makeReading(motor)
  reading.timestamp = new Date(Date.now() - (17 - i) * 60_000).toISOString()
  return reading
})
export const initialAlerts: AlertItem[] = [
  { id: 'ALT-104', motorId: 'MTR-003', motorName: 'Cooling Pump Motor', severity: 'Critical', message: 'Vibration above critical threshold · 9.1 mm/s', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), acknowledged: false },
  { id: 'ALT-103', motorId: 'MTR-002', motorName: 'Conveyor Motor 02', severity: 'Warning', message: 'Bearing temperature elevated · 78°C', timestamp: new Date(Date.now() - 34 * 60000).toISOString(), acknowledged: false },
  { id: 'ALT-102', motorId: 'MTR-005', motorName: 'Exhaust Fan Motor', severity: 'Warning', message: 'Vibration trend increasing over last 15 minutes', timestamp: new Date(Date.now() - 91 * 60000).toISOString(), acknowledged: true },
]
export const initialMaintenance: MaintenanceItem[] = [
  { id: 'WO-2081', motorId: 'MTR-003', motorName: 'Cooling Pump Motor', task: 'Inspect bearings & shaft alignment', dueDate: '2026-10-17', priority: 'High', status: 'Scheduled' },
  { id: 'WO-2080', motorId: 'MTR-002', motorName: 'Conveyor Motor 02', task: 'Thermal inspection and lubrication', dueDate: '2026-10-19', priority: 'Medium', status: 'Scheduled' },
  { id: 'WO-2074', motorId: 'MTR-005', motorName: 'Exhaust Fan Motor', task: 'Vibration re-check', dueDate: '2026-10-21', priority: 'Low', status: 'In progress' },
]
