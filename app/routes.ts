import { index, route, type RouteConfig } from "@react-router/dev/routes"

export default [
	index("routes/home.tsx"),
	route("contacts/:id", "routes/contact-profile.tsx"),
	route("contacts/:id/edit", "routes/contact-edit.tsx"),
] satisfies RouteConfig
