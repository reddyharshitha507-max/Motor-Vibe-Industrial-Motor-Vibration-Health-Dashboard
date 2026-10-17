export type HealthStatus = 'Healthy' | 'Warning' | 'Critical'
export type Metric = 'vibration' | 'temperature' | 'rpm' | 'current'
export interface SensorReading {
  id: string
  motorId: string
  motorName: string
  timestamp: string
  vibration: number
  temperature: number
  rpm: number
  current: number
  health: number
  status: HealthStatus
  simulated?: boolean
}
export interface Motor {
  id: string
  name: string
  location: string
  model: string
  vibration: number
  temperature: number
  rpm: number
  current: number
  health: number
  status: HealthStatus
  lastService: string
}
export interface AlertItem {
  id: string
  motorId: string
  motorName: string
  severity: 'Warning' | 'Critical'
  message: string
  timestamp: string
  acknowledged: boolean
}
export interface MaintenanceItem {
  id: string
  motorId: string
  motorName: string
  task: string
  dueDate: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Scheduled' | 'In progress' | 'Completed'
}
export interface SensorMeta { name: string; unit: string; description: string }
export interface ApiStatus { mode: 'demo' | 'connected' | 'offline'; message: string }
