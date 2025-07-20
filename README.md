# React-Router + Hono + Cloudflare Workers + Drizzle + OpenAPI

A full-stack web application template combining React Router (frontend) with Hono (backend API) deployed on Cloudflare Workers with D1 database, Drizzle ORM, and OpenAPI documentation.

## Features

- **Frontend**: React Router v7 with server-side rendering
- **Backend**: Hono with OpenAPI/Swagger documentation
- **Database**: Cloudflare D1 (SQLite at the edge) with Drizzle ORM
- **Type Safety**: End-to-end TypeScript with Hono RPC type sharing
- **API Client**: Type-safe RPC client with full IntelliSense
- **Validation**: Zod schemas auto-generated from database schema
- **Styling**: Tailwind CSS v4
- **Developer Experience**: Hot reload, type checking, code formatting with Biome

## Quick Start

```bash
# Install dependencies
pnpm install

# Create local D1 database
wrangler d1 execute contacts-db --local --file ./setup-local-db.sql

# Start development server
pnpm dev
```

Visit:
- Application: http://localhost:5173
- API Documentation: http://localhost:5173/api/swagger

## Project Structure

```
├── app/                    # React Router frontend
│   ├── components/        # Reusable React components
│   ├── lib/              # Frontend utilities and API client
│   │   └── hono-rpc-client.ts  # Type-safe RPC client
│   ├── routes/           # React Router route components
│   └── schemas/          # Frontend validation schemas
├── workers/              # Cloudflare Worker backend
│   ├── db/              # Database schema and configuration
│   ├── handlers/        # API route handlers
│   ├── routes/          # OpenAPI route definitions
│   └── app.ts          # Main Hono application (exports ApiType)
├── public/              # Static assets
└── CLAUDE.md           # AI assistant instructions
```

## Architecture Overview

### Server-Side Data Loading

React Router loaders can use the Hono RPC client for SSR by providing the full URL from the request context. See `app/routes/home-with-loader.tsx` for an example that demonstrates:
- Creating a server-aware RPC client that detects SSR context
- Using the request object to construct full URLs during SSR
- Falling back to relative URLs on the client side
- Maintaining full type safety with the Hono RPC client

### Backend (Hono + OpenAPI)

The backend uses Hono with OpenAPI for type-safe API development:

1. **Database Schema** (`workers/db/schema.ts`):
   - Drizzle ORM defines the database schema
   - drizzle-zod automatically generates Zod schemas from Drizzle schemas
   - Single source of truth for all types (no duplicate definitions)
   - Exports clean types: `Contact`, `InsertContact`, `PatchContact`

2. **API Routes** (`workers/app.ts`):
   - Routes use method chaining for RPC compatibility
   - Automatic validation using Zod schemas
   - Generated Swagger documentation at `/api/swagger`
   - Exports `ApiType` for frontend type inference

3. **Route Organization**:
   - OpenAPI route definitions in `workers/routes/`
   - Handlers in `workers/handlers/` with full type safety
   - Access to Cloudflare bindings (D1, KV, etc.) via Hono context

### Frontend (React Router)

The frontend uses React Router v7 with SSR:

1. **Components** (`app/components/`):
   - Modular, reusable React components
   - TypeScript interfaces for props
   - Clean separation of concerns

2. **API Client** (`app/lib/hono-rpc-client.ts`):
   - Uses Hono's `hc` client for perfect type inference
   - Imports `ApiType` from backend for type safety
   - No manual type definitions needed
   - Includes error extraction helper for consistent error handling

3. **Routes** (`app/routes/`):
   - File-based routing
   - Server-side rendering
   - Type-safe data loading

### Type Safety with Hono RPC

This template implements Hono's RPC pattern for perfect type sharing between frontend and backend:

1. **Backend Type Export** (`workers/app.ts`):
   ```typescript
   const contactsRoute = app
     .get("/", { ... })          // Method chaining for RPC
     .post("/", { ... })
     .get("/:id", { ... })
   
   export type ApiType = typeof contactsRoute  // Export for frontend
   ```

2. **Frontend RPC Client** (`app/lib/hono-rpc-client.ts`):
   ```typescript
   import { hc } from "hono/client"
   import type { ApiType } from "../../workers/app"
   
   export const rpcClient = hc<ApiType>("/api")  // Full type inference
   ```

3. **Type-Safe API Calls**:
   ```typescript
   // Direct RPC usage (recommended)
   const res = await rpcClient.contacts.$get()
   const contact = await rpcClient.contacts[":id"].$get({ 
     param: { id: "123" } 
   })
   
   // With search parameters
   const results = await rpcClient.contacts.search.$get({ 
     query: { q: "john" } 
   })
   ```

### Type Safety Flow

```
Database Schema (Drizzle)
    ↓
Zod Schemas (drizzle-zod)
    ↓
Types exported: Contact, InsertContact, PatchContact
    ↓
API Routes (Hono with method chaining)
    ↓
Export ApiType from backend
    ↓
Import ApiType in RPC client
    ↓
Full type inference in frontend
```

**Key Types:**
- `Contact` - Full contact with id and timestamps (from database)
- `InsertContact` - Fields needed to create a contact (no id/timestamps)
- `PatchContact` - Partial fields for updates

The API returns `Contact` objects directly without manual serialization. Date handling is done on the frontend where needed.

### Error Handling

