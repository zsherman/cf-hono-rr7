import { Hono } from "hono"
import { createRequestHandler } from "react-router"
import { api } from "./api"

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env
			ctx: ExecutionContext
		}
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
)

const app = new Hono<{ Bindings: Env }>()

// Mount API routes
app.route("/api", api)

app.all("*", (c) => {
	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
	})
})

export type AppType = typeof app
export default app
