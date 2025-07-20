import { useForm } from "@tanstack/react-form"
import { randFirstName, randLastName } from "@ngneat/falso"
import { useCallback, useEffect, useState } from "react"
import type { Contact } from "../../workers/db/schema"
import { ContactForm, ContactList, ContactStats, ErrorAlert, SearchBar } from "../components"
import { extractError, rpcClient } from "../lib/hono-rpc-client"
import type { Route } from "./+types/home"

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Contact Management Demo - Hono, Workers, Drizzle, Zod" },
		{
			name: "description",
			content: "Manage your contacts with ease. Add, search, and view contacts.",
		},
	]
}


export default function Home() {
	const [contacts, setContacts] = useState<Contact[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(null)
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
			setIsInitialLoad(false)
		}
	}, [])

	// Fetch contacts on mount
	useEffect(() => {
		fetchContacts()
	}, [fetchContacts])

	// Handle search
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			fetchContacts(searchQuery)
		}, 300)

		return () => clearTimeout(debounceTimer)
	}, [searchQuery, fetchContacts])

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
		// Remove any non-ASCII characters and generate a simple email
		const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '')
		const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '')
		const randomNum = Math.floor(Math.random() * 100)
		const email = `${cleanFirstName}.${cleanLastName}${randomNum}@example.com`
		// Generate phone number in format: 555-0123
		const phoneDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
		const phone = `555-${phoneDigits}`
		
		form.setFieldValue("firstName", firstName)
		form.setFieldValue("lastName", lastName)
		form.setFieldValue("email", email)
		form.setFieldValue("phone", phone)
		// Validate all fields to clear any existing errors
		form.validateAllFields("change")
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Management</h1>

				{/* Error display */}
				{error && <ErrorAlert error={error} />}

				<div className="grid gap-8 md:grid-cols-2">
					{/* Add Contact Form */}
					<ContactForm form={form} onFillMockData={fillWithMockData} />

					{/* Search and Stats */}
					<div className="space-y-6">
						<SearchBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							isSearching={isSearching}
						/>
						<ContactStats totalContacts={contacts.length} />
					</div>
				</div>

				{/* Contacts Table */}
				<ContactList
					contacts={contacts}
					isLoading={isLoading}
					isInitialLoad={isInitialLoad}
					isSearching={isSearching}
					searchQuery={searchQuery}
					deletingIds={deletingIds}
					onDelete={handleDelete}
				/>
			</div>
		</div>
	)
}
