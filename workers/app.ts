import { zValidator } from "@hono/zod-validator"
import { eq, like, or } from "drizzle-orm"
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
	// Get D1 database from environment bindings
	const d1 = c.env.DB
	if (!d1) {
		throw new Error("D1 database not found in environment")
	}
	const db = createDb(d1)
	c.set("db", db)
	await next()
})

// Define contacts routes with chaining for RPC compatibility
const contactsRoute = api
	// List all contacts
	.get("/contacts", async (c) => {
		const db = c.get("db")
		const allContacts = await db.select().from(contacts).orderBy(contacts.createdAt)

		return c.json({
			contacts: allContacts,
		})
	})
	// Search contacts
	.get(
		"/contacts/search",
		zValidator("query", z.object({ q: z.string().optional() })),
		async (c) => {
			const db = c.get("db")
			const { q } = c.req.valid("query")

			const results = await (q
				? db
						.select()
						.from(contacts)
						.where(
							or(
								like(contacts.firstName, `%${q}%`),
								like(contacts.lastName, `%${q}%`),
								like(contacts.email, `%${q}%`),
								like(contacts.phone, `%${q}%`),
							),
						)
						.orderBy(contacts.createdAt)
				: db.select().from(contacts).orderBy(contacts.createdAt))

			return c.json({
				contacts: results,
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
			if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
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
			.get()

		if (!contact) {
			return c.json({ message: "Contact not found" }, 404)
		}

		return c.json(contact, 200)
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
