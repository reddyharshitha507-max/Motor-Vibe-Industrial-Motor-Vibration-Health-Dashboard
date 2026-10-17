require('dotenv').config()
const pool = require('../src/db')
const motors = [
  ['MTR-001','Main Drive Motor','Production · Line A','ABB M3BP 160',3.2,62,1475,8.4,94,'Healthy','2026-09-18'],
  ['MTR-002','Conveyor Motor 02','Assembly · Line B','Siemens 1LE1',6.7,78,1438,11.2,71,'Warning','2026-08-29'],
  ['MTR-003','Cooling Pump Motor','Utilities · Pump Room','WEG W22',9.1,94,1450,13.6,42,'Critical','2026-07-11'],
  ['MTR-004','Packaging Motor','Packaging · Line C','ABB M2BAX',2.1,56,1480,7.1,97,'Healthy','2026-10-01'],
  ['MTR-005','Exhaust Fan Motor','Ventilation · Zone 3','Brook Crompton',5.4,73,1392,9.8,78,'Warning','2026-09-05']
]
async function main() {
  for (const m of motors) {
    await pool.query(`INSERT INTO motors(id,name,location,model,vibration,temperature,rpm,current,health,status,last_service)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,location=EXCLUDED.location,model=EXCLUDED.model,vibration=EXCLUDED.vibration,temperature=EXCLUDED.temperature,rpm=EXCLUDED.rpm,current=EXCLUDED.current,health=EXCLUDED.health,status=EXCLUDED.status,last_service=EXCLUDED.last_service`, m)
    for (let i=0;i<12;i++) {
      const vib = Math.max(.5, m[4] + (Math.random()-.5)*1.4)
      const temp = Math.max(20, m[5] + (Math.random()-.5)*6)
      await pool.query(`INSERT INTO telemetry_logs(sensor_id,metric_value,metric_name,motor_name,vibration,temperature,rpm,current,reading_timestamp)
        VALUES($1,$2,'vibration',$3,$4,$5,$6,$7,NOW()-($8 * INTERVAL '5 minutes'))`,
        [m[0],vib,m[1],vib,temp,m[6],m[7],i])
    }
  }
  await pool.query(`INSERT INTO alerts(motor_id,motor_name,severity,message,acknowledged) VALUES
    ('MTR-003','Cooling Pump Motor','Critical','Vibration above critical threshold · 9.1 mm/s',false),
    ('MTR-002','Conveyor Motor 02','Warning','Bearing temperature elevated · 78°C',false)
    ON CONFLICT DO NOTHING`)
  await pool.query(`INSERT INTO maintenance_orders(motor_id,motor_name,task,due_date,priority,status) VALUES
    ('MTR-003','Cooling Pump Motor','Inspect bearings & shaft alignment',CURRENT_DATE+1,'High','Scheduled'),
    ('MTR-002','Conveyor Motor 02','Thermal inspection and lubrication',CURRENT_DATE+3,'Medium','Scheduled')
    ON CONFLICT DO NOTHING`)
  console.log('Seeded 5 motors, 60 telemetry samples, alerts and maintenance work orders.')
  await pool.end()
}
main().catch(err => { console.error('Seed failed:', err.message); process.exit(1) })
