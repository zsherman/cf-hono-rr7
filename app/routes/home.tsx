import { useForm } from "@tanstack/react-form"
import type { InferResponseType } from "hono/client"
import { useEffect, useState } from "react"
import { ContactSkeleton } from "../components/ContactSkeleton"
import { client } from "../lib/api-client"
import { contactFormSchema } from "../schemas/contact"
import type { Route } from "./+types/home"

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Contact Management System" },
		{
			name: "description",
			content: "Manage your contacts with ease. Add, search, and view contacts.",
		},
	]
}

// Infer types from API responses
type ContactsResponse = InferResponseType<typeof client.contacts.$get>
type ContactResponse = InferResponseType<typeof client.contacts.$post>
type Contact = ContactsResponse["contacts"][0]

const mockContacts = [
	{ firstName: "John", lastName: "Doe", email: "john.doe@example.com", phone: "555-0123" },
	{ firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", phone: "555-0124" },
	{ firstName: "Bob", lastName: "Johnson", email: "bob.johnson@example.com", phone: "555-0125" },
	{
		firstName: "Alice",
		lastName: "Williams",
		email: "alice.williams@example.com",
		phone: "555-0126",
	},
	{
		firstName: "Charlie",
		lastName: "Brown",
		email: "charlie.brown@example.com",
		phone: "555-0127",
	},
]

export default function Home() {
	const [contacts, setContacts] = useState<Contact[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

	// Fetch contacts on mount
	useEffect(() => {
		fetchContacts()
	}, [])

	const fetchContacts = async (query = "") => {
		if (query) {
			setIsSearching(true)
		} else {
			setIsLoading(true)
		}
		setError(null)
		try {
			const response = query
				? await client.contacts.search.$get({ query: { q: query } })
				: await client.contacts.$get()

			if (!response.ok) {
				throw new Error("Failed to fetch contacts")
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
	}

	// Handle search
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			fetchContacts(searchQuery)
		}, 300)

		return () => clearTimeout(debounceTimer)
	}, [searchQuery])

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
				const response = await client.contacts.$post({
					json: {
						...value,
						phone: value.phone || undefined,
					},
				})

				if (!response.ok) {
					const errorData = await response.json()
					if ("error" in errorData) {
						throw new Error(errorData.error || "Failed to add contact")
					}
				}

				const data = await response.json()
				if ("contact" in data) {
					setContacts([data.contact, ...contacts])
					form.reset()
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to add contact")
			}
		},
	})

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this contact?")) return

		setDeletingIds((prev) => new Set(prev).add(id))
		try {
			const response = await client.contacts[":id"].$delete({
				param: { id },
			})

			if (!response.ok) {
				throw new Error("Failed to delete contact")
			}

			setContacts(contacts.filter((c) => c.id !== id))
		} catch (err) {
			setError("Failed to delete contact")
			console.error(err)
		} finally {
			setDeletingIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(id)
				return newSet
			})
		}
	}

	const fillWithMockData = () => {
		const randomMock = mockContacts[Math.floor(Math.random() * mockContacts.length)]
		form.setFieldValue("firstName", randomMock.firstName)
		form.setFieldValue("lastName", randomMock.lastName)
		form.setFieldValue("email", randomMock.email)
		form.setFieldValue("phone", randomMock.phone || "")
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Management</h1>

				{/* Error display */}
				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
						{error}
					</div>
				)}

				<div className="grid gap-8 md:grid-cols-2">
					{/* Add Contact Form */}
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-800">Add New Contact</h2>
							<button
								type="button"
								onClick={fillWithMockData}
								className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
							>
								Fill Mock Data
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								form.handleSubmit()
							}}
							className="space-y-4"
						>
							<form.Field
								name="firstName"
								validators={{
									onChange: ({ value }) => (!value ? "First name is required" : undefined),
								}}
							>
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											First Name *
										</label>
										<input
											id={field.name}
											name={field.name}
											type="text"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-sm text-red-600">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<form.Field
								name="lastName"
								validators={{
									onChange: ({ value }) => (!value ? "Last name is required" : undefined),
								}}
							>
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Last Name *
										</label>
										<input
											id={field.name}
											name={field.name}
											type="text"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-sm text-red-600">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<form.Field
								name="email"
								validators={{
									onChange: ({ value }) => {
										if (!value) return "Email is required"
										if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
											return "Invalid email address"
										}
										return undefined
									},
								}}
							>
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Email *
										</label>
										<input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										/>
										{field.state.meta.errors && (
											<p className="mt-1 text-sm text-red-600">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<form.Field name="phone">
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Phone
										</label>
										<input
											id={field.name}
											name={field.name}
											type="tel"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										/>
									</div>
								)}
							</form.Field>

							<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
								{([canSubmit, isSubmitting]) => (
									<button
										type="submit"
										disabled={!canSubmit}
										className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? "Adding..." : "Add Contact"}
									</button>
								)}
							</form.Subscribe>
						</form>
					</div>

					{/* Search and Stats */}
					<div className="space-y-6">
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
							<h2 className="text-xl font-semibold text-gray-800 mb-4">Search Contacts</h2>
							<div className="relative">
								<input
									type="text"
									placeholder="Search by name, email, or phone..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
								/>
								{isSearching && (
									<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
										<svg
											className="animate-spin h-5 w-5 text-gray-400"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
									</div>
								)}
							</div>
						</div>

						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
							<h3 className="text-lg font-semibold text-gray-800 mb-2">Statistics</h3>
							<p className="text-gray-600">
								Total Contacts: <span className="font-semibold">{contacts.length}</span>
							</p>
						</div>
					</div>
				</div>

				{/* Contacts Table */}
				<div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 relative">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-800">Contacts</h2>
					</div>
					<div className="overflow-x-auto relative">
						{/* Loading overlay for non-initial loads */}
						{!isInitialLoad && (isLoading || isSearching) && (
							<div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
								<div className="flex items-center space-x-2">
									<svg
										className="animate-spin h-5 w-5 text-blue-600"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span className="text-gray-600">
										{isSearching ? "Searching..." : "Loading..."}
									</span>
								</div>
							</div>
						)}

						{isInitialLoad && isLoading ? (
							<ContactSkeleton />
						) : contacts.length === 0 && !isLoading && !isSearching ? (
							<div className="p-8 text-center text-gray-500">
								{searchQuery
									? "No contacts found matching your search."
									: "No contacts yet. Add your first contact above!"}
							</div>
						) : (
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Phone
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Added
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{contacts.map((contact) => (
										<tr key={contact.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{contact.firstName} {contact.lastName}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-500">{contact.email}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-500">{contact.phone || "-"}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-500">
													{new Date(contact.createdAt).toLocaleDateString()}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												<button
													type="button"
													onClick={() => handleDelete(contact.id)}
													disabled={deletingIds.has(contact.id)}
													className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{deletingIds.has(contact.id) ? "Deleting..." : "Delete"}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
