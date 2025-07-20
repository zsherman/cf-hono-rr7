import { eq, like, or } from "drizzle-orm"
import { contacts, type Contact, type InsertContact, type PatchContact } from "../db/schema"
import type { createDb } from "../db"

export class ContactsService {
	constructor(private db: ReturnType<typeof createDb>) {}

	async getAll(): Promise<Contact[]> {
		return await this.db.select().from(contacts).orderBy(contacts.createdAt)
	}

	async search(query: string): Promise<Contact[]> {
		if (!query) {
			return this.getAll()
		}

		return await this.db
			.select()
			.from(contacts)
			.where(
				or(
					like(contacts.firstName, `%${query}%`),
					like(contacts.lastName, `%${query}%`),
					like(contacts.email, `%${query}%`),
					like(contacts.phone, `%${query}%`),
				),
			)
			.orderBy(contacts.createdAt)
	}

	async getById(id: number): Promise<Contact | undefined> {
		return await this.db
			.select()
			.from(contacts)
			.where(eq(contacts.id, id))
			.get()
	}

	async create(data: InsertContact): Promise<Contact> {
		try {
			const result = await this.db.insert(contacts).values(data).returning()
			return result[0]
		} catch (error) {
			if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
				throw new Error("Email already exists")
			}
			throw error
		}
	}

	async update(id: number, data: PatchContact): Promise<Contact | null> {
		try {
			const result = await this.db
				.update(contacts)
				.set(data)
				.where(eq(contacts.id, id))
				.returning()

			return result.length > 0 ? result[0] : null
		} catch (error) {
			if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
				throw new Error("Email already exists")
			}
			throw error
		}
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db
			.delete(contacts)
			.where(eq(contacts.id, id))
			.returning()

		return result.length > 0
	}
}