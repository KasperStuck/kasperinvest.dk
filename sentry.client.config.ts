import { init } from "@sentry/astro";

/** @param {string | undefined} value */
function stripUrlData(value: string | undefined) {
	if (!value) return value;
	try {
		const url = new URL(value);
		if (url.protocol !== "https:" && url.protocol !== "http:") return value;
		url.username = "";
		url.password = "";
		url.search = "";
		url.hash = "";
		return url.toString();
	} catch {
		// Relative route names may carry query strings too.
		return value.startsWith("/") ? value.split(/[?#]/, 1)[0] : value;
	}
}

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
init({
	dsn,
	enabled: Boolean(dsn),
	environment: import.meta.env.MODE,
	sendDefaultPii: false,
	tracesSampleRate: 0,
	initialScope: { tags: { application: "kasperinvest.dk", runtime: "client" } },
	beforeSend(event) {
		delete event.request;
		delete event.user;
		delete event.breadcrumbs;
		delete event.extra;
		delete event.contexts;
		if (event.transaction) event.transaction = stripUrlData(event.transaction);
		for (const exception of event.exception?.values ?? []) {
			for (const frame of exception.stacktrace?.frames ?? []) {
				if (frame.filename) frame.filename = stripUrlData(frame.filename);
				if (frame.module) frame.module = stripUrlData(frame.module)?.split(/[?#]/, 1)[0];
				if (frame.abs_path) frame.abs_path = stripUrlData(frame.abs_path);
			}
		}
		return event;
	},
});
