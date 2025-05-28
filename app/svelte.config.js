import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const DEPLOY_ADAPTER = process.env.DEPLOY_ADAPTER ?? "node";

let adapter;
switch (DEPLOY_ADAPTER) {
	case "node":
		adapter = (await import("@sveltejs/adapter-node")).default;
		break;
	case "netlify":
		adapter = (await import("@sveltejs/adapter-netlify")).default;
		break;
	default:
		throw new Error(`Unexpected deploy adapter '${DEPLOY_ADAPTER}'.`);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	}
};

export default config;
