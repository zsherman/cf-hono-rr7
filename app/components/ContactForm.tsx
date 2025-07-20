import type { AnyFieldApi } from "@tanstack/react-form"

interface ContactFormProps {
	form: any // Let TypeScript infer from useForm
	onFillMockData: () => void
}

export function ContactForm({ form, onFillMockData }: ContactFormProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold text-gray-800">Add New Contact</h2>
				<button
					type="button"
					onClick={onFillMockData}
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
				<form.Field name="firstName">
					{(field: AnyFieldApi) => (
						<div>
							<label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
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
							{field.state.meta.isTouched &&
								field.state.meta.errors &&
								field.state.meta.errors.length > 0 && (
									<p className="mt-1 text-sm text-red-600">
										{field.state.meta.errors
											.map((err: any) => {
												// Handle both string errors and object errors
												if (typeof err === "string") return err
												if (err?.message) return err.message
												return "Invalid value"
											})
											.join(", ")}
									</p>
								)}
						</div>
					)}
				</form.Field>

				<form.Field name="lastName">
					{(field: AnyFieldApi) => (
						<div>
							<label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
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
							{field.state.meta.isTouched &&
								field.state.meta.errors &&
								field.state.meta.errors.length > 0 && (
									<p className="mt-1 text-sm text-red-600">
										{field.state.meta.errors
											.map((err: any) => {
												// Handle both string errors and object errors
												if (typeof err === "string") return err
												if (err?.message) return err.message
												return "Invalid value"
											})
											.join(", ")}
									</p>
								)}
						</div>
					)}
				</form.Field>

				<form.Field name="email">
					{(field: AnyFieldApi) => (
						<div>
							<label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
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
							{field.state.meta.isTouched &&
								field.state.meta.errors &&
								field.state.meta.errors.length > 0 && (
									<p className="mt-1 text-sm text-red-600">
										{field.state.meta.errors
											.map((err: any) => {
												// Handle both string errors and object errors
												if (typeof err === "string") return err
												if (err?.message) return err.message
												return "Invalid value"
											})
											.join(", ")}
									</p>
								)}
						</div>
					)}
				</form.Field>

				<form.Field name="phone">
					{(field: AnyFieldApi) => (
						<div>
							<label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
								Phone
							</label>
							<input
								id={field.name}
								name={field.name}
								type="tel"
								value={field.state.value || ""}
								onChange={(e) => field.handleChange(e.target.value || null)}
								onBlur={field.handleBlur}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
							/>
						</div>
					)}
				</form.Field>

				<form.Subscribe selector={(state: any) => [state.canSubmit, state.isSubmitting]}>
					{([canSubmit, isSubmitting]: [boolean, boolean]) => (
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
	)
}
