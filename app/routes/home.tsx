import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType } from "hono/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { insertContactSchema } from "../../workers/db/schema"
import {
	ContactForm,
	ContactList,
	ContactStats,
	ErrorAlert,
	Pagination,
	SearchBar,
} from "../components"
import { generateMockContact } from "../lib/generate-contact"
import { extractError, rpcClient } from "../lib/hono-rpc-client"
import type { Route } from "./+types/home"

// Infer types from the API client
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
	const [currentPage, setCurrentPage] = useState(1)
	const [previousPage, setPreviousPage] = useState(1)
	const queryClient = useQueryClient()

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery)
			// Reset to page 1 when search changes
			setCurrentPage(1)
		}, 300)

		return () => clearTimeout(timer)
	}, [searchQuery])

	// Track when page changes
	useEffect(() => {
		setPreviousPage(currentPage)
	}, [currentPage])

	// Fetch contacts with React Query
	const { data, isLoading, isInitialLoading, error, isFetching } = useQuery({
		queryKey: ["contacts", debouncedSearchQuery, currentPage],
		queryFn: async () => {
			const response = debouncedSearchQuery
				? await rpcClient.contacts.search.$get({
						query: { q: debouncedSearchQuery, page: currentPage.toString(), limit: "10" },
					})
				: await rpcClient.contacts.$get({ query: { page: currentPage.toString(), limit: "10" } })

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			return await response.json()
		},
		// Keep previous data while loading new page
		placeholderData: (previousData) => previousData,
	})

	const contacts = data?.contacts || []
	const pagination = data?.pagination

	// Determine if we're loading due to pagination change
	const isPaginationLoading = isFetching && previousPage !== currentPage && !isInitialLoading

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
			toast.success("Contact created successfully!")
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create contact")
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
			toast.success("Contact deleted successfully!")
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete contact")
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
		const mockContact = generateMockContact()
		// Reset form with new values to clear all errors and touched states
		form.reset(mockContact as CreateContactRequest)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Management</h1>

				{/* Error display */}
				{error && <ErrorAlert error={error.message || "Failed to load contacts"} />}

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
						<ContactStats totalContacts={pagination?.total || 0} />
					</div>
				</div>

				{/* Contacts Table */}
				<ContactList
					contacts={contacts}
					isLoading={isLoading}
					isInitialLoad={isInitialLoading}
					isSearching={isLoading && searchQuery !== ""}
					isPaginationLoading={isPaginationLoading}
					searchQuery={searchQuery}
					deletingIds={deletingIds}
					onDelete={handleDelete}
				/>

				{/* Pagination */}
				{pagination && pagination.totalPages > 1 && (
					<div className="mt-6">
						<Pagination
							currentPage={pagination.page}
							totalPages={pagination.totalPages}
							hasNextPage={pagination.hasNextPage}
							hasPreviousPage={pagination.hasPreviousPage}
							onPageChange={setCurrentPage}
							isLoading={isFetching}
						/>
					</div>
				)}
			</div>
		</div>
	)
}
