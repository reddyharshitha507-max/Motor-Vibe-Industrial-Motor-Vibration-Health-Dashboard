require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mqtt = require('mqtt')
const { Server } = require('socket.io')
const http = require('http')
const pool = require('./db')
const { sensorSchema, readingSchema, maintenanceSchema } = require('./validation')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST', 'PATCH', 'DELETE'] } })
const PORT = Number(process.env.PORT || 3001)
const hasDb = Boolean(process.env.DATABASE_URL)
const sseClients = new Set()
let mqttClient = null
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }))

function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next) }
function dbRequired(req, res, next) {
  if (!hasDb) return res.status(503).json({ message: 'PostgreSQL is not configured. Set DATABASE_URL in server/.env.' })
  next()
}
function authRequired(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication token required' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-change-me'); next() }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }) }
}
app.get('/api/health', asyncRoute(async (req, res) => {
  let database = 'not configured'
  if (hasDb) {
    try { await pool.query('SELECT 1'); database = 'connected' } catch { database = 'unavailable' }
  }
  res.json({ ok: true, service: 'MotorVibe API', database, realtime: 'Socket.IO + SSE', timestamp: new Date().toISOString() })
}))
app.post('/api/auth/register', dbRequired, asyncRoute(async (req, res) => {
  const { email, password, name } = req.body || {}
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) return res.status(400).json({ message: 'Name must be 2–100 characters' })
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address' })
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) return res.status(400).json({ message: 'Password must be 10–128 characters' })
  const hash = await bcrypt.hash(password, 12)
  try {
    const result = await pool.query('INSERT INTO app_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email', [name.trim(), email.toLowerCase(), hash])
    res.status(201).json({ user: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'An account with this email already exists' })
    throw err
  }
}))
app.post('/api/auth/login', dbRequired, asyncRoute(async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required' })
  const result = await pool.query('SELECT id, name, email, password_hash FROM app_users WHERE email = $1', [email.toLowerCase()])
  if (!result.rows[0] || !(await bcrypt.compare(password, result.rows[0].password_hash))) return res.status(401).json({ message: 'Invalid email or password' })
  const user = result.rows[0]
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-only-secret-change-me', { expiresIn: '8h' })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
}))
app.get('/api/sensors', dbRequired, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT id, name, location, model, vibration, temperature, rpm, current, health, status, last_service AS "lastService" FROM motors ORDER BY id')
  res.json(result.rows)
}))
app.post('/api/sensors', dbRequired, asyncRoute(async (req, res) => {
  const parsed = sensorSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid motor data', issues: parsed.error.issues })
  const m = parsed.data
  const result = await pool.query(
    `INSERT INTO motors (id, name, location, model, vibration, temperature, rpm, current, health, status, last_service)
     VALUES (COALESCE($1, 'MTR-' || nextval('motor_id_seq')::text), $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::date, CURRENT_DATE))
     RETURNING *`,
    [m.id || null, m.name, m.location, m.model, m.vibration, m.temperature, m.rpm, m.current, m.health, m.status, m.lastService || null])
  res.status(201).json(result.rows[0])
}))
app.patch('/api/sensors/:id', dbRequired, asyncRoute(async (req, res) => {
  const parsed = sensorSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid motor data', issues: parsed.error.issues })
  const m = parsed.data
  const result = await pool.query(
    `UPDATE motors SET name=COALESCE($2,name), location=COALESCE($3,location), model=COALESCE($4,model),
     vibration=COALESCE($5,vibration), temperature=COALESCE($6,temperature), rpm=COALESCE($7,rpm),
     current=COALESCE($8,current), health=COALESCE($9,health), status=COALESCE($10,status),
     last_service=COALESCE($11::date,last_service) WHERE id=$1 RETURNING *`,
    [req.params.id, m.name ?? null, m.location ?? null, m.model ?? null, m.vibration ?? null, m.temperature ?? null, m.rpm ?? null, m.current ?? null, m.health ?? null, m.status ?? null, m.lastService ?? null])
  if (!result.rowCount) return res.status(404).json({ message: 'Motor not found' })
  res.json(result.rows[0])
}))
app.delete('/api/sensors/:id', dbRequired, asyncRoute(async (req, res) => {
  const result = await pool.query('DELETE FROM motors WHERE id=$1 RETURNING id', [req.params.id])
  if (!result.rowCount) return res.status(404).json({ message: 'Motor not found' })
  res.status(204).end()
}))
app.post('/api/readings', dbRequired, asyncRoute(async (req, res) => {
  const parsed = readingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid telemetry reading', issues: parsed.error.issues })
  const r = parsed.data
  const result = await pool.query(
    `INSERT INTO telemetry_logs (sensor_id, metric_value, metric_name, motor_name, vibration, temperature, rpm, current)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [r.sensor_id, r.metric_value, r.metric_name, r.motor_name || null, r.vibration ?? null, r.temperature ?? null, r.rpm ?? null, r.current ?? null])
  io.emit('telemetry:reading', { ...r, id: String(result.rows[0].id), timestamp: result.rows[0].reading_timestamp })
  res.status(201).json(result.rows[0])
}))
// CO6 exercise route: validates ID + 1–168 hours, then uses SQL parameters ($1, $2).
app.get('/api/sensors/:id/history', dbRequired, asyncRoute(async (req, res) => {
  const sensorId = req.params.id
  const hours = req.query.hours === undefined ? 24 : Number(req.query.hours)
  if (!sensorId || sensorId.length > 50) return res.status(400).json({ message: 'Valid sensor ID required' })
  if (!Number.isInteger(hours) || hours <= 0 || hours > 168) return res.status(400).json({ message: 'Hours must be an integer between 1 and 168' })
  const result = await pool.query(
    `SELECT id, sensor_id, metric_value, metric_name, motor_name, vibration, temperature, rpm, current,
            reading_timestamp AS timestamp
     FROM telemetry_logs WHERE sensor_id=$1 AND reading_timestamp >= NOW()-($2 * INTERVAL '1 hour')
     ORDER BY reading_timestamp DESC LIMIT 5000`, [sensorId, hours])
  if (!result.rows.length) return res.status(404).json({ message: 'No data found for this sensor and time window' })
  res.json(result.rows)
}))
app.get('/api/alerts', dbRequired, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT id, motor_id AS "motorId", motor_name AS "motorName", severity, message, created_at AS timestamp, acknowledged FROM alerts ORDER BY created_at DESC LIMIT 500')
  res.json(result.rows)
}))
app.patch('/api/alerts/:id/acknowledge', dbRequired, asyncRoute(async (req, res) => {
  const result = await pool.query('UPDATE alerts SET acknowledged=TRUE WHERE id=$1 RETURNING id, acknowledged', [req.params.id])
  if (!result.rowCount) return res.status(404).json({ message: 'Alert not found' })
  res.json(result.rows[0])
}))
app.get('/api/maintenance', dbRequired, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT id, motor_id AS "motorId", motor_name AS "motorName", task, due_date AS "dueDate", priority, status FROM maintenance_orders ORDER BY due_date')
  res.json(result.rows)
}))
app.post('/api/maintenance', dbRequired, asyncRoute(async (req, res) => {
  const parsed = maintenanceSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid maintenance order', issues: parsed.error.issues })
  const w = parsed.data
  const result = await pool.query('INSERT INTO maintenance_orders (motor_id,motor_name,task,due_date,priority,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,motor_id AS "motorId",motor_name AS "motorName",task,due_date AS "dueDate",priority,status', [w.motorId,w.motorName,w.task,w.dueDate,w.priority,w.status])
  res.status(201).json(result.rows[0])
}))
app.patch('/api/maintenance/:id', dbRequired, asyncRoute(async (req, res) => {
  const status = req.body?.status
  if (!['Scheduled', 'In progress', 'Completed'].includes(status)) return res.status(400).json({ message: 'Invalid work order status' })
  const result = await pool.query('UPDATE maintenance_orders SET status=$2 WHERE id=$1 RETURNING id,status', [req.params.id,status])
  if (!result.rowCount) return res.status(404).json({ message: 'Work order not found' })
  res.json(result.rows[0])
}))
// Server-Sent Events: unidirectional server-to-client telemetry push.
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  sseClients.add(res)
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, simulated: true })}\n\n`)
  req.on('close', () => sseClients.delete(res))
})
app.use((err, req, res, next) => {
  console.error('API error:', err.message)
  if (res.headersSent) return next(err)
  res.status(500).json({ message: 'Unexpected server error. Check server logs for details.' })
})
const alertNamespace = io.of('/alerts')
alertNamespace.on('connection', socket => { socket.join('plant:01'); socket.emit('alerts:status', { connected: true }) })
io.on('connection', socket => {
  socket.join('plant:01')
  socket.emit('telemetry:status', { connected: true, timestamp: new Date().toISOString(), simulated: true })
})
// Optional CO1 MQTT ingestion: configure MQTT_URL to subscribe to real sensor telemetry.
// Expected JSON payload: { sensor_id, metric_value, metric_name, motor_name, vibration, temperature, rpm, current }.
if (process.env.MQTT_URL) {
  mqttClient = mqtt.connect(process.env.MQTT_URL, { reconnectPeriod: 3000, connectTimeout: 5000 })
  mqttClient.on('connect', () => {
    const topic = process.env.MQTT_TOPIC || 'motorvibe/+/telemetry'
    mqttClient.subscribe(topic, err => { if (err) console.error('MQTT subscription failed:', err.message); else console.log('Subscribed to MQTT topic:', topic) })
  })
  mqttClient.on('message', async (topic, buffer) => {
    try {
      const payload = JSON.parse(buffer.toString())
      const parsed = readingSchema.safeParse(payload)
      if (!parsed.success) return console.warn('Ignored invalid MQTT payload on', topic)
      const r = parsed.data
      const reading = { id: `MQTT-${Date.now()}`, motorId: r.sensor_id, motorName: r.motor_name || r.sensor_id, timestamp: new Date().toISOString(), vibration: r.vibration ?? (r.metric_name === 'vibration' ? r.metric_value : 0), temperature: r.temperature ?? 25, rpm: r.rpm ?? 0, current: r.current ?? 0, health: 100, status: 'Healthy', simulated: false }
      if (hasDb) {
        await pool.query('INSERT INTO telemetry_logs(sensor_id,metric_value,metric_name,motor_name,vibration,temperature,rpm,current) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [r.sensor_id,r.metric_value,r.metric_name,r.motor_name || null,r.vibration ?? null,r.temperature ?? null,r.rpm ?? null,r.current ?? null])
      }
      io.to('plant:01').emit('telemetry:reading', reading)
      if (reading.status !== 'Healthy') alertNamespace.to('plant:01').emit('alert:new', { motorId: reading.motorId, motorName: reading.motorName, severity: reading.status, timestamp: reading.timestamp, simulated: true })
      const frame = `data: ${JSON.stringify(reading)}\n\n`
      for (const client of sseClients) { try { client.write(frame) } catch { sseClients.delete(client) } }
    } catch (err) { console.error('Invalid MQTT message:', err.message) }
  })
  mqttClient.on('error', err => console.error('MQTT connection error:', err.message))
}
// Stand-in telemetry producer for local lab demonstrations. Replace this with your MQTT broker data for physical sensors.
const demoMotors = [
  { id: 'MTR-001', name: 'Main Drive Motor', vibration: 3.2, temperature: 62, rpm: 1475, current: 8.4 },
  { id: 'MTR-002', name: 'Conveyor Motor 02', vibration: 6.7, temperature: 78, rpm: 1438, current: 11.2 },
  { id: 'MTR-003', name: 'Cooling Pump Motor', vibration: 9.1, temperature: 94, rpm: 1450, current: 13.6 },
  { id: 'MTR-004', name: 'Packaging Motor', vibration: 2.1, temperature: 56, rpm: 1480, current: 7.1 },
]
setInterval(() => {
  const m = demoMotors[Math.floor(Math.random() * demoMotors.length)]
  const vibration = Math.max(0.5, +(m.vibration + (Math.random() - .5) * 1.2).toFixed(2))
  const temperature = +(m.temperature + (Math.random() - .5) * 5).toFixed(1)
  const status = vibration >= 8 || temperature >= 90 ? 'Critical' : vibration >= 5 || temperature >= 75 ? 'Warning' : 'Healthy'
  const reading = { id: `SIM-${Date.now()}`, motorId: m.id, motorName: m.name, timestamp: new Date().toISOString(), vibration, temperature, rpm: Math.round(m.rpm + (Math.random() - .5) * 30), current: +(m.current + (Math.random() - .5)).toFixed(1), health: Math.max(5, Math.round(100 - vibration * 3 - Math.max(0, temperature - 60) * .6)), status, simulated: true }
  io.to('plant:01').emit('telemetry:reading', reading)
  if (reading.status !== 'Healthy') alertNamespace.to('plant:01').emit('alert:new', { motorId: reading.motorId, motorName: reading.motorName, severity: reading.status, timestamp: reading.timestamp, simulated: true })
  const frame = `data: ${JSON.stringify(reading)}\n\n`
  for (const client of sseClients) { try { client.write(frame) } catch { sseClients.delete(client) } }
}, 2500)
server.listen(PORT, () => console.log(`MotorVibe API listening on http://localhost:${PORT}; PostgreSQL ${hasDb ? 'configured' : 'not configured'}`))
