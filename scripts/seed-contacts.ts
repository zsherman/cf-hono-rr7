import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/neon-http"
import { generateMockContacts } from "../app/lib/generate-contact"
import { contacts } from "../workers/db/schema"

// Load environment variables
config({ path: ".dev.vars" })

async function seedContacts(count: number = 50) {
	const databaseUrl = process.env.DATABASE_URL

	if (!databaseUrl) {
		console.error("❌ DATABASE_URL not found in environment variables")
		console.error("Please ensure you have a .dev.vars file with DATABASE_URL set")
		process.exit(1)
	}

	console.log(`🌱 Starting to seed ${count} contacts...`)

	try {
		// Create database connection
		const sql = neon(databaseUrl)
		const db = drizzle(sql)

		// Generate mock contacts
		const mockContacts = generateMockContacts(count)

		// Insert contacts in batches to avoid overwhelming the database
		const batchSize = 10
		let inserted = 0

		for (let i = 0; i < mockContacts.length; i += batchSize) {
			const batch = mockContacts.slice(i, i + batchSize)

			try {
				await db.insert(contacts).values(batch)
				inserted += batch.length
				console.log(`✅ Inserted ${inserted}/${count} contacts`)
			} catch (error) {
				console.error(`❌ Error inserting batch starting at index ${i}:`, error)
				// Continue with next batch even if one fails
			}
		}

		console.log(`\n🎉 Successfully seeded ${inserted} contacts!`)
	} catch (error) {
		console.error("❌ Error seeding contacts:", error)
		process.exit(1)
	}
}

// Parse command line arguments
const args = process.argv.slice(2)
const count = args[0] ? parseInt(args[0], 10) : 50

if (Number.isNaN(count) || count < 1) {
	console.error("❌ Please provide a valid number of contacts to generate")
	console.log("Usage: pnpm seed:contacts [count]")
	console.log("Example: pnpm seed:contacts 100")
	process.exit(1)
}

// Run the seeding
seedContacts(count)
