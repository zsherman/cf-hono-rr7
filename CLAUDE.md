# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application template combining React-Router (frontend) with Hono (backend API) deployed on Cloudflare Workers. The architecture provides server-side rendering, API routes, and edge computing capabilities.

## Common Commands

### Development
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build production-ready application
- `pnpm preview` - Preview production build locally
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm deploy` - Build and deploy to Cloudflare Workers

### Code Quality
- `pnpm format` - Format all files with Biome
- `pnpm format:check` - Check formatting without making changes
- `pnpm lint` - Run Biome linter
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm lint:fix:unsafe` - Fix linting issues including unsafe fixes
- `pnpm check` - Run both formatting and linting checks
- `pnpm check:fix` - Fix both formatting and linting issues
- `pnpm check:fix:unsafe` - Fix both formatting and linting issues including unsafe fixes

### Type Generation
- `pnpm cf-typegen` - Generate Cloudflare Worker TypeScript types
- This runs automatically after `pnpm install`

## Architecture

### Entry Points
1. **`/workers/app.ts`** - Main application entry handling all requests:
   - API routes (e.g., `/api`) handled directly by Hono
   - All other routes fall back to React-Router SSR
   - Access to Cloudflare bindings through Hono context

2. **`/app/entry.server.tsx`** - React-Router SSR entry point

### Key Directories
- `/app/routes/` - React page components
- `/app/welcome/` - Shared React components
- `/workers/` - Cloudflare Worker and API logic
- `/public/` - Static assets

### Request Flow
1. All requests hit the Hono app in `/workers/app.ts`
2. API routes (`/api/*`) are handled by Hono directly
3. Non-API routes fall through to React-Router's `reactRouterHonoServer` middleware
4. React-Router handles SSR and client-side navigation

## Development Guidelines

### Adding API Routes
Add new API endpoints in `/workers/app.ts`:
```typescript
app.get('/api/example', async (c) => {
  // Access Cloudflare bindings via c.env
  return c.json({ data: 'example' })
})
```

### Adding Frontend Routes
1. Add route files to `/app/routes/` directory
2. React-Router uses file-based routing convention
3. Routes automatically generate TypeScript types

### Environment Variables
- Configure in `wrangler.jsonc` for Cloudflare deployment
- Access in Hono routes via `c.env`
- Frontend access requires passing through loaders/actions

### TypeScript
- Strict mode enabled
- Cloudflare Worker types auto-generated
- React-Router route types auto-generated
- Run `pnpm typecheck` before committing

## Database Setup

### Local Development
1. Create a local D1 database: `wrangler d1 create contacts-db --local`
2. Execute the schema: `wrangler d1 execute contacts-db --local --file=./setup-local-db.sql`

### Production
1. Create a D1 database: `wrangler d1 create contacts-db`
2. Update `wrangler.jsonc` with the database ID from the output
3. Execute the schema: `wrangler d1 execute contacts-db --remote --file=./setup-local-db.sql`

## API Documentation

- OpenAPI documentation available at `/api/doc`
- Swagger UI available at `/api/swagger`
- All API routes are fully typed with Zod schemas

## Important Notes

- No test framework is currently configured
- Code formatting and linting handled by Biome
- VSCode configured for format on save with Biome
- Uses pnpm as package manager
- Tailwind CSS v4 with new @theme directive
- Built for Cloudflare's edge runtime - be mindful of API limitations
- Uses Cloudflare D1 for database (SQLite at the edge)
- API routes use Hono with OpenAPI/Zod for type safety and documentation