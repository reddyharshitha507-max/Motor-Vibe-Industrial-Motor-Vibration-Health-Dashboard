require('dotenv').config()
const fs = require('fs')
const path = require('path')
const pool = require('../src/db')
async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8')
  await pool.query(sql)
  console.log('MotorVibe database schema created.')
  await pool.end()
}
main().catch(err => { console.error('Schema setup failed:', err.message); process.exit(1) })
