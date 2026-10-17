# MotorVibe syllabus coverage map

This map follows the uploaded course handouts. It distinguishes implemented demonstrations from integrations that require local infrastructure.

| CO / supplied source | Included in the project | Where to demonstrate |
|---|---|---|
| CO1 — SignalDash architecture and Tailwind CSS | Sensor → optional MQTT broker → Node/Express → Socket.IO/SSE → React/Recharts architecture panel; semantic HTML; responsive Tailwind utility styling | Engineering labs → SignalDash architecture; full dashboard UI |
| CO2 — SignalDash, PressureDash, VoltDash | Reading generation, °C/°F and Pa/bar switches, voltage/current view with \(R=2\Omega\), average calculations, abnormal thresholds, history, Emergency Stop/Restart | Engineering labs → TempDash, PressureDash, VoltDash; top-level Emergency stop |
| CO2 — Async/Await + Fetch | Asynchronous JSON fetch, loading state, network error message, API-key-missing exercise | Engineering labs → Async / await + Fetch API lab |
| CO3 — Components, JSX, props/state, unidirectional flow | Reusable typed components receive props; React state updates UI; custom `useSensorData`; `useEffect` timer cleanup; `useRef` counter; rolling 60-sample history; charts | Dashboard + Engineering labs |
| CO3 — SpeedDash / PulseDash / custom hook chart | Speed abnormal threshold >120 km/h; pulse abnormal threshold <60 or >100 bpm; line chart and rolling history | Engineering labs → SpeedDash and PulseDash |
| CO4 — TypeScript, semantic HTML5, Tailwind, power/humidity | Strict TypeScript interfaces; temperature conversion; PowerDash \(P=V\times I\) with >6 W threshold; HumidDash 40–60% comfort band; responsive Tailwind layout | Engineering labs |
| CO5 — REST, WebSockets/Socket.IO, rooms/namespaces concepts, SSE | REST API routes; Socket.IO push stream; SSE stream; polling selector; simulated server telemetry; MQTT-to-browser broadcast if configured | Protocol selector in top bar; server `/api/events`; Socket.IO `telemetry:reading` |
| CO6 — PostgreSQL secure history API | `pg.Pool`, `.env`, parameterized queries, Zod validation, bounded `hours` 1–168, error handling, indexed history table, bcrypt password hashes, JWT login, seed data | `server/src/server.js`, `server/sql/schema.sql`, `server/scripts/seed.js` |

## Infrastructure-dependent items

- **MQTT:** implemented as an optional subscriber. Configure `MQTT_URL` and `MQTT_TOPIC` in `server/.env` to connect a broker. Without it, the app uses clearly labelled simulated data.
- **PostgreSQL:** persistent CRUD/history requires a running database and a valid `DATABASE_URL`. Demo mode works without the database.
- **Weather API:** the Fetch lab calls Open-Meteo for current weather in Hyderabad. Network restrictions may prevent the request in some environments; the UI shows an error state.
- **Cloud deployment:** the project is deployment-ready as a starter, but it is **not already deployed**. Set production secrets and deploy the client/API/database to your chosen hosting services before presenting a live URL.
- **Security note:** demo-mode session storage is only for classroom UI access. Production deployments should enforce authentication/authorization on protected endpoints and use HTTPS, strong secrets, secure token storage, rate limits, and backups.
