# Somali Job Platform

Somali Job Platform is a full-stack job, skills, and training system built for Somali-speaking communities. It connects workers, employers, training providers, and admins in one bilingual (English/Somali) platform.

## What this system includes

- Multi-role access: `worker`, `employer`, `provider`, `admin`
- Authentication with email verification and password reset OTP
- Job posting, discovery, application tracking, and applicant review
- Training publication, enrollment, completion, and certificate issuance
- Resume and asset uploads (local disk by default)
- Messaging and contact endpoints
- Public stats and admin analytics/audit endpoints
- Optional AI chat assistant endpoint (`/api/chat/assistant`)

## Tech stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth: JWT
- Integrations: Nodemailer (SMTP), Twilio (optional), AWS env hooks (currently disk-first uploads)

## Repository structure

```text
.
|-- backend/
|   |-- prisma/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   `-- utils/
|   `-- package.json
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- contexts/
|   `-- lib/
|-- docs/
|   `-- API_REFERENCE.md
|-- .env.example
`-- package.json
```

## Quick start

### 1. Install dependencies (workspace root)

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` in the repository root and fill in values.

```bash
cp .env.example .env
```

Notes:
- Backend loads `.env` from `backend/.env` first, otherwise `../.env` (root `.env`).
- Frontend uses `NEXT_PUBLIC_API_URL`.

### 3. Set up database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Run app (from root)

```bash
npm run dev
```

- Frontend default: `http://localhost:3000`
- Backend default: `http://localhost:7000`
- Health check: `GET http://localhost:7000/health`

## Seeded demo accounts

From `backend/prisma/seed.ts`:

- `admin@somalijob.com` / `admin123`
- `worker@example.com` / `worker123`
- `employee@example.com` / `employee123`
- `employer@example.com` / `employer123`
- `provider@example.com` / `provider123`

## Environment variables

See `.env.example` for all keys. Important groups:

- Core: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `BACKEND_PUBLIC_URL`, `PUBLIC_ASSET_BASE_URL`
- Database: `DATABASE_URL`
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Email: `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `CONTACT_EMAIL_TO`
- Optional SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `SMS_TO`
- Optional AWS/S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `FORCE_DISK_STORAGE`
- AI assistant: `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`
- Frontend public: `NEXT_PUBLIC_API_URL`

## Upload/storage behavior

The code currently uses local disk storage by default (`backend/uploads`) even when AWS keys are present, due to SDK compatibility safeguards in `backend/src/config/aws.ts`.

## Scripts

### Root

- `npm run dev` - run backend + frontend concurrently
- `npm run build` - build backend and frontend
- `npm run seed` - run backend Prisma seed

### Backend (`backend/package.json`)

- `npm run dev` - start API with nodemon
- `npm run build` - compile TypeScript
- `npm start` - run compiled server
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run db:studio`

### Frontend (`frontend/package.json`)

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`

## API documentation

Full endpoint list is in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Security notes

- Do not commit real credentials in `.env`.
- Use strong `JWT_SECRET` in non-local environments.
- Rotate SMTP/API keys if they were exposed.
- Restrict CORS `FRONTEND_URL` in production.

## Deployment notes

- Build backend: `cd backend && npm install && npm run build`
- Start backend: `cd backend && npm start`
- Build frontend: `cd frontend && npm install && npm run build`
- Start frontend: `cd frontend && npm start`

Use managed PostgreSQL and configure environment variables per environment.
# ZeilaLink
