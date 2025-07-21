// Custom environment variables that extend the generated Cloudflare environment
declare global {
	interface Env {
		DATABASE_URL: string
	}
}

export {}
