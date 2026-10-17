CREATE SEQUENCE IF NOT EXISTS motor_id_seq START 100;
CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS motors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(120) NOT NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'Unspecified',
  vibration NUMERIC(10,2) NOT NULL DEFAULT 0,
  temperature NUMERIC(10,2) NOT NULL DEFAULT 25,
  rpm INTEGER NOT NULL DEFAULT 0,
  current NUMERIC(10,2) NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  status VARCHAR(10) NOT NULL DEFAULT 'Healthy' CHECK (status IN ('Healthy','Warning','Critical')),
  last_service DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50) NOT NULL,
  metric_value NUMERIC(12,3) NOT NULL,
  metric_name VARCHAR(50) NOT NULL DEFAULT 'vibration',
  motor_name VARCHAR(100),
  vibration NUMERIC(10,2),
  temperature NUMERIC(10,2),
  rpm INTEGER,
  current NUMERIC(10,2),
  reading_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_time ON telemetry_logs(sensor_id, reading_timestamp DESC);
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  motor_id VARCHAR(50) NOT NULL,
  motor_name VARCHAR(100) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('Warning','Critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS maintenance_orders (
  id BIGSERIAL PRIMARY KEY,
  motor_id VARCHAR(50) NOT NULL,
  motor_name VARCHAR(100) NOT NULL,
  task VARCHAR(300) NOT NULL,
  due_date DATE NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('Low','Medium','High')),
  status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','In progress','Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
