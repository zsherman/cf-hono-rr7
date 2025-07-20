import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { createRequestHandler } from "react-router"
import { z } from "zod"
import { createDb } from "./db"
import { insertContactSchema, patchContactSchema } from "./db/schema"
import { ContactsService } from "./services/contacts.service"

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env
			ctx: ExecutionContext
		}
		services: {
			contacts: ContactsService
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
		contactsService: ContactsService
	}
}

// Create Hono app
const app = new Hono<AppEnv>()

// Create API router
const api = new Hono<AppEnv>()

// Middleware to inject database and services
api.use("*", async (c, next) => {
	// Get D1 database from environment bindings
	const d1 = c.env.DB
	if (!d1) {
		throw new Error("D1 database not found in environment")
	}
	const db = createDb(d1)
	c.set("db", db)
	c.set("contactsService", new ContactsService(db))
	await next()
})

// Define contacts routes with chaining for RPC compatibility
const contactsRoute = api
	// List all contacts
	.get("/contacts", async (c) => {
		const contactsService = c.get("contactsService")
		const allContacts = await contactsService.getAll()

		return c.json({
			contacts: allContacts,
		})
	})
	// Search contacts
	.get(
		"/contacts/search",
		zValidator("query", z.object({ q: z.string().optional() })),
		async (c) => {
			const contactsService = c.get("contactsService")
			const { q } = c.req.valid("query")

			const results = await contactsService.search(q || "")

			return c.json({
				contacts: results,
			})
		},
	)
	// Create a contact
	.post("/contacts", zValidator("json", insertContactSchema), async (c) => {
		const contactsService = c.get("contactsService")
		const contactData = c.req.valid("json")

		try {
			const newContact = await contactsService.create(contactData)

			return c.json(
				{
					contact: newContact,
				},
				200,
			)
		} catch (error) {
			if (error instanceof Error && error.message === "Email already exists") {
				return c.json({ error: error.message }, 400)
			}
			throw error
		}
	})
	// Get a single contact
	.get("/contacts/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
		const contactsService = c.get("contactsService")
		const { id } = c.req.valid("param")

		const contact = await contactsService.getById(Number(id))

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
			const contactsService = c.get("contactsService")
			const { id } = c.req.valid("param")
			const updates = c.req.valid("json")

			try {
				const updatedContact = await contactsService.update(Number(id), updates)

				if (!updatedContact) {
					return c.json({ message: "Contact not found" }, 404)
				}

				return c.json(updatedContact, 200)
			} catch (error) {
				if (error instanceof Error && error.message === "Email already exists") {
					return c.json({ error: error.message }, 400)
				}
				throw error
			}
		},
	)
	// Delete a contact
	.delete("/contacts/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
		const contactsService = c.get("contactsService")
		const { id } = c.req.valid("param")

		const deleted = await contactsService.delete(Number(id))

		if (!deleted) {
			return c.json({ message: "Contact not found" }, 404)
		}

		return c.body(null, 204)
	})

// Mount API routes
app.route("/api", api)

// React Router handler for all other routes
app.all("*", (c) => {
	// Create database and services for React Router loaders
	const d1 = c.env.DB
	if (!d1) {
		throw new Error("D1 database not found in environment")
	}
	const db = createDb(d1)
	const contactsService = new ContactsService(db)
	
	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
		services: {
			contacts: contactsService,
		},
	})
})

// Export the route type for RPC
export type ApiType = typeof contactsRoute

export default app
