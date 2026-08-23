# SMB Voice Platform - Backend Reference

This is a detailed architecture and API reference for the codebase. For a quick setup guide see `README.md`; this document goes deeper into the data model, authorization rules, and the full endpoint list.

## What this platform does

Small business owners sign up, build a digital profile for their business (name, category, locations with opening hours, a catalog/menu, and an FAQ knowledge base), and pick a subscription plan. Each business is issued a phone number (via Exotel) that will route calls to an AI voice agent (Sarvam AI). The voice agent is meant to answer caller questions using the business's FAQ/catalog data and to create appointment bookings. As of this codebase, everything up to and including data modeling, auth, and CRUD is implemented; the actual Exotel/Sarvam AI telephony integration and the customer-facing frontend are not yet built.

## Tech stack

- **NestJS 10** (Express platform) - modular controller/service/module architecture
- **TypeORM 0.3** + **PostgreSQL** - entities double as the database schema (via `synchronize` in dev, migrations in prod)
- **Passport JWT** (`@nestjs/passport`, `passport-jwt`) - stateless bearer-token auth
- **class-validator** / **class-transformer** - request DTO validation, enforced globally
- **bcrypt** - password hashing
- **@nestjs/swagger** - OpenAPI documentation, served at `/api/docs`

## Architecture

The app is composed of five feature modules plus a `common` folder of cross-cutting pieces, wired together in `AppModule` (`src/app.module.ts`):

