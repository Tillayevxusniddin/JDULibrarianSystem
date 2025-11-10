# JDULibrarianSystem

A full‑stack library system with user accounts, book loans/reservations, fines, notifications, and a lightweight social "channels" feature for posts, comments, and reactions. Built with React + Vite on the frontend and Express + Prisma on the backend.

## Tech Stack
- Frontend: React 19, TypeScript, Vite, React Router 7, MUI, Tailwind CSS, Zustand, Axios, Socket.IO client, React Hot Toast, Framer Motion
- Backend: Node.js (TypeScript), Express 5, Prisma ORM (PostgreSQL), Redis, Socket.IO, Zod, Nodemailer, Swagger
- Tooling: Docker Compose (Postgres + Redis), ESLint, PostCSS, Tailwind, tsx/ts-node, Nodemon, Jest + Supertest

## Monorepo Structure
- `frontend/` – React app (Vite). Key: `src/components/`, `src/pages/`, `src/routes/`, `src/store/`, `src/api/`.
- `backend/` – Express API (TS). Key: `src/api/*` (controller/route/service/validation), `src/middlewares/`, `src/config/`, `src/jobs/`, `src/utils/`, `prisma/` (schema, migrations, seed), `src/api/__tests__/`.

## Prerequisites
- Node.js 18+ and npm
- Docker & Docker Compose

## Quick Start (Local Development)
1) Backend
- Install: `cd backend && npm install`
- Create `backend/.env` (example below)
- Start Postgres + Redis: `docker compose up -d`
- Apply DB migrations: `npx prisma migrate dev`
- Seed data (optional): `npm run db:seed`
- Start API dev server: `npm run dev` (default `http://localhost:5000`)

2) Frontend
- Install: `cd frontend && npm install`
- Start dev server: `npm run dev` (default `http://localhost:5173`)

3) Visit
- App: `http://localhost:5173`
- API health: `GET http://localhost:5000/`
- Swagger docs: `http://localhost:5000/api-docs`

### Example `backend/.env`
```
PORT=5000
FRONTEND_URL=http://localhost:5173
DB_USER=library_user
DB_PASSWORD=library_pass
DB_NAME=library_db
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
JWT_SECRET=change-me
JWT_EXPIRES_IN=3600
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

## Common Scripts
- Frontend: `npm run dev` | `npm run build` | `npm run preview` | `npm run lint`
- Backend: `npm run dev` | `npm run build` | `npm start` | `npm test` | `npm run db:seed` | `npm run prisma:test:migrate`

## Testing
- Backend tests (Jest + Supertest):
  - Ensure a test DB is available. From `backend/`: `dotenv -e .env.test -- docker compose up -d`
  - Apply test migrations: `npm run prisma:test:migrate`
  - Run tests: `npm test`

## Usage Notes
- Authentication uses JWT; set `JWT_SECRET` and `FRONTEND_URL` for CORS.
- Realtime features (notifications, post comments/reactions) require Redis + Socket.IO.
- File uploads are served from `backend/public` via `/public`.

## Contributing
- Use clear, imperative commit messages (e.g., `feat: add reservation status filter`).

