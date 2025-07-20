import { hc } from "hono/client"
import type { ApiType } from "../../workers/api"

// Create a typed Hono client
// The URL will be resolved relative to the current origin
export const client = hc<ApiType>("/api")
