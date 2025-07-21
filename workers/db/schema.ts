import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

export const contacts = pgTable("contacts", {
	id: serial("id").primaryKey(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text("email").notNull().unique(),
	phone: text("phone"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
})

// Generate Zod schemas from Drizzle schema with custom validations
export const selectContactSchema = createSelectSchema(contacts)

export const insertContactSchema = createInsertSchema(contacts, {
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	phone: z.string().optional().nullable(),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})

// Create a patch schema for partial updates
export const patchContactSchema = insertContactSchema.partial()

// Export types
export type Contact = z.infer<typeof selectContactSchema>
export type InsertContact = z.infer<typeof insertContactSchema>
export type PatchContact = z.infer<typeof patchContactSchema>
