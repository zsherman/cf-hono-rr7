import { hc } from "hono/client"
import type { ApiType } from "../../workers/app"

// Server-aware RPC client that can handle both SSR and client-side requests
export function createRpcClient(request?: Request) {
	// During SSR, we need to provide the full URL
	if (request && typeof window === "undefined") {
		// Extract the host from the request
		const url = new URL(request.url)
		const origin = `${url.protocol}//${url.host}`
		return hc<ApiType>(`${origin}/api`)
	}
	
	// Client-side: use relative URL
	return hc<ApiType>("/api")
}

// Default client for client-side usage
export const rpcClient = createRpcClient()

// Re-export the error helper
export { extractError } from "./hono-rpc-client"