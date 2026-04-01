# Punch

Simple time tracking for agencies. Track hours, approve timecards, export for invoicing.

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| [Node.js](https://nodejs.org/) | 20.9+ | LTS recommended |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x | For PostgreSQL |
| npm | 10+ | Comes with Node.js |

## First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
```

Generate an auth secret and add it to `.env`:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

```bash
# 3. Start the database and run migrations
docker compose up -d
npx prisma migrate dev

# 4. Seed demo data
npx prisma db seed
```

## Running

```bash
npm run punch
```

This starts the Docker PostgreSQL container and the Next.js dev server in one command.

The app will be available at **http://localhost:3000**.

## Demo Accounts

| Account | Email | Password |
|---------|-------|----------|
| Global Admin | admin@punch.local | password123 |
| Member | member@punch.local | password123 |

## Stripe (Optional)

Billing features are hidden unless Stripe is configured. To enable locally:

1. Add your keys to `.env`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

2. Run the webhook listener in a separate terminal:
   ```bash
   npm run stripe:listen
   ```
   Copy the `whsec_` signing secret it prints into your `.env`.

3. Start the dev server as usual (`npm run punch`).

In production, add your webhook endpoint URL in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks) pointing to `https://your-domain.com/api/webhooks/stripe`.

## Other Commands

```bash
npm run dev            # Dev server only (database must already be running)
npm run build          # Production build
npm start              # Production server
npm run db:migrate     # Apply database migrations
npm run stripe:listen  # Forward Stripe webhooks to localhost
npx prisma studio      # Browse database in the browser
```

## Documentation

- [Product Requirements](PRD.md)
- [Technical Architecture](TECHNICAL.md)
- [Data Model](DATA-MODEL.md)
- [User Stories](USER-STORIES.md)
- [Development Guide](CLAUDE.md)
