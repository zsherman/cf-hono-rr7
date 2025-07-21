import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { lazy, Suspense, useEffect, useState } from "react"
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Toaster } from "sonner"
import type { Route } from "./+types/root"
import "./app.css"

// Lazy load React Query DevTools to prevent SSR issues
const ReactQueryDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/react-query-devtools").then((mod) => ({
				default: mod.ReactQueryDevtools,
			})),
		)
	: () => null

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Stale time of 1 minute
			staleTime: 60 * 1000,
		},
	},
})

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
]

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<Toaster position="top-right" richColors />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const [mounted, setMounted] = useState(false)

	// Only render DevTools after hydration
	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			{import.meta.env.DEV && mounted && (
				<Suspense fallback={null}>
					<ReactQueryDevtools initialIsOpen={false} />
				</Suspense>
			)}
		</QueryClientProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!"
	let details = "An unexpected error occurred."
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error"
		details =
			error.status === 404 ? "The requested page could not be found." : error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
