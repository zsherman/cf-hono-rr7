import { config } from "dotenv"
import type { Config } from "drizzle-kit"

// Load environment-specific file
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".dev.vars"
config({ path: envFile })

export default {
	schema: "./workers/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
} satisfies Config