The API client provides comprehensive error handling:

- **Network Errors**: Caught and returned with descriptive messages
- **HTTP Errors**: Include status code and status text
- **Validation Errors**: Zod validation errors are formatted with field paths
- **API Errors**: Custom error messages from the backend are properly extracted
- **Non-JSON Responses**: Handles both JSON and text error responses

Example error formats handled:
```typescript
// Validation error
"firstName: First name is required, email: Invalid email address"

// Database constraint error
"Email already exists"

// HTTP error fallback
"HTTP 500: Internal Server Error"
```

## Development Workflow

### Common Commands

```bash
# Development
pnpm dev                # Start dev server
pnpm build             # Build for production
pnpm preview           # Preview production build
pnpm deploy            # Deploy to Cloudflare

# Code Quality
pnpm typecheck         # Run TypeScript checks
pnpm lint              # Run linter
pnpm format            # Format code
pnpm check             # Run all checks

# Database
pnpm db:generate       # Generate migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
```

### Adding New Features

1. **Add a Database Table**:
   ```typescript
   // workers/db/schema.ts
   export const users = sqliteTable("users", {
     id: integer("id").primaryKey({ autoIncrement: true }),
     name: text("name").notNull(),
     email: text("email").notNull().unique(),
   })
   
   // Zod schemas are auto-generated
   export const selectUserSchema = createSelectSchema(users)
   export const insertUserSchema = createInsertSchema(users)
   ```

2. **Create API Routes**:
   ```typescript
   // workers/routes/users.ts
   export const list = createRoute({
     path: "/users",
     method: "get",
     responses: {
       200: jsonContent(z.array(selectUserSchema), "List of users"),
     },
   })
   ```

3. **Implement Handlers**:
   ```typescript
   // workers/handlers/users.ts
   export const list: RouteHandler<routes.ListRoute, AppEnv> = async (c) => {
     const db = c.get("db")
     const users = await db.select().from(users)
     return c.json(users)
   }
   ```

4. **Use in Frontend**:
   ```typescript
   // app/routes/users.tsx
   import { rpcClient, extractError } from "~/lib/hono-rpc-client"
   
   const res = await rpcClient.users.$get()
   if (res.ok) {
     const users = await res.json()
     setUsers(users)
   } else {
     const error = await extractError(res)
     setError(error)
   }
   ```

### Best Practices

1. **Type Safety**:
   - All types come from `workers/db/schema.ts` (single source of truth)
   - Use `Contact` type for displaying data (includes id and timestamps)
   - Use `InsertContact` type for forms (excludes auto-generated fields)
   - No manual type conversions or serialization needed

2. **Component Structure**:
   - Keep components small and focused
   - Use TypeScript interfaces for props
   - Extract reusable logic into custom hooks

3. **API Design**:
   - Use OpenAPI for all endpoints
   - Validate all inputs with Zod
   - Return consistent error responses

4. **Database**:
   - Use Drizzle migrations for schema changes
   - Test locally with D1 before deploying
   - Keep schema.ts as single source of truth

### Using the API Client

This template uses Hono's RPC client for type-safe API calls:

```typescript
import { rpcClient, extractError } from "~/lib/hono-rpc-client"

// Type-safe with full IntelliSense
const res = await rpcClient.contacts.$get()
if (res.ok) {
  const data = await res.json()
  setContacts(data.contacts)
} else {
  const error = await extractError(res)
  setError(error)
}

// With parameters
const contact = await rpcClient.contacts[":id"].$get({ 
  param: { id: "123" } 
})

// With search query
const results = await rpcClient.contacts.search.$get({ 
  query: { q: "john" } 
})
```

The RPC client provides:
- Full type inference from backend routes
- Direct access to Hono's response objects
- Helper function for consistent error extraction

---

### Why put this template together?

There's a lot of templates out there showing you how to run React-Router and Hono but most of them are outdated (as of June 2025) because React-Router, Hono and Cloudflare Vite support have evolved a lot over the past 6 months.

There's been great work put into [react-router-hono-server](https://github.com/rphlmr/react-router-hono-server) and [remix-hono](https://github.com/sergiodxa/remix-hono). But, as of June 2025, those solutions aren't ideal for hosting on Cloudflare Workers.

[Agcty](https://github.com/agcty) [actually pointed out that it's really simple to configure RR + Hono + Cloudflare](https://github.com/rphlmr/react-router-hono-server/issues/115#issuecomment-2787089066), in light of recent developments in Cloudflare, Vite and React Router. This repository makes it easier to get a project started with this stack and makes it (hopefully) easier to discover that this is how to set this up (because I think it's a great stack, and I'll be using it myself to refer back to how to set this up).
 
This project is very simple. It's just the [original deployment template for Cloudflare and React Router ](https://github.com/remix-run/react-router-templates/tree/main/cloudflare) with a small change to use Hono to serve the React Router project, allowing Hono routes to take effect and fallback to React Router:

```diff
+ import { Hono } from 'hono';
import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

- export default {
-   async fetch(request, env, ctx) {
-     return requestHandler(request, {
-       cloudflare: { env, ctx },
-     });
-   },
- } satisfies ExportedHandler<Env>;

+ const app = new Hono<{ Bindings: Env }>();

+ app.all('*', (c) => {
+   return requestHandler(c.req.raw, {
+     cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
+   });
+ });

+ export default app;
```
