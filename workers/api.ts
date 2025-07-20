import { Hono } from "hono"
import { cors } from "hono/cors"
import { type ContactWithId, contactSchema, contactSearchSchema } from "../app/schemas/contact"

// Mock delay utility - simulates network latency
const mockDelay = (min = 200, max = 1500) => {
	const delay = Math.floor(Math.random() * (max - min + 1)) + min
	return new Promise((resolve) => setTimeout(resolve, delay))
}

// In-memory contact storage with createdAt
type StoredContact = ContactWithId & { createdAt: string }
const contacts: StoredContact[] = []

// Create API routes
export const api = new Hono()
	.use("/*", cors())
	// Get all contacts
	.get("/contacts", async (c) => {
		await mockDelay(100, 800)
		return c.json({ contacts })
	})
	// Search contacts
	.get("/contacts/search", async (c) => {
		const result = contactSearchSchema.safeParse(c.req.query())

		if (!result.success) {
			return c.json({ error: "Invalid query parameters", details: result.error.flatten() }, 400)
		}

		const query = result.data.q?.toLowerCase() || ""

		// Simulate faster response for empty searches, slower for filtered searches
		await mockDelay(query ? 300 : 100, query ? 1200 : 500)

		if (!query) {
			return c.json({ contacts })
		}

		const filtered = contacts.filter((contact) => {
			return (
				contact.firstName.toLowerCase().includes(query) ||
				contact.lastName.toLowerCase().includes(query) ||
				contact.email.toLowerCase().includes(query) ||
				(contact.phone?.includes(query) ?? false)
			)
		})

		return c.json({ contacts: filtered })
	})
	// Create a new contact
	.post("/contacts", async (c) => {
		try {
			const body = await c.req.json()

			// Validate with Zod
			const result = contactSchema.safeParse(body)

			if (!result.success) {
				// Faster response for validation errors
				await mockDelay(50, 200)
				return c.json(
					{
						error: "Validation failed",
						details: result.error.flatten(),
					},
					400,
				)
			}

			// Check for duplicate email
			const existingContact = contacts.find((contact) => contact.email === result.data.email)
			if (existingContact) {
				// Slightly slower for duplicate check
				await mockDelay(100, 400)
				return c.json({ error: "A contact with this email already exists" }, 400)
			}

			// Simulate database write delay
			await mockDelay(500, 2000)

			const newContact: StoredContact = {
				id: crypto.randomUUID(),
				...result.data,
				createdAt: new Date().toISOString(),
			}

			contacts.push(newContact)

			return c.json({ contact: newContact }, 201)
		} catch (_error) {
			await mockDelay(50, 150)
			return c.json({ error: "Invalid request body" }, 400)
		}
	})
	// Delete a contact
	.delete("/contacts/:id", async (c) => {
		const id = c.req.param("id")
		const index = contacts.findIndex((contact) => contact.id === id)

		if (index === -1) {
			// Quick response for not found
			await mockDelay(50, 200)
			return c.json({ error: "Contact not found" }, 404)
		}

		// Simulate database delete delay
		await mockDelay(300, 1000)

		contacts.splice(index, 1)
		return c.json({ message: "Contact deleted successfully" })
	})

export type ApiType = typeof api
