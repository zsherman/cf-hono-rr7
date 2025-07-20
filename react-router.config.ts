import type { Config } from "@react-router/dev/config"

export default {
	ssr: true,
	// https://github.com/remix-run/remix/issues/10455#issuecomment-2905573067
	routeDiscovery: {
		mode: "initial",
	},
	future: {
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config
