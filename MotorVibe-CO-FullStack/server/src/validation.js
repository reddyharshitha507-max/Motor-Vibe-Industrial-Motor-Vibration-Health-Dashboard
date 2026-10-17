const { z } = require('zod')
const sensorSchema = z.object({
  id: z.string().min(2).max(50).optional(),
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(120),
  model: z.string().trim().max(100).optional().default('Unspecified'),
  vibration: z.number().min(0).max(100).optional().default(0),
  temperature: z.number().min(-50).max(250).optional().default(25),
  rpm: z.number().min(0).max(100000).optional().default(0),
  current: z.number().min(0).max(10000).optional().default(0),
  health: z.number().min(0).max(100).optional().default(100),
  status: z.enum(['Healthy', 'Warning', 'Critical']).optional().default('Healthy'),
  lastService: z.string().optional(),
})
const readingSchema = z.object({
  sensor_id: z.string().min(2).max(50),
  metric_value: z.number().finite().min(-100000).max(100000),
  metric_name: z.string().min(2).max(50).optional().default('vibration'),
  motor_name: z.string().max(100).optional(),
  vibration: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-50).max(250).optional(),
  rpm: z.number().min(0).max(100000).optional(),
  current: z.number().min(0).max(10000).optional(),
})
const maintenanceSchema = z.object({
  motorId: z.string().min(2).max(50),
  motorName: z.string().min(2).max(100),
  task: z.string().trim().min(3).max(300),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Scheduled', 'In progress', 'Completed']).optional().default('Scheduled'),
})
module.exports = { sensorSchema, readingSchema, maintenanceSchema }
