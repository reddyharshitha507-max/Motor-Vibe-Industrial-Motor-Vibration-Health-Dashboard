# MotorVibe — Full-Stack Motor Health & Telemetry Dashboard

A course-aligned React + TypeScript + Tailwind + Express + PostgreSQL implementation. The UI is designed to run in **demo mode** immediately; connecting PostgreSQL enables persistent sensor history, maintenance records, and authenticated API endpoints.

See **[CO-MAPPING.md](./CO-MAPPING.md)** for the requirement-by-requirement coverage map based on the uploaded handouts.\n\n## Included course concepts

- **CO1 — Architecture and styling:** sensor → API / real-time transport → React dashboard; semantic HTML5; responsive Tailwind utility styling.
- **CO2 — State, events and array methods:** generate readings, Celsius/Fahrenheit conversion, history, abnormal-value filters, average via `reduce`, `map`-rendered history, Emergency Stop/Restart.
- **CO3 — React:** reusable components and props, state, effects, refs, callbacks, custom `useSensorData` hook, unidirectional data flow, rolling 60-reading window and Recharts graph.
- **CO4 — TypeScript:** strict interfaces for sensor readings and typed UI; temperature conversion; PowerDash (P=V×I); HumidDash classifications; typed component props and responsive Tailwind.
- **CO5 — Real-time protocols:** REST, Socket.IO/WebSocket push, SSE endpoint and polling fallback selector. The dashboard shows a clear demo/live-connection state.
- **CO6 — PostgreSQL secure history API:** connection pooling (`pg.Pool`), `.env`, parameterized SQL, input validation, consistent error handling, history API, SQL-injection-safe queries and seed data.

## Run the frontend + API

Requirements: Node.js 20+ and npm. PostgreSQL is optional for the demo UI, but required for persistent database features.

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

Open `http://localhost:5173`. The frontend simulates telemetry locally if the API or database is not configured.

## Enable PostgreSQL persistence

1. Create a PostgreSQL database named `motorvibe`.
2. Copy `server/.env.example` to `server/.env` and fill in your own local credentials. Never commit `.env`.
3. Run:

```bash
npm run db:setup
npm run db:seed
```

4. Restart `npm run dev`. API health is available at `http://localhost:3001/api/health`.

### Demo authentication

The frontend includes a demo-only local session so you can inspect the UI without setup. For backend API authentication, use `/api/auth/register` and `/api/auth/login`; passwords are hashed with bcrypt and responses use JWT. Do not use demo mode or local storage as production authentication.

## Main API routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/sensors`
- `POST /api/sensors`
- `PATCH /api/sensors/:id`
- `DELETE /api/sensors/:id`
- `GET /api/sensors/:id/history?hours=24` — CO6 exercise pattern, validates `hours` 1–168 and uses parameterized SQL.
- `POST /api/readings`
- `GET /api/alerts`
- `PATCH /api/alerts/:id/acknowledge`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `PATCH /api/maintenance/:id`
- `GET /api/events` — Server-Sent Events stream
- Socket.IO event: `telemetry:reading`

## Notes

- Optional MQTT ingestion is enabled by setting `MQTT_URL` and `MQTT_TOPIC` in `server/.env`; expected messages are JSON telemetry payloads.\n- Simulated readings are labelled **SIMULATED**. No physical sensor or cloud service is claimed to be connected.
- For a real deployment, use HTTPS, strong secrets, secure cookie/token handling, rate limits, role-based access control, managed PostgreSQL, backups, and production telemetry ingestion.
- CO6/PBL deliverables in the supplied handout also mention cloud deployment and seed-data creation; `server/scripts/seed.js` and the deployment checklist in this README provide starting points, not a claim that the app is already deployed.

## Deployment checklist (CO6 / PBL)

- [ ] Configure production `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` as hosting environment variables.
- [ ] Use managed PostgreSQL and run `npm run db:setup` plus `npm run db:seed` against that database.
- [ ] Build the client with `npm run build` and serve the generated `client/dist` assets from a static host or reverse proxy.
- [ ] Deploy the Express server to a Node-compatible host and configure CORS to the real client origin.
- [ ] Verify `/api/health`, authentication, history API validation, Socket.IO, and SSE over HTTPS.
- [ ] Add role-based access control, protected CRUD endpoints, monitoring, backups and logging before production use.
