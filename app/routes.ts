import { index, type RouteConfig, route } from "@react-router/dev/routes"

export default [
	index("routes/home-with-loader.tsx"),
	route("contacts/:id", "routes/contact.tsx"),
] satisfies RouteConfig
