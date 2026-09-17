const cache = new Map<string, Promise<string>>();
let bust = "";

function withBust(url: string) {
	if (!bust) return url;
	return url + (url.includes("?") ? "&" : "?") + "time=" + bust;
}

export function fetchText(url: string) {
	const finalUrl = withBust(url);
	const hit = cache.get(finalUrl);
	if (hit) return hit;
	const p = fetch(finalUrl).then(r => {
		if (!r.ok) throw new Error(`HTTP ${r.status}: ${finalUrl}`);
		return r.text();
	});
	cache.set(finalUrl, p);
	return p;
}

export function fetchJSON<T>(url: string): Promise<T> {
	return fetchText(url).then(t => JSON.parse(t) as T);
}

export function reloadCache() {
	cache.clear();
	bust = String(Date.now());
}
