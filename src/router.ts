import { parseConfig } from "./config";
import { fetchText, reloadCache } from "./fetcher";
import { parseMarkdown } from "./markdown";
import { render, render404, renderNav } from "./render";
import { state } from "./state";
import { stripMd } from "./utils";

export function navigate(path: string) {
	if (!path) return;
	const newHash = "#/" + path;
	if (location.hash === newHash) return;
	location.hash = newHash;
}

export function pathFromHash() {
	const h = location.hash;
	if (!h.startsWith("#/")) return "";
	return stripMd(h.slice(2));
}

export async function loadPage(path: string) {
	state.currentPath = path;
	state.loading = true;
	state.error = "";
	render();
	try {
		const md = await fetchText(state.baseUrl + path + ".md");
		const { html, toc } = parseMarkdown(md, state.baseUrl);
		state.html = html;
		state.toc = toc;
		state.loading = false;
	} catch (_e: any) {
		render404(path);
	}
	render();
}

export async function forceReload() {
	reloadCache();
	if (state.singleFile) {
		await renderSingleFile(state.configUrl);
		return;
	}
	const text = await fetchText(state.configUrl);
	const config = parseConfig(text, state.config?.repo);
	state.config = config;
	renderNav();
	if (state.currentPath) {
		await loadPage(state.currentPath);
	} else {
		state.loading = false;
		render();
	}
}

export async function renderSingleFile(configUrl: string) {
	const md = await fetchText(configUrl);
	const { html, toc } = parseMarkdown(md, state.baseUrl);
	state.html = html;
	state.toc = toc;
	state.loading = false;

	const fileName = configUrl.slice(configUrl.lastIndexOf("/") + 1);
	const mdTitle = md.match(/^\s*#\s+(.+)$/m)?.[1]?.trim();
	const title = mdTitle || stripMd(fileName) || "Docs";
	state.config = {
		title,
		nav: [
			{
				title,
				path: fileName,
			},
		],
	};
	state.currentPath = stripMd(fileName);
	renderNav();
	render();
}
