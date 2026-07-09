# API Reference

Base URL: `http://localhost:7000/api`

Auth header format (for protected endpoints):

```http
Authorization: Bearer <JWT_TOKEN>
```

## Health

- `GET /health` - service health check (outside `/api`)

## Authentication (`/api/auth`)

- `POST /login` - login user
- `POST /register` - register user
- `POST /verify-email` - verify registration email
- `POST /resend-verification` - resend verification code
- `POST /forgot-password` - request password reset OTP
- `POST /verify-reset-otp` - validate reset OTP
- `POST /reset-password` - set new password
- `GET /users/:id/profile` - get profile (auth)
- `PUT /users/:id` - update profile (auth)
- `PUT /profile` - update current user profile (auth)
- `PUT /change-password` - change password (auth)
- `POST /upload-avatar` - upload avatar image (auth, multipart field `avatar`)

## Jobs (`/api/jobs`)

- `GET /` - list jobs (public, token optional)
- `GET /:id` - job details (public, token optional)
- `POST /` - create job (auth, role `employer`)
- `PUT /:id` - update job (auth, role `employer`)
- `DELETE /:id` - delete job (auth, role `employer`)
- `POST /:id/publish` - publish job (auth, role `employer`)
- `GET /:id/applicants` - list job applicants (auth, role `employer`)

## Applications (`/api`)

- `POST /jobs/:id/apply` - apply to job (auth, role `worker`)
- `GET /users/:id/applications` - list user applications (auth)
- `GET /applications` - list employer applications (auth, role `employer`)
- `PUT /applications/:id/status` - update application status (auth, role `employer|admin`)

## Resumes (`/api/resumes`)

- `POST /upload` - upload resume (auth, multipart field `resume`)
- `POST /presign` - get upload URL/presign response (auth)
- `GET /users/:id` - list user resumes (auth)
- `DELETE /:id` - delete resume (auth)

## Trainings (`/api/trainings`)

- `GET /` - list trainings (public, token optional)
- `GET /:id` - training details (public, token optional)
- `POST /` - create training (auth, role `provider`)
- `PUT /:id` - update training (auth, role `provider`)
- `DELETE /:id` - delete training (auth, role `provider`)
- `POST /:id/enroll` - enroll in training (auth)
- `POST /:id/complete` - mark completion (auth)
- `GET /provider/enrollments` - provider enrollment list (auth, role `provider`)
- `POST /:id/issue-certificate` - issue certificate (auth, role `provider`)

## Providers (`/api/providers`)

- `GET /` - list providers (auth)
- `POST /` - create provider profile (auth, role `provider`)
- `GET /me/profile` - current provider profile (auth, role `provider`)
- `GET /me/metrics` - provider metrics (auth, role `provider`)
- `GET /me/enrollments` - provider enrollments (auth, role `provider`)
- `GET /:id` - provider details (auth)
- `GET /:id/courses` - provider courses/trainings (auth)

## Employers (`/api/employers`)

- `GET /me/dashboard` - employer dashboard data (auth, role `employer|admin`)
- `GET /me/profile` - employer profile (auth, role `employer|admin`)
- `PUT /me/profile` - update employer profile (auth, role `employer`)

## Messages (`/api/messages`)

- `POST /contact` - public contact form endpoint
- `POST /` - send message (auth)
- `GET /conversations` - list conversations (auth)
- `GET /conversations/:id` - get one conversation (auth)
- `GET /notifications` - notifications list (auth)

## Admin (`/api/admin`)

- `GET /users` - users list (auth, role `admin`)
- `PUT /users/:id` - update user (auth, role `admin`)
- `DELETE /users/:id` - delete user (auth, role `admin`)
- `GET /jobs` - admin jobs list (auth, role `admin`)
- `POST /verify-employer/:id` - verify employer (auth, role `admin`)
- `POST /verify-provider/:id` - verify provider (auth, role `admin`)
- `GET /audit-logs` - audit logs (auth, role `admin`)
- `GET /metrics` - dashboard metrics (auth, role `admin`)
- `POST /test-email` - send test email (auth, role `admin`)

## Public (`/api/public`)

- `GET /stats` - public platform statistics

## Uploads (`/api/uploads`)

- `POST /presign` - get public asset upload info
- `POST /direct` - direct file upload (multipart field `file`)
- `POST /` - direct file upload (multipart field `file`)

## Services (`/api/services`)

- `GET /` - list published services (public)
- `GET /:id` - service details (public)
- `POST /:id/book` - create service booking (auth)
- `GET /bookings/me` - list current user service bookings (auth)

## AI Chat (`/api/chat`)

- `POST /assistant` - chatbot assistant response (uses `OPENAI_API_KEY`)

## Role model

The system supports these roles:

- `worker`
- `employer`
- `provider`
- `admin`

## Notes

- Global API rate-limit is applied to `/api/*` requests.
- In production, server enforces HTTPS redirect when not already secure.
- Error payloads are JSON and may include stack traces in development.
- Admin service management endpoints are available under `/api/admin/services` and `/api/admin/service-bookings`.
