import { randFirstName, randLastName } from "@ngneat/falso"
import type { InsertContact } from "../../workers/db/schema"

export function generateMockContact(): InsertContact {
	const firstName = randFirstName()
	const lastName = randLastName()

	// Remove any non-ASCII characters and generate a simple email
	const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, "")
	const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, "")
	const randomNum = Math.floor(Math.random() * 100)
	const email = `${cleanFirstName}.${cleanLastName}${randomNum}@example.com`

	// Generate phone number in format: 555-0123
	const phoneDigits = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, "0")
	const phone = `555-${phoneDigits}`

	return {
		firstName,
		lastName,
		email,
		phone,
	}
}

export function generateMockContacts(count: number): InsertContact[] {
	const contacts: InsertContact[] = []
	const usedEmails = new Set<string>()

	for (let i = 0; i < count; i++) {
		let contact: InsertContact
		let attempts = 0

		// Ensure unique emails
		do {
			contact = generateMockContact()
			attempts++
			// If we've tried too many times, add a timestamp to guarantee uniqueness
			if (attempts > 10) {
				const timestamp = Date.now()
				contact.email = contact.email.replace("@", `${timestamp}@`)
			}
		} while (usedEmails.has(contact.email))

		usedEmails.add(contact.email)
		contacts.push(contact)
	}

	return contacts
}
