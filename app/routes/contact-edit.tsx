import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, useNavigate, useParams } from "react-router"
import { useEffect } from "react"
import { patchContactSchema } from "../../workers/db/schema"
import { ErrorAlert } from "../components"
import { extractError, rpcClient } from "../lib/hono-rpc-client"
import type { InferRequestType } from "hono/client"

// Infer types from the API client
type UpdateContactRequest = InferRequestType<typeof rpcClient.contacts[":id"]["$patch"]>["json"]

export default function EditContact() {
	const { id } = useParams()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Fetch existing contact data
	const { data: contact, isLoading, error } = useQuery({
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

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async (values: UpdateContactRequest) => {
			const response = await rpcClient.contacts[":id"].$patch({
				param: { id: id! },
				json: values,
			})

			if (!response.ok) {
				throw new Error(await extractError(response))
			}

			return await response.json()
		},
		onSuccess: () => {
			// Invalidate both the specific contact and the list
			queryClient.invalidateQueries({ queryKey: ["contact", id] })
			queryClient.invalidateQueries({ queryKey: ["contacts"] })
			// Navigate back to the contact profile
			navigate(`/contacts/${id}`)
		},
	})

	// Contact form
	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: null,
		} as UpdateContactRequest,
		validators: {
			onChange: patchContactSchema,
		},
		onSubmit: async ({ value }) => {
			// Only send fields that have changed
			const changedFields: UpdateContactRequest = {}
			if (value.firstName !== contact?.firstName) changedFields.firstName = value.firstName
			if (value.lastName !== contact?.lastName) changedFields.lastName = value.lastName
			if (value.email !== contact?.email) changedFields.email = value.email
			if (value.phone !== contact?.phone) changedFields.phone = value.phone

			if (Object.keys(changedFields).length > 0) {
				await updateMutation.mutateAsync(changedFields)
			} else {
				// No changes, just navigate back
				navigate(`/contacts/${id}`)
			}
		},
	})

	// Update form when contact data loads
	useEffect(() => {
		if (contact) {
			form.setFieldValue("firstName", contact.firstName)
			form.setFieldValue("lastName", contact.lastName)
			form.setFieldValue("email", contact.email)
			form.setFieldValue("phone", contact.phone)
		}
	}, [contact])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
						<div className="bg-white shadow sm:rounded-lg p-6">
							<div className="space-y-6">
								<div className="h-10 bg-gray-200 rounded"></div>
								<div className="h-10 bg-gray-200 rounded"></div>
								<div className="h-10 bg-gray-200 rounded"></div>
								<div className="h-10 bg-gray-200 rounded"></div>
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
				<h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Contact</h1>

				{/* Error display */}
				{updateMutation.error && (
					<ErrorAlert error={updateMutation.error.message || "Failed to update contact"} />
				)}

				<div className="bg-white shadow sm:rounded-lg">
					<form
						onSubmit={(e) => {
							e.preventDefault()
							form.handleSubmit()
						}}
						className="p-6 space-y-6"
					>
						{/* First Name */}
						<form.Field
							name="firstName"
							children={(field) => (
								<div>
									<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
										First Name
									</label>
									<input
										type="text"
										id="firstName"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										className={`block w-full rounded-md shadow-sm ${
											field.state.meta.errors.length > 0
												? "border-red-300 focus:border-red-500 focus:ring-red-500"
												: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										} sm:text-sm`}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
									)}
								</div>
							)}
						/>

						{/* Last Name */}
						<form.Field
							name="lastName"
							children={(field) => (
								<div>
									<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
										Last Name
									</label>
									<input
										type="text"
										id="lastName"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										className={`block w-full rounded-md shadow-sm ${
											field.state.meta.errors.length > 0
												? "border-red-300 focus:border-red-500 focus:ring-red-500"
												: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										} sm:text-sm`}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
									)}
								</div>
							)}
						/>

						{/* Email */}
						<form.Field
							name="email"
							children={(field) => (
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
										Email
									</label>
									<input
										type="email"
										id="email"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										className={`block w-full rounded-md shadow-sm ${
											field.state.meta.errors.length > 0
												? "border-red-300 focus:border-red-500 focus:ring-red-500"
												: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										} sm:text-sm`}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
									)}
								</div>
							)}
						/>

						{/* Phone */}
						<form.Field
							name="phone"
							children={(field) => (
								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
										Phone (optional)
									</label>
									<input
										type="tel"
										id="phone"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value || null)}
										onBlur={field.handleBlur}
										className={`block w-full rounded-md shadow-sm ${
											field.state.meta.errors.length > 0
												? "border-red-300 focus:border-red-500 focus:ring-red-500"
												: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										} sm:text-sm`}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
									)}
								</div>
							)}
						/>

						{/* Actions */}
						<div className="flex gap-4 pt-4">
							<button
								type="submit"
								disabled={form.state.isSubmitting || updateMutation.isPending}
								className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{form.state.isSubmitting || updateMutation.isPending ? "Saving..." : "Save Changes"}
							</button>
							<Link
								to={`/contacts/${id}`}
								className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Cancel
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}