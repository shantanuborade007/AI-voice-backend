# SMB Voice Platform - Backend

Backend for the SaaS platform: small business owners create a digital profile
(name, hours, location, catalog, FAQs), pick a subscription plan, and get a
phone number that routes to an AI voice agent (Exotel for telephony, Sarvam AI
for the voice agent) which can answer questions and book appointments.

Stack: **NestJS** + **TypeORM** + **PostgreSQL**, JWT auth.

## Current scope

This scaffold covers everything that doesn't depend on Exotel/Sarvam AI being
live yet:

- Business-owner signup/login (email + password, JWT)
- Business profiles: locations (with opening hours), catalog/menu items, FAQ
  knowledge base (for the future voice agent), weekly availability slots, and
  appointments
- Subscription plans and a per-business subscription record - **billing is
  stubbed**: selecting a plan activates it directly in Postgres, no payment
  gateway is wired up yet (per current scope)
- A `phone_number_assignments` record per business that starts in
  `pending_kyc`, ready for an admin to fill in once Exotel KYC clears and a
  number is purchased/mapped
- A platform admin role, separate from business owners

Not built yet (next, once Exotel KYC is approved): the Exotel/Sarvam AI voice
webhook integration, and the React frontend.

## Setup

```bash
npm install
cp .env.example .env      # edit values as needed
docker compose up -d      # starts Postgres locally
npm run db:migrate         # creates the schema (see db/DB_README.txt)
npm run seed               # creates default subscription plans + admin user
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1` (health check at `/api/v1/health`).

### Database schema

Schema is managed by hand-written, numbered SQL files in `db/migrations/`
(one file per table), each recording itself in a `schema_migrations` table
so it isn't re-applied. TypeORM's `synchronize` is always off. See
`db/DB_README.txt` for the full instructions and cautions.

```bash
npm run db:migrate                                    # apply all migrations locally (uses db/local-apply.sh)
psql postgres://postgres:postgres@localhost:5432/smb_voice_platform \
  -f db/migrations/<filename>.sql                     # apply a single file, or against dev/prod
```

To add a table: create the next-numbered file in `db/migrations/`, following
the existing files as a template (wrap in `BEGIN`/`COMMIT`, end with an
`INSERT INTO schema_migrations` for that filename).

## API overview

All routes are prefixed with `/api/v1`.

**Auth**
- `POST /auth/register` - business owner signup
- `POST /auth/login` - returns a JWT

**Businesses** (JWT required; owners see their own, admins see all)
- `POST /businesses`, `GET /businesses`, `GET/PATCH/DELETE /businesses/:id`

**Nested under `/businesses/:businessId/...`** (owner or admin only)
- `locations` - branches/addresses with opening hours
- `catalog-items` - products/services/menu, with price and image
- `faqs` - question/answer knowledge base for the voice agent
- `availability` - weekly recurring slots for appointment booking
- `appointments` - bookings (source defaults to `phone_ai_agent` - this is
  the extension point for the future Exotel/Sarvam webhook)
- `subscription` (`GET`, `POST select-plan`, `POST cancel`)
- `phone-number` (`GET` status, `PATCH` admin-only - fill in once Exotel is live)

**Plans**
- `GET /subscription-plans` - public list
- `POST /subscription-plans` - admin only

## Note on this build

`npm install` / `nest build` could not be run in this environment because
outbound access to the npm registry is blocked here. The code was written
and manually cross-checked (import resolution, exported symbols, external
package usage) instead of compiler-verified. Run `npm install && npm run
build` on your machine as the first real check - if TypeScript flags
anything, share the error and it's a quick fix.

## Next steps

1. Run `npm install && npm run build` locally to confirm a clean compile.
2. Once Exotel KYC clears: add an Exotel + Sarvam AI integration module that
   (a) purchases/maps a number into `phone_number_assignments`, and (b)
   exposes a webhook the voice agent calls to read a business's FAQs/catalog
   and write appointments.
3. Add Razorpay/Stripe checkout + webhooks to replace the stubbed
   `select-plan` flow.
4. Start the React frontend.
