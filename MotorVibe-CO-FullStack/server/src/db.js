require('dotenv').config()
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})
pool.on('error', err => console.error('Unexpected idle PostgreSQL client error:', err.message))
module.exports = pool
