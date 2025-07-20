import { randFirstName, randLastName } from "@ngneat/falso"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { useEffect, useState } from "react"
import { insertContactSchema } from "../../workers/db/schema"
import { ContactForm, ContactList, ContactStats, ErrorAlert, SearchBar } from "../components"
import { extractError, rpcClient } from "../lib/hono-rpc-client"
import type { Route } from "./+types/home"

// Infer types from the API client
type ContactsResponse = InferResponseType<typeof rpcClient.contacts.$get>
type CreateContactRequest = InferRequestType<typeof rpcClient.contacts.$post>["json"]

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
	const [searchQuery, setSearchQuery] = useState("")
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
	const queryClient = useQueryClient()

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery)
		}, 300)

		return () => clearTimeout(timer)
	}, [searchQuery])

	// Fetch contacts with React Query
	const { data, isLoading, isInitialLoading, error } = useQuery({
		queryKey: ["contacts", debouncedSearchQuery],
		queryFn: async () => {
			const response = debouncedSearchQuery
				? await rpcClient.contacts.search.$get({ query: { q: debouncedSearchQuery } })
				: await rpcClient.contacts.$get()

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			const data = (await response.json()) as Awaited<ContactsResponse>
			return data.contacts || []
		},
	})

	const contacts = data || []

	// Create contact mutation
	const createContactMutation = useMutation({
		mutationFn: async (value: CreateContactRequest) => {
			const response = await rpcClient.contacts.$post({
				json: value,
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			return await response.json()
		},
		onSuccess: () => {
			// Invalidate and refetch contacts
			queryClient.invalidateQueries({ queryKey: ["contacts"] })
		},
	})

	// Contact form
	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: null,
		} as CreateContactRequest,
		validators: {
			onChange: insertContactSchema,
		},
		onSubmit: async ({ formApi, value }) => {
			await createContactMutation.mutateAsync(value)
			// Reset form on success
			formApi.reset()
		},
	})

	// Delete contact mutation
	const deleteContactMutation = useMutation({
		mutationFn: async (id: number) => {
			const response = await rpcClient.contacts[":id"].$delete({
				param: { id: id.toString() },
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			return id
		},
		onMutate: async (id) => {
			// Add to deleting set
			setDeletingIds((prev) => new Set(prev).add(id.toString()))
		},
		onSuccess: () => {
			// Invalidate and refetch contacts
			queryClient.invalidateQueries({ queryKey: ["contacts"] })
		},
		onSettled: (_data, _error, id) => {
			// Remove from deleting set
			setDeletingIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(id.toString())
				return newSet
			})
		},
	})

	const handleDelete = async (id: number) => {
		deleteContactMutation.mutate(id)
	}

	const fillWithMockData = () => {
		const firstName = randFirstName()
		const lastName = randLastName()
		// Remove any non-ASCII characters and generate a simple email
		const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, "")
		const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, "")
		const randomNum = Math.floor(Math.random() * 100)
		const email = `${cleanFirstName}.${cleanLastName}${randomNum}@example.com`
		// Generate phone number in format: 555-0123
		const phoneDigits = Math.floor(Math.random() * 10000)
			.toString()
			.padStart(4, "0")
		const phone = `555-${phoneDigits}`

		// Reset form with new values to clear all errors and touched states
		form.reset({
			firstName,
			lastName,
			email,
			phone,
		} as CreateContactRequest)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Management</h1>

				{/* Error display */}
				{error && <ErrorAlert error={error.message || "Failed to load contacts"} />}
				{createContactMutation.error && (
					<ErrorAlert error={createContactMutation.error.message || "Failed to create contact"} />
				)}
				{deleteContactMutation.error && (
					<ErrorAlert error={deleteContactMutation.error.message || "Failed to delete contact"} />
				)}

				<div className="grid gap-8 md:grid-cols-2">
					{/* Add Contact Form */}
					<ContactForm form={form} onFillMockData={fillWithMockData} />

					{/* Search and Stats */}
					<div className="space-y-6">
						<SearchBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							isSearching={isLoading && searchQuery !== ""}
						/>
						<ContactStats totalContacts={contacts.length} />
					</div>
				</div>

				{/* Contacts Table */}
				<ContactList
					contacts={contacts}
					isLoading={isLoading}
					isInitialLoad={isInitialLoading}
					isSearching={isLoading && searchQuery !== ""}
					searchQuery={searchQuery}
					deletingIds={deletingIds}
					onDelete={handleDelete}
				/>
			</div>
		</div>
	)
}
