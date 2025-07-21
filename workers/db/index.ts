import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Use Neon serverless driver for Cloudflare Workers
export function createDb(databaseUrl: string) {
	const sql = neon(databaseUrl)
	return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof createDb>
