interface ErrorAlertProps {
	error: string
}

export function ErrorAlert({ error }: ErrorAlertProps) {
	return (
		<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
	)
}
