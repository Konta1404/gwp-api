# GWP API prototype

Express, TypeScript, Prisma, and PostgreSQL authentication API. The schema includes events, registrations, and related content, but only authentication/profile endpoints are implemented and mounted. This is not a complete event-management backend.

## Setup

Use a disposable local PostgreSQL database. Copy `.env.example` to an untracked `.env`, set `DATABASE_URL`, and generate a random `JWT_SECRET` of at least 32 characters. The API defaults to port 4000; the frontend defaults to 3000.

```sh
npm ci
npm run prisma:generate
npx prisma db push
npm run dev
```

`db push` is for an empty/disposable development database. Review schema differences and create a proper migration before using any existing database. The proposed Participant default does not downgrade existing accounts; audit previously self-registered Admin accounts separately. Do not run the historical seed files against a real database without review.

## Contract

- `POST /api/auth/register`: `{ name, email, password }`. Public registration always creates a Participant; extra fields such as `role` are rejected.
- `POST /api/auth/login`: `{ email, password }`.
- Both return `{ status: "success", token, data: { user } }`. User data contains only ID, name, email, role, and active status.
- `GET /api/auth/me`: requires a Bearer token and returns the safe user object.
- `PATCH /api/auth/updatePassword`: requires a token plus current/new passwords. Sign in again afterwards.
- `POST /api/auth/resetPassword`: consumes a previously issued, unexpired reset token. Token issuance/email delivery is not implemented here.

Password changes invalidate older JWTs. Auth checks read current user status/role from the database. Tokens expire after one day. Browser clients should keep tokens behind a server boundary; the accompanying admin uses HttpOnly cookies. Per-resource admin authorization is still required when event endpoints are added.

## Validation

`npm run build` compiles TypeScript. `npm test` exercises HTTP auth routes using Supertest with a mocked database and password hasher. It verifies least-privileged registration, role injection rejection, safe response fields, bad credentials, missing auth, password-change invalidation, and inactive users. These tests do not prove database migrations, bcrypt integration, or a deployed login flow.

## Trade-offs

One shared Prisma client, one auth service, explicit response selection, input validation, bounded JSON bodies, and an auth rate limit keep the prototype understandable. A distributed rate-limit store, email verification, reset-token issuance, database integration tests, and deployment configuration are future work. No production-readiness claim is made.

The historically tracked `.env` has been replaced with empty/local development values. If any former credentials were real, rotate them at their provider; this change does not remove values from Git history. No remote credential or database was changed.
