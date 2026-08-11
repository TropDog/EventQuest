# EventQuest

SaaS / Event Engagement Platform — turn weddings, parties and events into interactive games.

## Architecture

Modular monolith with:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS (`apps/web`)
- **Backend:** NestJS, TypeScript, REST API (`apps/api`)
- **Shared:** Domain enums, types, schemas (`packages/shared`)
- **Database:** PostgreSQL with Prisma ORM (`prisma/`)

See `docs/` for full product and architecture documentation.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (or use Docker Compose below)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL (optional, via Docker)
docker compose up -d

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start backend (port 3001)
npm run dev:api

# Start frontend (port 3000)
npm run dev:web
```

## Workspace Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Start Next.js development server |
| `npm run dev:api` | Start NestJS development server |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run tests in all workspaces |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations (dev) |

## Repository Structure

```text
eventquest/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types, enums, schemas
├── prisma/           # Prisma schema and migrations
└── docs/             # Project documentation
```
