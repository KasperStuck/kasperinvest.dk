export function serviceUnavailable(message = "Tjenesten er midlertidigt utilgængelig."): Response {
	return new Response(
		`<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Midlertidigt utilgængelig - KasperInvest</title></head><body><main><h1>Midlertidigt utilgængelig</h1><p>${message}</p><p><a href="/">Gå til KasperInvest</a></p></main></body></html>`,
		{
			status: 503,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Retry-After": "300",
				"Cache-Control": "no-store",
			},
		},
	);
}
