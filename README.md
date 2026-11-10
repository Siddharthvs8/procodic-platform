# PROCODIC platform

A pnpm monorepo foundation for the PROCODIC public website and its content platform. The implementation keeps the public Next.js app, NestJS REST API and Prisma data layer separate.

## What's in this build

- Responsive, branded public site with pages for products, AI research, training, about, case studies, insights and contact.
- Product catalogue and detail routes read published content from the API, with an editorial empty state until products are added.
- Admin dashboard with content collections, product editing, leads, media uploads and navigation/website-content collections.
- NestJS API with Swagger, validation, cookie-based admin sessions, role checks, generic content CRUD and private lead handling.
- Media library uploads with content signature checks, size limits, metadata, local storage for development and S3-compatible object storage for deployment.
- PostgreSQL/Prisma schema for content, leads, users, media assets, site settings and audit records.
- Local PostgreSQL Compose service, seeded administrator setup, environment template and deployment notes.

The supplied artwork is used as the original wordmark, cropped to its visible bounds and made transparent for use on the dark brand palette. The second supplied image provides a subtle hero texture.

## Local setup

Requirements: Node.js 20.9+, pnpm 10+, and Docker Desktop (or PostgreSQL 16).

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD`.
2. Install dependencies: `pnpm install`.
3. Start PostgreSQL: `docker compose up -d postgres`.
4. Generate Prisma Client and apply the initial schema: `pnpm db:generate` then `pnpm db:migrate`.
5. Seed the first administrator: `pnpm db:seed`.
6. Start both apps: `pnpm dev`.

Run the API unit tests with `pnpm --filter @procodic/api test`. This builds the API first, then checks published-content scoping, login validation, missing-session rejection and media signature detection. Database-backed and browser end-to-end scenarios still need a configured test database and browser runner.

The website is at `http://localhost:3000`, the API at `http://localhost:4000/api`, and OpenAPI documentation at `http://localhost:4000/api/docs`.

## Admin access

Sign in at `/admin/login` using the credentials supplied to the seed command. The seed process refuses to create a user without an explicit password. Never reuse local credentials in production.

## Data model and content

The CMS uses typed collection names with a flexible JSON payload on each content item. That supports evolving editorial fields without putting layout or executable HTML in the database. Published records are served publicly; draft records require an authenticated session. `Lead` records are isolated behind admin routes.

Product payloads can include `tagline`, `description`, `category`, `features`, `industries`, `overview`, `problems`, `screenshots`, `integrations`, `faqs`, and `seo`. Product URLs use the unique `slug` field. Publish a product in the admin to expose it at `/products/{slug}`.

## Production checklist

- Use managed PostgreSQL with TLS, backups and a least-privilege database account.
- Set `NODE_ENV=production`, a high-entropy `JWT_SECRET`, HTTPS, and a deployment-specific `WEB_ORIGIN`.
- Put media behind S3-compatible object storage and a CDN; configure upload scanning, lifecycle policy and backups before enabling uploads.
- Add SMTP credentials for lead notifications. Email delivery is intentionally not simulated when configuration is absent.
- Configure analytics with a public tracking ID only; keep service credentials server-side.
- Terminate TLS at the ingress or Nginx layer. Add rate limiting at the edge and set trusted proxy configuration to match deployment.
- Run migrations as a release step and seed the first administrator only through a controlled setup job.
- Configure monitoring, structured log shipping, health checks, incident alerts, secrets management and a restore drill.
- Review privacy notices, retention periods, cookie consent and jurisdiction-specific data handling before collecting personal data.

## API overview

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/content/:type` for published public content
- `GET /api/content/:type/:slug` for a published public record
- `GET|POST|PATCH|DELETE /api/admin/content/:type[/:id]` for authenticated CMS operations
- `POST /api/leads` to submit a validated public enquiry
- `GET|PATCH /api/admin/leads[/:id]` for private lead management
- `GET|POST|DELETE /api/admin/media[/:id]` for authorized media management
- `GET /api/health`

## Known integration boundary

Email delivery, image transformations, analytics dashboards, user/role administration beyond the seeded Super Admin, and editable global site settings are not implemented in this build. Navigation and homepage-section records can be managed as CMS content, but the current public layout does not yet render those records as configurable site chrome. The Nginx config applies an edge rate limit to public lead submissions; deploy behind a trusted proxy and configure forwarded-IP handling appropriately.
