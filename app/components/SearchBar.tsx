interface SearchBarProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	isSearching: boolean
}

export function SearchBar({ searchQuery, onSearchChange, isSearching }: SearchBarProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<h2 className="text-xl font-semibold text-gray-800 mb-4">Search Contacts</h2>
			<div className="relative">
				<input
					type="text"
					placeholder="Search by name, email, or phone..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
				/>
				{isSearching && (
					<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
						<svg
							className="animate-spin h-5 w-5 text-gray-400"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Searching"
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
	)
}
