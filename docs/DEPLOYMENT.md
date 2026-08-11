# EventQuest — Deployment Architecture

## Purpose

Describe the deployment options explicitly listed in the Architecture Document.

## MVP Architecture

```text
Frontend
  ↓ HTTPS
NestJS Backend API
  ↓ Prisma
Managed PostgreSQL

Frontend
  ↓ Signed Upload URL
S3-compatible Object Storage

Backend
  ↓ WebSocket
Realtime Gateway

Backend
  ↓ Redis/BullMQ
Worker
  ├── AI Summary
  ├── Media Packaging
  └── Cleanup
```

## Recommended Simple MVP Hosting

Architecture lists:

### Frontend

Vercel.

### Backend

One of:

- Render
- Railway
- Fly.io
- Azure App Service

### Database

Managed PostgreSQL.

### Storage

One of:

- S3
- Azure Blob Storage
- Cloudflare R2

### Redis

Managed Redis.

## More Production-Oriented Azure Option

Architecture lists:

- Azure App Service / Container Apps
- Azure PostgreSQL
- Azure Blob Storage
- Azure Cache for Redis
- Azure OpenAI
- Application Insights

## Environment Configuration

Secrets/configuration must not be committed to the repository.

Architecture explicitly requires JWT secret to be stored in environment variables.

Storage administration credentials must never reach the frontend.

Payment and AI credentials should likewise remain server-side.

## Deployment Rules

- Frontend and backend are separate runtime concerns even when stored in one repository.
- Database migrations must be executed deliberately.
- Worker processes must be able to access Redis and the database.
- Object-storage credentials belong only to trusted backend/worker environments.
- WebSocket connectivity must be supported by the deployed backend architecture.

## MVP Scope

Do not introduce microservices for MVP.

The application remains a modular monolith.
