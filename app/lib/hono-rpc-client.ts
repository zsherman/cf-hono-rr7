import { hc } from "hono/client"
import type { ApiType } from "../../workers/app"

// Create the RPC client with full type inference
export const rpcClient = hc<ApiType>("/api")

// Helper to extract error messages from responses (same as our custom client)
export async function extractError(response: Response): Promise<string> {
	try {
		const contentType = response.headers.get("content-type")
		if (contentType?.includes("application/json")) {
			const errorData = (await response.json()) as {
				error?: string
				message?: string
				issues?: Array<{ path: string[]; message: string }>
			}

			// Handle different error formats
			if (errorData.error) {
				return errorData.error
			} else if (errorData.message) {
				return errorData.message
			} else if (errorData.issues && errorData.issues.length > 0) {
				// Zod validation errors
				return errorData.issues
					.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
					.join(", ")
			}
		} else {
			// Try to get text response for non-JSON errors
			const text = await response.text()
			if (text) {
				return text
			}
		}
	} catch (parseError) {
		console.error("Error parsing error response:", parseError)
	}

	return `HTTP ${response.status}: ${response.statusText}`
}
