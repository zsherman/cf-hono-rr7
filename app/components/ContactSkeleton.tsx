export function ContactSkeleton() {
	return (
		<div className="animate-pulse">
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
					{[...Array(5)].map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Skeleton rows are static and don't change
						<tr key={index}>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="h-4 bg-gray-200 rounded w-32"></div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="h-4 bg-gray-200 rounded w-40"></div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="h-4 bg-gray-200 rounded w-24"></div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="h-4 bg-gray-200 rounded w-20"></div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="h-4 bg-gray-200 rounded w-16"></div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
