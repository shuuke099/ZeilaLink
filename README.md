# Somali Job Platform

Somali Job Platform is a full-stack job, skills, and training system built for Somali-speaking communities. It connects workers, employers, training providers, and admins in one bilingual (English/Somali) platform.

## What this system includes

- Multi-role access: `worker`, `employer`, `provider`, `admin`
- Authentication with email verification and password reset OTP
- Job posting, discovery, application tracking, and applicant review
- Training publication, worker enrollment, and provider-controlled certificate issuance
- Resume and asset uploads (local disk by default)
- Messaging and contact endpoints
- Public stats and admin analytics/audit endpoints
- Optional AI chat assistant endpoint (`/api/chat/assistant`)

## Tech stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth: short-lived JWT in an HttpOnly, Secure production cookie
- Integrations: Nodemailer (SMTP), Twilio (optional), Stripe and OpenAI (optional)

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
- Production frontend traffic uses the same-origin `/api` proxy. Set
  `INTERNAL_API_ORIGIN` to the private backend origin and `NEXT_PUBLIC_API_URL=/api`.

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

The development seed uses clearly identified sample accounts and records. It no
longer contains published passwords: set the five `SEED_*_PASSWORD` variables
before running it. Production seeding is blocked unless a reviewed deployment
explicitly sets `ALLOW_PRODUCTION_SEED=true`.

## Environment variables

See `.env.example` for all keys. Important groups:

- Core: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `BACKEND_PUBLIC_URL`, `INTERNAL_API_ORIGIN`, `UPLOADS_ROOT`
- Database: `DATABASE_URL`
- Auth: independent `JWT_SECRET` and `OTP_SECRET` values (at least 32 random bytes), `JWT_EXPIRES_IN`, `AUTH_COOKIE_MAX_AGE_MS`
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_EMAIL_TO`
- Optional SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `SMS_TO`
- Proxy: `TRUST_PROXY_ADDRESSES` must contain only the production reverse-proxy IPs/CIDRs
- AI assistant: `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`
- Optional cache: `REDIS_URL`

## Upload/storage behavior

Public account images use `backend/uploads/public`; resumes and documents use
private storage and are returned only through authenticated, ownership-checked
download routes. Production `UPLOADS_ROOT` must be an absolute path on encrypted,
persistent storage. Add malware scanning/CDR before accepting production documents.

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
- `npm run security:check-passwords` - read-only hash-format and legacy-password audit

### Frontend (`frontend/package.json`)

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`

## API documentation

Full endpoint list is in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Security notes

- Do not commit real credentials in `.env`.
- Use independent, randomly generated `JWT_SECRET` and `OTP_SECRET` values.
- Rotate SMTP/API keys if they were exposed.
- Restrict CORS `FRONTEND_URL` in production.
- Use a shared Redis-backed rate-limit store before running multiple API instances.
- Never commit user uploads. If documents were committed previously, remove them
  from Git history using an approved retention and incident-response process.

## Deployment notes

- Install exactly the reviewed lockfile: `pnpm install --frozen-lockfile`
- Build both applications: `pnpm run build`
- Start backend: `pnpm -C backend start`
- Start frontend: `pnpm -C frontend start`

Use managed PostgreSQL and configure environment variables per environment.