- **AuthModule** (`src/auth`) - registration/login, issues JWTs. Depends on `UsersModule`.
- **UsersModule** (`src/users`) - `User` entity and lookup/creation logic. Has no controller of its own; consumed by Auth and the JWT strategy.
- **BusinessesModule** (`src/businesses`) - the largest module. Owns the `Business` entity plus everything nested under a business: `BusinessLocation`, `CatalogItem`, `FaqEntry`, `AvailabilitySlot`, `Appointment`. Each nested resource has its own controller/service pair, all mounted under `businesses/:businessId/...`. Also exports `BusinessOwnershipGuard`, which `SubscriptionsModule` and `PhoneNumbersModule` import to protect their own nested routes.
- **SubscriptionsModule** (`src/subscriptions`) - `SubscriptionPlan` (the catalog of plans) and `Subscription` (a business's active plan record).
- **PhoneNumbersModule** (`src/phone-numbers`) - `PhoneNumberAssignment`, the Exotel number lifecycle record per business.

Within each module the pattern is consistent: a `*.controller.ts` handles HTTP concerns and guards, a `*.service.ts` talks to the TypeORM repository, DTOs in `dto/` validate input, and entities in `entities/` define the schema. Every entity extends `AbstractEntity` (`src/common/entities/abstract.entity.ts`), which supplies a UUID primary key plus `createdAt`/`updatedAt` timestamps.

## Data model

All entities live under `src/**/entities/*.entity.ts`. Column names in the database are snake_case (e.g. `owner_id`) via explicit `@JoinColumn`/`@Column({ name: ... })`, but the TypeScript property names used in requests/responses are camelCase.

**User** (`users` table)
- `email` (unique), `passwordHash`, `fullName`, `role` (`UserRole`: `admin` | `business_owner`, default `business_owner`), `isActive` (default true)
- `businesses`: one-to-many to `Business` (as owner)

**Business** (`businesses` table)
- `ownerId` / `owner`: many-to-one to `User`, cascades on delete
- `name` (max 150), `category` (`BusinessCategory`: `restaurant_cafe`, `retail_shop`, `clinic_doctor`, `salon_spa`, `professional_services`, `other`; default `other`)
- `description` (nullable text), `status` (`BusinessStatus`: `draft` | `pending_review` | `active` | `suspended`; default `draft`), `websiteUrl` (nullable), `socialLinks` (nullable jsonb map of platform -> URL)
- Relations (all cascade-deleted with the business, only populated when explicitly loaded): `locations`, `catalogItems`, `faqEntries`, `availabilitySlots`, `appointments` (one-to-many), `subscription`, `phoneNumberAssignment` (one-to-one)

**BusinessLocation** (`business_locations` table)
- `businessId`, `label` (max 120), `addressLine1`, `addressLine2` (nullable), `city`, `state`, `postalCode`, `country` (default `IN`)
- `latitude`/`longitude` (nullable doubles), `contactPhone` (nullable)
- `openingHours`: jsonb array of `{ day: 0-6, opensAt: "HH:mm", closesAt: "HH:mm", isClosed: boolean }`, default `[]`
- `isPrimary` (default false)

**CatalogItem** (`catalog_items` table)
- `businessId`, `name` (max 150), `description` (nullable text)
- `price`: nullable `numeric(10,2)` stored as a string (null = "price on request")
- `currency` (default `INR`), `imageUrl` (nullable), `category` (nullable free text), `isAvailable` (default true), `sortOrder` (default 0, ascending)

**FaqEntry** (`faq_entries` table)
- `businessId`, `question` (text), `answer` (text), `tags` (text array, default `{}`), `isActive` (default true)
- Intended as the knowledge base the voice agent will query. Note: `isActive` cannot currently be set via the create/update DTOs (no field for it) even though the entity supports it.

**AvailabilitySlot** (`availability_slots` table)
- `businessId`, `dayOfWeek` (0-6 smallint), `startTime`/`endTime` (Postgres `time`, "HH:mm:ss"), `slotDurationMinutes` (default 30), `isActive` (default true)
- Represents a recurring weekly window (e.g. "Mondays 9am-5pm in 30-minute slots"); there is no server-side check preventing overlapping windows for the same business/day.

**Appointment** (`appointments` table)
- `businessId`, `locationId`/`location` (nullable many-to-one, `SET NULL` on location delete)
- `customerName`, `customerPhone`, `scheduledAt` (timestamptz), `durationMinutes` (default 30)
- `status` (`AppointmentStatus`: `requested` | `confirmed` | `cancelled` | `completed` | `no_show`; default `requested`)
- `source` (`AppointmentSource`: `phone_ai_agent` | `manual` | `web`; default `phone_ai_agent`, since the intended long-term source of most bookings is the voice pipeline)
- `notes` (nullable text). Only `status` and `notes` are editable via `PATCH`; there's no reschedule endpoint (delete and recreate instead).

**SubscriptionPlan** (`subscription_plans` table)
- `code` (unique), `name`, `priceMonthly` (`numeric(10,2)` as string), `currency` (default `INR`)
- `features`: jsonb `{ maxLocations, maxCatalogItems, appointmentBooking, aiMinutesIncluded }` - not currently enforced anywhere, just stored
- `isActive` (default true; inactive plans are hidden from the public list), `sortOrder` (default 0)

**Subscription** (`subscriptions` table)
- One-to-one with `Business`. `planId`/`plan` (many-to-one to `SubscriptionPlan`)
- `status` (`SubscriptionStatus`: `trialing` | `active` | `past_due` | `cancelled`; default `trialing`)
- `currentPeriodStart`/`currentPeriodEnd` (timestamptz; set to now / now+1 month whenever a plan is selected)
- `cancelAtPeriodEnd` (default false), `paymentProvider`/`paymentProviderReference` (nullable - unused until real billing is added)

**PhoneNumberAssignment** (`phone_number_assignments` table)
- One-to-one with `Business`. `telephonyProvider` (default `exotel`), `phoneNumber` (nullable, E.164), `providerNumberSid` (nullable)
- `status` (`PhoneNumberStatus`: `pending_kyc` | `pending_assignment` | `active` | `suspended`; default `pending_kyc`)
- `voiceAgentProvider` (default `sarvam_ai`), `notes` (nullable), `assignedAt` (nullable timestamptz)
- A record is lazily created with `pending_kyc` status the first time a business's phone-number endpoint is queried.

## Auth & authorization

- **JWT strategy** (`src/auth/strategies/jwt.strategy.ts`): tokens are signed with `JWT_SECRET`/`JWT_EXPIRES_IN` from env (defaults: an insecure placeholder secret, 1 day expiry - must be overridden in any real deployment). The payload is `{ sub: userId, email, role }`. On each request, `validate()` reloads the user from the database by `sub` and rejects (401) if `isActive` is false, so deactivating a user takes effect immediately without waiting for token expiry.
- **JwtAuthGuard** (`src/common/guards/jwt-auth.guard.ts`): thin wrapper around Passport's `AuthGuard('jwt')`. Applied via `@UseGuards(JwtAuthGuard)` on every protected controller; expects `Authorization: Bearer <token>`.
- **RolesGuard** (`src/common/guards/roles.guard.ts`) + **`@Roles(...)`** decorator (`src/common/decorators/roles.decorator.ts`): reads required roles from handler/class metadata and checks `request.user.role`. If no roles are set on a route, it allows any authenticated user through. Must run after `JwtAuthGuard` so `request.user` is populated.
- **BusinessOwnershipGuard** (`src/businesses/guards/business-ownership.guard.ts`): looks up `:businessId` (or `:id` on the top-level `/businesses/:id` routes) and allows the request only if the caller is an admin or the business's `ownerId` matches the caller's id; otherwise throws 403 (or 404 if the business doesn't exist at all). It also attaches the loaded `business` to the request object for potential downstream use. This guard is what makes every nested resource controller (`locations`, `catalog-items`, `faqs`, `availability`, `appointments`, `subscription`, `phone-number`) effectively owner-or-admin scoped, even though most of those controllers only declare `JwtAuthGuard` + `BusinessOwnershipGuard` (no separate `RolesGuard`).
- **`@CurrentUser()`** (`src/common/decorators/current-user.decorator.ts`): param decorator that pulls `request.user` (the full `User` entity, as set by the JWT strategy) into a controller method argument.
- Two roles exist (`UserRole`): `business_owner` (default for anyone who registers) and `admin` (only created via the seed script, or by direct DB/admin action - there is no public "become admin" endpoint).

## Global HTTP setup

- Global prefix: every route is served under `/api/v1` (`app.setGlobalPrefix('api/v1')` in `src/main.ts`).
- Global `ValidationPipe` with `whitelist: true, transform: true, forbidNonWhitelisted: true` - unknown body fields are rejected (400), and DTO instances are auto-transformed/coerced (e.g. numeric strings to numbers) before hitting handlers.
- Global `AllExceptionsFilter` (`src/common/filters/http-exception.filter.ts`) - normalizes every error response to `{ statusCode, path, timestamp, ...originalBody }`; non-`HttpException` errors are reported as a generic 500 without leaking internals.
- CORS is enabled for all origins (`app.enableCors()`).
- Swagger/OpenAPI UI is served at `/api/docs` (raw JSON at `/api/docs/json`), configured in `src/main.ts` with a Bearer auth scheme named `access-token`.

## API reference

All paths below are relative to `/api/v1`.

### Health
- `GET /health` - public. Returns `{ status: "ok", timestamp }`. Does not check DB connectivity.

### Auth (`src/auth/auth.controller.ts`)
- `POST /auth/register` - public. Body: `{ email, password (>=8 chars), fullName }`. Creates a `business_owner` user; 409 if the email is already registered. Returns `{ accessToken, user: { id, email, fullName, role } }`.
- `POST /auth/login` - public. Body: `{ email, password }`. Returns the same shape as register; 401 on bad credentials or a deactivated account.

### Businesses (`src/businesses/businesses.controller.ts`)
All require `JwtAuthGuard` + `RolesGuard` (no specific role required beyond being authenticated); `:id` routes additionally require `BusinessOwnershipGuard`.
- `POST /businesses` - body: `CreateBusinessDto` (`name`, `category`, optional `description`/`websiteUrl`/`socialLinks`). Always owned by the caller.
- `GET /businesses` - admins get every business; owners get only their own.
- `GET /businesses/:id` - owner or admin. Eagerly loads `locations`, `catalogItems`, `faqEntries`, `availabilitySlots`, `subscription` (+ `subscription.plan`), `phoneNumberAssignment`.
- `PATCH /businesses/:id` - owner or admin. Body: `UpdateBusinessDto` (all fields from create, optional).
- `DELETE /businesses/:id` - owner or admin. Cascades to all nested resources, subscription, and phone number assignment.

### Locations (`src/businesses/locations.controller.ts`, mounted at `businesses/:businessId/locations`)
Owner or admin only (`JwtAuthGuard` + `BusinessOwnershipGuard`).
- `POST /businesses/:businessId/locations` - `CreateLocationDto` (`label`, `addressLine1`, `city`, `state`, `postalCode`, optional `addressLine2`/`country`/`latitude`/`longitude`/`contactPhone`/`openingHours[]`/`isPrimary`).
- `GET /businesses/:businessId/locations` - list all.
- `GET /businesses/:businessId/locations/:id`
- `PATCH /businesses/:businessId/locations/:id` - partial update.
- `DELETE /businesses/:businessId/locations/:id`

### Catalog Items (`src/businesses/catalog-items.controller.ts`, mounted at `businesses/:businessId/catalog-items`)
Owner or admin only.
- `POST /businesses/:businessId/catalog-items` - `CreateCatalogItemDto` (`name`, optional `description`/`price`/`currency`/`imageUrl`/`category`/`isAvailable`/`sortOrder`).
- `GET /businesses/:businessId/catalog-items` - list, ordered by `sortOrder` ascending.
- `GET /businesses/:businessId/catalog-items/:id`
- `PATCH /businesses/:businessId/catalog-items/:id` - partial update.
- `DELETE /businesses/:businessId/catalog-items/:id`

### FAQs (`src/businesses/faqs.controller.ts`, mounted at `businesses/:businessId/faqs`)
Owner or admin only.
- `POST /businesses/:businessId/faqs` - `CreateFaqDto` (`question`, `answer`, optional `tags[]`).
- `GET /businesses/:businessId/faqs`
- `GET /businesses/:businessId/faqs/:id`
- `PATCH /businesses/:businessId/faqs/:id`
- `DELETE /businesses/:businessId/faqs/:id`

### Availability (`src/businesses/availability.controller.ts`, mounted at `businesses/:businessId/availability`)
Owner or admin only. No update endpoint - delete and recreate to change a window.
- `POST /businesses/:businessId/availability` - `CreateAvailabilitySlotDto` (`dayOfWeek` 0-6, `startTime`, `endTime`, optional `slotDurationMinutes`/`isActive`).
- `GET /businesses/:businessId/availability` - ordered by day of week then start time.
- `DELETE /businesses/:businessId/availability/:id`

### Appointments (`src/businesses/appointments.controller.ts`, mounted at `businesses/:businessId/appointments`)
Owner or admin only. Currently created via the dashboard/API directly; once the Exotel/Sarvam AI webhook exists, it is expected to call the same service.
- `POST /businesses/:businessId/appointments` - `CreateAppointmentDto` (`customerName`, `customerPhone`, `scheduledAt` (ISO datetime), optional `locationId`/`durationMinutes`/`source`/`notes`; `source` defaults to `phone_ai_agent`).
- `GET /businesses/:businessId/appointments` - ordered by `scheduledAt` ascending.
- `GET /businesses/:businessId/appointments/:id`
- `PATCH /businesses/:businessId/appointments/:id` - only `status` and `notes` are updatable.
- `DELETE /businesses/:businessId/appointments/:id`

### Subscription Plans (`src/subscriptions/subscription-plans.controller.ts`, mounted at `subscription-plans`)
- `GET /subscription-plans` - public. Only plans with `isActive=true`, ordered by `sortOrder` ascending.
- `POST /subscription-plans` - admin only (`JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)`). Body: `CreatePlanDto` (`code` (unique), `name`, `priceMonthly`, `features` object, optional `currency`/`isActive`/`sortOrder`).

### Subscriptions (`src/subscriptions/subscriptions.controller.ts`, mounted at `businesses/:businessId/subscription`)
Owner or admin only.
- `GET /businesses/:businessId/subscription` - returns the subscription with its plan loaded, or `null` if none was ever selected.
- `POST /businesses/:businessId/subscription/select-plan` - body `{ planId }`. Activates the subscription immediately (billing is stubbed - no payment gateway); creates the record if missing, otherwise switches plan and resets `currentPeriodStart`/`currentPeriodEnd` to a fresh one-month window and clears `cancelAtPeriodEnd`. 404 if `planId` doesn't exist.
- `POST /businesses/:businessId/subscription/cancel` - sets `cancelAtPeriodEnd=true`. 404 if no subscription exists yet.

### Phone Numbers (`src/phone-numbers/phone-numbers.controller.ts`, mounted at `businesses/:businessId/phone-number`)
- `GET /businesses/:businessId/phone-number` - owner or admin. Lazily creates a `pending_kyc` record on first call if none exists.
- `PATCH /businesses/:businessId/phone-number` - admin only (`RolesGuard` + `@Roles(ADMIN)`, layered on top of the owner/admin `BusinessOwnershipGuard`). Body: `AssignPhoneNumberDto` (`phoneNumber`, optional `providerNumberSid`/`status`/`notes`; `status` defaults to `active`). Sets `assignedAt` to now.

## Environment variables (`.env.example`)

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Standard Node environment flag. |
| `PORT` | HTTP port (default 3000). |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Postgres connection. |
| `JWT_SECRET` | Secret used to sign/verify JWTs. Must be overridden outside local dev. |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1d`). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials for the admin account created by `npm run seed`. |
| `EXOTEL_SID`, `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN` | Reserved for the future Exotel telephony integration; not read anywhere yet. |
| `SARVAM_AI_API_KEY` | Reserved for the future Sarvam AI voice agent integration; not read anywhere yet. |

## Setup

```bash
npm install
cp .env.example .env      # edit values as needed
docker compose up -d      # starts Postgres locally
npm run db:migrate         # creates the schema from db/migrations/*.sql
npm run seed               # creates default subscription plans + admin user
npm run start:dev
```

API listens on `http://localhost:3000/api/v1`; health check at `/api/v1/health`; Swagger UI at `http://localhost:3000/api/docs`.

Schema is managed by hand-written SQL files in `db/migrations/` (one per
table, numbered, each recording itself in a `schema_migrations` table so it
isn't re-applied) - see `db/DB_README.txt`. TypeORM `synchronize` is always
`false`; entities are used for querying only, not schema generation.

The seed script (`src/database/seed.ts`) creates three default plans (`starter`, `growth`, `pro` - see the script for exact pricing/features) and one admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, skipping anything that already exists.

## Known gaps / stubbed areas

- **Billing is stubbed.** Selecting a plan (`POST .../subscription/select-plan`) activates it directly in Postgres; there is no Razorpay/Stripe checkout or webhook integration, and `paymentProvider`/`paymentProviderReference` on `Subscription` are always null.
- **Exotel/Sarvam AI are not integrated.** `PhoneNumberAssignment` records exist and start at `pending_kyc`, but nothing actually calls Exotel to provision a number, and there is no voice-agent webhook endpoint yet for the AI to read FAQs/catalog data or create appointments. `EXOTEL_*`/`SARVAM_AI_API_KEY` env vars are placeholders only.
- **No frontend.** This is a backend-only repository; the React frontend referenced in the README has not been started.
- **No automated tests.** There is no test directory or test runner configured in this repository as of this writing.
- **Migrations are plain SQL, not TypeORM-generated.** `db/migrations/*.sql` create the schema by hand (see `db/DB_README.txt`); there is no automatic diffing against entity changes, so a new/changed column needs a matching hand-written SQL file.
- **Plan `features` are not enforced.** `SubscriptionPlan.features` (`maxLocations`, `maxCatalogItems`, `appointmentBooking`, `aiMinutesIncluded`) is stored but nothing in the codebase currently checks a business against its plan's limits.
- **FAQ `isActive` cannot be set via the API.** The entity has the field, but neither `CreateFaqDto` nor `UpdateFaqDto` expose it.
- **Appointments cannot be rescheduled via PATCH.** Only `status` and `notes` are updatable; changing `scheduledAt`/`locationId`/etc. requires deleting and recreating the appointment.
