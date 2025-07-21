interface PaginationProps {
	currentPage: number
	totalPages: number
	hasNextPage: boolean
	hasPreviousPage: boolean
	onPageChange: (page: number) => void
	isLoading?: boolean
}

export function Pagination({
	currentPage,
	totalPages,
	hasNextPage,
	hasPreviousPage,
	onPageChange,
	isLoading = false,
}: PaginationProps) {
	// Generate page numbers to display
	const getPageNumbers = () => {
		const pages: (number | string)[] = []
		const showEllipsis = totalPages > 7

		if (!showEllipsis) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			// Always show first page
			pages.push(1)

			if (currentPage > 3) {
				pages.push("ellipsis-start")
			}

			// Show current page and neighbors
			const start = Math.max(2, currentPage - 1)
			const end = Math.min(totalPages - 1, currentPage + 1)

			for (let i = start; i <= end; i++) {
				pages.push(i)
			}

			if (currentPage < totalPages - 2) {
				pages.push("ellipsis-start")
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages)
			}
		}

		return pages
	}

	return (
		<div className="flex items-center justify-between px-4 py-3 sm:px-6">
			<div className="flex flex-1 items-center justify-between">
				<div>
					<p className="text-sm text-gray-700">
						Page <span className="font-medium">{currentPage}</span> of{" "}
						<span className="font-medium">{totalPages}</span>
					</p>
				</div>
				<div>
					<nav
						className="isolate inline-flex -space-x-px rounded-md shadow-sm"
						aria-label="Pagination"
					>
						{/* Previous button */}
						<button
							type="button"
							onClick={() => onPageChange(currentPage - 1)}
							disabled={!hasPreviousPage || isLoading}
							className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<span className="sr-only">Previous</span>
							{isLoading ? (
								<svg
									className="animate-spin h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
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
							) : (
								<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fillRule="evenodd"
										d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</button>

						{/* Page numbers */}
						{getPageNumbers().map((page) => {
							if (typeof page === "string") {
								return (
									<span
										key={page}
										className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
									>
										...
									</span>
								)
							}

							const isActive = page === currentPage

							return (
								<button
									key={page}
									type="button"
									onClick={() => onPageChange(page as number)}
									disabled={isLoading}
									aria-current={isActive ? "page" : undefined}
									className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
										isActive
											? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
											: "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
									} disabled:cursor-not-allowed disabled:opacity-50`}
								>
									{page}
								</button>
							)
						})}

						{/* Next button */}
						<button
							type="button"
							onClick={() => onPageChange(currentPage + 1)}
							disabled={!hasNextPage || isLoading}
							className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<span className="sr-only">Next</span>
							{isLoading ? (
								<svg
									className="animate-spin h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
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
							) : (
								<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fillRule="evenodd"
										d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</button>
					</nav>
				</div>
			</div>
		</div>
	)
}
