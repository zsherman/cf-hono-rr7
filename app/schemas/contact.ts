import { z } from "zod"

export const contactSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	phone: z.string().optional(),
})

export const contactFormSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	phone: z.union([z.string(), z.undefined()]),
})

export const contactWithIdSchema = contactSchema.extend({
	id: z.string(),
})

export const contactSearchSchema = z.object({
	q: z.string().optional(),
})

export type Contact = z.infer<typeof contactSchema>
export type ContactForm = z.infer<typeof contactFormSchema>
export type ContactWithId = z.infer<typeof contactWithIdSchema>
export type ContactSearchQuery = z.infer<typeof contactSearchSchema>
