import { useForm } from "@tanstack/react-form"
import { randFirstName, randLastName } from "@ngneat/falso"
import { useCallback, useState } from "react"
import { useLoaderData } from "react-router"
import type { Contact } from "../../workers/db/schema"
import { ContactForm, ContactList, ContactStats, ErrorAlert, SearchBar } from "../components"
import { createRpcClient, extractError, rpcClient } from "../lib/server-rpc-client"
import type { Route } from "./+types/home-with-loader"

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Contact Management Demo (SSR) - Hono, Workers, Drizzle, Zod" },
		{
			name: "description",
			content: "Manage your contacts with ease. Add, search, and view contacts.",
		},
	]
}

// Loader that uses the shared ContactsService for SSR
export async function loader({ context }: Route.LoaderArgs) {
	try {
		// Access the contacts service from the loader context
		const contactsService = context.services.contacts
		const initialContacts = await contactsService.getAll()
		
		return {
			initialContacts,
			error: null,
		}
	} catch (error) {
		console.error("Failed to load contacts:", error)
		return {
			initialContacts: [],
			error: "Failed to load contacts",
		}
	}
}

export default function HomeWithLoader() {
	const { initialContacts, error: loaderError } = useLoaderData<typeof loader>()
	const [contacts, setContacts] = useState<Contact[]>(initialContacts)
	const [searchQuery, setSearchQuery] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(loaderError)
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

	const fetchContacts = useCallback(async (query = "") => {
		if (query) {
			setIsSearching(true)
		} else {
			setIsLoading(true)
		}
		setError(null)
		try {
			const response = query
				? await rpcClient.contacts.search.$get({ query: { q: query } })
				: await rpcClient.contacts.$get()

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			const data = await response.json()
			setContacts(data.contacts || [])
		} catch (err) {
			setError("Failed to fetch contacts")
			console.error(err)
		} finally {
			setIsLoading(false)
			setIsSearching(false)
		}
	}, [])

	// Handle search with debounce
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query)
		const debounceTimer = setTimeout(() => {
			fetchContacts(query)
		}, 300)
		return () => clearTimeout(debounceTimer)
	}, [fetchContacts])

	// Contact form
	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
		},
		onSubmit: async ({ value }) => {
			setError(null)
			try {
				const response = await rpcClient.contacts.$post({
					json: {
						...value,
						phone: value.phone || null,
					},
				})

				if (!response.ok) {
					throw new Error(await extractError(response))
				}

				const data = await response.json()
				setContacts([data.contact, ...contacts])
				form.reset()
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message)
				} else if (typeof err === 'string') {
					setError(err)
				} else {
					setError("Failed to add contact")
				}
			}
		},
	})

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this contact?")) return

		setDeletingIds((prev) => new Set(prev).add(id.toString()))
		try {
			const response = await rpcClient.contacts[":id"].$delete({
				param: { id: id.toString() },
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			setContacts(contacts.filter((c) => c.id !== id))
		} catch (err) {
			setError("Failed to delete contact")
			console.error(err)
		} finally {
			setDeletingIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(id.toString())
				return newSet
			})
		}
	}

	const fillWithMockData = () => {
		const firstName = randFirstName()
		const lastName = randLastName()
		const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '')
		const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '')
		const randomNum = Math.floor(Math.random() * 100)
		const email = `${cleanFirstName}.${cleanLastName}${randomNum}@example.com`
		const phoneDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
		const phone = `555-${phoneDigits}`
		
		form.setFieldValue("firstName", firstName)
		form.setFieldValue("lastName", lastName)
		form.setFieldValue("email", email)
		form.setFieldValue("phone", phone)
		form.validateAllFields("change")
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Management (SSR)</h1>

				{/* Error display */}
				{error && <ErrorAlert error={error} />}

				<div className="grid gap-8 md:grid-cols-2">
					{/* Add Contact Form */}
					<ContactForm form={form} onFillMockData={fillWithMockData} />

					{/* Search and Stats */}
					<div className="space-y-6">
						<SearchBar
							searchQuery={searchQuery}
							onSearchChange={handleSearch}
							isSearching={isSearching}
						/>
						<ContactStats totalContacts={contacts.length} />
					</div>
				</div>

				{/* Contacts Table */}
				<ContactList
					contacts={contacts}
					isLoading={isLoading}
					isInitialLoad={false}
					isSearching={isSearching}
					searchQuery={searchQuery}
					deletingIds={deletingIds}
					onDelete={handleDelete}
				/>
			</div>
		</div>
	)
}