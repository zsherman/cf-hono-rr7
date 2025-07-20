import { Link } from "react-router"
import { useEffect, useState } from "react"
import type { Contact } from "../../workers/db/schema"
import { extractError, rpcClient } from "../lib/hono-rpc-client"
import type { Route } from "./+types/contacts.$id"

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `Contact Details` },
		{
			name: "description",
			content: `View contact information`,
		},
	]
}

export async function loader({ params, context }: Route.LoaderArgs) {
	// Access the Hono app context to get database
	const { env } = context.cloudflare
	
	// For now, return null - we'll load the data client-side
	// In a real app, you'd query the database here directly
	return { contactId: params.id }
}

export default function ContactDetail({ loaderData }: Route.ComponentProps) {
	const { contactId } = loaderData
	const [contact, setContact] = useState<Contact | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Load contact data on mount
	useEffect(() => {
		const loadContact = async () => {
			try {
				const response = await rpcClient.contacts[":id"].$get({
					param: { id: contactId },
				})

				if (!response.ok) {
					if (response.status === 404) {
						setError("Contact not found")
					} else {
						setError(await extractError(response))
					}
					setIsLoading(false)
					return
				}

				const data = await response.json()
				setContact(data)
			} catch (err) {
				setError("Failed to load contact")
			} finally {
				setIsLoading(false)
			}
		}

		loadContact()
	}, [contactId])

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this contact?")) return

		setIsDeleting(true)
		setError(null)
		try {
			const response = await rpcClient.contacts[":id"].$delete({
				param: { id: contactId },
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			// Redirect to home after successful deletion
			window.location.href = "/"
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError("Failed to delete contact")
			}
			setIsDeleting(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* Navigation */}
				<div className="mb-6">
					<Link
						to="/"
						className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
					>
						<svg
							className="w-5 h-5 mr-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Back to Contacts
					</Link>
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
						<div className="flex justify-center items-center">
							<div className="text-gray-500">Loading contact...</div>
						</div>
					</div>
				)}

				{/* Error Alert */}
				{error && !isLoading && (
					<div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
						{error}
					</div>
				)}

				{/* Contact Profile Card */}
				{contact && !isLoading && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					{/* Header with gradient background */}
					<div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-12">
						<div className="flex items-center">
							<div className="bg-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-semibold text-blue-600">
								{contact.firstName[0]}{contact.lastName[0]}
							</div>
							<div className="ml-6 text-white">
								<h1 className="text-3xl font-bold">
									{contact.firstName} {contact.lastName}
								</h1>
								<p className="text-blue-100 mt-1">{contact.email}</p>
							</div>
						</div>
					</div>

					{/* Contact Details */}
					<div className="p-8">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
									Contact Information
								</h3>
								<div className="space-y-3">
									<div>
										<p className="text-sm text-gray-600">Email</p>
										<p className="font-medium text-gray-900">{contact.email}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">Phone</p>
										<p className="font-medium text-gray-900">{contact.phone || "Not provided"}</p>
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
									Additional Details
								</h3>
								<div className="space-y-3">
									<div>
										<p className="text-sm text-gray-600">Contact ID</p>
										<p className="font-medium text-gray-900">#{contact.id}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">Added</p>
										<p className="font-medium text-gray-900">
											{contact.createdAt instanceof Date
												? contact.createdAt.toLocaleDateString()
												: new Date(contact.createdAt).toLocaleDateString()}
										</p>
									</div>
									{contact.updatedAt && (
										<div>
											<p className="text-sm text-gray-600">Last Updated</p>
											<p className="font-medium text-gray-900">
												{contact.updatedAt instanceof Date
													? contact.updatedAt.toLocaleDateString()
													: new Date(contact.updatedAt).toLocaleDateString()}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isDeleting ? "Deleting..." : "Delete Contact"}
							</button>
						</div>
					</div>
				</div>
				)}
			</div>
		</div>
	)
}