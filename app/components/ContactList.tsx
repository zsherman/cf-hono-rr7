import { ContactSkeleton } from "./ContactSkeleton"

// API returns dates as strings due to JSON serialization
interface ContactFromAPI {
	id: number
	firstName: string
	lastName: string
	email: string
	phone: string | null
	createdAt: string
	updatedAt: string
}

interface ContactListProps {
	contacts: ContactFromAPI[]
	isLoading: boolean
	isInitialLoad: boolean
	isSearching: boolean
	searchQuery: string
	deletingIds: Set<string>
	onDelete: (id: number) => void
}

export function ContactList({
	contacts,
	isLoading,
	isInitialLoad,
	isSearching,
	searchQuery,
	deletingIds,
	onDelete,
}: ContactListProps) {
	return (
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
								role="img"
								aria-label="Loading"
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
							<span className="text-gray-600">{isSearching ? "Searching..." : "Loading..."}</span>
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
											onClick={() => onDelete(contact.id)}
											disabled={deletingIds.has(contact.id.toString())}
											className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{deletingIds.has(contact.id.toString()) ? "Deleting..." : "Delete"}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	)
}
