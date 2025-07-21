import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { extractError, rpcClient } from "~/lib/hono-rpc-client"

export default function ContactProfile() {
	const { id } = useParams()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const {
		data: contact,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["contact", id],
		queryFn: async () => {
			const response = await rpcClient.contacts[":id"].$get({
				param: { id: id! },
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			return await response.json()
		},
		enabled: !!id,
	})

	// Delete mutation
	const { mutate: deleteContact, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const response = await rpcClient.contacts[":id"].$delete({
				param: { id: id! },
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}
		},
		onSuccess: () => {
			// Invalidate contacts list
			queryClient.invalidateQueries({ queryKey: ["contacts"] })
			toast.success("Contact deleted successfully!")
			// Navigate back to home
			navigate("/")
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete contact")
		},
	})

	const handleDelete = () => {
		if (window.confirm("Are you sure you want to delete this contact?")) {
			deleteContact()
		}
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
					<div className="animate-pulse">
						<div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
						<div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
							<div className="space-y-4">
								<div className="h-4 bg-gray-200 rounded w-3/4"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								<div className="h-4 bg-gray-200 rounded w-2/3"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (error || !contact) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
					<div className="bg-red-50 border border-red-200 rounded-md p-4">
						<p className="text-red-600">{error?.message || "Contact not found"}</p>
						<Link to="/" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
							← Back to contacts
						</Link>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
				{/* Back button */}
				<div className="mb-8">
					<Link
						to="/"
						className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
					>
						<svg
							className="mr-1 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back to contacts
					</Link>
				</div>

				{/* Profile Card */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<div className="px-4 py-5 sm:px-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900">Contact Information</h3>
						<p className="mt-1 max-w-2xl text-sm text-gray-500">
							Personal details and contact information.
						</p>
					</div>
					<div className="border-t border-gray-200 px-4 py-5 sm:p-0">
						<dl className="sm:divide-y sm:divide-gray-200">
							<div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Full name</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{contact.firstName} {contact.lastName}
								</dd>
							</div>
							<div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Email address</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									<a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-500">
										{contact.email}
									</a>
								</dd>
							</div>
							<div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Phone number</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{contact.phone ? (
										<a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-500">
											{contact.phone}
										</a>
									) : (
										<span className="text-gray-400">Not provided</span>
									)}
								</dd>
							</div>
							<div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Created</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{new Date(contact.createdAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</dd>
							</div>
							<div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt className="text-sm font-medium text-gray-500">Last updated</dt>
								<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
									{new Date(contact.updatedAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</dd>
							</div>
						</dl>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-6 flex gap-4">
					<Link
						to={`/contacts/${contact.id}/edit`}
						className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Edit Contact
					</Link>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? "Deleting..." : "Delete Contact"}
					</button>
				</div>
			</div>
		</div>
	)
}
