# Punch

Simple time tracking for agencies. Track hours, approve timecards, export for invoicing.

## Quick Start

```bash
# Install dependencies
npm install

# Start database (Docker required)
docker compose up -d

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed

# Run dev server
npm run dev
```

## Demo Accounts

- **Admin:** admin@punch.local / password123
- **Member:** member@punch.local / password123

## Documentation

- [Product Requirements](PRD.md)
- [Technical Architecture](TECHNICAL.md)
- [Data Model](DATA-MODEL.md)
- [User Stories](USER-STORIES.md)
- [Development Guide](CLAUDE.md)
