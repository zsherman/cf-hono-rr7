import { zValidator } from "@hono/zod-validator"
import { count, desc, eq, like, or } from "drizzle-orm"
import { Hono } from "hono"
import { createRequestHandler } from "react-router"
import { z } from "zod"
import { createDb } from "./db"
import { contacts, insertContactSchema, patchContactSchema } from "./db/schema"

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env
			ctx: ExecutionContext
		}
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
)

type AppEnv = {
	Bindings: Env
	Variables: {
		db: ReturnType<typeof createDb>
	}
}

// Create Hono app
const app = new Hono<AppEnv>()

// Create API router
const api = new Hono<AppEnv>()

// Middleware to inject database
api.use("*", async (c, next) => {
	// Get database URL from environment bindings
	const databaseUrl = c.env.DATABASE_URL
	if (!databaseUrl) {
		throw new Error("DATABASE_URL not found in environment")
	}
	const db = createDb(databaseUrl)
	c.set("db", db)
	await next()
})

// Define pagination schema
const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
})

// Define contacts routes with chaining for RPC compatibility
const contactsRoute = api
	// List all contacts with pagination
	.get("/contacts", zValidator("query", paginationSchema), async (c) => {
		const db = c.get("db")
		const { page, limit } = c.req.valid("query")
		const offset = (page - 1) * limit

		// Get total count
		const [{ total }] = await db.select({ total: count() }).from(contacts)

		// Get paginated results
		const allContacts = await db
			.select()
			.from(contacts)
			.orderBy(desc(contacts.createdAt))
			.limit(limit)
			.offset(offset)

		// Calculate pagination metadata
		const totalPages = Math.ceil(total / limit)
		const hasNextPage = page < totalPages
		const hasPreviousPage = page > 1

		return c.json({
			contacts: allContacts,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNextPage,
				hasPreviousPage,
			},
		})
	})
	// Search contacts with pagination
	.get(
		"/contacts/search",
		zValidator("query", paginationSchema.extend({ q: z.string().optional() })),
		async (c) => {
			const db = c.get("db")
			const { q, page, limit } = c.req.valid("query")
			const offset = (page - 1) * limit

			// Build where clause
			const whereClause = q
				? or(
						like(contacts.firstName, `%${q}%`),
						like(contacts.lastName, `%${q}%`),
						like(contacts.email, `%${q}%`),
						like(contacts.phone, `%${q}%`),
					)
				: undefined

			// Get total count for search results
			const [{ total }] = await db.select({ total: count() }).from(contacts).where(whereClause)

			// Get paginated search results
			const results = await db
				.select()
				.from(contacts)
				.where(whereClause)
				.orderBy(desc(contacts.createdAt))
				.limit(limit)
				.offset(offset)

			// Calculate pagination metadata
			const totalPages = Math.ceil(total / limit)
			const hasNextPage = page < totalPages
			const hasPreviousPage = page > 1

			return c.json({
				contacts: results,
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasNextPage,
					hasPreviousPage,
				},
			})
		},
	)
	// Create a contact
	.post("/contacts", zValidator("json", insertContactSchema), async (c) => {
		const db = c.get("db")
		const contactData = c.req.valid("json")

		try {
			const result = await db.insert(contacts).values(contactData).returning()
			const newContact = result[0]

			return c.json(
				{
					contact: newContact,
				},
				200,
			)
		} catch (error) {
			if (
				error instanceof Error &&
				(error.message.includes("UNIQUE constraint failed") ||
					error.message.includes("duplicate key value"))
			) {
				return c.json({ error: "Email already exists" }, 400)
			}
			throw error
		}
	})
	// Get a single contact
	.get("/contacts/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
		const db = c.get("db")
		const { id } = c.req.valid("param")

		const contact = await db
			.select()
			.from(contacts)
			.where(eq(contacts.id, Number(id)))
			.limit(1)

		if (!contact[0]) {
			return c.json({ message: "Contact not found" }, 404)
		}

		return c.json(contact[0], 200)
	})
	// Update a contact
	.patch(
		"/contacts/:id",
		zValidator("param", z.object({ id: z.string() })),
		zValidator("json", patchContactSchema),
		async (c) => {
			const db = c.get("db")
			const { id } = c.req.valid("param")
			const updates = c.req.valid("json")

			try {
				const result = await db
					.update(contacts)
					.set(updates)
					.where(eq(contacts.id, Number(id)))
					.returning()

				if (result.length === 0) {
					return c.json({ message: "Contact not found" }, 404)
				}

				const updatedContact = result[0]
				return c.json(updatedContact, 200)
			} catch (error) {
				if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
					return c.json({ error: "Email already exists" }, 400)
				}
				throw error
			}
		},
	)
	// Delete a contact
	.delete("/contacts/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
		const db = c.get("db")
		const { id } = c.req.valid("param")

		const result = await db
			.delete(contacts)
			.where(eq(contacts.id, Number(id)))
			.returning()

		if (result.length === 0) {
			return c.json({ message: "Contact not found" }, 404)
		}

		return c.body(null, 204)
	})

// Mount API routes
app.route("/api", api)

// React Router handler for all other routes
app.all("*", (c) => {
	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
	})
})

// Export the route type for RPC
export type ApiType = typeof contactsRoute

export default app
