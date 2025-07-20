interface ContactStatsProps {
	totalContacts: number
}

export function ContactStats({ totalContacts }: ContactStatsProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<h3 className="text-lg font-semibold text-gray-800 mb-2">Statistics</h3>
			<p className="text-gray-600">
				Total Contacts: <span className="font-semibold">{totalContacts}</span>
			</p>
		</div>
	)
}
