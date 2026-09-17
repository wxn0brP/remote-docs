import { NavItem, RemoteDocsConfig, ResolvedConfig } from "./types";
import { stripMd } from "./utils";

function ensureTxt(url: string) {
	if (url.endsWith(".txt") || url.endsWith(".md")) return url;
	return url.replace(/\/?$/, "/") + "remote-docs.txt";
}

function isMd(url: string) {
	return url.toLowerCase().endsWith(".md");
}

function split(url: string) {
	const idx = url.lastIndexOf("/");
	return {
		configUrl: url,
		baseUrl: idx >= 0 ? url.slice(0, idx + 1) : "",
		singleFile: isMd(url),
	};
}

export function resolveConfig(search: URLSearchParams): ResolvedConfig {
	const ll = search.get("ll");
	if (ll) {
		const slash = ll.indexOf("/");
		const port = slash >= 0 ? ll.slice(0, slash) : ll;
		const path = slash >= 0 ? ll.slice(slash) : "";
		const url = ensureTxt(`http://localhost:${port}${path}`);
		return split(url);
	}

	const l = search.get("l");
	if (l) {
		const withProto = /^https?:\/\//i.test(l) ? l : "https://" + l;
		return split(ensureTxt(withProto));
	}

	const r = search.get("r");
	if (r) {
		const fullRepo = r.includes("/") ? r : `wxn0brP/${r}`;
		const rp = (search.get("rp") ?? "docs").replace(/^\/+|\/+$/g, "");
		const prefix = rp ? `${rp}/` : "";
		const base = `https://raw.githubusercontent.com/${fullRepo}/HEAD`;
		return {
			configUrl: `${base}/${prefix}remote-docs.txt`,
			baseUrl: `${base}/${prefix}`,
			repoUrl: `https://github.com/${fullRepo}`,
		};
	}
	throw new Error("missing ?r=user/repo, ?l=url or ?ll=port/path");
}

export function parseConfig(
	text: string,
	fallbackRepo?: string,
): RemoteDocsConfig {
	const lines = text
		.split(/\r?\n/)
		.map(l => l.trim())
		.filter(l => l && !l.startsWith("//"));
	if (!lines.length) throw new Error("empty config");

	const nav: NavItem[] = [];
	let currentSection: {
		title: string;
		items: NavItem[];
	} | null = null;

	for (let i = 1; i < lines.length; i++) {
		let line = lines[i];
		if (line.startsWith("#")) line = line.slice(1).trim();
		if (!line.includes("|")) {
			currentSection = {
				title: line.replace(/\.md$/, ""),
				items: [],
			};
			nav.push(currentSection);
			continue;
		}
		const idx = line.indexOf("|");
		const title = line.slice(0, idx).trim();
		let path = line.slice(idx + 1).trim();
		if (!path) continue;
		if (!path.endsWith(".md")) path += ".md";
		const item: NavItem = {
			title,
			path,
		};
		if (currentSection) currentSection.items.push(item);
		else nav.push(item);
	}

	return {
		title: lines[0],
		repo: fallbackRepo,
		nav,
	};
}

export function flattenPages(nav: NavItem[]) {
	const out: {
		title: string;
		path: string;
	}[] = [];
	const walk = (items: NavItem[]) => {
		for (const n of items) {
			if ("path" in n)
				out.push({
					title: n.title,
					path: n.path,
				});
			else walk(n.items);
		}
	};
	walk(nav);
	return out;
}

export function findPage(nav: NavItem[], path: string) {
	const target = stripMd(path);
	for (const n of nav) {
		if ("path" in n) {
			if (stripMd(n.path) === target) return n;
		} else {
			const r = findPage(n.items, path);
			if (r) return r;
		}
	}
	return null;
}
